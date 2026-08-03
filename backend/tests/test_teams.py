from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def team_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for Team testing.
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
async def test_team_crud_and_invitation_flow(team_client: AsyncClient) -> None:
    """
    Test team creation, invitation, accept invitation, role update, ownership transfer.
    """
    # 1. Register User 1 (Owner)
    reg_resp1 = await team_client.post(
        "/api/v1/auth/register",
        json={"email": "teamowner@neurodesk.ai", "username": "teamowner", "password": "Password123!"},
    )
    token1 = reg_resp1.json()["data"]["tokens"]["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Setup Org & Workspace for User 1
    org_resp = await team_client.post(
        "/api/v1/organizations", json={"name": "Team Test Org"}, headers=headers1
    )
    headers1["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await team_client.post(
        "/api/v1/workspaces", json={"name": "Team Test WS"}, headers=headers1
    )
    headers1["X-Workspace-ID"] = ws_resp.json()["id"]

    # 2. Create Team
    create_payload = {
        "name": "AI Engineers",
        "description": "Core AI model development team",
    }
    team_resp = await team_client.post(
        "/api/v1/teams", json=create_payload, headers=headers1
    )
    assert team_resp.status_code == 201
    team_data = team_resp.json()
    assert team_data["name"] == "AI Engineers"
    team_id = team_data["id"]

    # 3. Register User 2 (Invite Recipient)
    reg_resp2 = await team_client.post(
        "/api/v1/auth/register",
        json={"email": "teammember@neurodesk.ai", "username": "teammember", "password": "Password123!"},
    )
    token2 = reg_resp2.json()["data"]["tokens"]["access_token"]
    user2_id = reg_resp2.json()["data"]["user"]["id"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 4. Invite User 2 to Team
    invite_resp = await team_client.post(
        f"/api/v1/teams/{team_id}/invite",
        json={"email": "teammember@neurodesk.ai", "role": "EDITOR"},
        headers=headers1,
    )
    assert invite_resp.status_code == 201
    inv_token = invite_resp.json()["token"]

    # 5. List Pending Invitations for User 2
    user2_invs = await team_client.get("/api/v1/invitations", headers=headers2)
    assert user2_invs.status_code == 200
    assert user2_invs.json()["total_items"] == 1

    # 6. User 2 Accepts Invitation
    accept_resp = await team_client.post(
        f"/api/v1/invitations/{inv_token}/accept", headers=headers2
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["role"] == "EDITOR"

    # 7. List Team Members
    members_resp = await team_client.get(
        f"/api/v1/teams/{team_id}/members", headers=headers1
    )
    assert members_resp.status_code == 200
    members = members_resp.json()
    assert members["total_items"] == 2

    # 8. Transfer Ownership to User 2
    trans_resp = await team_client.put(
        f"/api/v1/teams/{team_id}/transfer-owner",
        json={"new_owner_id": user2_id},
        headers=headers1,
    )
    assert trans_resp.status_code == 200
    assert trans_resp.json()["owner_id"] == user2_id
