from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def user_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for user profile testing.
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
async def test_update_profile(user_client: AsyncClient) -> None:
    """
    Test PATCH /api/v1/users/me updates profile fields.
    """
    # 1. Register user
    reg_payload = {
        "email": "profileuser@neurodesk.ai",
        "username": "profileuser",
        "password": "Password123!",
    }
    reg_resp = await user_client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update Profile
    update_payload = {
        "first_name": "UpdatedFirst",
        "last_name": "UpdatedLast",
        "bio": "AI Engineer & Senior Architect",
        "timezone": "America/New_York",
    }
    response = await user_client.patch(
        "/api/v1/users/me", json=update_payload, headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "UpdatedFirst"
    assert data["last_name"] == "UpdatedLast"
    assert data["bio"] == "AI Engineer & Senior Architect"
    assert data["timezone"] == "America/New_York"


@pytest.mark.asyncio
async def test_change_password(user_client: AsyncClient) -> None:
    """
    Test PATCH /api/v1/users/change-password changes credentials and allows login with new password.
    """
    # 1. Register user
    reg_payload = {
        "email": "pwduser@neurodesk.ai",
        "username": "pwduser",
        "password": "Password123!",
    }
    reg_resp = await user_client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Change password
    change_payload = {
        "current_password": "Password123!",
        "new_password": "NewStrongPassword456!",
    }
    response = await user_client.patch(
        "/api/v1/users/change-password", json=change_payload, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # 3. Verify login with new password
    login_resp = await user_client.post(
        "/api/v1/auth/login",
        data={
            "username": "pwduser@neurodesk.ai",
            "password": "NewStrongPassword456!",
        },
    )
    assert login_resp.status_code == 200



@pytest.mark.asyncio
async def test_unauthorized_access(user_client: AsyncClient) -> None:
    """
    Test accessing protected user route without authorization header fails with 401 Unauthorized.
    """
    response = await user_client.get("/api/v1/users/me")
    assert response.status_code == 401
