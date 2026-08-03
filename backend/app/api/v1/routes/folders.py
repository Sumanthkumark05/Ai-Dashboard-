import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.folder import (
    CreateFolderRequest,
    FolderListResponse,
    FolderResponse,
    UpdateFolderRequest,
)
from app.security.dependencies import get_current_user
from app.security.workspace_dependency import get_current_workspace
from app.services.folder_service import FolderService

router = APIRouter(prefix="/folders", tags=["Folder Organization"])


@router.post(
    "",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Folder",
    description="Creates a new folder or subfolder in the active workspace.",
)
async def create_folder(
    payload: CreateFolderRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FolderResponse:
    folder = await FolderService.create_folder(current_ws.id, payload, current_user, db)
    return FolderResponse.model_validate(folder)


@router.get(
    "",
    response_model=FolderListResponse,
    summary="List Workspace Folders",
    description="Returns paginated folders in the active workspace with search support.",
)
async def list_folders(
    parent_folder_id: Optional[uuid.UUID] = Query(default=None, description="Filter by Parent Folder ID"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, description="Search folder name"),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> FolderListResponse:
    data = await FolderService.get_workspace_folders(
        workspace_id=current_ws.id,
        parent_folder_id=parent_folder_id,
        page=page,
        page_size=page_size,
        search=search,
        db=db,
    )

    items = [FolderResponse.model_validate(f) for f in data["items"]]
    return FolderListResponse(
        items=items,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.put(
    "/{folder_id}",
    response_model=FolderResponse,
    summary="Rename Folder",
    description="Updates a folder's name.",
)
async def update_folder(
    folder_id: uuid.UUID,
    payload: UpdateFolderRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> FolderResponse:
    folder = await FolderService.update_folder(folder_id, payload, db)
    return FolderResponse.model_validate(folder)


@router.delete(
    "/{folder_id}",
    response_model=Dict[str, Any],
    summary="Delete Folder",
    description="Deletes a folder and all nested items inside.",
)
async def delete_folder(
    folder_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await FolderService.delete_folder(folder_id, db)
    return {
        "success": True,
        "message": f"Folder '{folder_id}' deleted successfully.",
    }
