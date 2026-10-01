from fastapi import APIRouter

router = APIRouter(tags=["ml"])


@router.get("/ml", summary="ML status")
def ml_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "ML endpoints are planned for a later phase."}
