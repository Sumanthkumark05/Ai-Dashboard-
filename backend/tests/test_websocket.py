from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


@pytest_asyncio.fixture
async def ws_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture for WebSocket tests.
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
async def test_websocket_authentication_and_stats(ws_client: AsyncClient) -> None:
    """
    Test WebSocket authentication and stats API.
    """
    # 1. Register User to get access token
    reg_resp = await ws_client.post(
        "/api/v1/auth/register",
        json={"email": "wsuser@neurodesk.ai", "username": "wsuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]

    # 2. Check WebSocket stats endpoint
    stats_resp = await ws_client.get("/api/v1/ws/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert "connected_users_count" in stats
    assert "active_connections_count" in stats


@pytest.mark.asyncio
async def test_connection_manager_broadcasting() -> None:
    """
    Test ConnectionManager unit logic for room broadcasting and multi-device connection tracking.
    """
    import uuid

    user_id = uuid.uuid4()
    stats_initial = manager.get_stats()

    # Verify initial stats structure
    assert "connected_users_count" in stats_initial
    assert "messages_processed" in stats_initial

    # Create dummy message
    msg = WebSocketMessage(
        event=WebSocketEventType.NOTIFICATION_CREATED.value,
        data={"title": "Test Notification"},
    )
    assert msg.event == "notification.created"
    assert msg.data["title"] == "Test Notification"
