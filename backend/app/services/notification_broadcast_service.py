import uuid
from typing import Any, Dict
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class NotificationBroadcastService:
    """
    Service broadcasting notification events over WebSocket.
    """

    @staticmethod
    async def notify_user(user_id: uuid.UUID, notification: Dict[str, Any]) -> None:
        """
        Sends real-time notification to user socket.
        """
        msg = WebSocketMessage(
            event=WebSocketEventType.NOTIFICATION_CREATED.value,
            data=notification,
        )
        await manager.send_personal_message(msg, user_id)
