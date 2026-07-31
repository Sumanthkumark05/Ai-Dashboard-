from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app
from app.repositories.session_repository import SessionRepository
from app.services.session_service import SessionService


@pytest_asyncio.fixture
async def rbac_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for RBAC and Session testing.
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
async def test_roles_and_permissions_endpoints(rbac_client: AsyncClient) -> None:
    """
    Test listing roles and permissions.
    """
    # 1. Register & Login
    reg_payload = {
        "email": "rbacuser@neurodesk.ai",
        "username": "rbacuser",
        "password": "Password123!",
    }
    reg_resp = await rbac_client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Roles
    roles_resp = await rbac_client.get("/api/v1/roles", headers=headers)
    assert roles_resp.status_code == 200
    assert isinstance(roles_resp.json(), list)

    # 3. Get Permissions
    perms_resp = await rbac_client.get("/api/v1/permissions", headers=headers)
    assert perms_resp.status_code == 200
    assert isinstance(perms_resp.json(), list)


@pytest.mark.asyncio
async def test_session_management(rbac_client: AsyncClient) -> None:
    """
    Test session listing, session termination, and logout all devices.
    """
    # 1. Register
    reg_payload = {
        "email": "sessionuser@neurodesk.ai",
        "username": "sessionuser",
        "password": "Password123!",
    }
    reg_resp = await rbac_client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Active Sessions
    sessions_resp = await rbac_client.get("/api/v1/sessions", headers=headers)
    assert sessions_resp.status_code == 200

    # 3. Terminate All Sessions (Logout all devices)
    logout_all_resp = await rbac_client.delete("/api/v1/sessions", headers=headers)
    assert logout_all_resp.status_code == 200
    assert logout_all_resp.json()["success"] is True


@pytest.mark.asyncio
async def test_login_history_endpoint(rbac_client: AsyncClient) -> None:
    """
    Test GET /api/v1/sessions/history endpoint.
    """
    reg_payload = {
        "email": "histuser@neurodesk.ai",
        "username": "histuser",
        "password": "Password123!",
    }
    reg_resp = await rbac_client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await rbac_client.get("/api/v1/sessions/history", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total_items" in data
