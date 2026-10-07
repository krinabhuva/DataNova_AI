from typing import Any

from sqlalchemy.orm import Session

from app.models.business_data import Inventory, Product
from app.repositories.common import (
    BusinessStorageError,
    decimal_value,
    integer_value,
    optional_text,
)


def upsert_inventory(db: Session, row: dict[str, Any]) -> Inventory:
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

    quantity = integer_value(row, "quantity")
    reorder_level = integer_value(row, "reorder_level", default=0)
    if quantity < 0 or reorder_level < 0:
        raise BusinessStorageError("Inventory quantity and reorder level cannot be negative.")
    inventory = db.query(Inventory).filter_by(product_id=product.id).one_or_none()
    if inventory is None:
        inventory = Inventory(product_id=product.id, quantity=quantity, reorder_level=reorder_level)
        db.add(inventory)
    inventory.quantity = quantity
    inventory.reorder_level = reorder_level
    inventory.inventory_value = decimal_value(
        row, "inventory_value", default=product.price * quantity
    )
    db.flush()
    return inventory
