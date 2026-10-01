from fastapi import APIRouter

router = APIRouter(tags=["customers"])


@router.get("/customers", summary="Customers status")
def customers_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Customer endpoints are planned for a later phase."}
