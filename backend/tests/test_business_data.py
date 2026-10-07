from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.business_data import Customer, Inventory, Order, Product, Sale
from app.models.pipeline_run import PipelineRun
from app.services.business_storage import load_business_rows
from app.services.object_storage import get_object_storage

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False, expire_on_commit=False)


@event.listens_for(TEST_ENGINE, "connect")
def enable_sqlite_foreign_keys(connection, record) -> None:
    cursor = connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


class InMemoryObjectStorage:
    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}

    def get(self, object_key: str) -> bytes:
        return self.objects[object_key]

    def put(self, object_key: str, content: bytes, content_type: str) -> None:
        self.objects[object_key] = content

    def remove(self, object_key: str) -> None:
        self.objects.pop(object_key, None)


@pytest.fixture
def business_client() -> Generator[tuple[TestClient, InMemoryObjectStorage], None, None]:
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


def test_repositories_store_each_business_record_and_resolve_foreign_keys(
    business_client: tuple[TestClient, InMemoryObjectStorage],
) -> None:
    with TestSessionLocal() as db:
        load_business_rows(db, "customers", [{
            "customer_code": "C-1",
            "name": "Jamie Customer",
            "email": "jamie@example.com",
            "region": "West",
            "city": "Seattle",
        }])
        load_business_rows(db, "products", [{
            "product_code": "P-1",
            "name": "Desk",
            "category": "Furniture",
            "price": "125.00",
            "cost": "80.00",
            "stock_quantity": 8,
        }])
        load_business_rows(db, "orders", [{
            "order_code": "O-1",
            "customer_code": "C-1",
            "order_date": "2026-05-01",
            "status": "paid",
            "total_amount": "250.00",
        }])
        load_business_rows(db, "sales", [{
            "order_code": "O-1",
            "product_code": "P-1",
            "quantity": 2,
            "unit_price": "125.00",
        }])
        load_business_rows(db, "inventory", [{
            "product_code": "P-1",
            "quantity": 8,
            "reorder_level": 2,
        }])
        db.commit()

        customer = db.scalar(select(Customer).where(Customer.customer_code == "C-1"))
        product = db.scalar(select(Product).where(Product.product_code == "P-1"))
        order = db.scalar(select(Order).where(Order.order_code == "O-1"))
        sale = db.scalar(select(Sale).where(Sale.order_id == order.id))
        inventory = db.scalar(select(Inventory).where(Inventory.product_id == product.id))
        assert order.customer_id == customer.id
        assert sale.customer_id == customer.id
        assert sale.product_id == product.id
        assert sale.quantity == 2
        assert sale.revenue == 250
        assert sale.profit == 90
        assert inventory.product_id == product.id
        assert inventory.inventory_value == 1000


def test_business_imports_are_idempotent_and_api_lists_all_records(
    business_client: tuple[TestClient, InMemoryObjectStorage],
) -> None:
    client, _ = business_client
    with TestSessionLocal() as db:
        business_data = {
            "customers": [{"customer_code": "C-2", "name": "Robin", "region": "East"}],
            "products": [{
                "product_code": "P-2",
                "name": "Lamp",
                "price": "30.00",
                "cost": "10.00",
                "stock_quantity": 6,
            }],
            "orders": [{
                "order_code": "O-2",
                "customer_code": "C-2",
                "order_date": "2026-06-02",
                "total_amount": "30.00",
            }],
        }
        for destination, rows in business_data.items():
            load_business_rows(db, destination, rows)
        load_business_rows(db, "sales", [{
            "order_code": "O-2",
            "product_code": "P-2",
            "quantity": 1,
            "unit_price": "30.00",
        }])
        inventory_row = {"product_code": "P-2", "quantity": 6, "reorder_level": 1}
        load_business_rows(db, "inventory", [inventory_row])
        load_business_rows(db, "customers", [{"customer_code": "C-2", "name": "Robin Updated"}])
        load_business_rows(db, "products", [{
            "product_code": "P-2",
            "name": "Lamp Updated",
            "price": "32.00",
            "cost": "11.00",
            "stock_quantity": 5,
        }])
        load_business_rows(db, "orders", [{
            "order_code": "O-2",
            "customer_code": "C-2",
            "order_date": "2026-06-02",
            "total_amount": "32.00",
        }])
        load_business_rows(db, "sales", [{
            "order_code": "O-2",
            "product_code": "P-2",
            "quantity": 1,
            "unit_price": "32.00",
        }])
        load_business_rows(db, "inventory", [{"product_code": "P-2", "quantity": 5, "reorder_level": 1}])
        db.commit()

        assert db.scalar(select(func.count()).select_from(Customer)) == 1
        assert db.scalar(select(func.count()).select_from(Product)) == 1
        assert db.scalar(select(func.count()).select_from(Order)) == 1
        assert db.scalar(select(func.count()).select_from(Sale)) == 1
        assert db.scalar(select(func.count()).select_from(Inventory)) == 1

    for route in ("/api/customers", "/api/products", "/api/orders", "/api/sales", "/api/inventory"):
        response = client.get(route)
        assert response.status_code == 200
        assert len(response.json()) == 1
    assert client.get("/api/customers?limit=1&offset=1").json() == []
    assert client.get("/api/products?limit=0").status_code == 422


