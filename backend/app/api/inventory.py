from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.business_data import Inventory
from app.schemas.business_data import InventoryResponse

router = APIRouter(tags=["inventory"])


@router.get("/inventory", response_model=list[InventoryResponse], summary="List stored inventory")
def list_inventory(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Inventory]:
    return list(db.scalars(select(Inventory).order_by(Inventory.id).limit(limit).offset(offset)).all())
