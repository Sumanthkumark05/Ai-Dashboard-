from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def ds_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for Dataset testing.
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
async def test_create_and_list_datasets(ds_client: AsyncClient) -> None:
    """
    Test creating dataset metadata and listing workspace datasets.
    """
    # 1. Register & Setup Org & Workspace
    reg_resp = await ds_client.post(
        "/api/v1/auth/register",
        json={"email": "dsuser@neurodesk.ai", "username": "dsuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await ds_client.post(
        "/api/v1/organizations", json={"name": "DS Org"}, headers=headers
    )
    org_id = org_resp.json()["id"]
    headers["X-Organization-ID"] = org_id

    ws_resp = await ds_client.post(
        "/api/v1/workspaces", json={"name": "DS WS"}, headers=headers
    )
    ws_id = ws_resp.json()["id"]
    headers["X-Workspace-ID"] = ws_id

    # 2. Create Dataset Metadata
    create_payload = {
        "name": "Customer Churn Dataset",
        "file_name": "churn_data.csv",
        "dataset_type": "csv",
        "mime_type": "text/csv",
        "file_size": 5242880,
        "checksum": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
        "description": "Historical customer churn records",
        "record_count": 10000,
        "column_count": 15,
        "tags": ["finance", "churn"],
    }
    create_resp = await ds_client.post(
        "/api/v1/datasets", json=create_payload, headers=headers
    )
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert data["name"] == "Customer Churn Dataset"
    assert data["dataset_type"] == "csv"
    assert data["record_count"] == 10000

    # 3. List Datasets
    list_resp = await ds_client.get("/api/v1/datasets", headers=headers)
    assert list_resp.status_code == 200
    res = list_resp.json()
    assert res["total_items"] == 1
    assert res["items"][0]["name"] == "Customer Churn Dataset"


@pytest.mark.asyncio
async def test_dataset_statistics_and_versions(ds_client: AsyncClient) -> None:
    """
    Test dataset workspace statistics endpoint and version listing.
    """
    reg_resp = await ds_client.post(
        "/api/v1/auth/register",
        json={"email": "statuser@neurodesk.ai", "username": "statuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await ds_client.post(
        "/api/v1/organizations", json={"name": "Stat Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await ds_client.post(
        "/api/v1/workspaces", json={"name": "Stat WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    create_payload = {
        "name": "E-Commerce Transactions",
        "file_name": "transactions.json",
        "dataset_type": "json",
        "mime_type": "application/json",
        "file_size": 10485760,
        "checksum": "9876543210fedcba9876543210fedcba",
        "record_count": 50000,
        "column_count": 8,
    }
    ds_resp = await ds_client.post(
        "/api/v1/datasets", json=create_payload, headers=headers
    )
    ds_id = ds_resp.json()["id"]

    # Statistics
    stats_resp = await ds_client.get("/api/v1/datasets/statistics", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_datasets"] == 1
    assert stats["total_records"] == 50000

    # Versions
    vers_resp = await ds_client.get(
        f"/api/v1/datasets/{ds_id}/versions", headers=headers
    )
    assert vers_resp.status_code == 200
    versions = vers_resp.json()
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1


@pytest.mark.asyncio
async def test_upload_dataset_file_flow(ds_client: AsyncClient) -> None:
    """
    Test uploading a physical file payload to /api/v1/datasets/upload endpoint.
    """
    reg_resp = await ds_client.post(
        "/api/v1/auth/register",
        json={"email": "uploaduser@neurodesk.ai", "username": "uploaduser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await ds_client.post(
        "/api/v1/organizations", json={"name": "Upload Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await ds_client.post(
        "/api/v1/workspaces", json={"name": "Upload WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    # Upload CSV dataset
    file_payload = ("users.csv", b"id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com\n", "text/csv")
    upload_resp = await ds_client.post(
        "/api/v1/datasets/upload",
        files={"file": file_payload},
        data={"description": "Test user records", "tags": "test,users"},
        headers=headers,
    )
    assert upload_resp.status_code == 201
    data = upload_resp.json()
    assert data["success"] is True
    assert "dataset" in data
    assert data["dataset"]["file_name"] == "users.csv"
    assert data["dataset"]["dataset_type"] == "csv"
    assert data["dataset"]["record_count"] == 2
    assert data["dataset"]["column_count"] == 3

    # List datasets to verify it's persisted in DB
    list_resp = await ds_client.get("/api/v1/datasets", headers=headers)
    assert list_resp.status_code == 200
    res = list_resp.json()
    assert res["total_items"] == 1
    assert res["items"][0]["file_name"] == "users.csv"
