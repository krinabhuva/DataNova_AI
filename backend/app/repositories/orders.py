from typing import Any

from sqlalchemy.orm import Session

from app.models.business_data import Order
from app.repositories.common import (
    customer_for_row,
    datetime_value,
    decimal_value,
    optional_text,
    required_text,
)


def upsert_order(db: Session, row: dict[str, Any]) -> Order:
    order_code = required_text(row, "order_code")
    customer = customer_for_row(db, row)
    order = db.query(Order).filter_by(order_code=order_code).one_or_none()
    if order is None:
        order = Order(order_code=order_code, customer_id=customer.id)
        db.add(order)

    order.customer_id = customer.id
    order.order_date = datetime_value(row, "order_date")
    order.status = optional_text(row, "status") or "pending"
    order.total_amount = decimal_value(row, "total_amount")
    db.flush()
    return order
