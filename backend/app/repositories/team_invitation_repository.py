import uuid
from typing import List, Optional
from sqlalchemy import func, select

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import TeamInvitationStatus
from app.models.team_invitation import TeamInvitation
from app.repositories.base_repository import BaseRepository


class TeamInvitationRepository(BaseRepository[TeamInvitation]):
    """
    TeamInvitation Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(TeamInvitation, session)

    async def get_by_token(self, token: str) -> Optional[TeamInvitation]:
        """
        Fetch TeamInvitation record by secure UUID token string.
        """
        query = select(TeamInvitation).where(TeamInvitation.token == token)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_active_invitation(
        self, team_id: uuid.UUID, email: str
    ) -> Optional[TeamInvitation]:
        """
        Fetch active pending invitation for email in a team.
        """
        query = select(TeamInvitation).where(
            TeamInvitation.team_id == team_id,
            func.lower(TeamInvitation.email) == email.lower().strip(),
            TeamInvitation.status == TeamInvitationStatus.PENDING,
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_user_invitations(self, email: str) -> List[TeamInvitation]:
        """
        Fetch all pending invitations for a user email.
        """
        query = select(TeamInvitation).where(
            func.lower(TeamInvitation.email) == email.lower().strip(),
            TeamInvitation.status == TeamInvitationStatus.PENDING,
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
