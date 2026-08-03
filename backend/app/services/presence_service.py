import uuid
from typing import Any, Dict
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager
from app.websocket.presence import presence_tracker


class PresenceService:
    """
    Business Logic Service managing User Online/Offline status and broadcasting status changes.
    """

    @staticmethod
    async def user_connected(user_id: uuid.UUID, username: str, room_id: str = "global") -> None:
        """
        Handles user connection and broadcasts online presence if status changed.
        """
        was_offline = presence_tracker.mark_online(user_id)
        if was_offline:
            msg = WebSocketMessage(
                event=WebSocketEventType.PRESENCE_ONLINE.value,
                room_id=room_id,
                data={"user_id": str(user_id), "username": username, "status": "online"},
            )
            await manager.broadcast_to_room(msg, room_id)

    @staticmethod
    async def user_disconnected(user_id: uuid.UUID, username: str, room_id: str = "global") -> None:
        """
        Handles user disconnection and broadcasts offline presence if all devices disconnected.
        """
        # Only mark offline if user has no remaining active socket connections
        active_sockets = manager.active_connections.get(user_id, set())
        if not active_sockets:
            is_offline = presence_tracker.mark_offline(user_id)
            if is_offline:
                msg = WebSocketMessage(
                    event=WebSocketEventType.PRESENCE_OFFLINE.value,
                    room_id=room_id,
                    data={
                        "user_id": str(user_id),
                        "username": username,
                        "status": "offline",
                        "last_seen": presence_tracker.get_last_seen(user_id),
                    },
                )
                await manager.broadcast_to_room(msg, room_id)

    @staticmethod
    def get_user_presence(user_id: uuid.UUID) -> Dict[str, Any]:
        """
        Returns presence info for user.
        """
        is_online = presence_tracker.is_online(user_id)
        return {
            "user_id": str(user_id),
            "status": "online" if is_online else "offline",
            "last_seen": presence_tracker.get_last_seen(user_id),
        }
