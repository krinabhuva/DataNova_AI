from fastapi import APIRouter

router = APIRouter(tags=["datasets"])


@router.get("/datasets", summary="Datasets status")
def datasets_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Dataset endpoints are planned for a later phase."}
