import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from loguru import logger

from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.schemas.websocket import WebSocketConnectionStats
from app.services.presence_service import PresenceService
from app.services.websocket_service import WebSocketService
from app.websocket.auth import authenticate_websocket
from app.websocket.connection_manager import manager

router = APIRouter(tags=["Real-Time WebSockets"])


@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
) -> None:
    """
    WebSocket endpoint streaming user-specific notifications.
    """
    auth_data = await authenticate_websocket(websocket, token=token)
    if not auth_data:
        return

    room_id = f"user_notifications_{auth_data.user_id}"
    await manager.connect(websocket, auth_data.user_id, room_id=room_id)
    await PresenceService.user_connected(auth_data.user_id, auth_data.username, room_id=room_id)

    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat or message pong
            logger.debug(f"Received WS notification frame from user '{auth_data.user_id}': {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, auth_data.user_id, room_id=room_id)
        await PresenceService.user_disconnected(auth_data.user_id, auth_data.username, room_id=room_id)


@router.websocket("/ws/chat")
async def websocket_chat(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
    room_id: str = Query(default="global_chat"),
) -> None:
    """
    WebSocket endpoint for real-time AI Chat streaming and typing indicators.
    """
    auth_data = await authenticate_websocket(websocket, token=token)
    if not auth_data:
        return

    await manager.connect(websocket, auth_data.user_id, room_id=room_id)

    try:
        while True:
            raw_msg = await websocket.receive_json()
            event_type = raw_msg.get("event")
            if event_type == "chat.typing":
                msg = WebSocketMessage(
                    event="chat.typing",
                    room_id=room_id,
                    data={"user_id": str(auth_data.user_id), "username": auth_data.username, "is_typing": raw_msg.get("data", {}).get("is_typing", True)},
                )
                await manager.broadcast_to_room(msg, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, auth_data.user_id, room_id=room_id)


@router.websocket("/ws/jobs")
async def websocket_jobs(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
) -> None:
    """
    WebSocket endpoint streaming background job progress and state changes.
    """
    auth_data = await authenticate_websocket(websocket, token=token)
    if not auth_data:
        return

    room_id = f"jobs_{auth_data.user_id}"
    await manager.connect(websocket, auth_data.user_id, room_id=room_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, auth_data.user_id, room_id=room_id)


@router.websocket("/ws/analytics")
async def websocket_analytics(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
) -> None:
    """
    WebSocket endpoint streaming live analytics and dashboard metrics.
    """
    auth_data = await authenticate_websocket(websocket, token=token)
    if not auth_data:
        return

    room_id = "analytics_global"
    await manager.connect(websocket, auth_data.user_id, room_id=room_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, auth_data.user_id, room_id=room_id)


@router.websocket("/ws/workspaces/{workspace_id}")
async def websocket_workspace(
    websocket: WebSocket,
    workspace_id: uuid.UUID,
    token: Optional[str] = Query(default=None),
) -> None:
    """
    WebSocket endpoint for workspace collaboration, document updates, and resource changes.
    """
    auth_data = await authenticate_websocket(websocket, token=token)
    if not auth_data:
        return

    room_id = f"workspace_{workspace_id}"
    await manager.connect(websocket, auth_data.user_id, room_id=room_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, auth_data.user_id, room_id=room_id)


@router.websocket("/ws/teams/{team_id}")
async def websocket_team(
    websocket: WebSocket,
    team_id: uuid.UUID,
    token: Optional[str] = Query(default=None),
) -> None:
    """
    WebSocket endpoint for team presence and member activity.
    """
    auth_data = await authenticate_websocket(websocket, token=token)
    if not auth_data:
        return

    room_id = f"team_{team_id}"
    await manager.connect(websocket, auth_data.user_id, room_id=room_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, auth_data.user_id, room_id=room_id)


@router.websocket("/ws/presence")
async def websocket_presence(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
) -> None:
    """
    WebSocket endpoint tracking real-time user online/offline presence.
    """
    auth_data = await authenticate_websocket(websocket, token=token)
    if not auth_data:
        return

    room_id = "presence_global"
    await manager.connect(websocket, auth_data.user_id, room_id=room_id)
    await PresenceService.user_connected(auth_data.user_id, auth_data.username, room_id=room_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, auth_data.user_id, room_id=room_id)
        await PresenceService.user_disconnected(auth_data.user_id, auth_data.username, room_id=room_id)


@router.websocket("/ws/admin")
async def websocket_admin(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
) -> None:
    """
    WebSocket endpoint for admin monitoring. Rejects non-admin users with 1008 policy violation.
    """
    auth_data = await authenticate_websocket(websocket, token=token)
    if not auth_data:
        return

    # RBAC check: Require ADMIN role
    if "ADMIN" not in auth_data.roles and "SUPER_ADMIN" not in auth_data.roles:
        logger.warning(f"Admin WS access rejected for user '{auth_data.user_id}': Insufficient permissions.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Admin access required")
        return

    room_id = "admin_monitoring"
    await manager.connect(websocket, auth_data.user_id, room_id=room_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, auth_data.user_id, room_id=room_id)


@router.get(
    "/api/v1/ws/stats",
    response_model=WebSocketConnectionStats,
    summary="Get WebSocket Monitoring Stats",
    description="Returns metrics on connected users, active socket connections, and rooms.",
)
async def get_websocket_stats() -> WebSocketConnectionStats:
    return WebSocketService.get_monitoring_stats()
