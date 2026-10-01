from fastapi import APIRouter

router = APIRouter(tags=["products"])


@router.get("/products", summary="Products status")
def products_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Product endpoints are planned for a later phase."}
