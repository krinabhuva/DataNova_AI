from collections.abc import Generator
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.dataset import Dataset
from app.schemas.pipeline import PipelineRunCreate
from app.services.etl import extract_dataset, validate_clean_transform
from app.services.object_storage import get_object_storage

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False, expire_on_commit=False)


class InMemoryObjectStorage:
    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}

    def get(self, object_key: str) -> bytes:
        return self.objects[object_key]


@pytest.fixture
def pipeline_client() -> Generator[tuple[TestClient, InMemoryObjectStorage, int], None, None]:
    Base.metadata.create_all(bind=TEST_ENGINE)
    with TEST_ENGINE.begin() as connection:
        connection.exec_driver_sql("DROP TABLE IF EXISTS orders_cleaned")
    storage = InMemoryObjectStorage()
    contents = (
        "amount,created_at,name\n"
        "10,2026-01-01, A \n"
        "bad,2026-01-02,Bad number\n"
        "11,not-a-date,Bad date\n"
        "10,2026-01-01, A \n"
        ",2026-01-03,Missing amount\n"
    ).encode()
    with TestSessionLocal() as db:
        dataset = Dataset(
            filename="orders.csv",
            file_type="CSV",
            content_type="text/csv",
            file_size_bytes=len(contents),
            row_count=5,
            column_count=3,
            object_key="raw/1/orders.csv",
        )
        db.add(dataset)
        db.commit()
        dataset_id = dataset.id
        storage.objects[dataset.object_key] = contents

    def override_get_db():
        with TestSessionLocal() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_object_storage] = lambda: storage
    with TestClient(app) as client:
        yield client, storage, dataset_id
    app.dependency_overrides.clear()
    with TEST_ENGINE.begin() as connection:
        connection.exec_driver_sql("DROP TABLE IF EXISTS orders_cleaned")
    Base.metadata.drop_all(bind=TEST_ENGINE)


def test_numeric_date_validation_and_duplicate_detection() -> None:
    request = PipelineRunCreate(
        dataset_id=1,
        destination_table="orders_cleaned",
        numeric_columns=["amount"],
        date_columns=["created_at"],
    )

    prepared = validate_clean_transform(
        ["amount", "created_at"],
        [
            {"amount": "12.5", "created_at": "2026-05-31"},
            {"amount": "invalid", "created_at": "2026-05-31"},
            {"amount": "10", "created_at": "not-a-date"},
            {"amount": "12.5", "created_at": "2026-05-31"},
        ],
        request,
    )

    assert prepared.metrics.total_rows == 4
    assert prepared.metrics.valid_rows == 1
    assert prepared.metrics.rejected_rows == 2
    assert prepared.metrics.duplicates == 1
    assert prepared.metrics.quality_score == 25
    assert prepared.rows[0]["amount"] == 12.5
    assert prepared.rows[0]["created_at"].isoformat() == "2026-05-31T00:00:00"
    assert len(prepared.metrics.errors) == 2


def test_missing_values_can_be_filled_and_counted() -> None:
    request = PipelineRunCreate(
        dataset_id=1,
        destination_table="values_filled",
        missing_value_action="fill",
        fill_value="0",
        numeric_columns=["quantity"],
    )

    prepared = validate_clean_transform(
        ["quantity", "label"],
        [{"quantity": "", "label": "  "}, {"quantity": "4", "label": "x"}],
        request,
    )

    assert prepared.metrics.missing_values == 2
    assert prepared.metrics.valid_rows == 2
    assert prepared.rows == [{"quantity": 0.0, "label": "0"}, {"quantity": 4.0, "label": "x"}]


def test_missing_rows_can_be_rejected_and_transformations_applied() -> None:
    request = PipelineRunCreate(
        dataset_id=1,
        destination_table="values_cleaned",
        missing_value_action="drop_row",
        drop_columns=["internal"],
        lowercase_columns=["region"],
        rename_columns={"region": "Sales Region"},
    )

    prepared = validate_clean_transform(
        ["region", "internal"],
        [{"region": "  WEST ", "internal": "private"}, {"region": "", "internal": "private"}],
        request,
    )

    assert prepared.metrics.missing_values == 1
    assert prepared.metrics.valid_rows == 1
    assert prepared.metrics.rejected_rows == 1
    assert prepared.headers == ["sales_region"]
    assert prepared.rows == [{"sales_region": "west"}]


def test_excel_extraction_reads_first_worksheet() -> None:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.append(["Product", "Units"])
    worksheet.append(["Widget", 3])
    contents = BytesIO()
    workbook.save(contents)

    headers, rows = extract_dataset("Excel", contents.getvalue())

    assert headers == ["Product", "Units"]
    assert rows == [{"Product": "Widget", "Units": 3}]


def test_pipeline_api_loads_rows_and_persists_quality_metrics(
    pipeline_client: tuple[TestClient, InMemoryObjectStorage, int],
) -> None:
    client, _, dataset_id = pipeline_client

    response = client.post(
        "/api/pipelines/run",
        json={
            "dataset_id": dataset_id,
            "destination_table": "orders_cleaned",
            "numeric_columns": ["amount"],
            "date_columns": ["created_at"],
        },
    )

    assert response.status_code == 201
    run = response.json()
    assert run["status"] == "SUCCESS"
    assert run["total_rows"] == 5
    assert run["valid_rows"] == 2
    assert run["rejected_rows"] == 2
    assert run["duplicates"] == 1
    assert run["missing_values"] == 1
    assert run["quality_score"] == 40
    assert run["duration_ms"] >= 0
    assert len(run["errors"]) == 2
    with TEST_ENGINE.connect() as connection:
        assert connection.execute(text("SELECT COUNT(*) FROM orders_cleaned")).scalar_one() == 2

    listing = client.get("/api/pipelines")
    details = client.get(f"/api/pipelines/{run['id']}")
    assert listing.status_code == 200
    assert listing.json()[0]["id"] == run["id"]
    assert details.status_code == 200
    assert details.json() == run


def test_pipeline_api_reports_existing_destination_as_failed_run(
    pipeline_client: tuple[TestClient, InMemoryObjectStorage, int],
) -> None:
    client, _, dataset_id = pipeline_client
    request = {
        "dataset_id": dataset_id,
        "destination_table": "orders_cleaned",
        "numeric_columns": ["amount"],
        "date_columns": ["created_at"],
    }
    assert client.post("/api/pipelines/run", json=request).json()["status"] == "SUCCESS"

    response = client.post("/api/pipelines/run", json=request)

    assert response.status_code == 201
    assert response.json()["status"] == "FAILED"
    assert response.json()["total_rows"] == 5
    assert response.json()["valid_rows"] == 2
    assert any("already exists" in error for error in response.json()["errors"])
