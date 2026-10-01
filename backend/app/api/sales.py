from fastapi import APIRouter

router = APIRouter(tags=["sales"])


@router.get("/sales", summary="Sales status")
def sales_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Sales endpoints are planned for a later phase."}
