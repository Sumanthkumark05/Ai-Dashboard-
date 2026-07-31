import uuid
from typing import List
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import MemberStatus, WorkspaceRole
from app.models.workspace_member import WorkspaceMember
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.workspace_member_repository import WorkspaceMemberRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace_member import AddWorkspaceMemberRequest


class WorkspaceMemberService:
    """
    Business Logic Service managing workspace members and access roles.
    """

    @staticmethod
    async def get_members(
        workspace_id: uuid.UUID, db: AsyncSession
    ) -> List[WorkspaceMember]:
        """
        Fetch active workspace member records.
        """
        ws_member_repo = WorkspaceMemberRepository(db)
        return await ws_member_repo.get_workspace_members(workspace_id)

    @staticmethod
    async def add_member(
        workspace_id: uuid.UUID, payload: AddWorkspaceMemberRequest, db: AsyncSession
    ) -> WorkspaceMember:
        """
        Adds an Organization member to a Workspace.
        """
        ws_repo = WorkspaceRepository(db)
        ws_member_repo = WorkspaceMemberRepository(db)
        org_member_repo = OrganizationMemberRepository(db)

        workspace = await ws_repo.get_by_id(workspace_id)
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found.",
            )

        # Verify user is an active member of parent organization
        org_member = await org_member_repo.get_membership(
            workspace.organization_id, payload.user_id
        )
        if not org_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must be an active member of the parent organization to join this workspace.",
            )

        # Check if already a workspace member
        existing = await ws_member_repo.get_membership(workspace_id, payload.user_id)
        if existing:
            return existing

        member = await ws_member_repo.create(
            workspace_id=workspace_id,
            user_id=payload.user_id,
            role=payload.role,
            status=MemberStatus.ACTIVE,
        )

        # Update workspace member count
        member_count = await ws_member_repo.count_members(workspace_id)
        await ws_repo.update(workspace_id, member_count=member_count)

        logger.info(
            f"User ID {payload.user_id} added to Workspace ID {workspace_id} with role {payload.role}"
        )
        return member

    @staticmethod
    async def update_member_role(
        workspace_id: uuid.UUID,
        member_id: uuid.UUID,
        new_role: WorkspaceRole,
        db: AsyncSession,
    ) -> WorkspaceMember:
        """
        Updates a workspace member's role.
        Prevents demoting sole OWNER.
        """
        ws_member_repo = WorkspaceMemberRepository(db)
        member = await ws_member_repo.get_by_id(member_id)

        if not member or member.workspace_id != workspace_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace member record not found.",
            )

        if member.role == WorkspaceRole.OWNER and new_role != WorkspaceRole.OWNER:
            all_members = await ws_member_repo.get_workspace_members(workspace_id)
            owner_count = sum(1 for m in all_members if m.role == WorkspaceRole.OWNER)
            if owner_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the sole owner of a workspace.",
                )

        updated_member = await ws_member_repo.update(member_id, role=new_role)
        return updated_member

    @staticmethod
    async def remove_member(
        workspace_id: uuid.UUID, member_id: uuid.UUID, db: AsyncSession
    ) -> bool:
        """
        Removes a member from a workspace.
        """
        ws_repo = WorkspaceRepository(db)
        ws_member_repo = WorkspaceMemberRepository(db)
        member = await ws_member_repo.get_by_id(member_id)

        if not member or member.workspace_id != workspace_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace member record not found.",
            )

        if member.role == WorkspaceRole.OWNER:
            all_members = await ws_member_repo.get_workspace_members(workspace_id)
            owner_count = sum(1 for m in all_members if m.role == WorkspaceRole.OWNER)
            if owner_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the sole owner of a workspace.",
                )

        success = await ws_member_repo.delete(member_id, soft=False)

        # Update member count
        member_count = await ws_member_repo.count_members(workspace_id)
        await ws_repo.update(workspace_id, member_count=member_count)

        return success