def test_etl_upload_loads_customer_records_and_persists_run_metrics(
    business_client: tuple[TestClient, InMemoryObjectStorage],
) -> None:
    client, _ = business_client
    uploaded = client.post(
        "/api/datasets",
        files={"file": ("customers.csv", b"customer_code,name,region\nC-3,Casey,North\n", "text/csv")},
    )
    assert uploaded.status_code == 201
    dataset_id = uploaded.json()["id"]

    response = client.post(
        "/api/pipelines/run",
        json={"dataset_id": dataset_id, "destination_table": "customers"},
    )

    assert response.status_code == 201
    run = response.json()
    assert run["status"] == "SUCCESS"
    assert run["dataset_id"] == dataset_id
    assert run["dataset_filename"] == "customers.csv"
    assert run["total_rows"] == 1
    assert run["valid_rows"] == 1
    assert run["rows_loaded"] == 1
    assert run["rejected_rows"] == 0
    assert run["load_status"] == "SUCCESS"
    assert run["created_at"]
    assert client.get("/api/customers").json()[0]["customer_code"] == "C-3"

    repeated = client.post(
        "/api/pipelines/run",
        json={"dataset_id": dataset_id, "destination_table": "customers"},
    )
    assert repeated.json()["rows_loaded"] == 1
    assert client.get("/api/customers").json()[0]["customer_code"] == "C-3"
    with TestSessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Customer)) == 1
        assert db.scalar(select(func.count()).select_from(PipelineRun)) == 2
    assert client.delete(f"/api/datasets/{dataset_id}").status_code == 409


def test_failed_business_load_rolls_back_prior_rows_and_marks_run_failed(
    business_client: tuple[TestClient, InMemoryObjectStorage],
) -> None:
    client, _ = business_client
    with TestSessionLocal() as db:
        load_business_rows(db, "customers", [{"customer_code": "C-4", "name": "Jordan"}])
        load_business_rows(db, "products", [{
            "product_code": "P-4",
            "name": "Chair",
            "price": "50",
            "cost": "20",
        }])
        load_business_rows(db, "orders", [{
            "order_code": "O-4",
            "customer_code": "C-4",
            "order_date": "2026-06-04",
            "total_amount": "50",
        }])
        db.commit()

    uploaded = client.post(
        "/api/datasets",
        files={
            "file": (
                "sales.csv",
                b"order_code,product_code,quantity,unit_price\nO-4,P-4,1,50\nO-4,UNKNOWN,1,50\n",
                "text/csv",
            )
        },
    )
    response = client.post(
        "/api/pipelines/run",
        json={"dataset_id": uploaded.json()["id"], "destination_table": "sales"},
    )

    assert response.status_code == 201
    run = response.json()
    assert run["status"] == "FAILED"
    assert run["rows_loaded"] == 0
    assert run["load_status"] == "FAILED"
    assert "Product 'UNKNOWN' does not exist" in run["load_error"]
    with TestSessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Sale)) == 0


