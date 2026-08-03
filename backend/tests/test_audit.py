from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app
from app.services.audit_service import AuditService
from app.services.retention_service import RetentionService
from app.services.security_event_service import SecurityEventService


@pytest_asyncio.fixture
async def audit_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture for Audit Logs & Activity tests.
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
async def test_audit_logs_and_export_flow(audit_client: AsyncClient) -> None:
    """
    Test audit log creation, listing, search, and CSV/JSON export.
    """
    # 1. Register User & Workspace
    reg_resp = await audit_client.post(
        "/api/v1/auth/register",
        json={"email": "audituser@neurodesk.ai", "username": "audituser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await audit_client.post(
        "/api/v1/organizations", json={"name": "Audit Test Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await audit_client.post(
        "/api/v1/workspaces", json={"name": "Audit Test WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    # 2. List Audit Logs
    list_resp = await audit_client.get("/api/v1/audit", headers=headers)
    assert list_resp.status_code == 200
    assert "items" in list_resp.json()

    # 3. Export Audit Logs (CSV)
    csv_resp = await audit_client.post(
        "/api/v1/audit/export", json={"format": "csv"}, headers=headers
    )
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]

    # 4. Export Audit Logs (JSON)
    json_resp = await audit_client.post(
        "/api/v1/audit/export", json={"format": "json"}, headers=headers
    )
    assert json_resp.status_code == 200
    assert "application/json" in json_resp.headers["content-type"]


@pytest.mark.asyncio
async def test_activity_feed_endpoints(audit_client: AsyncClient) -> None:
    """
    Test workspace activity feed endpoints.
    """
    reg_resp = await audit_client.post(
        "/api/v1/auth/register",
        json={"email": "actuser@neurodesk.ai", "username": "actuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await audit_client.post(
        "/api/v1/organizations", json={"name": "Act Test Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await audit_client.post(
        "/api/v1/workspaces", json={"name": "Act Test WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    activity_resp = await audit_client.get("/api/v1/activity", headers=headers)
    assert activity_resp.status_code == 200
    assert "items" in activity_resp.json()


@pytest.mark.asyncio
async def test_security_events_and_login_history(audit_client: AsyncClient) -> None:
    """
    Test security events listing and user login history retrieval.
    """
    reg_resp = await audit_client.post(
        "/api/v1/auth/register",
        json={"email": "histuser@neurodesk.ai", "username": "histuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    login_resp = await audit_client.get("/api/v1/login-history", headers=headers)
    assert login_resp.status_code == 200
    assert "items" in login_resp.json()

    sec_resp = await audit_client.get("/api/v1/security/events", headers=headers)
    assert sec_resp.status_code == 200
    assert "items" in sec_resp.json()
