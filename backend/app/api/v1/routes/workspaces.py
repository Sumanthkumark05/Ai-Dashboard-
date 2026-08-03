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
    SwitchWorkspaceRequest,
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
    summary="List User Workspaces",
    description="Returns all active workspaces the current user is a member of within the current organization.",
)
async def list_workspaces(
    current_org: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[WorkspaceResponse]:
    workspaces = await WorkspaceService.get_user_workspaces(current_user.id, current_org.id, db)
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


@router.post(
    "/switch",
    response_model=WorkspaceResponse,
    summary="Switch Active Workspace",
    description="Switches context to the specified workspace ID.",
)
async def switch_workspace(
    payload: SwitchWorkspaceRequest,
    current_org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceResponse:
    workspaces = await WorkspaceService.get_organization_workspaces(current_org.id, db)
    target = next((w for w in workspaces if w.id == payload.workspace_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found in the current organization.",
        )
    return WorkspaceResponse.model_validate(target)


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


# ── Workspace Storage Analytics Endpoint ──────────────────────────────────────

from app.models.dataset import Dataset
from app.models.document import Document
from app.models.stored_file import StoredFile
from app.schemas.workspace_storage import WorkspaceStorageResponse
from sqlalchemy import select, func


def format_bytes_human(bytes_val: int) -> str:
    if bytes_val < 1024:
        return f"{bytes_val} B"
    kb = bytes_val / 1024.0
    if kb < 1024:
        return f"{kb:.1f} KB"
    mb = kb / 1024.0
    if mb < 1024:
        return f"{mb:.1f} MB"
    gb = mb / 1024.0
    return f"{gb:.2f} GB"


async def _calculate_workspace_storage(target_ws_id: uuid.UUID, db: AsyncSession) -> WorkspaceStorageResponse:
    # Query active non-deleted files in PostgreSQL stored_files
    files_count = (
        await db.execute(
            select(func.count(StoredFile.id)).where(
                StoredFile.workspace_id == target_ws_id,
                StoredFile.is_deleted == False,
            )
        )
    ).scalar() or 0

    files_bytes = (
        await db.execute(
            select(func.coalesce(func.sum(StoredFile.size), 0)).where(
                StoredFile.workspace_id == target_ws_id,
                StoredFile.is_deleted == False,
            )
        )
    ).scalar() or 0

    # Query active non-deleted datasets in PostgreSQL datasets
    datasets_count = (
        await db.execute(
            select(func.count(Dataset.id)).where(
                Dataset.workspace_id == target_ws_id,
                Dataset.is_deleted == False,
            )
        )
    ).scalar() or 0

    datasets_bytes = (
        await db.execute(
            select(func.coalesce(func.sum(Dataset.file_size), 0)).where(
                Dataset.workspace_id == target_ws_id,
                Dataset.is_deleted == False,
            )
        )
    ).scalar() or 0

    # Query active non-deleted documents in PostgreSQL documents
    # Avoid double counting if storage_path is already in stored_files
    sf_paths_res = await db.execute(
        select(StoredFile.storage_path).where(
            StoredFile.workspace_id == target_ws_id,
            StoredFile.is_deleted == False,
        )
    )
    sf_paths = set(sf_paths_res.scalars().all())

    docs_res = await db.execute(
        select(Document).where(
            Document.workspace_id == target_ws_id,
            Document.is_deleted == False,
        )
    )
    docs_all = docs_res.scalars().all()

    additional_doc_bytes = 0
    additional_doc_count = 0
    for doc in docs_all:
        if doc.storage_path not in sf_paths:
            additional_doc_bytes += (doc.file_size or 0)
            additional_doc_count += 1

    total_files = int(files_count + datasets_count + additional_doc_count)
    total_used_bytes = int(files_bytes + datasets_bytes + additional_doc_bytes)


    used_kb = round(total_used_bytes / 1024.0, 4)
    used_mb = round(total_used_bytes / (1024.0 * 1024.0), 6)

    capacity_mb = 10240.0  # 10 GB limit
    capacity_bytes = int(capacity_mb * 1024 * 1024)

    remaining_mb = max(0.0, round(capacity_mb - used_mb, 4))
    remaining_bytes = max(0, capacity_bytes - total_used_bytes)

    percentage_used = min(100.0, (total_used_bytes / capacity_bytes) * 100.0)

    return WorkspaceStorageResponse(
        workspaceId=target_ws_id,
        totalFiles=total_files,
        usedBytes=total_used_bytes,
        usedKB=used_kb,
        usedMB=used_mb,
        capacityMB=capacity_mb,
        remainingMB=remaining_mb,
        percentageUsed=percentage_used,
        usedFormatted=format_bytes_human(total_used_bytes),
        remainingFormatted=format_bytes_human(remaining_bytes),
        capacityFormatted=format_bytes_human(capacity_bytes),
    )


@router.get(
    "/storage",
    response_model=WorkspaceStorageResponse,
    summary="Get Active Workspace Storage",
)
async def get_active_workspace_storage(
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceStorageResponse:
    return await _calculate_workspace_storage(current_ws.id, db)


@router.get(
    "/{workspaceId}/storage",
    response_model=WorkspaceStorageResponse,
    summary="Get Workspace Storage by ID",
)
async def get_workspace_storage(
    workspaceId: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> WorkspaceStorageResponse:
    return await _calculate_workspace_storage(workspaceId, db)



