from collections.abc import Generator
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.services.object_storage import get_object_storage

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False, expire_on_commit=False)


class InMemoryObjectStorage:
    def __init__(self) -> None:
        self.objects: dict[str, tuple[bytes, str]] = {}

    def put(self, object_key: str, content: bytes, content_type: str) -> None:
        self.objects[object_key] = (content, content_type)

    def remove(self, object_key: str) -> None:
        self.objects.pop(object_key, None)


@pytest.fixture
def dataset_client() -> Generator[tuple[TestClient, InMemoryObjectStorage], None, None]:
    Base.metadata.create_all(bind=TEST_ENGINE)
    storage = InMemoryObjectStorage()

    def override_get_db():
        with TestSessionLocal() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_object_storage] = lambda: storage
    with TestClient(app) as client:
        yield client, storage
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=TEST_ENGINE)


def test_upload_list_detail_and_delete_dataset(
    dataset_client: tuple[TestClient, InMemoryObjectStorage],
) -> None:
    client, storage = dataset_client
    upload = client.post(
        "/api/datasets",
        files={"file": ("sales.csv", b"region,revenue\nWest,12\nEast,18\n", "text/csv")},
    )

    assert upload.status_code == 201
    dataset = upload.json()
    assert dataset["filename"] == "sales.csv"
    assert dataset["file_type"] == "CSV"
    assert dataset["row_count"] == 2
    assert dataset["column_count"] == 2
    object_key = next(iter(storage.objects))
    assert object_key.startswith("raw/")
    assert storage.objects[object_key][0] == b"region,revenue\nWest,12\nEast,18\n"

    listing = client.get("/api/datasets")
    assert listing.status_code == 200
    assert [item["id"] for item in listing.json()] == [dataset["id"]]

    detail = client.get(f"/api/datasets/{dataset['id']}")
    assert detail.status_code == 200
    assert detail.json() == dataset

    deletion = client.delete(f"/api/datasets/{dataset['id']}")
    assert deletion.status_code == 204
    assert not storage.objects
    assert client.get(f"/api/datasets/{dataset['id']}").status_code == 404
    assert client.get("/api/datasets").json() == []


def test_upload_xlsx_dataset(dataset_client: tuple[TestClient, InMemoryObjectStorage]) -> None:
    client, _ = dataset_client
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(["product", "units"])
    sheet.append(["Widget", 3])

    contents = BytesIO()
    workbook.save(contents)

    response = client.post(
        "/api/datasets",
        files={"file": ("inventory.xlsx", contents.getvalue(), "application/octet-stream")},
    )

    assert response.status_code == 201
    assert response.json()["file_type"] == "Excel"
    assert response.json()["row_count"] == 1
    assert response.json()["column_count"] == 2


@pytest.mark.parametrize(
    ("filename", "content", "expected_detail"),
    [
        ("records.csv", b"one,two\nvalue\n", "Every CSV row must have the same number of columns."),
        ("records.parquet", b"not a supported file", "Only CSV and .xlsx files are supported."),
        ("records.csv", b"\xff\xfe", "CSV files must use UTF-8 encoding."),
    ],
)
def test_rejects_invalid_dataset_files(
    dataset_client: tuple[TestClient, InMemoryObjectStorage],
    filename: str,
    content: bytes,
    expected_detail: str,
) -> None:
    client, storage = dataset_client
    response = client.post("/api/datasets", files={"file": (filename, content, "application/octet-stream")})

    assert response.status_code == 422
    assert response.json()["detail"] == expected_detail
    assert not storage.objects
