from fastapi import APIRouter

router = APIRouter(tags=["ai"])


@router.get("/ai", summary="AI status")
def ai_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "AI endpoints are planned for a later phase."}
