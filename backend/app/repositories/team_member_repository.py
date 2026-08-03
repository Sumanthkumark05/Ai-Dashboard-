import uuid
from typing import Any, Dict, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.team_member import TeamMember
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class TeamMemberRepository(BaseRepository[TeamMember]):
    """
    TeamMember Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(TeamMember, session)

    async def get_member(
        self, team_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[TeamMember]:
        """
        Fetch TeamMember record for team and user.
        """
        query = select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_team_members(
        self,
        team_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated team members with search support.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = (
            select(TeamMember)
            .join(User, TeamMember.user_id == User.id)
            .where(TeamMember.team_id == team_id)
        )

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    User.username.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                )
            )

        # Count total matching
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        # Execute paginated query
        query = query.order_by(TeamMember.joined_at.asc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }
