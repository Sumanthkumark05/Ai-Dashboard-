from typing import Any, Dict
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response, StreamingResponse

from app.models.user import User
from app.schemas.upload import FileUploadResponse
from app.security.dependencies import get_current_user
from app.services.storage.storage_service import StorageService
from app.utils.mime import get_mime_type

router = APIRouter(prefix="/uploads", tags=["File Storage & Upload Engine"])


@router.post(
    "",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload File",
    description="Uploads a file via multipart form data, validates security checks, and stores it using the configured storage provider.",
)
async def upload_file(
    file: UploadFile = File(..., description="Multipart file payload"),
    subfolder: str = Form(default="documents", description="Subfolder category (documents, datasets, avatars, workspaces, organizations, temp)"),
    current_user: User = Depends(get_current_user),
) -> FileUploadResponse:
    content = await file.read()
    storage_svc = StorageService()

    return await storage_svc.upload_file(
        file_bytes=content,
        original_filename=file.filename or "upload.bin",
        subfolder=subfolder,
    )


@router.get(
    "/{storage_path:path}/metadata",
    response_model=Dict[str, Any],
    summary="Get File Metadata",
    description="Returns metadata details for a file at the given storage path.",
)
async def get_file_metadata(
    storage_path: str,
) -> Dict[str, Any]:
    storage_svc = StorageService()
    return await storage_svc.get_file_metadata(storage_path)


@router.get(
    "/{storage_path:path}/download",
    summary="Download File",
    description="Downloads the complete file from storage.",
)
async def download_file(
    storage_path: str,
) -> Response:
    storage_svc = StorageService()
    file_bytes = await storage_svc.download_file(storage_path)
    filename = storage_path.split("/")[-1]
    mime_type = get_mime_type(filename)

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": mime_type,
    }
    return Response(content=file_bytes, media_type=mime_type, headers=headers)


@router.get(
    "/{storage_path:path}/stream",
    summary="Stream File",
    description="Streams file content from storage in chunks.",
)
async def stream_file(
    storage_path: str,
) -> StreamingResponse:
    storage_svc = StorageService()
    filename = storage_path.split("/")[-1]
    mime_type = get_mime_type(filename)

    headers = {
        "Content-Disposition": f'inline; filename="{filename}"',
    }

    return StreamingResponse(
        storage_svc.stream_file(storage_path),
        media_type=mime_type,
        headers=headers,
    )


@router.delete(
    "/{storage_path:path}",
    response_model=Dict[str, Any],
    summary="Delete File",
    description="Deletes a file from storage.",
)
async def delete_file(
    storage_path: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    storage_svc = StorageService()
    success = await storage_svc.delete_file(storage_path)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found at '{storage_path}'.",
        )

    return {
        "success": True,
        "message": f"File at '{storage_path}' deleted successfully.",
    }
