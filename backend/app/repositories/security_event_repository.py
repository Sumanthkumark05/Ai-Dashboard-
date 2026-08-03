import uuid
from typing import Any, Dict, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security_event import SecurityEvent
from app.repositories.base_repository import BaseRepository


class SecurityEventRepository(BaseRepository[SecurityEvent]):
    """
    SecurityEvent Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(SecurityEvent, session)

    async def search_events(
        self,
        workspace_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Fetches paginated security events with severity and type filters.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(SecurityEvent)

        if workspace_id:
            query = query.where(SecurityEvent.workspace_id == workspace_id)
        if user_id:
            query = query.where(SecurityEvent.user_id == user_id)
        if severity:
            query = query.where(SecurityEvent.severity == severity)
        if event_type:
            query = query.where(SecurityEvent.event_type == event_type)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        query = query.order_by(SecurityEvent.created_at.desc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }
