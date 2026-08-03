import uuid
from typing import Any, Dict
from app.schemas.events import WebSocketMessage
from app.schemas.websocket import WebSocketConnectionStats
from app.services.pubsub_service import pubsub_service
from app.websocket.connection_manager import manager


class WebSocketService:
    """
    Central Service managing WebSocket event dispatches across local manager and Redis Pub/Sub.
    """

    @staticmethod
    async def broadcast_event(message: WebSocketMessage, channel_id: str = "global") -> None:
        """
        Broadcasts message to local WebSocket connections and publishes to Redis Pub/Sub for other backend nodes.
        """
        # Local delivery
        await manager.broadcast_to_room(message, channel_id)

        # Cross-node delivery via Redis Pub/Sub
        await pubsub_service.publish(message, channel_id)

    @staticmethod
    async def send_user_event(user_id: uuid.UUID, message: WebSocketMessage) -> None:
        """
        Sends message to a specific user's active socket connections.
        """
        await manager.send_personal_message(message, user_id)

    @staticmethod
    def get_monitoring_stats() -> WebSocketConnectionStats:
        """
        Returns live monitoring stats for active sockets and rooms.
        """
        stats = manager.get_stats()
        return WebSocketConnectionStats(
            connected_users_count=stats["connected_users_count"],
            active_connections_count=stats["active_connections_count"],
            active_workspaces_count=stats["active_rooms_count"],
            active_teams_count=0,
            messages_processed=stats["messages_processed"],
        )
