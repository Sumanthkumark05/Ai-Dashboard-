import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.organization import Organization
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import (
    CreateWorkspaceRequest,
    UpdateWorkspaceRequest,
    WorkspaceResponse,
)
from app.schemas.workspace_member import (
    AddWorkspaceMemberRequest,
    UpdateWorkspaceMemberRequest,
    WorkspaceMemberResponse,
)
from app.security.dependencies import get_current_user
from app.security.organization_dependency import get_current_organization
from app.security.workspace_dependency import get_current_workspace
from app.services.workspace_member_service import WorkspaceMemberService
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspace Management"])


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Workspace",
    description="Creates a new workspace inside the current organization and sets creator as OWNER.",
)
async def create_workspace(
    payload: CreateWorkspaceRequest,
    current_org: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    workspace = await WorkspaceService.create_workspace(
        current_org.id, payload, current_user, db
    )
    return WorkspaceResponse.model_validate(workspace)


@router.get(
    "",
    response_model=List[WorkspaceResponse],
    summary="List Organization Workspaces",
    description="Returns all active workspaces belonging to the current organization.",
)
async def list_workspaces(
    current_org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db),
) -> List[WorkspaceResponse]:
    workspaces = await WorkspaceService.get_organization_workspaces(current_org.id, db)
    return [WorkspaceResponse.model_validate(w) for w in workspaces]


@router.get(
    "/current",
    response_model=WorkspaceResponse,
    summary="Get Active Workspace Context",
    description="Returns active workspace context for the current organization.",
)
async def get_current_ws(
    current_ws: Workspace = Depends(get_current_workspace),
) -> WorkspaceResponse:
    return WorkspaceResponse.model_validate(current_ws)


@router.patch(
    "/current",
    response_model=WorkspaceResponse,
    summary="Switch Active Workspace Context",
    description="Switches and returns active workspace context by ID.",
)
async def switch_current_ws(
    workspace_id: uuid.UUID,
    current_org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    workspaces = await WorkspaceService.get_organization_workspaces(current_org.id, db)
    target = next((w for w in workspaces if w.id == workspace_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found in the current organization.",
        )
    return WorkspaceResponse.model_validate(target)


@router.get(
    "/{workspaceId}",
    response_model=WorkspaceResponse,
    summary="Get Workspace Details",
    description="Returns details for a specific workspace ID.",
)
async def get_workspace(
    workspaceId: uuid.UUID,
    current_org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    workspaces = await WorkspaceService.get_organization_workspaces(current_org.id, db)
    ws = next((w for w in workspaces if w.id == workspaceId), None)
    if not ws:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )
    return WorkspaceResponse.model_validate(ws)


@router.patch(
    "/{workspaceId}",
    response_model=WorkspaceResponse,
    summary="Update Workspace",
    description="Updates workspace metadata.",
)
async def update_workspace(
    workspaceId: uuid.UUID,
    payload: UpdateWorkspaceRequest,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    updated = await WorkspaceService.update_workspace(workspaceId, payload, db)
    return WorkspaceResponse.model_validate(updated)


@router.delete(
    "/{workspaceId}",
    response_model=Dict[str, Any],
    summary="Soft Delete Workspace",
    description="Soft deletes a workspace by ID.",
)
async def delete_workspace(
    workspaceId: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await WorkspaceService.soft_delete_workspace(workspaceId, db)
    return {
        "success": True,
        "message": f"Workspace '{workspaceId}' deleted successfully.",
    }


@router.post(
    "/{workspaceId}/archive",
    response_model=WorkspaceResponse,
    summary="Archive Workspace",
    description="Archives a workspace, setting it to read-only status.",
)
async def archive_workspace(
    workspaceId: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    archived = await WorkspaceService.archive_workspace(workspaceId, db)
    return WorkspaceResponse.model_validate(archived)


@router.post(
    "/{workspaceId}/restore",
    response_model=WorkspaceResponse,
    summary="Restore Workspace",
    description="Restores an archived workspace back to ACTIVE status.",
)
async def restore_workspace(
    workspaceId: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    restored = await WorkspaceService.restore_workspace(workspaceId, db)
    return WorkspaceResponse.model_validate(restored)


@router.get(
    "/{workspaceId}/members",
    response_model=List[WorkspaceMemberResponse],
    summary="List Workspace Members",
    description="Returns active member records for a workspace.",
)
async def list_workspace_members(
    workspaceId: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[WorkspaceMemberResponse]:
    members = await WorkspaceMemberService.get_members(workspaceId, db)
    return [WorkspaceMemberResponse.model_validate(m) for m in members]


@router.post(
    "/{workspaceId}/members",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Member to Workspace",
    description="Adds an Organization member to a Workspace.",
)
async def add_workspace_member(
    workspaceId: uuid.UUID,
    payload: AddWorkspaceMemberRequest,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceMemberResponse:
    member = await WorkspaceMemberService.add_member(workspaceId, payload, db)
    return WorkspaceMemberResponse.model_validate(member)


@router.patch(
    "/{workspaceId}/members/{memberId}",
    response_model=WorkspaceMemberResponse,
    summary="Update Workspace Member Role",
    description="Updates role for a workspace member.",
)
async def update_workspace_member_role(
    workspaceId: uuid.UUID,
    memberId: uuid.UUID,
    payload: UpdateWorkspaceMemberRequest,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceMemberResponse:
    updated = await WorkspaceMemberService.update_member_role(
        workspaceId, memberId, payload.role, db
    )
    return WorkspaceMemberResponse.model_validate(updated)


@router.delete(
    "/{workspaceId}/members/{memberId}",
    response_model=Dict[str, Any],
    summary="Remove Workspace Member",
    description="Removes a member from a workspace.",
)
async def remove_workspace_member(
    workspaceId: uuid.UUID,
    memberId: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await WorkspaceMemberService.remove_member(workspaceId, memberId, db)
    return {
        "success": True,
        "message": f"Member '{memberId}' removed from workspace.",
    }