def test_analytics_api_aggregates_known_business_data(
    business_client: tuple[TestClient, InMemoryObjectStorage],
) -> None:
    client, _ = business_client
    with TestSessionLocal() as db:
        load_business_rows(db, "customers", [
            {"customer_code": "C-A", "name": "Alex", "region": "North"},
            {"customer_code": "C-B", "name": "Blair", "region": "South"},
        ])
        load_business_rows(db, "products", [
            {"product_code": "P-A", "name": "Keyboard", "category": "Electronics", "price": "50", "cost": "30"},
            {"product_code": "P-B", "name": "Chair", "category": "Home", "price": "80", "cost": "40"},
        ])
        load_business_rows(db, "orders", [
            {"order_code": "O-A", "customer_code": "C-A", "order_date": "2026-01-10", "total_amount": "100"},
            {"order_code": "O-B", "customer_code": "C-A", "order_date": "2026-02-04", "total_amount": "240"},
            {"order_code": "O-C", "customer_code": "C-B", "order_date": "2026-02-10", "total_amount": "80"},
        ])
        load_business_rows(db, "sales", [
            {"order_code": "O-A", "product_code": "P-A", "quantity": 2, "unit_price": "50"},
            {"order_code": "O-B", "product_code": "P-B", "quantity": 3, "unit_price": "80"},
            {"order_code": "O-C", "product_code": "P-B", "quantity": 1, "unit_price": "80"},
        ])
        load_business_rows(db, "inventory", [
            {"product_code": "P-A", "quantity": 2, "reorder_level": 2},
            {"product_code": "P-B", "quantity": 8, "reorder_level": 2},
        ])
        db.commit()

    response = client.get("/api/analytics")

    assert response.status_code == 200
    analytics = response.json()
    assert analytics["summary"] == {
        "total_revenue": 420.0,
        "total_orders": 3,
        "total_customers": 2,
        "total_profit": 200.0,
        "growth": 220.0,
        "inventory_value": 740.0,
        "profit_margin": 47.6,
    }
    assert analytics["period_sales"] == {
        "daily": 80.0,
        "weekly": 320.0,
        "monthly": 320.0,
        "yearly": 420.0,
    }
    assert analytics["revenue_trend"][-2:] == [
        {"name": "Jan", "revenue": 100.0, "profit": 40.0},
        {"name": "Feb", "revenue": 320.0, "profit": 160.0},
    ]
    assert analytics["category_sales"] == [
        {"name": "Home", "sales": 4, "revenue": 320.0},
        {"name": "Electronics", "sales": 2, "revenue": 100.0},
    ]
    assert analytics["regional_sales"] == [
        {"name": "North", "revenue": 340.0, "orders": 2},
        {"name": "South", "revenue": 80.0, "orders": 1},
    ]
    assert analytics["top_products"][0] == {
        "name": "Chair",
        "category": "Home",
        "sales": 4,
        "revenue": 320.0,
        "profit": 160.0,
        "stock": 8,
    }
    assert analytics["customer_growth"][-2:] == [
        {"month": "Jan", "new": 1, "returning": 0},
        {"month": "Feb", "new": 1, "returning": 1},
    ]
    assert analytics["customer_metrics"] == [
        {"label": "New customers", "value": 1},
        {"label": "Returning customers", "value": 1},
        {"label": "Retention", "value": 50.0},
        {"label": "Average order value", "value": 140.0},
        {"label": "Customer lifetime value", "value": 210.0},
    ]
    assert analytics["inventory_status"] == [
        {"name": "Healthy", "value": 50.0, "count": 1},
        {"name": "Watch", "value": 0.0, "count": 0},
        {"name": "Critical", "value": 50.0, "count": 1},
    ]


def test_analytics_api_returns_zero_totals_for_empty_business_data(
    business_client: tuple[TestClient, InMemoryObjectStorage],
) -> None:
    client, _ = business_client

    response = client.get("/api/analytics")

    assert response.status_code == 200
    analytics = response.json()
    assert analytics["summary"] == {
        "total_revenue": 0.0,
        "total_orders": 0,
        "total_customers": 0,
        "total_profit": 0.0,
        "growth": 0.0,
        "inventory_value": 0.0,
        "profit_margin": 0.0,
    }
    assert analytics["period_sales"] == {"daily": 0, "weekly": 0, "monthly": 0, "yearly": 0}
    assert analytics["revenue_trend"] == []
    assert analytics["category_sales"] == []
    assert analytics["regional_sales"] == []
    assert analytics["top_products"] == []
    assert analytics["customer_growth"] == []
    assert analytics["inventory_status"] == [
        {"name": "Healthy", "value": 0.0, "count": 0},
        {"name": "Watch", "value": 0.0, "count": 0},
        {"name": "Critical", "value": 0.0, "count": 0},
    ]
