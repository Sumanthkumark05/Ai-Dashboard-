import uuid
from typing import Any, Dict, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.login_history import LoginHistory
from app.repositories.base_repository import BaseRepository


class LoginHistoryService:
    """
    Business Logic Service managing user login history records and session duration metrics.
    """

    @classmethod
    async def get_user_login_history(
        cls,
        user_id: uuid.UUID,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Fetches paginated login history records for a user.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(LoginHistory).where(LoginHistory.user_id == user_id)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total_items = total_result.scalar() or 0

        query = query.order_by(LoginHistory.created_at.desc()).offset(skip).limit(page_size)
        result = await db.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }
