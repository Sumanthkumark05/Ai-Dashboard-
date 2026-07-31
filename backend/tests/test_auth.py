from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def auth_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for authentication testing.
    """
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    testing_session_factory = async_sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with testing_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.asyncio
async def test_user_registration_success(auth_client: AsyncClient) -> None:
    """
    Test user registration endpoint creates account and returns tokens.
    """
    payload = {
        "email": "testuser@neurodesk.ai",
        "username": "testuser",
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "User",
    }
    response = await auth_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "user" in data["data"]
    assert data["data"]["user"]["email"] == "testuser@neurodesk.ai"
    assert "tokens" in data["data"]
    assert "access_token" in data["data"]["tokens"]
    assert "refresh_token" in data["data"]["tokens"]


@pytest.mark.asyncio
async def test_user_registration_duplicate_email(auth_client: AsyncClient) -> None:
    """
    Test registering with an existing email returns 400 Bad Request.
    """
    payload = {
        "email": "duplicate@neurodesk.ai",
        "username": "user1",
        "password": "Password123!",
    }
    await auth_client.post("/api/v1/auth/register", json=payload)

    payload2 = {
        "email": "duplicate@neurodesk.ai",
        "username": "user2",
        "password": "Password123!",
    }
    response = await auth_client.post("/api/v1/auth/register", json=payload2)
    assert response.status_code == 400
    assert "already exists" in response.json()["error"]


@pytest.mark.asyncio
async def test_user_registration_weak_password(auth_client: AsyncClient) -> None:
    """
    Test registering with a weak password returns 400 or 422 validation error.
    """
    payload = {
        "email": "weakpass@neurodesk.ai",
        "username": "weakuser",
        "password": "weak",
    }
    response = await auth_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code in (400, 422)



@pytest.mark.asyncio
async def test_user_login_success(auth_client: AsyncClient) -> None:
    """
    Test login endpoint returns access and refresh tokens.
    """
    # 1. Register
    reg_payload = {
        "email": "loginuser@neurodesk.ai",
        "username": "loginuser",
        "password": "Password123!",
    }
    await auth_client.post("/api/v1/auth/register", json=reg_payload)

    # 2. Login via Email using form data
    login_data = {
        "username": "loginuser@neurodesk.ai",
        "password": "Password123!",
    }
    response = await auth_client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data



@pytest.mark.asyncio
async def test_refresh_token(auth_client: AsyncClient) -> None:
    """
    Test exchanging a refresh token for new tokens.
    """
    reg_payload = {
        "email": "refreshuser@neurodesk.ai",
        "username": "refreshuser",
        "password": "Password123!",
    }
    reg_resp = await auth_client.post("/api/v1/auth/register", json=reg_payload)
    refresh_token = reg_resp.json()["data"]["tokens"]["refresh_token"]

    response = await auth_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_authenticated_me_route(auth_client: AsyncClient) -> None:
    """
    Test GET /api/v1/auth/me returns current user profile when authorized.
    """
    reg_payload = {
        "email": "meuser@neurodesk.ai",
        "username": "meuser",
        "password": "Password123!",
    }
    reg_resp = await auth_client.post("/api/v1/auth/register", json=reg_payload)
    access_token = reg_resp.json()["data"]["tokens"]["access_token"]

    headers = {"Authorization": f"Bearer {access_token}"}
    response = await auth_client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "meuser@neurodesk.ai"
    assert data["username"] == "meuser"
