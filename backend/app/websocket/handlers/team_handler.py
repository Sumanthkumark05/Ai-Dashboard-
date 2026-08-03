import uuid
from typing import Any, Dict
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class TeamHandler:
    """
    WebSocket event handler for Team Collaboration & Member status events.
    """

    @staticmethod
    async def broadcast_team_event(team_id: uuid.UUID, event_type: str, details: Dict[str, Any]) -> None:
        """
        Broadcasts team events (role updates, member join/leave) to team room.
        """
        room_id = f"team_{team_id}"
        msg = WebSocketMessage(
            event=event_type,
            room_id=room_id,
            data=details,
        )
        await manager.broadcast_to_room(msg, room_id)
