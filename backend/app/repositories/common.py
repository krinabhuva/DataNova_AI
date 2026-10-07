from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy.orm import Session


class BusinessStorageError(ValueError):
    pass


def required_text(row: dict[str, Any], field: str) -> str:
    value = optional_text(row, field)
    if value is None:
        raise BusinessStorageError(f"Required field '{field}' is missing.")
    return value


def optional_text(row: dict[str, Any], field: str) -> str | None:
    value = row.get(field)
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def decimal_value(row: dict[str, Any], field: str, *, default: Decimal | None = None) -> Decimal:
    value = row.get(field)
    if value is None or (isinstance(value, str) and not value.strip()):
        if default is not None:
            return default
        raise BusinessStorageError(f"Required numeric field '{field}' is missing.")
    try:
        result = Decimal(str(value).strip())
    except (InvalidOperation, ValueError) as exc:
        raise BusinessStorageError(f"Field '{field}' must be numeric.") from exc
    if not result.is_finite():
        raise BusinessStorageError(f"Field '{field}' must be a finite number.")
    return result


def integer_value(row: dict[str, Any], field: str, *, default: int | None = None) -> int:
    value = row.get(field)
    if value is None or (isinstance(value, str) and not value.strip()):
        if default is not None:
            return default
        raise BusinessStorageError(f"Required integer field '{field}' is missing.")
    try:
        number = Decimal(str(value).strip())
    except (InvalidOperation, ValueError) as exc:
        raise BusinessStorageError(f"Field '{field}' must be an integer.") from exc
    if not number.is_finite() or number != number.to_integral_value():
        raise BusinessStorageError(f"Field '{field}' must be an integer.")
    return int(number)


def datetime_value(row: dict[str, Any], field: str) -> datetime:
    value = row.get(field)
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, time.min)
    if value is None:
        raise BusinessStorageError(f"Required date field '{field}' is missing.")
    text = str(value).strip()
    if text.endswith("Z"):
        text = f"{text[:-1]}+00:00"
    for parser in (
        datetime.fromisoformat,
        lambda item: datetime.strptime(item, "%m/%d/%Y"),
        lambda item: datetime.strptime(item, "%d/%m/%Y"),
        lambda item: datetime.strptime(item, "%Y/%m/%d"),
    ):
        try:
            return parser(text)
        except ValueError:
            continue
    raise BusinessStorageError(f"Field '{field}' must be a valid date or timestamp.")


def customer_for_row(db: Session, row: dict[str, Any]):
    from app.models.business_data import Customer

    customer_code = optional_text(row, "customer_code")
    customer_id = row.get("customer_id")
    if customer_code is not None:
        customer = db.query(Customer).filter_by(customer_code=customer_code).one_or_none()
        if customer is None:
            raise BusinessStorageError(f"Customer '{customer_code}' does not exist.")
        return customer
    if customer_id is not None:
        customer = db.get(Customer, integer_value(row, "customer_id"))
        if customer is None:
            raise BusinessStorageError(f"Customer id '{customer_id}' does not exist.")
        return customer
    raise BusinessStorageError("Provide either 'customer_code' or 'customer_id'.")
