import uuid
from typing import Any, Dict
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class JobHandler:
    """
    WebSocket event handler for Background Job progress streaming.
    """

    @staticmethod
    async def broadcast_job_progress(
        workspace_id: uuid.UUID, job_id: str, progress: int, status: str, result: Any = None
    ) -> None:
        """
        Broadcasts background job status & progress updates to workspace room.
        """
        room_id = f"workspace_{workspace_id}"
        event_type = (
            WebSocketEventType.JOB_COMPLETED.value
            if status == "SUCCESS"
            else (
                WebSocketEventType.JOB_FAILED.value
                if status == "FAILED"
                else WebSocketEventType.JOB_PROGRESS.value
            )
        )

        msg = WebSocketMessage(
            event=event_type,
            room_id=room_id,
            data={
                "job_id": job_id,
                "progress": progress,
                "status": status,
                "result": result,
            },
        )
        await manager.broadcast_to_room(msg, room_id)
