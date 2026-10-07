from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.ml import (
    detect_anomalies,
    forecast_sales,
    list_models,
    predict_inventory_demand,
    train_churn,
    train_segmentation,
)

router = APIRouter(tags=["ml"])


@router.get("/ml", summary="ML status")
def ml_status(db: Session = Depends(get_db)) -> dict[str, Any]:
    return {"status": "ok", "models": len(list_models(db))}


@router.get("/ml/models", summary="List trained model metadata")
def get_models(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    return list_models(db)


@router.post("/ml/segmentation", summary="Train RFM customer segmentation")
def customer_segmentation(db: Session = Depends(get_db)) -> dict[str, Any]:
    response = train_segmentation(db)
    db.commit()
    return response


@router.post("/ml/churn", summary="Train and score customer churn")
def customer_churn(db: Session = Depends(get_db)) -> dict[str, Any]:
    response = train_churn(db)
    db.commit()
    return response


@router.post("/ml/forecast", summary="Validate and forecast sales")
def sales_forecast(
    horizon: int = Query(default=3, ge=1, le=12),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    response = forecast_sales(db, horizon)
    db.commit()
    return response


@router.post("/ml/inventory-demand", summary="Predict demand and recommended stock")
def inventory_demand(db: Session = Depends(get_db)) -> dict[str, Any]:
    response = predict_inventory_demand(db)
    db.commit()
    return response


@router.post("/ml/anomalies", summary="Detect anomalous sales transactions")
def sales_anomalies(
    contamination: float = Query(default=0.05, gt=0, le=0.5),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    response = detect_anomalies(db, contamination)
    db.commit()
    return response
