import uuid
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.repositories.base_repository import BaseRepository
from app.core.constants import MemberStatus


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

    async def get_user_workspaces(
        self, user_id: uuid.UUID, organization_id: uuid.UUID
    ) -> List[Workspace]:
        """
        Fetch all active non-deleted workspaces that the user is an active member of
        within a given organization. This is the canonical query used by both the
        Workspace Manager list and the Dashboard summary count.
        """
        query = (
            select(Workspace)
            .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
            .where(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == MemberStatus.ACTIVE,
                Workspace.organization_id == organization_id,
                Workspace.is_deleted == False,  # noqa: E712
            )
            .order_by(Workspace.updated_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_organization_workspaces(
        self, organization_id: uuid.UUID
    ) -> List[Workspace]:
        """
        Fetch all active non-deleted workspaces belonging to an Organization.
        (Admin/superuser view — not filtered by user membership.)
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

    async def count_user_workspaces(
        self, user_id: uuid.UUID, organization_id: uuid.UUID
    ) -> int:
        """
        Count workspaces the user is an active member of within an organization.
        """
        query = (
            select(func.count(Workspace.id))
            .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
            .where(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == MemberStatus.ACTIVE,
                Workspace.organization_id == organization_id,
                Workspace.is_deleted == False,  # noqa: E712
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
