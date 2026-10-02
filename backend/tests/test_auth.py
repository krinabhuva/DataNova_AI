import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.security import hash_password
from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.user import User, UserRole

TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def override_get_db():
    with TestSessionLocal() as db:
        yield db


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def register(client: TestClient, email: str = "user@example.com") -> dict:
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "full_name": "Test User",
            "password": "correct-horse-battery",
            "role": "ADMIN",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_registration_creates_user_role_and_http_only_cookie(client: TestClient) -> None:
    user = register(client)

    assert user["role"] == "USER"
    assert "password_hash" not in user
    assert client.cookies.get("datanova_access_token")
    assert client.get("/api/auth/me").json()["email"] == "user@example.com"


def test_login_and_wrong_password(client: TestClient) -> None:
    register(client)
    client.post("/api/auth/logout")

    login_response = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "correct-horse-battery"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["email"] == "user@example.com"

    wrong_password = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "incorrect-password"},
    )
    assert wrong_password.status_code == 401


def test_protected_api_and_logout(client: TestClient) -> None:
    register(client)
    assert client.get("/api/auth/me").status_code == 200

    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 204
    assert client.get("/api/auth/me").status_code == 401


@pytest.mark.parametrize("role,expected_status", [(UserRole.USER, 403), (UserRole.ANALYST, 403), (UserRole.ADMIN, 200)])
def test_admin_role_restriction(client: TestClient, role: UserRole, expected_status: int) -> None:
    with TestSessionLocal() as db:
        db.add(
            User(
                email=f"{role.value.lower()}@example.com",
                full_name=role.value,
                password_hash=hash_password("correct-horse-battery"),
                role=role,
            )
        )
        db.commit()

    login_response = client.post(
        "/api/auth/login",
        json={"email": f"{role.value.lower()}@example.com", "password": "correct-horse-battery"},
    )
    assert login_response.status_code == 200
    assert client.get("/api/users").status_code == expected_status