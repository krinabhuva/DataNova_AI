from collections import defaultdict
from datetime import date, datetime
from math import ceil
from typing import Any

import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import f1_score, mean_squared_error, precision_score, recall_score, roc_auc_score, silhouette_score
from sklearn.model_selection import TimeSeriesSplit, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.models.business_data import Customer, Inventory, Product, Sale
from app.models.ml_model import MLModel


def list_models(db: Session) -> list[dict[str, Any]]:
    models = db.scalars(select(MLModel).order_by(MLModel.name)).all()
    return [_model_response(model) for model in models]


def _model_response(model: MLModel) -> dict[str, Any]:
    return {
        "id": model.id,
        "model_key": model.model_key,
        "name": model.name,
        "version": model.version,
        "algorithm": model.algorithm,
        "dataset": model.dataset,
        "training_date": model.trained_at.isoformat(),
        "metrics": model.metrics,
        "status": model.status,
    }


def _record_model(
    db: Session,
    *,
    model_key: str,
    name: str,
    algorithm: str,
    dataset: str,
    metrics: dict[str, Any],
    status: str,
) -> MLModel:
    model = db.scalar(select(MLModel).where(MLModel.model_key == model_key))
    if model is None:
        model = MLModel(
            model_key=model_key,
            name=name,
            version="v1",
            algorithm=algorithm,
            dataset=dataset,
            metrics=metrics,
            status=status,
        )
        db.add(model)
    else:
        version_number = int(model.version.lstrip("v")) + 1
        model.version = f"v{version_number}"
        model.algorithm = algorithm
        model.dataset = dataset
        model.metrics = metrics
        model.status = status
        model.trained_at = datetime.now().astimezone()
    db.flush()
    return model


