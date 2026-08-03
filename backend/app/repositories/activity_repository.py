import uuid
from typing import Any, Dict, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.repositories.base_repository import BaseRepository


class ActivityRepository(BaseRepository[Activity]):
    """
    Activity Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Activity, session)

    async def search_activities(
        self,
        workspace_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        activity_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Fetches paginated workspace or user activity entries.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(Activity)

        if workspace_id:
            query = query.where(Activity.workspace_id == workspace_id)
        if user_id:
            query = query.where(Activity.user_id == user_id)
        if activity_type:
            query = query.where(Activity.activity_type == activity_type)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        query = query.order_by(Activity.created_at.desc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }
