from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.business_data import Customer
from app.schemas.business_data import CustomerResponse

router = APIRouter(tags=["customers"])


@router.get("/customers", response_model=list[CustomerResponse], summary="List stored customers")
def list_customers(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Customer]:
    return list(db.scalars(select(Customer).order_by(Customer.id).limit(limit).offset(offset)).all())
