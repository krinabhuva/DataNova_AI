from typing import Any

from sqlalchemy.orm import Session

from app.models.business_data import Customer
from app.repositories.common import optional_text, required_text


def upsert_customer(db: Session, row: dict[str, Any]) -> Customer:
    customer_code = required_text(row, "customer_code")
    customer = db.query(Customer).filter_by(customer_code=customer_code).one_or_none()
    if customer is None:
        customer = Customer(customer_code=customer_code, name=required_text(row, "name"))
        db.add(customer)

    customer.name = required_text(row, "name")
    customer.email = optional_text(row, "email")
    customer.phone = optional_text(row, "phone")
    customer.region = optional_text(row, "region")
    customer.city = optional_text(row, "city")
    db.flush()
    return customer
