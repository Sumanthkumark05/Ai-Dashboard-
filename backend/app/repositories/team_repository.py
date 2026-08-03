import uuid
from typing import Any, Dict, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.team import Team
from app.repositories.base_repository import BaseRepository


class TeamRepository(BaseRepository[Team]):
    """
    Team Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Team, session)

    async def get_by_name(self, workspace_id: uuid.UUID, name: str) -> Optional[Team]:
        """
        Find team by name within workspace.
        """
        query = select(Team).where(
            Team.workspace_id == workspace_id,
            func.lower(Team.name) == name.lower().strip(),
            Team.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_workspace_teams(
        self,
        workspace_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated teams in a workspace with search support.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(Team).where(
            Team.workspace_id == workspace_id,
            Team.is_deleted == False,  # noqa: E712
        )

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Team.name.ilike(search_pattern),
                    Team.description.ilike(search_pattern),
                )
            )

        # Count total matching
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        # Execute paginated query
        query = query.order_by(Team.created_at.desc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }
