from collections.abc import Generator
from datetime import datetime, timezone
from typing import Any

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import Settings
from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.business_data import Customer, Inventory, Order, Product, Sale
from app.schemas.ai import AIGeneratedAnswer
from app.services import ai as ai_service

AI_TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
AITestSessionLocal = sessionmaker(
    bind=AI_TEST_ENGINE,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


@pytest.fixture
def ai_client(monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    Base.metadata.create_all(bind=AI_TEST_ENGINE)

    def override_get_db() -> Generator[Session, None, None]:
        with AITestSessionLocal() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(
        ai_service,
        "get_settings",
        lambda: Settings(_env_file=None, gemini_api_key=SecretStr("mock-key")),
    )
    with AITestSessionLocal() as db:
        customer = Customer(
            customer_code="C-1",
            name="Example Customer",
            email="private@example.com",
            region="North",
        )
        product = Product(
            product_code="P-1",
            name="Example Product",
            category="Office",
            price=50,
            cost=25,
            stock_quantity=2,
        )
        db.add_all([customer, product])
        db.flush()
        order_date = datetime(2026, 1, 15, tzinfo=timezone.utc)
        order = Order(
            order_code="O-1",
            customer_id=customer.id,
            order_date=order_date,
            status="paid",
            total_amount=100,
        )
        db.add(order)
        db.flush()
        db.add_all([
            Sale(
                order_id=order.id,
                customer_id=customer.id,
                product_id=product.id,
                quantity=2,
                unit_price=50,
                revenue=100,
                cost=50,
                profit=50,
                profit_margin=50,
                order_date=order_date,
                region="North",
            ),
            Inventory(
                product_id=product.id,
                quantity=2,
                reorder_level=5,
                inventory_value=100,
            ),
        ])
        db.commit()

    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=AI_TEST_ENGINE)


def _mock_answer(
    intent: ai_service.AIIntent,
) -> AIGeneratedAnswer:
    return AIGeneratedAnswer(
        answer=f"Answer for {intent}",
        key_findings=["Grounded finding"],
        recommendations=["Grounded recommendation"],
        confidence="high",
    )


def test_ai_endpoint_uses_fixed_aggregates_for_supported_questions(
    ai_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[tuple[str, ai_service.AIIntent, dict[str, Any]]] = []

    def mocked_gemini(
        question: str,
        intent: ai_service.AIIntent,
        context: dict[str, Any],
        settings: Settings,
    ) -> AIGeneratedAnswer:
        del settings
        calls.append((question, intent, context))
        return _mock_answer(intent)

    monkeypatch.setattr(ai_service, "_call_gemini", mocked_gemini)
    questions = {
        "Why did revenue decrease last month?": (
            "revenue_explanation",
            {"monthly_revenue_and_profit", "revenue_by_category", "revenue_by_region"},
        ),
        "Why did revenue drop last month?": (
            "revenue_explanation",
            {"monthly_revenue_and_profit", "revenue_by_category", "revenue_by_region"},
        ),
        "What are my top 5 products?": ("top_products", {"top_products_by_revenue"}),
        "Which region has the highest revenue?": ("highest_revenue_region", {"revenue_by_region"}),
        "Which customers are most valuable?": ("valuable_customers", {"top_customers_by_revenue"}),
        "Which products have inventory risk?": (
            "inventory_risk",
            {"model_status", "algorithm", "at_risk_products"},
        ),
        "Predict next month's revenue.": (
            "revenue_prediction",
            {"model_status", "algorithm", "recent_monthly_revenue", "next_three_months", "forecast_rmse"},
        ),
    }

    for question, (intent, expected_context_keys) in questions.items():
        response = ai_client.post("/api/ai/ask", json={"question": question})
        assert response.status_code == 200
        body = response.json()
        assert body["intent"] == intent
        assert body["answer"] == f"Answer for {intent}"
        assert body["key_findings"] == ["Grounded finding"]
        assert body["recommendations"] == ["Grounded recommendation"]
        assert body["confidence"] == "high"
        assert "mock-key" not in response.text
        assert set(calls[-1][2]) == expected_context_keys

    assert len(calls) == len(questions)
    for question, intent, context in calls:
        assert intent == questions[question][0]
        assert set(context) == questions[question][1]
    customer_context = calls[4][2]["top_customers_by_revenue"]
    assert customer_context == [{
        "name": "Example Customer",
        "region": "North",
        "orders": 1,
        "revenue": 100.0,
    }]
    assert "private@example.com" not in str(customer_context)


@pytest.mark.parametrize(
    "question",
    [
        " ",
        "SELECT * FROM sales",
        "Tell me a joke",
    ],
)
def test_ai_endpoint_rejects_blank_sql_and_unsupported_questions(
    ai_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    question: str,
) -> None:
    calls = 0

    def mocked_gemini() -> AIGeneratedAnswer:
        nonlocal calls
        calls += 1
        raise AssertionError("Gemini must not be called for rejected questions.")

    monkeypatch.setattr(ai_service, "_call_gemini", mocked_gemini)
    response = ai_client.post("/api/ai/ask", json={"question": question})
    assert response.status_code == 422
    assert calls == 0


def test_ai_endpoint_reports_missing_gemini_configuration(
    ai_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        ai_service,
        "get_settings",
        lambda: Settings(_env_file=None, gemini_api_key=None),
    )
    response = ai_client.post("/api/ai/ask", json={"question": "What are my top 5 products?"})
    assert response.status_code == 503
    assert response.json()["detail"] == "Generative AI is not configured. Set GEMINI_API_KEY on the backend."


def test_ai_endpoint_surfaces_gemini_upstream_failures(
    ai_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def failed_gemini(
        question: str,
        intent: ai_service.AIIntent,
        context: dict[str, Any],
        settings: Settings,
    ) -> AIGeneratedAnswer:
        del question, intent, context, settings
        raise ai_service.GeminiUpstreamError("Gemini could not generate an answer.")

    monkeypatch.setattr(ai_service, "_call_gemini", failed_gemini)
    response = ai_client.post("/api/ai/ask", json={"question": "What are my top 5 products?"})
    assert response.status_code == 502
    assert response.json()["detail"] == "Gemini could not generate an answer."
