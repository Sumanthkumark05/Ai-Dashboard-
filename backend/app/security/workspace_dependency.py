import uuid
from typing import Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import WorkspaceRole
from app.database.dependency import get_db
from app.models.organization import Organization
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.repositories.workspace_member_repository import WorkspaceMemberRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.security.dependencies import get_current_user
from app.security.organization_dependency import get_current_organization


async def get_current_workspace(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    current_org: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workspace:
    """
    FastAPI Dependency establishing Workspace context within the current Organization.
    Inspects 'X-Workspace-ID' header or defaults to user's first accessible workspace in the org.
    Auto-repairing missing workspaces on-the-fly.
    """
    ws_member_repo = WorkspaceMemberRepository(db)
    ws_repo = WorkspaceRepository(db)

    # 1. Fetch user's workspaces in current organization
    user_workspaces = await ws_member_repo.get_user_workspaces(
        current_user.id, current_org.id
    )

    if not user_workspaces:
        # Fallback to org workspaces if public/internal
        org_workspaces = await ws_repo.get_organization_workspaces(current_org.id)
        if not org_workspaces:
            from app.services.auth_service import AuthService
            logger.info(f"Auto-repairing missing workspace for User ID: {current_user.id} in Org ID: {current_org.id}")
            await AuthService.provision_user_defaults(current_user, db)
            user_workspaces = await ws_member_repo.get_user_workspaces(
                current_user.id, current_org.id
            )
            if not user_workspaces:
                user_workspaces = await ws_repo.get_organization_workspaces(current_org.id)
        else:
            user_workspaces = org_workspaces

    if not user_workspaces:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No workspaces found in this organization.",
        )

    # 2. Match Target Workspace ID if header specified
    target_workspace: Optional[Workspace] = None
    if x_workspace_id:
        try:
            target_uuid = uuid.UUID(x_workspace_id)
            target_workspace = next((w for w in user_workspaces if w.id == target_uuid), None)
        except ValueError:
            target_workspace = None

        if not target_workspace and user_workspaces:
            target_workspace = user_workspaces[0]
    else:
        target_workspace = user_workspaces[0] if user_workspaces else None

    if not target_workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No workspaces found in this organization.",
        )

    return target_workspace


async def get_optional_workspace(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    current_org: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Optional[Workspace]:
    """
    FastAPI Dependency that resolves active Workspace context or returns None when no workspace exists.
    Never throws HTTP exceptions.
    """
    try:
        return await get_current_workspace(x_workspace_id, current_org, current_user, db)
    except HTTPException:
        return None


def require_workspace_role(allowed_roles: List[WorkspaceRole]) -> Callable:
    """
    Dependency factory verifying member role within the current Workspace context.
    """

    async def role_checker(
        current_ws: Workspace = Depends(get_current_workspace),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> WorkspaceMember:
        if current_user.is_superuser:
            return WorkspaceMember(
                workspace_id=current_ws.id,
                user_id=current_user.id,
                role=WorkspaceRole.OWNER,
            )

        ws_member_repo = WorkspaceMemberRepository(db)
        member = await ws_member_repo.get_membership(current_ws.id, current_user.id)

        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not an active member of this workspace.",
            )

        member_role_str = (
            member.role.value if hasattr(member.role, "value") else str(member.role)
        )
        allowed_role_strs = [
            r.value if hasattr(r, "value") else str(r) for r in allowed_roles
        ]

        if member_role_str not in allowed_role_strs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires workspace role: {[r.value for r in allowed_roles]}",
            )

        return member

    return role_checker
