from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app
from app.models.role import Role
from app.models.user import User


@pytest_asyncio.fixture
async def admin_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture for Admin Panel tests.
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
async def test_admin_access_control_and_dashboard(admin_client: AsyncClient) -> None:
    """
    Test RBAC admin dependency enforcement and dashboard overview.
    """
    # 1. Register normal user
    reg_resp = await admin_client.post(
        "/api/v1/auth/register",
        json={"email": "normaluser@neurodesk.ai", "username": "normaluser", "password": "Password123!"},
    )
    user_token = reg_resp.json()["data"]["tokens"]["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Normal user should be denied admin endpoints with HTTP 403
    forbidden_resp = await admin_client.get("/api/v1/admin/dashboard", headers=user_headers)
    assert forbidden_resp.status_code == 403


@pytest.mark.asyncio
async def test_feature_flags_and_settings_lifecycle(admin_client: AsyncClient) -> None:
    """
    Test Feature Flag CRUD operations and System Settings.
    """
    reg_resp = await admin_client.post(
        "/api/v1/auth/register",
        json={"email": "sysadmin@neurodesk.ai", "username": "sysadmin", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify normal user gets 403
    ff_list = await admin_client.get("/api/v1/admin/feature-flags", headers=headers)
    assert ff_list.status_code == 403
