from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models.business_data import Customer, Order, Product, Sale
from app.repositories.common import (
    BusinessStorageError,
    customer_for_row,
    datetime_value,
    decimal_value,
    integer_value,
    optional_text,
)


def upsert_sale(db: Session, row: dict[str, Any]) -> Sale:
    order_code = optional_text(row, "order_code")
    order_id = row.get("order_id")
    if order_code is not None:
        order = db.query(Order).filter_by(order_code=order_code).one_or_none()
    elif order_id is not None:
        order = db.get(Order, integer_value(row, "order_id"))
    else:
        raise BusinessStorageError("Provide either 'order_code' or 'order_id'.")
    if order is None:
        raise BusinessStorageError(f"Order '{order_code or order_id}' does not exist.")

    product_code = optional_text(row, "product_code")
    product_id = row.get("product_id")
    if product_code is not None:
        product = db.query(Product).filter_by(product_code=product_code).one_or_none()
    elif product_id is not None:
        product = db.get(Product, integer_value(row, "product_id"))
    else:
        raise BusinessStorageError("Provide either 'product_code' or 'product_id'.")
    if product is None:
        raise BusinessStorageError(f"Product '{product_code or product_id}' does not exist.")

    customer = customer_for_row(db, row) if (
        optional_text(row, "customer_code") is not None or row.get("customer_id") is not None
    ) else db.get(Customer, order.customer_id)
    if customer is None or customer.id != order.customer_id:
        raise BusinessStorageError("Sale customer must match the order customer.")

    quantity = integer_value(row, "quantity")
    if quantity < 1:
        raise BusinessStorageError("Sale quantity must be greater than zero.")
    unit_price = decimal_value(row, "unit_price")
    revenue = decimal_value(row, "revenue", default=unit_price * quantity)
    cost = decimal_value(row, "cost", default=product.cost * quantity)
    profit = decimal_value(row, "profit", default=revenue - cost)
    margin = decimal_value(
        row,
        "profit_margin",
        default=(profit / revenue * Decimal(100)) if revenue else Decimal(0),
    )

    sale = db.query(Sale).filter_by(order_id=order.id, product_id=product.id).one_or_none()
    if sale is None:
        sale = Sale(order_id=order.id, product_id=product.id, customer_id=customer.id)
        db.add(sale)
    sale.customer_id = customer.id
    sale.quantity = quantity
    sale.unit_price = unit_price
    sale.revenue = revenue
    sale.cost = cost
    sale.profit = profit
    sale.profit_margin = margin
    sale.order_date = (
        datetime_value(row, "order_date") if row.get("order_date") else order.order_date
    )
    sale.region = optional_text(row, "region") or customer.region
    db.flush()
    return sale
