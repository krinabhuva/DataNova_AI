from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.business_data import Product
from app.schemas.business_data import ProductResponse

router = APIRouter(tags=["products"])


@router.get("/products", response_model=list[ProductResponse], summary="List stored products")
def list_products(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Product]:
    return list(db.scalars(select(Product).order_by(Product.id).limit(limit).offset(offset)).all())