def _periods_between(start: tuple[int, int], end: tuple[int, int]) -> list[tuple[int, int]]:
    start_index = start[0] * 12 + start[1] - 1
    end_index = end[0] * 12 + end[1] - 1
    return [(index // 12, index % 12 + 1) for index in range(start_index, end_index + 1)]


def _customer_orders(db: Session) -> dict[int, dict[str, Any]]:
    rows = db.execute(
        select(Sale.customer_id, Sale.order_id, Sale.order_date, Sale.revenue, Customer.name, Customer.customer_code)
        .join(Customer, Customer.id == Sale.customer_id)
        .order_by(Sale.order_date)
    ).all()
    customers: dict[int, dict[str, Any]] = {}
    for row in rows:
        customer = customers.setdefault(
            row.customer_id,
            {"customer_id": row.customer_id, "customer_code": row.customer_code, "name": row.name, "orders": {}},
        )
        order = customer["orders"].setdefault(row.order_id, {"date": row.order_date, "revenue": 0.0})
        order["revenue"] += float(row.revenue)
    return customers


def _customer_rfm(customers: dict[int, dict[str, Any]]) -> tuple[list[int], list[dict[str, Any]]]:
    if not customers:
        return [], []
    reference_date = max(
        (order["date"].date() if isinstance(order["date"], datetime) else order["date"])
        for customer in customers.values()
        for order in customer["orders"].values()
    )
    customer_ids: list[int] = []
    profiles: list[dict[str, Any]] = []
    for customer_id, customer in customers.items():
        order_dates = sorted(
            order["date"].date() if isinstance(order["date"], datetime) else order["date"]
            for order in customer["orders"].values()
        )
        last_date = order_dates[-1]
        monetary = sum(order["revenue"] for order in customer["orders"].values())
        profiles.append({
            "customer_id": customer_id,
            "customer_code": customer["customer_code"],
            "name": customer["name"],
            "recency_days": (reference_date - last_date).days,
            "frequency": len(customer["orders"]),
            "monetary": round(monetary, 2),
        })
        customer_ids.append(customer_id)
    return customer_ids, profiles


def train_segmentation(db: Session) -> dict[str, Any]:
    customers = _customer_orders(db)
    _, profiles = _customer_rfm(customers)
    if len(profiles) < 2:
        return {"status": "insufficient_data", "message": "At least two customers with sales are required.", "customers": [], "metrics": {}}

    feature_matrix = np.asarray([[item["recency_days"], item["frequency"], item["monetary"]] for item in profiles], dtype=float)
    distinct_features = np.unique(feature_matrix, axis=0)
    if len(distinct_features) < 2:
        return {"status": "insufficient_data", "message": "Customer purchase patterns must differ to form segments.", "customers": [], "metrics": {}}

    cluster_count = min(4, len(distinct_features))
    scaled_features = StandardScaler().fit_transform(feature_matrix)
    clusterer = KMeans(n_clusters=cluster_count, n_init=10, random_state=42)
    cluster_ids = clusterer.fit_predict(scaled_features)
    cluster_scores = {
        cluster_id: float(clusterer.cluster_centers_[cluster_id, 0] - clusterer.cluster_centers_[cluster_id, 1] - clusterer.cluster_centers_[cluster_id, 2])
        for cluster_id in range(cluster_count)
    }
    ordered_clusters = sorted(cluster_scores, key=cluster_scores.get, reverse=True)
    segment_names = ["At Risk", "Occasional", "Loyal", "High Value"]
    labels = {
        cluster_id: segment_names[round(index * (len(segment_names) - 1) / max(len(ordered_clusters) - 1, 1))]
        for index, cluster_id in enumerate(ordered_clusters)
    }
    predictions = [
        {**profile, "segment": labels[int(cluster_id)]}
        for profile, cluster_id in zip(profiles, cluster_ids, strict=True)
    ]
    metrics: dict[str, Any] = {"customers": len(profiles), "clusters": cluster_count}
    if len(set(cluster_ids)) > 1 and len(profiles) > cluster_count:
        metrics["silhouette_score"] = round(float(silhouette_score(scaled_features, cluster_ids)), 4)
    _record_model(
        db,
        model_key="customer_segmentation",
        name="Customer Segmentation",
        algorithm="RFM + K-Means",
        dataset="sales",
        metrics=metrics,
        status="Active",
    )
    return {"status": "trained", "algorithm": "RFM + K-Means", "metrics": metrics, "customers": predictions}


def train_churn(db: Session) -> dict[str, Any]:
    customer_orders = _customer_orders(db)
    _, profiles = _customer_rfm(customer_orders)
    if len(profiles) < 2:
        return {"status": "insufficient_data", "message": "At least two customers with sales are required.", "predictions": [], "metrics": {}}

    order_dates = {
        customer_id: sorted(
            order["date"].date() if isinstance(order["date"], datetime) else order["date"]
            for order in customer["orders"].values()
        )
        for customer_id, customer in customer_orders.items()
    }
    reference_date = max(dates[-1] for dates in order_dates.values())
    labels = np.asarray([int((reference_date - dates[-1]).days >= 90) for dates in order_dates.values()])
    feature_rows: list[list[float]] = []
    ordered_profiles = []
    for profile in profiles:
        dates = order_dates[profile["customer_id"]]
        gaps = [(later - earlier).days for earlier, later in zip(dates, dates[1:])]
        feature_rows.append([
            float(profile["frequency"]),
            float(profile["monetary"]),
            float(profile["monetary"] / max(profile["frequency"], 1)),
            float(np.mean(gaps)) if gaps else 0.0,
        ])
        ordered_profiles.append(profile)
    features = np.asarray(feature_rows, dtype=float)
    class_counts = np.bincount(labels, minlength=2)
    trained = len(profiles) >= 8 and int(class_counts.min()) >= 3
    metrics: dict[str, Any] = {"precision": None, "recall": None, "f1": None, "roc_auc": None, "training_customers": len(profiles)}
    probabilities: np.ndarray
    algorithm = "Logistic Regression baseline"
    if trained:
        train_x, test_x, train_y, test_y = train_test_split(
            features, labels, test_size=0.25, random_state=42, stratify=labels
        )
        classifier = make_pipeline(StandardScaler(), LogisticRegression(class_weight="balanced", random_state=42))
        classifier.fit(train_x, train_y)
        test_predictions = classifier.predict(test_x)
        test_probabilities = classifier.predict_proba(test_x)[:, 1]
        metrics.update({
            "precision": round(float(precision_score(test_y, test_predictions, zero_division=0)), 4),
            "recall": round(float(recall_score(test_y, test_predictions, zero_division=0)), 4),
            "f1": round(float(f1_score(test_y, test_predictions, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(test_y, test_probabilities)), 4),
            "test_customers": len(test_y),
        })
        probabilities = classifier.predict_proba(features)[:, 1]
    else:
        probabilities = np.asarray([
            min(max((profile["recency_days"] - 60) / 90, 0.0), 1.0)
            for profile in ordered_profiles
        ])
        algorithm = "90-day inactivity baseline"

    predictions = [
        {
            "customer_id": profile["customer_id"],
            "customer_code": profile["customer_code"],
            "name": profile["name"],
            "churn_probability": round(float(probability), 4),
            "churn_risk": "High" if probability >= 0.65 else "Medium" if probability >= 0.35 else "Low",
        }
        for profile, probability in zip(ordered_profiles, probabilities, strict=True)
    ]
    status = "Active" if trained else "Preview"
    _record_model(
        db,
        model_key="customer_churn",
        name="Customer Churn",
        algorithm=algorithm,
        dataset="sales customer history",
        metrics=metrics,
        status=status,
    )
    return {"status": "trained" if trained else "preview", "algorithm": algorithm, "metrics": metrics, "predictions": predictions}


def forecast_sales(db: Session, horizon: int) -> dict[str, Any]:
    rows = db.execute(
        select(
            extract("year", Sale.order_date).label("year"),
            extract("month", Sale.order_date).label("month"),
            func.sum(Sale.revenue).label("revenue"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
    ).all()
    if not rows:
        return {"status": "insufficient_data", "message": "Sales history is required to forecast.", "history": [], "forecast": [], "metrics": {}}
    monthly_values = {(int(row.year), int(row.month)): float(row.revenue) for row in rows}
    periods = _periods_between(min(monthly_values), max(monthly_values))
    revenues = [monthly_values.get(period, 0.0) for period in periods]
    history = [
        {"period": date(year, month, 1).strftime("%Y-%m"), "actual": revenue}
        for (year, month), revenue in zip(periods, revenues, strict=True)
    ]
    supervised_features = np.asarray(
        [[float(index), *revenues[index - 3:index]] for index in range(3, len(revenues))],
        dtype=float,
    )
    targets = np.asarray(revenues[3:], dtype=float)
    metrics: dict[str, Any] = {"rmse": None, "validation": "TimeSeriesSplit", "folds": 0}
    status = "Preview"
    algorithm = "Linear Regression with lag features"
    predictor = LinearRegression()
    if len(targets) >= 3:
        split_count = min(5, len(targets) - 1)
        splitter = TimeSeriesSplit(n_splits=split_count)
        actual_values: list[float] = []
        predicted_values: list[float] = []
        for train_indices, test_indices in splitter.split(supervised_features):
            fold_predictor = LinearRegression().fit(supervised_features[train_indices], targets[train_indices])
            predicted_values.extend(fold_predictor.predict(supervised_features[test_indices]).tolist())
            actual_values.extend(targets[test_indices].tolist())
        metrics = {
            "rmse": round(float(np.sqrt(mean_squared_error(actual_values, predicted_values))), 2),
            "validation": "TimeSeriesSplit",
            "folds": split_count,
            "historical_months": len(revenues),
        }
        predictor.fit(supervised_features, targets)
        status = "Active"
    else:
        algorithm = "Three-month moving average baseline"

    forecast_values: list[float] = []
    recent_values = revenues[:]
    for step in range(horizon):
        future_index = len(revenues) + step
        if status == "Active":
            features = np.asarray([[float(future_index), *recent_values[-3:]]], dtype=float)
            predicted_value = max(0.0, float(predictor.predict(features)[0]))
        else:
            predicted_value = float(np.mean(recent_values[-3:]))
        forecast_values.append(round(predicted_value, 2))
        recent_values.append(predicted_value)
    last_year, last_month = periods[-1]
    last_index = last_year * 12 + last_month - 1
    forecast = []
    for step, value in enumerate(forecast_values, start=1):
        year, month_index = divmod(last_index + step, 12)
        forecast.append({"period": date(year, month_index + 1, 1).strftime("%Y-%m"), "forecast": value})
    _record_model(
        db,
        model_key="sales_forecast",
        name="Sales Forecast",
        algorithm=algorithm,
        dataset="monthly sales history",
        metrics=metrics,
        status=status,
    )
    return {"status": "trained" if status == "Active" else "preview", "algorithm": algorithm, "history": history, "forecast": forecast, "metrics": metrics}


def predict_inventory_demand(db: Session) -> dict[str, Any]:
    products = db.execute(
        select(Product.id, Product.name, Product.stock_quantity, Inventory.quantity, Inventory.reorder_level, Inventory.inventory_value)
        .outerjoin(Inventory, Inventory.product_id == Product.id)
        .order_by(Product.id)
    ).all()
    if not products:
        return {"status": "insufficient_data", "message": "Product and inventory records are required.", "items": [], "inventory_value": 0.0, "metrics": {}}

    sales_rows = db.execute(
        select(
            Sale.product_id,
            extract("year", Sale.order_date).label("year"),
            extract("month", Sale.order_date).label("month"),
            func.sum(Sale.quantity).label("quantity"),
        )
        .group_by(Sale.product_id, "year", "month")
        .order_by("year", "month")
    ).all()
    monthly_sales: dict[int, dict[tuple[int, int], float]] = defaultdict(dict)
    all_periods: list[tuple[int, int]] = []
    for row in sales_rows:
        period = (int(row.year), int(row.month))
        monthly_sales[row.product_id][period] = float(row.quantity)
        all_periods.append(period)
    periods = _periods_between(min(all_periods), max(all_periods)) if all_periods else []

    training_features: list[list[float]] = []
    training_targets: list[float] = []
    product_history: dict[int, list[float]] = {}
    for product in products:
        values = [monthly_sales[product.id].get(period, 0.0) for period in periods]
        product_history[product.id] = values
        for index in range(3, len(values)):
            training_features.append([*values[index - 3:index], float(product.reorder_level or 0)])
            training_targets.append(values[index])

    model_trained = len(training_targets) >= 10
    model = RandomForestRegressor(n_estimators=100, random_state=42, min_samples_leaf=2) if model_trained else None
    metrics: dict[str, Any] = {"training_examples": len(training_targets)}
    if model is not None:
        feature_array = np.asarray(training_features, dtype=float)
        target_array = np.asarray(training_targets, dtype=float)
        model.fit(feature_array, target_array)
        metrics["training_rmse"] = round(float(np.sqrt(mean_squared_error(target_array, model.predict(feature_array)))), 2)

    items = []
    for product in products:
        values = product_history[product.id]
        current_stock = int(product.quantity if product.quantity is not None else product.stock_quantity)
        reorder_level = int(product.reorder_level or 0)
        if model is not None and len(values) >= 3:
            features = np.asarray([[*values[-3:], float(reorder_level)]], dtype=float)
            demand = max(0, int(round(float(model.predict(features)[0]))))
        elif values:
            demand = max(0, int(round(float(np.mean(values[-3:])))))
        else:
            demand = 0
        recommended_stock = max(reorder_level, int(ceil(demand * 1.2)))
        if current_stock < demand * 0.5:
            risk = "High"
            status = "Critical"
        elif current_stock < demand or current_stock < reorder_level:
            risk = "Medium"
            status = "Watch"
        else:
            risk = "Low"
            status = "Healthy"
        items.append({
            "product_id": product.id,
            "product": product.name,
            "current_stock": current_stock,
            "predicted_demand": demand,
            "recommended_stock": recommended_stock,
            "risk": risk,
            "status": status,
        })

    status = "Active" if model_trained else "Preview"
    algorithm = "Random Forest Regressor" if model_trained else "Three-month demand average baseline"
    metrics.update({"products": len(products), "historical_months": len(periods)})
    _record_model(
        db,
        model_key="inventory_demand",
        name="Inventory Demand",
        algorithm=algorithm,
        dataset="monthly product sales and current stock",
        metrics=metrics,
        status=status,
    )
    inventory_value = sum(float(product.inventory_value or 0) for product in products)
    return {
        "status": "trained" if model_trained else "preview",
        "algorithm": algorithm,
        "metrics": metrics,
        "inventory_value": inventory_value,
        "items": items,
    }


def detect_anomalies(db: Session, contamination: float = 0.05) -> dict[str, Any]:
    rows = db.execute(
        select(Sale.id, Sale.order_id, Sale.customer_id, Sale.product_id, Sale.order_date, Sale.quantity, Sale.revenue, Sale.profit, Sale.profit_margin)
        .order_by(Sale.order_date)
    ).all()
    if not rows:
        return {"status": "insufficient_data", "message": "Sales are required for anomaly detection.", "anomalies": [], "metrics": {}}
    feature_matrix = np.asarray([
        [float(row.quantity), float(row.revenue), float(row.profit), float(row.profit_margin)]
        for row in rows
    ], dtype=float)
    if len(rows) < 10:
        metrics = {"transactions": len(rows), "anomalies": 0, "contamination": contamination}
        _record_model(
            db,
            model_key="sales_anomaly_detection",
            name="Anomaly Detection",
            algorithm="Isolation Forest",
            dataset="sales transactions",
            metrics=metrics,
            status="Preview",
        )
        return {"status": "preview", "algorithm": "Isolation Forest", "metrics": metrics, "anomalies": []}

    detector = IsolationForest(contamination=contamination, random_state=42)
    labels = detector.fit_predict(feature_matrix)
    scores = detector.decision_function(feature_matrix)
    anomalies = [
        {
            "sale_id": row.id,
            "order_id": row.order_id,
            "customer_id": row.customer_id,
            "product_id": row.product_id,
            "order_date": row.order_date.isoformat(),
            "quantity": row.quantity,
            "revenue": float(row.revenue),
            "profit": float(row.profit),
            "anomaly_score": round(float(score), 6),
        }
        for row, label, score in zip(rows, labels, scores, strict=True)
        if label == -1
    ]
    metrics = {"transactions": len(rows), "anomalies": len(anomalies), "contamination": contamination}
    _record_model(
        db,
        model_key="sales_anomaly_detection",
        name="Anomaly Detection",
        algorithm="Isolation Forest",
        dataset="sales transactions",
        metrics=metrics,
        status="Monitoring",
    )
    return {"status": "trained", "algorithm": "Isolation Forest", "metrics": metrics, "anomalies": anomalies}