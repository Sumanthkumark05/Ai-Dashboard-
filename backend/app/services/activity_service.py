import uuid
from typing import Any, Dict, Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.repositories.activity_repository import ActivityRepository
from app.schemas.events import WebSocketEventType, WebSocketMessage
from app.websocket.connection_manager import manager


class ActivityService:
    """
    Business Logic Service managing user-facing activity feeds and real-time WebSocket broadcasts.
    """

    @classmethod
    async def log_activity(
        cls,
        user_id: uuid.UUID,
        action: str,
        details: Dict[str, Any],
        db: Optional[AsyncSession] = None,
        workspace_id: Optional[uuid.UUID] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Optional[Activity]:
        """
        Logs user activity event into console, database (if db provided), and WebSocket broadcast stream.
        """
        logger.info(f"ACTIVITY | User: {user_id} | Action: {action} | Details: {details}")

        activity_record = None
        if db:
            repo = ActivityRepository(db)
            activity_record = await repo.create(
                user_id=user_id,
                workspace_id=workspace_id,
                activity_type=action,
                title=title or f"User performed {action}",
                description=description or str(details),
                metadata_json=details,
            )

        # Real-time WebSocket broadcast to workspace room if workspace_id exists
        if workspace_id:
            room_id = f"workspace_{workspace_id}"
            msg = WebSocketMessage(
                event=WebSocketEventType.WORKSPACE_UPDATED.value,
                room_id=room_id,
                data={
                    "user_id": str(user_id),
                    "action": action,
                    "title": title or action,
                    "details": details,
                },
            )
            await manager.broadcast_to_room(msg, room_id)

        return activity_record

    @staticmethod
    async def get_activities(
        db: AsyncSession,
        workspace_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        activity_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Fetches paginated activities for a workspace or user.
        """
        repo = ActivityRepository(db)
        return await repo.search_activities(
            workspace_id=workspace_id,
            user_id=user_id,
            activity_type=activity_type,
            page=page,
            page_size=page_size,
        )
