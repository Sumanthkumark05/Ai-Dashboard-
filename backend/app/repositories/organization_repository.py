import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Organization
from app.repositories.base_repository import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    """
    Organization Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Organization, session)

    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        """
        Fetch non-deleted organization by unique URL slug.
        """
        query = select(Organization).where(
            Organization.slug == slug.lower().strip(),
            Organization.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def slug_exists(self, slug: str) -> bool:
        """
        Check if slug is already taken.
        """
        org = await self.get_by_slug(slug)
        return org is not None
