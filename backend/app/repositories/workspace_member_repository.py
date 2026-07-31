import uuid
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.constants import MemberStatus
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.repositories.base_repository import BaseRepository


class WorkspaceMemberRepository(BaseRepository[WorkspaceMember]):
    """
    Workspace Member Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(WorkspaceMember, session)

    async def get_membership(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[WorkspaceMember]:
        """
        Fetch active member record for a specific user in a workspace.
        """
        query = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.status == MemberStatus.ACTIVE,
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_user_workspaces(
        self, user_id: uuid.UUID, organization_id: uuid.UUID
    ) -> List[Workspace]:
        """
        Fetch all workspaces in an organization where user is an active member.
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

    async def get_workspace_members(
        self, workspace_id: uuid.UUID
    ) -> List[WorkspaceMember]:
        """
        Fetch all member records for a workspace.
        """
        query = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.status == MemberStatus.ACTIVE,
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_members(self, workspace_id: uuid.UUID) -> int:
        """
        Count active members in a workspace.
        """
        query = select(func.count(WorkspaceMember.id)).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.status == MemberStatus.ACTIVE,
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
