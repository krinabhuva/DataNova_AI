from fastapi import APIRouter

router = APIRouter(tags=["analytics"])


@router.get("/analytics", summary="Analytics status")
def analytics_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Analytics endpoints are planned for a later phase."}
