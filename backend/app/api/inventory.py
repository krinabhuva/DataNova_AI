from fastapi import APIRouter

router = APIRouter(tags=["inventory"])


@router.get("/inventory", summary="Inventory status")
def inventory_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Inventory endpoints are planned for a later phase."}
