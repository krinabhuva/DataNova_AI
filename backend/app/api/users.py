from fastapi import APIRouter

router = APIRouter(tags=["users"])


@router.get("/users", summary="Users status")
def users_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "User management endpoints are planned for a later phase."}
