import uuid
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.workspace import Workspace
from app.repositories.base_repository import BaseRepository


class WorkspaceRepository(BaseRepository[Workspace]):
    """
    Workspace Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Workspace, session)

    async def get_by_slug(
        self, organization_id: uuid.UUID, slug: str
    ) -> Optional[Workspace]:
        """
        Fetch non-deleted workspace by unique URL slug within an Organization.
        """
        query = select(Workspace).where(
            Workspace.organization_id == organization_id,
            Workspace.slug == slug.lower().strip(),
            Workspace.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def slug_exists(self, organization_id: uuid.UUID, slug: str) -> bool:
        """
        Check if slug is already taken within the organization.
        """
        ws = await self.get_by_slug(organization_id, slug)
        return ws is not None

    async def get_organization_workspaces(
        self, organization_id: uuid.UUID
    ) -> List[Workspace]:
        """
        Fetch all active non-deleted workspaces belonging to an Organization.
        """
        query = (
            select(Workspace)
            .where(
                Workspace.organization_id == organization_id,
                Workspace.is_deleted == False,  # noqa: E712
            )
            .order_by(Workspace.updated_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_organization_workspaces(
        self, organization_id: uuid.UUID
    ) -> int:
        """
        Count total workspaces in an Organization.
        """
        query = select(func.count(Workspace.id)).where(
            Workspace.organization_id == organization_id,
            Workspace.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
