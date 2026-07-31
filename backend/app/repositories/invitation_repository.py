import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import InvitationStatus
from app.models.invitation import Invitation
from app.repositories.base_repository import BaseRepository


class InvitationRepository(BaseRepository[Invitation]):
    """
    Organization Invitation Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Invitation, session)

    async def get_by_token(self, token: str) -> Optional[Invitation]:
        """
        Fetch pending non-expired invitation by token.
        """
        query = select(Invitation).where(
            Invitation.token == token,
            Invitation.status == InvitationStatus.PENDING,
            Invitation.expires_at > datetime.now(timezone.utc),
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_pending_invitation(
        self, organization_id: uuid.UUID, email: str
    ) -> Optional[Invitation]:
        """
        Fetch existing pending invitation by email for an organization.
        """
        query = select(Invitation).where(
            Invitation.organization_id == organization_id,
            Invitation.email == email.lower().strip(),
            Invitation.status == InvitationStatus.PENDING,
        )
        result = await self.session.execute(query)
        return result.scalars().first()
