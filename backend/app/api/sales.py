from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.business_data import Sale
from app.schemas.business_data import SaleResponse

router = APIRouter(tags=["sales"])


@router.get("/sales", response_model=list[SaleResponse], summary="List stored sales")
def list_sales(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Sale]:
    return list(db.scalars(select(Sale).order_by(Sale.id).limit(limit).offset(offset)).all())
