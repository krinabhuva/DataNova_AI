import logging
import re
from pathlib import PurePosixPath
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from minio.error import MinioException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.session import get_db
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetResponse
from app.services.dataset_validation import DatasetFileValidationError, validate_dataset_file
from app.services.object_storage import ObjectStorage, get_object_storage

logger = logging.getLogger(__name__)
router = APIRouter(tags=["datasets"])


def _safe_filename(filename: str | None) -> str:
    basename = PurePosixPath((filename or "").replace("\\", "/")).name
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", basename).strip("._")
    if not safe_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A valid filename is required.")
    if len(safe_name) > 255:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Filename must be 255 characters or fewer.")
    return safe_name


@router.post(
    "/datasets",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a raw dataset",
)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    storage: ObjectStorage = Depends(get_object_storage),
) -> Dataset:
    filename = _safe_filename(file.filename)
    max_bytes = get_settings().dataset_max_upload_bytes
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds the {max_bytes}-byte upload limit.",
        )

    try:
        file_type, content_type, row_count, column_count = validate_dataset_file(filename, content)
    except DatasetFileValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    dataset = Dataset(
        filename=filename,
        file_type=file_type,
        content_type=content_type,
        file_size_bytes=len(content),
        row_count=row_count,
        column_count=column_count,
        object_key="",
    )
    db.add(dataset)
    try:
        db.flush()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Could not allocate dataset metadata.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save dataset metadata.") from exc

    object_key = f"raw/{dataset.id}/{uuid4().hex}_{filename}"
    try:
        storage.put(object_key, content, content_type)
    except MinioException as exc:
        db.rollback()
        logger.exception("Could not store uploaded dataset in MinIO.")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Object storage is unavailable.") from exc

    dataset.object_key = object_key
    try:
        db.commit()
        db.refresh(dataset)
    except SQLAlchemyError as exc:
        db.rollback()
        try:
            storage.remove(object_key)
        except MinioException:
            logger.exception("Could not clean up the uploaded object after metadata persistence failed.")
        logger.exception("Could not persist dataset metadata.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save dataset metadata.") from exc
    return dataset


@router.get("/datasets", response_model=list[DatasetResponse], summary="List datasets")
def list_datasets(db: Session = Depends(get_db)) -> list[Dataset]:
    return list(db.scalars(select(Dataset).order_by(Dataset.uploaded_at.desc(), Dataset.id.desc())).all())


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse, summary="Get dataset details")
def get_dataset(dataset_id: int, db: Session = Depends(get_db)) -> Dataset:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
    return dataset


@router.delete("/datasets/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete dataset")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    storage: ObjectStorage = Depends(get_object_storage),
) -> None:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    db.delete(dataset)
    try:
        db.flush()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Could not delete dataset metadata.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not delete dataset.") from exc

    try:
        storage.remove(dataset.object_key)
    except MinioException as exc:
        db.rollback()
        logger.exception("Could not remove dataset object from MinIO.")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Object storage is unavailable.") from exc

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Could not commit dataset deletion after removing the object.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not delete dataset metadata.") from exc
