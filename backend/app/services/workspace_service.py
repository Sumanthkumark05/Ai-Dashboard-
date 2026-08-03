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
        logger.info(f"[WorkspaceService.create_workspace] Request received for '{payload.name}' by user {creator.email} (Org: {organization_id})")
        org_repo = OrganizationRepository(db)
        ws_repo = WorkspaceRepository(db)
        ws_member_repo = WorkspaceMemberRepository(db)

        # 1. Check organization workspace limits
        org = await org_repo.get_by_id(organization_id)
        if not org:
            logger.error(f"[WorkspaceService.create_workspace] Organization ID {organization_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found.",
            )

        current_ws_count = await ws_repo.count_organization_workspaces(organization_id)
        if current_ws_count >= org.workspace_limit:
            logger.warning(f"[WorkspaceService.create_workspace] Organization workspace limit reached ({current_ws_count}/{org.workspace_limit})")
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

        logger.info(f"[WorkspaceService.create_workspace] Creating workspace '{payload.name}' with slug '{slug}'...")

        # 3. Create Workspace
        is_client_project = (payload.project_type or "internal").lower() == "client"
        project_type_val = "client" if is_client_project else "internal"

        c_name = payload.client_name if is_client_project else None
        c_demo = payload.client_demo_date if is_client_project else None
        i_review = payload.internal_review_date if is_client_project else None
        f_delivery = payload.final_delivery_date if is_client_project else None

        try:
            workspace = await ws_repo.create(
                organization_id=organization_id,
                name=payload.name,
                slug=slug,
                description=payload.description,
                icon=payload.icon or "💼",
                color=payload.color or "#3B82F6",
                visibility=payload.visibility,
                status=WorkspaceStatus.ACTIVE,
                created_by=creator.id,
                member_count=1,
                default_model="openai/gpt-oss-120b",
                storage_limit=10240,
                project_type=project_type_val,
                client_name=c_name,
                project_name=payload.project_name,
                start_date=payload.start_date,
                end_date=payload.end_date,
                client_demo_date=c_demo,
                internal_review_date=i_review,
                final_delivery_date=f_delivery,
                reminder_before_demo=payload.reminder_before_demo,
                reminder_before_deadline=payload.reminder_before_deadline,
                meeting_duration=payload.meeting_duration,
                priority=payload.priority,
            )
        except Exception as exc:
            logger.error(f"[WorkspaceService.create_workspace] Failed to persist workspace: {exc}", exc_info=True)
            try:
                await db.rollback()
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database workspace creation failed: {str(exc)}",
            )

        # 4. Add Creator as Workspace OWNER
        # workspace is already committed by ws_repo.create() — membership is a separate transaction
        try:
            await ws_member_repo.create(
                workspace_id=workspace.id,
                user_id=creator.id,
                role=WorkspaceRole.OWNER,
                status=MemberStatus.ACTIVE,
            )
            logger.info(f"[WorkspaceService.create_workspace] Added User {creator.id} as OWNER of Workspace {workspace.id}")
        except Exception as exc:
            logger.error(f"[WorkspaceService.create_workspace] Failed to create OWNER membership: {exc}", exc_info=True)
            # Workspace is already committed — membership failure is non-fatal but logged
            # Do NOT rollback here: that would corrupt an already-committed session state
            logger.warning(f"Workspace {workspace.id} created but OWNER membership failed — user may need to be re-added.")

        # 5. Create default folders for workspace
        # Each folder is added in an independent nested savepoint so failures never
        # touch the already-committed workspace or membership records.
        try:
            from app.models.folder import Folder
            default_folder_names = ["Documents", "Datasets", "AI Chats", "Uploads", "Reports", "Knowledge Base"]
            for fname in default_folder_names:
                try:
                    async with db.begin_nested():
                        folder = Folder(
                            workspace_id=workspace.id,
                            name=fname,
                            path=f"/{fname.lower().replace(' ', '-')}",
                            created_by=creator.id,
                        )
                        db.add(folder)
                except Exception as folder_exc:
                    logger.warning(f"Could not create default folder '{fname}' for workspace {workspace.id}: {folder_exc}")
            await db.commit()
        except Exception as exc:
            logger.warning(f"Could not auto-create default folders for workspace {workspace.id}: {exc}")
            try:
                await db.rollback()
            except Exception:
                pass

        # 6. Auto-sync calendar events from workspace dates ONLY for Client Projects
        # Calendar sync runs in a completely separate isolated try block —
        # any failure is non-fatal and must never affect the workspace response.
        if is_client_project:
            try:
                from app.api.v1.routes.calendar import sync_workspace_calendar
                await sync_workspace_calendar(workspace.id, current_user=creator, db=db)
            except Exception as exc:
                logger.warning(f"Could not auto-sync calendar events for workspace {workspace.id}: {exc}")

        logger.info(
            f"[WorkspaceService.create_workspace] SUCCESS: Workspace '{workspace.name}' ({workspace.id}) created in Org ID: {organization_id}"
        )
        setattr(workspace, "role", "OWNER")
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

        # Auto-sync calendar events if scheduling dates changed
        try:
            from app.api.v1.routes.calendar import sync_workspace_calendar
            from app.models.user import User
            # dummy creator reference for system sync
            dummy_user = User(id=updated_ws.created_by)
            await sync_workspace_calendar(updated_ws.id, current_user=dummy_user, db=db)
        except Exception as exc:
            logger.warning(f"Could not auto-sync calendar events on update for workspace {workspace_id}: {exc}")

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
        (Admin/superuser view — not filtered by user membership.)
        """
        ws_repo = WorkspaceRepository(db)
        return await ws_repo.get_organization_workspaces(organization_id)

    @staticmethod
    async def get_user_workspaces(
        user_id: uuid.UUID, organization_id: uuid.UUID, db: AsyncSession
    ) -> List[Workspace]:
        """
        Lists all workspaces the user is an active member of within an organization.
        This is the canonical query used by both the Workspace Manager and Dashboard
        to ensure counts always stay in sync.
        """
        ws_repo = WorkspaceRepository(db)
        return await ws_repo.get_user_workspaces(user_id, organization_id)

