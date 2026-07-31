import uuid
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import MemberStatus
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.repositories.base_repository import BaseRepository


class OrganizationMemberRepository(BaseRepository[OrganizationMember]):
    """
    Organization Member Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(OrganizationMember, session)

    async def get_membership(
        self, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[OrganizationMember]:
        """
        Fetch active member record for a specific user in an organization.
        """
        query = select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
            OrganizationMember.status == MemberStatus.ACTIVE,
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_user_organizations(self, user_id: uuid.UUID) -> List[Organization]:
        """
        Fetch all active organizations where user is an active member.
        """
        query = (
            select(Organization)
            .join(
                OrganizationMember,
                Organization.id == OrganizationMember.organization_id,
            )
            .where(
                OrganizationMember.user_id == user_id,
                OrganizationMember.status == MemberStatus.ACTIVE,
                Organization.is_deleted == False,  # noqa: E712
            )
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_organization_members(
        self, organization_id: uuid.UUID
    ) -> List[OrganizationMember]:
        """
        Fetch all member records for an organization.
        """
        query = select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.status == MemberStatus.ACTIVE,
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_members(self, organization_id: uuid.UUID) -> int:
        """
        Count active members in an organization.
        """
        query = select(func.count(OrganizationMember.id)).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.status == MemberStatus.ACTIVE,
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
