from collections.abc import Callable
from typing import Any

from sqlalchemy.orm import Session

from app.repositories.common import BusinessStorageError
from app.repositories.customers import upsert_customer
from app.repositories.inventory import upsert_inventory
from app.repositories.orders import upsert_order
from app.repositories.products import upsert_product
from app.repositories.sales import upsert_sale

BUSINESS_DESTINATIONS: dict[str, Callable[[Session, dict[str, Any]], Any]] = {
    "customers": upsert_customer,
    "products": upsert_product,
    "orders": upsert_order,
    "sales": upsert_sale,
    "inventory": upsert_inventory,
}


def load_business_rows(db: Session, destination: str, rows: list[dict[str, Any]]) -> int:
    try:
        repository = BUSINESS_DESTINATIONS[destination.lower()]
    except KeyError as exc:
        raise BusinessStorageError(f"Unknown business destination '{destination}'.") from exc

    for row in rows:
        repository(db, row)
    return len(rows)
