from fastapi import APIRouter

router = APIRouter(tags=["pipelines"])


@router.get("/pipelines", summary="Pipelines status")
def pipelines_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Pipeline endpoints are planned for a later phase."}
