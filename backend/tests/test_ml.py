from collections.abc import Generator
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.business_data import Customer, Inventory, Order, Product, Sale

ML_TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
MLTestSessionLocal = sessionmaker(bind=ML_TEST_ENGINE, autoflush=False, autocommit=False, expire_on_commit=False)


def _add_sale(
    db: Session,
    *,
    order_code: str,
    customer: Customer,
    product: Product,
    order_date: datetime,
    quantity: int,
    unit_price: float,
) -> None:
    order = Order(
        order_code=order_code,
        customer_id=customer.id,
        order_date=order_date,
        status="paid",
        total_amount=quantity * unit_price,
    )
    db.add(order)
    db.flush()
    revenue = quantity * unit_price
    cost = quantity * float(product.cost)
    db.add(Sale(
        order_id=order.id,
        customer_id=customer.id,
        product_id=product.id,
        quantity=quantity,
        unit_price=unit_price,
        revenue=revenue,
        cost=cost,
        profit=revenue - cost,
        profit_margin=(revenue - cost) / revenue * 100,
        order_date=order_date,
        region=customer.region,
    ))


@pytest.fixture
def ml_client() -> Generator[TestClient, None, None]:
    Base.metadata.create_all(bind=ML_TEST_ENGINE)

    def override_get_db():
        with MLTestSessionLocal() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    with MLTestSessionLocal() as db:
        customers = [
            Customer(customer_code=f"C-{index:02d}", name=f"Customer {index:02d}", region="North" if index % 2 else "South")
            for index in range(1, 13)
        ]
        products = [
            Product(product_code="P-1", name="Keyboard", category="Electronics", price=50, cost=25, stock_quantity=20),
            Product(product_code="P-2", name="Chair", category="Home", price=80, cost=40, stock_quantity=2),
        ]
        db.add_all([*customers, *products])
        db.flush()
        db.add_all([
            Inventory(product_id=products[0].id, quantity=20, reorder_level=5, inventory_value=1000),
            Inventory(product_id=products[1].id, quantity=2, reorder_level=5, inventory_value=160),
        ])

        order_number = 0
        for month_index in range(18):
            year, month = divmod(month_index, 12)
            order_date = datetime(2025 + year, month + 1, 15, tzinfo=timezone.utc)
            customer = customers[month_index % 6]
            product = products[month_index % 2]
            quantity = 4 + month_index % 5
            _add_sale(
                db,
                order_code=f"H-{order_number:03d}",
                customer=customer,
                product=product,
                order_date=order_date,
                quantity=quantity,
                unit_price=float(product.price),
            )
            order_number += 1

        for customer in customers[6:]:
            _add_sale(
                db,
                order_code=f"OLD-{customer.customer_code}",
                customer=customer,
                product=products[0],
                order_date=datetime(2025, 10, 15, tzinfo=timezone.utc),
                quantity=1,
                unit_price=float(products[0].price),
            )
        db.commit()

    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=ML_TEST_ENGINE)


@pytest.fixture
def empty_ml_client() -> Generator[TestClient, None, None]:
    Base.metadata.create_all(bind=ML_TEST_ENGINE)

    def override_get_db():
        with MLTestSessionLocal() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=ML_TEST_ENGINE)


def test_ml_endpoints_train_predict_and_store_metadata(ml_client: TestClient) -> None:
    assert ml_client.get("/api/ml/models").json() == []

    segmentation = ml_client.post("/api/ml/segmentation").json()
    assert segmentation["status"] == "trained"
    assert segmentation["algorithm"] == "RFM + K-Means"
    assert len(segmentation["customers"]) == 12
    assert segmentation["metrics"]["clusters"] >= 2
    assert all(customer["segment"] == "At Risk" for customer in segmentation["customers"] if customer["customer_code"] >= "C-07")

    churn = ml_client.post("/api/ml/churn").json()
    assert churn["status"] == "trained"
    assert len(churn["predictions"]) == 12
    assert set(("precision", "recall", "f1", "roc_auc")).issubset(churn["metrics"])
    assert churn["metrics"]["test_customers"] > 0
    for metric in ("precision", "recall", "f1", "roc_auc"):
        assert 0 <= churn["metrics"][metric] <= 1

    forecast = ml_client.post("/api/ml/forecast?horizon=3").json()
    assert forecast["status"] == "trained"
    assert forecast["metrics"]["validation"] == "TimeSeriesSplit"
    assert forecast["metrics"]["folds"] >= 2
    assert forecast["metrics"]["rmse"] >= 0
    assert len(forecast["history"]) == 18
    assert len(forecast["forecast"]) == 3
    assert all(point["forecast"] >= 0 for point in forecast["forecast"])

    inventory = ml_client.post("/api/ml/inventory-demand").json()
    assert inventory["status"] in {"trained", "preview"}
    assert len(inventory["items"]) == 2
    assert {"predicted_demand", "current_stock", "recommended_stock", "risk"}.issubset(inventory["items"][0])
    assert inventory["items"][1]["status"] in {"Critical", "Watch", "Healthy"}
    assert inventory["inventory_value"] == 1160
    assert all(item["recommended_stock"] >= item["predicted_demand"] for item in inventory["items"])

    anomalies = ml_client.post("/api/ml/anomalies").json()
    assert anomalies["status"] == "trained"
    assert anomalies["algorithm"] == "Isolation Forest"
    assert anomalies["metrics"]["transactions"] == 24
    assert anomalies["metrics"]["anomalies"] > 0

    models = ml_client.get("/api/ml/models").json()
    assert len(models) == 5
    assert all({"version", "algorithm", "dataset", "training_date", "metrics", "status"}.issubset(model) for model in models)
    assert {model["model_key"] for model in models} == {
        "customer_segmentation",
        "customer_churn",
        "sales_forecast",
        "inventory_demand",
        "sales_anomaly_detection",
    }


def test_ml_endpoints_return_empty_states_without_business_data(empty_ml_client: TestClient) -> None:
    assert empty_ml_client.post("/api/ml/segmentation").json()["status"] == "insufficient_data"
    assert empty_ml_client.post("/api/ml/churn").json()["status"] == "insufficient_data"
    assert empty_ml_client.post("/api/ml/forecast").json()["status"] == "insufficient_data"
    assert empty_ml_client.post("/api/ml/inventory-demand").json()["status"] == "insufficient_data"
    assert empty_ml_client.post("/api/ml/anomalies").json()["status"] == "insufficient_data"