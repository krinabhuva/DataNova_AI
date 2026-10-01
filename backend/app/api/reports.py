from fastapi import APIRouter

router = APIRouter(tags=["reports"])


@router.get("/reports", summary="Reports status")
def reports_status() -> dict[str, str]:
    return {"status": "not_implemented", "message": "Report endpoints are planned for a later phase."}
