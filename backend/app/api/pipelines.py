from datetime import UTC, datetime
from logging import getLogger
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, status
from minio.error import MinioException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.dataset import Dataset
from app.models.pipeline_run import PipelineRun
from app.schemas.pipeline import PipelineRunCreate, PipelineRunResponse
from app.services.etl import PipelineExecutionError, load_rows, prepare_pipeline
from app.services.object_storage import ObjectStorage, get_object_storage

logger = getLogger(__name__)
router = APIRouter(tags=["pipelines"])


@router.get("/pipelines", response_model=list[PipelineRunResponse], summary="List ETL pipeline runs")
def list_pipeline_runs(db: Session = Depends(get_db)) -> list[PipelineRun]:
    return list(
        db.scalars(
            select(PipelineRun).order_by(PipelineRun.started_at.desc(), PipelineRun.id.desc())
        ).all()
    )


@router.get(
    "/pipelines/{run_id}",
    response_model=PipelineRunResponse,
    summary="Get ETL pipeline run details",
)
def get_pipeline_run(run_id: int, db: Session = Depends(get_db)) -> PipelineRun:
    run = db.get(PipelineRun, run_id)
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline run not found.")
    return run


@router.post(
    "/pipelines/run",
    response_model=PipelineRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run ETL for a stored dataset",
)
def run_pipeline(
    request: PipelineRunCreate,
    db: Session = Depends(get_db),
    storage: ObjectStorage = Depends(get_object_storage),
) -> PipelineRun:
    dataset = db.get(Dataset, request.dataset_id)
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    run = PipelineRun(
        dataset_id=dataset.id,
        dataset_filename=dataset.filename,
        destination_table=request.destination_table,
        status="RUNNING",
        started_at=datetime.now(UTC),
        errors=[],
    )
    started_clock = monotonic()
    db.add(run)
    try:
        db.commit()
        db.refresh(run)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Could not create pipeline run.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create pipeline run.",
        ) from exc

    metrics = None
    try:
        content = storage.get(dataset.object_key)
        prepared = prepare_pipeline(dataset, content, request)
        metrics = prepared.metrics
        run.total_rows = metrics.total_rows
        run.valid_rows = metrics.valid_rows
        run.rejected_rows = metrics.rejected_rows
        run.duplicates = metrics.duplicates
        run.missing_values = metrics.missing_values
        run.quality_score = metrics.quality_score
        run.errors = metrics.errors
        load_rows(db, request.destination_table, prepared)
        run.status = "SUCCESS"
        run.finished_at = datetime.now(UTC)
        run.duration_ms = max(0, int((monotonic() - started_clock) * 1000))
        db.commit()
        db.refresh(run)
        return run
    except (MinioException, PipelineExecutionError, SQLAlchemyError) as exc:
        db.rollback()
        persisted_run = db.get(PipelineRun, run.id)
        if persisted_run is None:
            logger.exception("Pipeline run disappeared after execution failed.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not persist pipeline failure status.",
            ) from exc
        if metrics is not None:
            persisted_run.total_rows = metrics.total_rows
            persisted_run.valid_rows = metrics.valid_rows
            persisted_run.rejected_rows = metrics.rejected_rows
            persisted_run.duplicates = metrics.duplicates
            persisted_run.missing_values = metrics.missing_values
            persisted_run.quality_score = metrics.quality_score
            persisted_run.errors = [*metrics.errors, str(exc)]
        else:
            persisted_run.errors = [str(exc)]
        persisted_run.status = "FAILED"
        persisted_run.finished_at = datetime.now(UTC)
        persisted_run.duration_ms = max(0, int((monotonic() - started_clock) * 1000))
        try:
            db.commit()
            db.refresh(persisted_run)
        except SQLAlchemyError as persistence_error:
            db.rollback()
            logger.exception("Could not persist pipeline failure status.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not persist pipeline failure status.",
            ) from persistence_error
        if isinstance(exc, SQLAlchemyError):
            logger.exception("Could not load pipeline output into PostgreSQL.")
        elif isinstance(exc, MinioException):
            logger.exception("Could not read raw dataset from MinIO.")
        return persisted_run
