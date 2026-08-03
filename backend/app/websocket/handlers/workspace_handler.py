import uuid
from typing import Any, Dict
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class WorkspaceHandler:
    """
    WebSocket event handler for Workspace Collaboration & Resource updates.
    """

    @staticmethod
    async def broadcast_workspace_event(
        workspace_id: uuid.UUID, action: str, entity_type: str, details: Dict[str, Any]
    ) -> None:
        """
        Broadcasts resource updates (e.g. document uploaded, dataset created, file deleted) to workspace members.
        """
        room_id = f"workspace_{workspace_id}"
        msg = WebSocketMessage(
            event=WebSocketEventType.WORKSPACE_UPDATED.value,
            room_id=room_id,
            data={
                "action": action,
                "entity_type": entity_type,
                "details": details,
            },
        )
        await manager.broadcast_to_room(msg, room_id)
