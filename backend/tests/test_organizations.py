from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def org_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for Organization testing.
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
async def test_create_and_list_organization(org_client: AsyncClient) -> None:
    """
    Test creating an organization and listing user organizations.
    """
    # 1. Register User
    reg_payload = {
        "email": "orgowner@neurodesk.ai",
        "username": "orgowner",
        "password": "Password123!",
    }
    reg_resp = await org_client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Organization
    create_payload = {
        "name": "NeuroDesk Labs",
        "slug": "neurodesk-labs",
        "description": "AI SaaS Innovation Lab",
        "industry": "Artificial Intelligence",
    }
    create_resp = await org_client.post(
        "/api/v1/organizations", json=create_payload, headers=headers
    )
    assert create_resp.status_code == 201
    org_data = create_resp.json()
    assert org_data["name"] == "NeuroDesk Labs"
    assert org_data["slug"] == "neurodesk-labs"

    # 3. List Organizations (includes auto-provisioned default org + created org)
    list_resp = await org_client.get("/api/v1/organizations", headers=headers)
    assert list_resp.status_code == 200
    orgs = list_resp.json()
    assert len(orgs) >= 1
    assert any(o["slug"] == "neurodesk-labs" for o in orgs)


@pytest.mark.asyncio
async def test_organization_context_switching(org_client: AsyncClient) -> None:
    """
    Test GET /api/v1/organizations/current and switching context.
    """
    reg_payload = {
        "email": "switcher@neurodesk.ai",
        "username": "switcher",
        "password": "Password123!",
    }
    reg_resp = await org_client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Org 1
    org1_resp = await org_client.post(
        "/api/v1/organizations", json={"name": "Org Alpha"}, headers=headers
    )
    org1_id = org1_resp.json()["id"]

    # Create Org 2
    org2_resp = await org_client.post(
        "/api/v1/organizations", json={"name": "Org Beta"}, headers=headers
    )
    org2_id = org2_resp.json()["id"]

    # Current Org endpoint returns valid active org
    current_resp = await org_client.get(
        "/api/v1/organizations/current", headers=headers
    )
    assert current_resp.status_code == 200
    assert "id" in current_resp.json()

    # Switch Context to Org 2
    switch_resp = await org_client.patch(
        f"/api/v1/organizations/current?organization_id={org2_id}", headers=headers
    )
    assert switch_resp.status_code == 200
    assert switch_resp.json()["id"] == org2_id


@pytest.mark.asyncio
async def test_invite_and_accept(org_client: AsyncClient) -> None:
    """
    Test inviting a new member and accepting the invitation.
    """
    # 1. Register Owner
    owner_reg = await org_client.post(
        "/api/v1/auth/register",
        json={"email": "inv_owner@neurodesk.ai", "username": "invowner", "password": "Password123!"},
    )
    owner_token = owner_reg.json()["data"]["tokens"]["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # 2. Owner creates Org
    org_resp = await org_client.post(
        "/api/v1/organizations", json={"name": "Invite Org"}, headers=owner_headers
    )
    org_id = org_resp.json()["id"]

    # 3. Owner invites Member
    invite_resp = await org_client.post(
        f"/api/v1/organizations/{org_id}/invite",
        json={"email": "invited_user@neurodesk.ai", "role": "member"},
        headers=owner_headers,
    )
    assert invite_resp.status_code == 200
    token = invite_resp.json()["token"]

    # 4. Register Invited User
    user_reg = await org_client.post(
        "/api/v1/auth/register",
        json={"email": "invited_user@neurodesk.ai", "username": "inviteduser", "password": "Password123!"},
    )
    user_token = user_reg.json()["data"]["tokens"]["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 5. User accepts invitation
    accept_resp = await org_client.post(
        "/api/v1/invitations/accept", json={"token": token}, headers=user_headers
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "active"
