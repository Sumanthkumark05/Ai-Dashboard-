from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def job_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for Background Jobs testing.
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
async def test_background_job_lifecycle(job_client: AsyncClient) -> None:
    """
    Test job enqueuing, listing, statistics, retry, cancellation, and deletion.
    """
    # 1. Register User & Workspace
    reg_resp = await job_client.post(
        "/api/v1/auth/register",
        json={"email": "jobuser@neurodesk.ai", "username": "jobuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await job_client.post(
        "/api/v1/organizations", json={"name": "Job Test Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await job_client.post(
        "/api/v1/workspaces", json={"name": "Job Test WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    # 2. Enqueue Job
    create_payload = {
        "job_name": "process_ai_document",
        "priority": "HIGH",
        "payload": {"document_id": "doc_12345"},
    }
    create_resp = await job_client.post(
        "/api/v1/jobs/create", json=create_payload, headers=headers
    )
    assert create_resp.status_code == 201
    job_data = create_resp.json()
    assert job_data["job_name"] == "process_ai_document"
    assert job_data["queue_name"] == "high"
    assert job_data["priority"] == "HIGH"
    job_id = job_data["id"]

    # 3. Get Job Details
    details_resp = await job_client.get(f"/api/v1/jobs/{job_id}", headers=headers)
    assert details_resp.status_code == 200
    assert details_resp.json()["id"] == job_id

    # 4. List Jobs
    list_resp = await job_client.get("/api/v1/jobs", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total_items"] == 1

    # 5. Cancel Job
    cancel_resp = await job_client.post(f"/api/v1/jobs/{job_id}/cancel", headers=headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # 6. Retry Job
    retry_resp = await job_client.post(f"/api/v1/jobs/{job_id}/retry", headers=headers)
    assert retry_resp.status_code == 200
    assert retry_resp.json()["status"] == "QUEUED"
    assert retry_resp.json()["retry_count"] == 1

    # 7. Job & Worker Statistics
    stats_resp = await job_client.get("/api/v1/jobs/statistics", headers=headers)
    assert stats_resp.status_code == 200
    assert "job_statistics" in stats_resp.json()
    assert "worker_cluster" in stats_resp.json()

    # 8. Delete Job
    del_resp = await job_client.delete(f"/api/v1/jobs/{job_id}", headers=headers)
    assert del_resp.status_code == 200
