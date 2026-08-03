import uuid
from typing import Any, Dict
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class AnalyticsHandler:
    """
    WebSocket event handler for Real-Time Analytics & Dashboard Metrics updates.
    """

    @staticmethod
    async def broadcast_metrics(workspace_id: uuid.UUID, metrics_data: Dict[str, Any]) -> None:
        """
        Broadcasts analytics metrics updates to workspace analytics channel.
        """
        room_id = f"analytics_{workspace_id}"
        msg = WebSocketMessage(
            event=WebSocketEventType.ANALYTICS_UPDATED.value,
            room_id=room_id,
            data=metrics_data,
        )
        await manager.broadcast_to_room(msg, room_id)
