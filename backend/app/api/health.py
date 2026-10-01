from fastapi import APIRouter

from app.database.session import check_database_connection
from app.schemas.health import DatabaseHealthResponse, HealthResponse
from app.services.health_service import get_health_status

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Service health")
def health_check() -> HealthResponse:
    return HealthResponse(service="DataNova API", **get_health_status())


@router.get("/health/db", response_model=DatabaseHealthResponse, summary="Database health")
def database_health_check() -> DatabaseHealthResponse:
    is_connected, detail = check_database_connection()
    return DatabaseHealthResponse(
        database="postgresql",
        status="connected" if is_connected else "unavailable",
        details=detail if is_connected else f"Database unavailable: {detail}",
    )