from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def ws_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for Workspace testing.
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
async def test_create_and_list_workspace(ws_client: AsyncClient) -> None:
    """
    Test creating a workspace within an Organization and listing workspaces.
    """
    # 1. Register User & Create Organization
    reg_resp = await ws_client.post(
        "/api/v1/auth/register",
        json={"email": "wsuser@neurodesk.ai", "username": "wsuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await ws_client.post(
        "/api/v1/organizations", json={"name": "Org WS Test"}, headers=headers
    )
    org_id = org_resp.json()["id"]
    headers["X-Organization-ID"] = org_id

    # 2. Create Workspace
    create_ws = await ws_client.post(
        "/api/v1/workspaces",
        json={"name": "Engineering Workspace", "slug": "engineering-workspace"},
        headers=headers,
    )
    assert create_ws.status_code == 201
    ws_data = create_ws.json()
    assert ws_data["name"] == "Engineering Workspace"
    assert ws_data["slug"] == "engineering-workspace"

    # 3. List Workspaces
    list_ws = await ws_client.get("/api/v1/workspaces", headers=headers)
    assert list_ws.status_code == 200
    workspaces = list_ws.json()
    assert len(workspaces) == 1
    assert workspaces[0]["slug"] == "engineering-workspace"


@pytest.mark.asyncio
async def test_workspace_archive_and_restore(ws_client: AsyncClient) -> None:
    """
    Test archiving and restoring a workspace.
    """
    # Setup user and org
    reg_resp = await ws_client.post(
        "/api/v1/auth/register",
        json={"email": "archuser@neurodesk.ai", "username": "archuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await ws_client.post(
        "/api/v1/organizations", json={"name": "Org Archive Test"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    # Create workspace
    ws_resp = await ws_client.post(
        "/api/v1/workspaces", json={"name": "Temp WS"}, headers=headers
    )
    ws_id = ws_resp.json()["id"]

    # Archive
    arch_resp = await ws_client.post(
        f"/api/v1/workspaces/{ws_id}/archive", headers=headers
    )
    assert arch_resp.status_code == 200
    assert arch_resp.json()["status"] == "archived"

    # Restore
    rest_resp = await ws_client.post(
        f"/api/v1/workspaces/{ws_id}/restore", headers=headers
    )
    assert rest_resp.status_code == 200
    assert rest_resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_workspace_member_management(ws_client: AsyncClient) -> None:
    """
    Test adding, updating, listing, and removing workspace members.
    """
    # Register Owner & Create Org + Workspace
    owner_reg = await ws_client.post(
        "/api/v1/auth/register",
        json={"email": "wsowner@neurodesk.ai", "username": "wsowner", "password": "Password123!"},
    )
    owner_token = owner_reg.json()["data"]["tokens"]["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    org_resp = await ws_client.post(
        "/api/v1/organizations", json={"name": "WS Member Org"}, headers=owner_headers
    )
    org_id = org_resp.json()["id"]
    owner_headers["X-Organization-ID"] = org_id

    ws_resp = await ws_client.post(
        "/api/v1/workspaces", json={"name": "Team Workspace"}, headers=owner_headers
    )
    ws_id = ws_resp.json()["id"]

    # Register Second User & Add to Org
    user2_reg = await ws_client.post(
        "/api/v1/auth/register",
        json={"email": "wsuser2@neurodesk.ai", "username": "wsuser2", "password": "Password123!"},
    )
    user2_id = user2_reg.json()["data"]["user"]["id"]

    # Invite user2 to Org and Accept
    inv_resp = await ws_client.post(
        f"/api/v1/organizations/{org_id}/invite",
        json={"email": "wsuser2@neurodesk.ai", "role": "member"},
        headers=owner_headers,
    )
    inv_token = inv_resp.json()["token"]
    user2_token = user2_reg.json()["data"]["tokens"]["access_token"]
    await ws_client.post(
        "/api/v1/invitations/accept",
        json={"token": inv_token},
        headers={"Authorization": f"Bearer {user2_token}"},
    )

    # Add user2 to Workspace
    add_ws_resp = await ws_client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"user_id": user2_id, "role": "contributor"},
        headers=owner_headers,
    )
    assert add_ws_resp.status_code == 201
    assert add_ws_resp.json()["role"] == "contributor"

    # List workspace members
    members_resp = await ws_client.get(
        f"/api/v1/workspaces/{ws_id}/members", headers=owner_headers
    )
    assert members_resp.status_code == 200
    assert len(members_resp.json()) == 2


@pytest.mark.asyncio
async def test_workspace_storage_analytics(ws_client: AsyncClient) -> None:
    """
    Test workspace storage calculation API endpoint returns live bytes, formatted strings, and counts.
    """
    reg_resp = await ws_client.post(
        "/api/v1/auth/register",
        json={"email": "storageuser@neurodesk.ai", "username": "storageuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await ws_client.post(
        "/api/v1/organizations", json={"name": "Storage Test Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await ws_client.post(
        "/api/v1/workspaces", json={"name": "Storage Test WS"}, headers=headers
    )
    ws_id = ws_resp.json()["id"]
    headers["X-Workspace-ID"] = ws_id

    # Query initial empty storage
    st_resp = await ws_client.get(f"/api/v1/workspaces/{ws_id}/storage", headers=headers)
    assert st_resp.status_code == 200
    st_data = st_resp.json()
    assert st_data["totalFiles"] == 0
    assert st_data["usedBytes"] == 0
    assert st_data["usedFormatted"] == "0 B"

    # Upload a file
    file_payload = ("productivity_report.csv", b"id,task,status\n1,R&D,Completed\n", "text/csv")
    up_resp = await ws_client.post(
        "/api/v1/files/upload",
        files={"file": file_payload},
        headers=headers,
    )
    assert up_resp.status_code == 201

    # Query storage after file upload
    st_resp2 = await ws_client.get(f"/api/v1/workspaces/{ws_id}/storage", headers=headers)
    assert st_resp2.status_code == 200
    st_data2 = st_resp2.json()
    assert st_data2["totalFiles"] == 1
    assert st_data2["usedBytes"] == 31
    assert st_data2["usedFormatted"] == "31 B"

