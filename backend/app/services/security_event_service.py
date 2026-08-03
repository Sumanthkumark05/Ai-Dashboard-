import uuid
from typing import Any, Dict, Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security_event import SecurityEvent
from app.repositories.security_event_repository import SecurityEventRepository
from app.schemas.events import WebSocketMessage
from app.websocket.connection_manager import manager


class SecurityEventService:
    """
    Business Logic Service managing security events, brute force tracking, and administrator alerts.
    """

    @classmethod
    async def log_security_event(
        cls,
        event_type: str,
        description: str,
        db: AsyncSession,
        user_id: Optional[uuid.UUID] = None,
        workspace_id: Optional[uuid.UUID] = None,
        severity: str = "MEDIUM",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> SecurityEvent:
        """
        Logs a security event record and broadcasts alert to admin monitoring WebSocket room.
        """
        repo = SecurityEventRepository(db)
        event = await repo.create(
            user_id=user_id,
            workspace_id=workspace_id,
            event_type=event_type,
            severity=severity,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata,
        )
        logger.warning(f"SECURITY EVENT [{severity}] | Type: '{event_type}' | {description}")

        # Broadcast to admin monitoring room
        msg = WebSocketMessage(
            event="security.event",
            room_id="admin_monitoring",
            data={
                "event_id": str(event.id),
                "event_type": event_type,
                "severity": severity,
                "description": description,
                "ip_address": ip_address,
            },
        )
        await manager.broadcast_to_room(msg, "admin_monitoring")
        return event

    @staticmethod
    async def search_events(
        db: AsyncSession,
        workspace_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Fetches paginated security events.
        """
        repo = SecurityEventRepository(db)
        return await repo.search_events(
            workspace_id=workspace_id,
            user_id=user_id,
            severity=severity,
            event_type=event_type,
            page=page,
            page_size=page_size,
        )
