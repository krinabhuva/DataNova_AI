from fastapi import APIRouter

router = APIRouter(tags=["auth"])


@router.get("/auth", summary="Authentication status")
def auth_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Authentication endpoints are planned for a later phase."}
