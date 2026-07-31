import uuid
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.login_history import LoginHistory
from app.repositories.base_repository import BaseRepository


class LoginHistoryRepository(BaseRepository[LoginHistory]):
    """
    Login History Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(LoginHistory, session)

    async def get_user_history(
        self, user_id: uuid.UUID, page: int = 1, page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Fetch paginated login history for a specific user.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = (
            select(LoginHistory)
            .where(LoginHistory.user_id == user_id)
            .order_by(LoginHistory.login_time.desc())
            .offset(skip)
            .limit(page_size)
        )
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        total_count = await self.count()
        return {
            "items": items,
            "total_items": total_count,
            "page": page,
            "page_size": page_size,
        }
