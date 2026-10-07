from typing import Any

from sqlalchemy.orm import Session

from app.models.business_data import Product
from app.repositories.common import decimal_value, integer_value, optional_text, required_text


def upsert_product(db: Session, row: dict[str, Any]) -> Product:
    product_code = required_text(row, "product_code")
    product = db.query(Product).filter_by(product_code=product_code).one_or_none()
    if product is None:
        product = Product(product_code=product_code, name=required_text(row, "name"))
        db.add(product)

    product.name = required_text(row, "name")
    product.category = optional_text(row, "category")
    product.price = decimal_value(row, "price")
    product.cost = decimal_value(row, "cost")
    product.stock_quantity = integer_value(row, "stock_quantity", default=0)
    db.flush()
    return product
