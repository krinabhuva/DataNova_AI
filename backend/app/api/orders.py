from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.business_data import Order
from app.schemas.business_data import OrderResponse

router = APIRouter(tags=["orders"])


@router.get("/orders", response_model=list[OrderResponse], summary="List stored orders")
def list_orders(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Order]:
    return list(db.scalars(select(Order).order_by(Order.id).limit(limit).offset(offset)).all())
