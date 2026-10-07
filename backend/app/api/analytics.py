from collections import defaultdict
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import case, distinct, extract, func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.business_data import Customer, Inventory, Order, Product, Sale

router = APIRouter(tags=["analytics"])


@router.get("/analytics", summary="Business analytics aggregates")
def get_analytics(db: Session = Depends(get_db)) -> dict[str, Any]:
    revenue, profit = db.execute(
        select(func.coalesce(func.sum(Sale.revenue), 0), func.coalesce(func.sum(Sale.profit), 0))
    ).one()
    order_count = db.scalar(select(func.count(Order.id))) or 0
    customer_count = db.scalar(select(func.count(Customer.id))) or 0
    inventory_value = db.scalar(
        select(func.coalesce(func.sum(Inventory.inventory_value), 0))
    ) or 0

    monthly_rows = db.execute(
        select(
            extract("year", Sale.order_date).label("year"),
            extract("month", Sale.order_date).label("month"),
            func.sum(Sale.revenue).label("revenue"),
            func.sum(Sale.profit).label("profit"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
    ).all()
    monthly_sales = {
        (int(row.year), int(row.month)): {"revenue": float(row.revenue), "profit": float(row.profit)}
        for row in monthly_rows
    }
    latest_period = max(monthly_sales, default=None)
    revenue_trend: list[dict[str, Any]] = []
    period_sales = {"daily": 0.0, "weekly": 0.0, "monthly": 0.0, "yearly": 0.0}
    growth = 0.0
    if latest_period is not None:
        year, month = latest_period
        month_index = year * 12 + month - 1
        trend_periods = [divmod(month_index - offset, 12) for offset in reversed(range(12))]
        trend_periods = [(period_year, period_month + 1) for period_year, period_month in trend_periods]
        revenue_trend = [
            {
                "name": date(period_year, period_month, 1).strftime("%b"),
                "revenue": monthly_sales.get((period_year, period_month), {}).get("revenue", 0.0),
                "profit": monthly_sales.get((period_year, period_month), {}).get("profit", 0.0),
            }
            for period_year, period_month in trend_periods
        ]
        prior_month_index = month_index - 1
        prior_period = divmod(prior_month_index, 12)
        prior_revenue = monthly_sales.get((prior_period[0], prior_period[1] + 1), {}).get("revenue", 0.0)
        latest_revenue = monthly_sales[latest_period]["revenue"]
        growth = ((latest_revenue - prior_revenue) / prior_revenue * 100) if prior_revenue else 0.0
        period_sales["monthly"] = latest_revenue
        period_sales["yearly"] = sum(
            values["revenue"] for (period_year, _), values in monthly_sales.items() if period_year == year
        )
        latest_date = db.scalar(select(func.max(Sale.order_date)))
        if latest_date is not None:
            latest_day = latest_date.date() if hasattr(latest_date, "date") else latest_date
            period_sales["daily"] = float(db.scalar(
                select(func.coalesce(func.sum(Sale.revenue), 0)).where(func.date(Sale.order_date) == latest_day)
            ) or 0)
            week_start = date.fromordinal(latest_day.toordinal() - 6)
            period_sales["weekly"] = float(db.scalar(
                select(func.coalesce(func.sum(Sale.revenue), 0)).where(
                    func.date(Sale.order_date) >= week_start,
                    func.date(Sale.order_date) <= latest_day,
                )
            ) or 0)

    category_rows = db.execute(
        select(
            Product.category,
            func.sum(Sale.quantity).label("sales"),
            func.sum(Sale.revenue).label("revenue"),
        )
        .join(Product, Product.id == Sale.product_id)
        .group_by(Product.category)
        .order_by(func.sum(Sale.revenue).desc())
    ).all()
    category_sales = [
        {"name": row.category or "Uncategorized", "sales": int(row.sales), "revenue": float(row.revenue)}
        for row in category_rows
    ]

    regional_rows = db.execute(
        select(
            Sale.region,
            func.sum(Sale.revenue).label("revenue"),
            func.count(distinct(Sale.order_id)).label("orders"),
        )
        .group_by(Sale.region)
        .order_by(func.sum(Sale.revenue).desc())
    ).all()
    regional_sales = [
        {"name": row.region or "Unspecified", "revenue": float(row.revenue), "orders": int(row.orders)}
        for row in regional_rows
    ]

    product_rows = db.execute(
        select(
            Product.name,
            Product.category,
            func.sum(Sale.quantity).label("sales"),
            func.sum(Sale.revenue).label("revenue"),
            func.sum(Sale.profit).label("profit"),
            func.coalesce(Inventory.quantity, Product.stock_quantity).label("stock"),
        )
        .join(Sale, Sale.product_id == Product.id)
        .outerjoin(Inventory, Inventory.product_id == Product.id)
        .group_by(Product.id, Product.name, Product.category, Inventory.quantity, Product.stock_quantity)
        .order_by(func.sum(Sale.revenue).desc())
        .limit(5)
    ).all()
    top_products = [
        {
            "name": row.name,
            "category": row.category or "Uncategorized",
            "sales": int(row.sales),
            "revenue": float(row.revenue),
            "profit": float(row.profit),
            "stock": int(row.stock),
        }
        for row in product_rows
    ]

    customer_month_rows = db.execute(
        select(
            Sale.customer_id,
            extract("year", Sale.order_date).label("year"),
            extract("month", Sale.order_date).label("month"),
            func.count(distinct(Sale.order_id)).label("orders"),
        )
        .group_by(Sale.customer_id, "year", "month")
        .order_by("year", "month")
    ).all()
    customer_first_month: dict[int, tuple[int, int]] = {}
    customer_month_counts: dict[tuple[int, int], dict[str, int]] = defaultdict(lambda: {"new": 0, "returning": 0})
    customers_with_sales: set[int] = set()
    customer_order_totals: dict[int, int] = defaultdict(int)
    for row in customer_month_rows:
        customer_id = int(row.customer_id)
        period = (int(row.year), int(row.month))
        customer_first_month.setdefault(customer_id, period)
        customers_with_sales.add(customer_id)
        customer_order_totals[customer_id] += int(row.orders)
        if customer_first_month[customer_id] == period:
            customer_month_counts[period]["new"] += 1
        else:
            customer_month_counts[period]["returning"] += 1
    repeat_customer_count = sum(total_orders > 1 for total_orders in customer_order_totals.values())

    customer_growth: list[dict[str, Any]] = []
    if latest_period is not None:
        latest_month_index = latest_period[0] * 12 + latest_period[1] - 1
        growth_periods = [divmod(latest_month_index - offset, 12) for offset in reversed(range(7))]
        for period_year, period_month in growth_periods:
            period = (period_year, period_month + 1)
            customer_growth.append({
                "month": date(period[0], period[1], 1).strftime("%b"),
                **customer_month_counts[period],
            })

    inventory_rows = db.execute(
        select(
            func.count(Inventory.id).label("total"),
            func.sum(case((Inventory.quantity <= Inventory.reorder_level, 1), else_=0)).label("critical"),
            func.sum(case((Inventory.quantity <= Inventory.reorder_level * 2, 1), else_=0)).label("watch"),
        )
    ).one()
    inventory_total = int(inventory_rows.total or 0)
    critical_count = int(inventory_rows.critical or 0)
    watch_count = int(inventory_rows.watch or 0) - critical_count
    healthy_count = inventory_total - critical_count - watch_count
    inventory_status = [
        {"name": name, "value": round(count / inventory_total * 100, 1) if inventory_total else 0.0, "count": count}
        for name, count in (("Healthy", healthy_count), ("Watch", watch_count), ("Critical", critical_count))
    ]

    total_revenue = float(revenue)
    total_profit = float(profit)
    active_customer_count = len(customers_with_sales)
    order_revenue_count = db.scalar(select(func.count(distinct(Sale.order_id)))) or 0
    latest_customer_period = customer_month_counts.get(latest_period, {}) if latest_period else {}
    customer_metrics = [
        {"label": "New customers", "value": int(latest_customer_period.get("new", 0))},
        {"label": "Returning customers", "value": repeat_customer_count},
        {"label": "Retention", "value": round(repeat_customer_count / active_customer_count * 100, 1) if active_customer_count else 0.0},
        {"label": "Average order value", "value": total_revenue / order_revenue_count if order_revenue_count else 0.0},
        {"label": "Customer lifetime value", "value": total_revenue / active_customer_count if active_customer_count else 0.0},
    ]

    return {
        "summary": {
            "total_revenue": total_revenue,
            "total_orders": int(order_count),
            "total_customers": int(customer_count),
            "total_profit": total_profit,
            "growth": round(growth, 1),
            "inventory_value": float(inventory_value),
            "profit_margin": round(total_profit / total_revenue * 100, 1) if total_revenue else 0.0,
        },
        "period_sales": period_sales,
        "revenue_trend": revenue_trend,
        "category_sales": category_sales,
        "regional_sales": regional_sales,
        "top_products": top_products,
        "customer_growth": customer_growth,
        "customer_metrics": customer_metrics,
        "inventory_status": inventory_status,
    }
