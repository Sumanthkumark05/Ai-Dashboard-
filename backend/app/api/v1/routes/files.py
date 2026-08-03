import uuid
from typing import Any, Dict, List, Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import FileTypeCategory
from app.database.dependency import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.stored_file_repository import StoredFileRepository
from app.schemas.file import (
    FileListResponse,
    FileResponse,
    StorageAnalyticsResponse,
    UpdateFileRequest,
)
from app.schemas.share import CreateShareRequest, FileShareResponse
from app.schemas.version import FileVersionListResponse, FileVersionResponse
from app.security.dependencies import get_current_user
from app.security.workspace_dependency import get_current_workspace
from app.services.file_service import FileService
from app.services.share_service import ShareService
from app.services.storage.storage_factory import StorageFactory
from app.services.version_service import VersionService

router = APIRouter(prefix="/files", tags=["File Storage & Media Management"])


@router.post(
    "/upload",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Single File",
    description="Uploads a file to the active workspace with validation, security checks, SHA256 checksumming, and optional folder categorization.",
)
async def upload_file(
    file: UploadFile = File(..., description="Multipart file payload"),
    folder_id: Optional[uuid.UUID] = Query(default=None, description="Optional Folder ID"),
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    stored_file = await FileService.upload_file(
        workspace_id=current_ws.id,
        uploader=current_user,
        file_obj=file,
        folder_id=folder_id,
        db=db,
    )
    return FileResponse.model_validate(stored_file)


@router.post(
    "/upload-multiple",
    response_model=List[FileResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload Multiple Files",
    description="Uploads multiple files sequentially to the active workspace.",
)
async def upload_multiple_files(
    files: List[UploadFile] = File(..., description="Multiple multipart file payloads"),
    folder_id: Optional[uuid.UUID] = Query(default=None),
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[FileResponse]:
    stored_files = await FileService.upload_multiple_files(
        workspace_id=current_ws.id,
        uploader=current_user,
        files=files,
        folder_id=folder_id,
        db=db,
    )
    return [FileResponse.model_validate(f) for f in stored_files]


@router.get(
    "",
    response_model=FileListResponse,
    summary="List Workspace Files",
    description="Returns paginated workspace files with search, folder, and file_type filtering.",
)
async def list_files(
    folder_id: Optional[uuid.UUID] = Query(default=None, description="Filter by Folder ID"),
    file_type: Optional[FileTypeCategory] = Query(default=None, description="Filter by FileTypeCategory"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, description="Search filename or extension"),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> FileListResponse:
    data = await FileService.get_workspace_files(
        workspace_id=current_ws.id,
        folder_id=folder_id,
        file_type=file_type,
        search=search,
        page=page,
        page_size=page_size,
        db=db,
    )
    items = [FileResponse.model_validate(f) for f in data["items"]]
    return FileListResponse(
        items=items,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.get(
    "/analytics",
    response_model=StorageAnalyticsResponse,
    summary="Storage Usage Analytics",
    description="Returns workspace storage metrics (total storage bytes, breakdown by file type, largest files).",
)
async def get_storage_analytics(
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> StorageAnalyticsResponse:
    data = await FileService.get_storage_analytics(current_ws.id, db)
    return StorageAnalyticsResponse(**data)


@router.get(
    "/share/{token}",
    summary="Public Share File Download",
    description="Downloads a file publicly via valid, non-expired share link token.",
)
async def download_shared_file(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    file = await ShareService.get_file_by_share_token(token, db)
    storage = StorageFactory.get_storage_provider()

    stream_generator = storage.stream(file.storage_path)
    return StreamingResponse(
        stream_generator,
        media_type=file.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{file.original_name}"'},
    )


@router.delete(
    "/share/{token}",
    response_model=Dict[str, Any],
    summary="Revoke Share Link",
    description="Revokes a public share link token.",
)
async def revoke_share_link(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await ShareService.revoke_share_link(token, db)
    return {
        "success": True,
        "message": f"Share token '{token}' revoked successfully.",
    }


@router.get(
    "/{file_id}",
    response_model=FileResponse,
    summary="Get File Details",
    description="Returns metadata for a specific file ID.",
)
async def get_file_details(
    file_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    repo = StoredFileRepository(db)
    file = await repo.get_by_id(file_id)
    if not file or file.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found.",
        )
    return FileResponse.model_validate(file)


@router.get(
    "/{file_id}/download",
    summary="Download File Payload",
    description="Streams file payload with attachment headers.",
)
@router.get(
    "/download/{file_id}",
    summary="Download File Payload (Legacy Path)",
)
async def download_file(
    file_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    repo = StoredFileRepository(db)
    file = await repo.get_by_id(file_id)
    if not file or file.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in this workspace.",
        )

    if file.workspace_id != current_ws.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="File does not belong to the current workspace.",
        )

    storage = StorageFactory.get_storage_provider()
    if not await storage.exists(file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file payload missing from storage.",
        )

    # Log audit activity
    try:
        from app.services.activity_service import ActivityService
        await ActivityService.log_activity(
            user_id=current_user.id,
            action="DOWNLOAD_FILE",
            details={
                "file_id": str(file.id),
                "filename": file.original_name,
                "workspace_id": str(file.workspace_id),
                "size": file.size,
            },
        )
    except Exception as exc:
        pass

    stream_generator = storage.stream(file.storage_path)

    import urllib.parse
    encoded_name = urllib.parse.quote(file.original_name)
    headers = {
        "Content-Disposition": f'attachment; filename="{file.original_name}"; filename*=UTF-8\'\'{encoded_name}',
        "Content-Length": str(file.size),
        "Cache-Control": "no-cache",
    }

    return StreamingResponse(
        stream_generator,
        media_type=file.mime_type or "application/octet-stream",
        headers=headers,
    )


@router.get(
    "/preview/{file_id}",
    summary="Preview File Media",
    description="Streams file payload inline for media preview (images, audio, video, PDFs).",
)
async def preview_file(
    file_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    repo = StoredFileRepository(db)
    file = await repo.get_by_id(file_id)
    if not file or file.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found.",
        )

    storage = StorageFactory.get_storage_provider()
    stream_generator = storage.stream(file.storage_path)

    return StreamingResponse(
        stream_generator,
        media_type=file.mime_type,
        headers={"Content-Disposition": f'inline; filename="{file.original_name}"'},
    )


@router.put(
    "/{file_id}",
    response_model=FileResponse,
    summary="Update File Metadata",
    description="Updates file original name, folder location, or public status.",
)
async def update_file(
    file_id: uuid.UUID,
    payload: UpdateFileRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    updated = await FileService.update_file(file_id, payload, db)
    return FileResponse.model_validate(updated)


@router.post(
    "/{file_id}/new-version",
    response_model=FileResponse,
    summary="Upload New Version",
    description="Uploads a new version of an existing file. Preserves version history.",
)
async def upload_new_version(
    file_id: uuid.UUID,
    file: UploadFile = File(...),
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    repo = StoredFileRepository(db)
    existing_file = await repo.get_by_id(file_id)
    if not existing_file or existing_file.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found.",
        )

    content = await file.read()
    updated_file = await VersionService.create_new_version(
        file=existing_file,
        file_content=content,
        uploader=current_user,
        db=db,
    )
    return FileResponse.model_validate(updated_file)


@router.get(
    "/{file_id}/versions",
    response_model=FileVersionListResponse,
    summary="List Version History",
    description="Returns version history list for a file.",
)
async def list_file_versions(
    file_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> FileVersionListResponse:
    versions = await VersionService.get_file_versions(file_id, db)
    items = [FileVersionResponse.model_validate(v) for v in versions]
    return FileVersionListResponse(items=items)


@router.post(
    "/{file_id}/versions/{version_id}/restore",
    response_model=FileResponse,
    summary="Restore File Version",
    description="Restores a previous version of a file.",
)
async def restore_file_version(
    file_id: uuid.UUID,
    version_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    repo = StoredFileRepository(db)
    file = await repo.get_by_id(file_id)
    if not file or file.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found.",
        )

    restored = await VersionService.restore_version(file, version_id, current_user, db)
    return FileResponse.model_validate(restored)


@router.post(
    "/{file_id}/share",
    response_model=FileShareResponse,
    summary="Create Share Link",
    description="Generates a public share link token for a file.",
)
async def create_share_link(
    file_id: uuid.UUID,
    payload: CreateShareRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileShareResponse:
    repo = StoredFileRepository(db)
    file = await repo.get_by_id(file_id)
    if not file or file.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found.",
        )

    share = await ShareService.create_share_link(file, payload.expires_in_days, current_user, db)
    resp = FileShareResponse.model_validate(share)
    resp.share_url = f"/api/v1/files/share/{share.token}"
    return resp


@router.delete(
    "/{file_id}",
    response_model=Dict[str, Any],
    summary="Soft Delete File",
    description="Soft deletes a file.",
)
async def soft_delete_file(
    file_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await FileService.soft_delete_file(file_id, db)
    return {
        "success": True,
        "message": f"File '{file_id}' soft deleted successfully.",
    }


@router.delete(
    "/{file_id}/permanent",
    response_model=Dict[str, Any],
    summary="Permanent Delete File",
    description="Permanently deletes file metadata and physical storage payload.",
)
async def permanent_delete_file(
    file_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await FileService.permanent_delete_file(file_id, db)
    return {
        "success": True,
        "message": f"File '{file_id}' permanently deleted successfully.",
    }
