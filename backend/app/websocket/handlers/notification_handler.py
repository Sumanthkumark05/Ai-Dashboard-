import uuid
from typing import Any, Dict
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class NotificationHandler:
    """
    WebSocket event handler for Real-Time Notifications.
    """

    @staticmethod
    async def broadcast_notification(user_id: uuid.UUID, notification_data: Dict[str, Any]) -> None:
        """
        Sends notification payload directly to target user's active sockets.
        """
        msg = WebSocketMessage(
            event=WebSocketEventType.NOTIFICATION_CREATED.value,
            data=notification_data,
        )
        await manager.send_personal_message(msg, user_id)
