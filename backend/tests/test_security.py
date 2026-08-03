from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app
from app.services.cache_service import cache_service
from app.services.security_service import security_service


@pytest_asyncio.fixture
async def sec_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture for Security & API Keys testing.
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
async def test_health_liveness_readiness_probes(sec_client: AsyncClient) -> None:
    """
    Test /health, /health/live, /health/ready probes.
    """
    health_resp = await sec_client.get("/api/v1/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] in ["healthy", "degraded"]

    live_resp = await sec_client.get("/api/v1/health/live")
    assert live_resp.status_code == 200
    assert live_resp.json()["status"] == "live"

    ready_resp = await sec_client.get("/api/v1/health/ready")
    assert ready_resp.status_code in [200, 503]
    assert ready_resp.json()["status"] in ["ready", "not_ready"]



@pytest.mark.asyncio
async def test_security_headers_and_request_id(sec_client: AsyncClient) -> None:
    """
    Test security headers and X-Request-ID correlation headers.
    """
    resp = await sec_client.get("/api/v1/ping")
    assert resp.status_code == 200
    assert "X-Request-ID" in resp.headers
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"


@pytest.mark.asyncio
async def test_api_keys_crud_lifecycle(sec_client: AsyncClient) -> None:
    """
    Test API key creation, listing, rotation, and deletion.
    """
    # 1. Register User & Workspace
    reg_resp = await sec_client.post(
        "/api/v1/auth/register",
        json={"email": "secuser@neurodesk.ai", "username": "secuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await sec_client.post(
        "/api/v1/organizations", json={"name": "Sec Test Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await sec_client.post(
        "/api/v1/workspaces", json={"name": "Sec Test WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    # 2. Create API Key
    create_resp = await sec_client.post(
        "/api/v1/api-keys",
        json={"name": "Production Key", "permissions": ["read", "write"]},
        headers=headers,
    )
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert "raw_key" in data
    assert data["raw_key"].startswith("nd_live_")
    key_id = data["api_key"]["id"]

    # 3. List API Keys
    list_resp = await sec_client.get("/api/v1/api-keys", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["name"] == "Production Key"

    # 4. Rotate API Key
    rot_resp = await sec_client.post(f"/api/v1/api-keys/{key_id}/rotate", headers=headers)
    assert rot_resp.status_code == 200
    assert "raw_key" in rot_resp.json()

    # 5. Delete API Key
    del_resp = await sec_client.delete(f"/api/v1/api-keys/{key_id}", headers=headers)
    assert del_resp.status_code == 200


@pytest.mark.asyncio
async def test_ip_blocking_service() -> None:
    """
    Test SecurityService IP blocking and brute force failure tracking.
    """
    test_ip = "192.168.1.100"
    assert not security_service.is_ip_blocked(test_ip)

    # Record 5 failed logins to trigger auto-block
    for _ in range(5):
        security_service.record_failed_login(test_ip)

    assert security_service.is_ip_blocked(test_ip)
