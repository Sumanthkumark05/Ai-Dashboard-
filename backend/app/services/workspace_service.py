import re
import uuid
from typing import List
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import MemberStatus, WorkspaceRole, WorkspaceStatus
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.workspace_member_repository import WorkspaceMemberRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import CreateWorkspaceRequest, UpdateWorkspaceRequest


class WorkspaceService:
    """
    Business Logic Service managing tenant Workspaces lifecycle, archiving, and slug generation.
    """

    @staticmethod
    def generate_slug(name: str) -> str:
        """
        Generates URL slug from workspace name.
        Example: "Marketing Workspace" -> "marketing-workspace"
        """
        slug = name.lower().strip()
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[\s_-]+", "-", slug)
        return slug.strip("-")

    @staticmethod
    async def create_workspace(
        organization_id: uuid.UUID,
        payload: CreateWorkspaceRequest,
        creator: User,
        db: AsyncSession,
    ) -> Workspace:
        """
        Creates a Workspace within an Organization, sets creator as OWNER member.
        Enforces organization workspace limits.
        """
        org_repo = OrganizationRepository(db)
        ws_repo = WorkspaceRepository(db)
        ws_member_repo = WorkspaceMemberRepository(db)

        # 1. Check organization workspace limits
        org = await org_repo.get_by_id(organization_id)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found.",
            )

        current_ws_count = await ws_repo.count_organization_workspaces(organization_id)
        if current_ws_count >= org.workspace_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization has reached its workspace limit of {org.workspace_limit}.",
            )

        # 2. Slug generation & uniqueness per organization
        base_slug = payload.slug or WorkspaceService.generate_slug(payload.name)
        slug = base_slug
        counter = 1
        while await ws_repo.slug_exists(organization_id, slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        # 3. Create Workspace
        workspace = await ws_repo.create(
            organization_id=organization_id,
            name=payload.name,
            slug=slug,
            description=payload.description,
            icon=payload.icon,
            color=payload.color,
            visibility=payload.visibility,
            status=WorkspaceStatus.ACTIVE,
            created_by=creator.id,
            member_count=1,
        )

        # 4. Add Creator as Workspace OWNER
        await ws_member_repo.create(
            workspace_id=workspace.id,
            user_id=creator.id,
            role=WorkspaceRole.OWNER,
            status=MemberStatus.ACTIVE,
        )

        logger.info(
            f"Workspace '{workspace.name}' ({workspace.slug}) created in Org ID: {organization_id} by User ID: {creator.id}"
        )
        return workspace

    @staticmethod
    async def update_workspace(
        workspace_id: uuid.UUID, payload: UpdateWorkspaceRequest, db: AsyncSession
    ) -> Workspace:
        """
        Updates workspace metadata.
        """
        ws_repo = WorkspaceRepository(db)
        update_data = payload.model_dump(exclude_unset=True)

        updated_ws = await ws_repo.update(workspace_id, **update_data)
        if not updated_ws:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found.",
            )
        return updated_ws

    @staticmethod
    async def soft_delete_workspace(workspace_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Soft deletes a workspace.
        """
        ws_repo = WorkspaceRepository(db)
        return await ws_repo.delete(workspace_id, soft=True)

    @staticmethod
    async def archive_workspace(
        workspace_id: uuid.UUID, db: AsyncSession
    ) -> Workspace:
        """
        Sets workspace status to ARCHIVED (read-only).
        """
        ws_repo = WorkspaceRepository(db)
        updated = await ws_repo.update(workspace_id, status=WorkspaceStatus.ARCHIVED)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found.",
            )
        logger.info(f"Workspace ID {workspace_id} archived.")
        return updated

    @staticmethod
    async def restore_workspace(
        workspace_id: uuid.UUID, db: AsyncSession
    ) -> Workspace:
        """
        Restores an ARCHIVED workspace to ACTIVE status.
        """
        ws_repo = WorkspaceRepository(db)
        updated = await ws_repo.update(workspace_id, status=WorkspaceStatus.ACTIVE)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found.",
            )
        logger.info(f"Workspace ID {workspace_id} restored to ACTIVE.")
        return updated

    @staticmethod
    async def get_organization_workspaces(
        organization_id: uuid.UUID, db: AsyncSession
    ) -> List[Workspace]:
        """
        Lists all workspaces belonging to an organization.
        """
        ws_repo = WorkspaceRepository(db)
        return await ws_repo.get_organization_workspaces(organization_id)
