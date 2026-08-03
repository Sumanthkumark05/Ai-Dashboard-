import io
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import (
    DocumentListResponse,
    DocumentResponse,
    UpdateDocumentRequest,
    UploadDocumentRequest,
    VersionResponse,
)
from app.security.dependencies import get_current_user
from app.security.workspace_dependency import get_current_workspace
from app.services.document_service import DocumentService
from app.services.storage.storage_service import StorageService

router = APIRouter(prefix="/documents", tags=["Document Management"])


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Document File",
    description="Uploads a physical document file (PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPT, PPTX, JSON, MD) to storage and registers metadata in PostgreSQL.",
)
async def upload_document_file(
    file: UploadFile = File(..., description="Multipart file payload"),
    title: Optional[str] = Form(None, description="Optional document title override"),
    description: Optional[str] = Form(None, description="Optional document description"),
    category: Optional[str] = Form("uncategorized", description="Document category"),
    visibility: Optional[str] = Form("workspace", description="Visibility level"),
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc = await DocumentService.upload_document_file(
        workspace=current_ws,
        uploader=current_user,
        file_obj=file,
        title=title,
        description=description,
        category=category,
        visibility=visibility,
        db=db,
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "/{id}/download",
    summary="Download Document File",
    description="Streams the original document file payload.",
)
async def download_document(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(id)
    if not doc or doc.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    storage_svc = StorageService()
    file_bytes = await storage_svc.download_file(doc.storage_path)

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=doc.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{doc.original_file_name or doc.file_name}"'
        },
    )


@router.get(
    "/storage/summary",
    summary="Get Knowledge Repository Storage Summary",
    description="Returns exact real-time totalDocuments, totalUsedBytes, remainingBytes, capacityBytes, and usagePercentage.",
)
async def get_document_storage_summary(
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    doc_repo = DocumentRepository(db)
    total_docs = await doc_repo.count_workspace_documents(current_ws.id)
    doc_bytes = await doc_repo.sum_workspace_storage(current_ws.id)

    capacity_mb = current_ws.storage_limit or 10240.0
    capacity_bytes = int(capacity_mb * 1024 * 1024)
    remaining_bytes = max(0, capacity_bytes - doc_bytes)
    usage_percentage = (doc_bytes / capacity_bytes * 100.0) if capacity_bytes > 0 else 0.0

    from app.api.v1.routes.workspaces import format_bytes_human
    return {
        "workspaceId": str(current_ws.id),
        "totalDocuments": total_docs,
        "totalUsedBytes": doc_bytes,
        "remainingBytes": remaining_bytes,
        "capacityBytes": capacity_bytes,
        "usagePercentage": usage_percentage,
        "usedFormatted": format_bytes_human(doc_bytes),
        "remainingFormatted": format_bytes_human(remaining_bytes),
        "capacityFormatted": format_bytes_human(capacity_bytes),
    }



@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Document Metadata",
    description="Registers new document metadata and initial version 1 inside the active workspace.",
)
async def upload_document(
    payload: UploadDocumentRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc = await DocumentService.upload_document_metadata(
        current_ws, payload, current_user, db
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "",
    response_model=DocumentListResponse,

    summary="List Workspace Documents",
    description="Returns paginated documents in the active workspace with search and filtering.",
)
async def list_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, description="Search title, description, or filename"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by document status"),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    data = await DocumentService.get_workspace_documents(
        workspace_id=current_ws.id,
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        status_filter=status_filter,
        db=db,
    )
    items_validated = [DocumentResponse.model_validate(item) for item in data["items"]]

    return DocumentListResponse(
        items=items_validated,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.get(
    "/{id}",
    response_model=DocumentResponse,
    summary="Get Document Details",
    description="Returns metadata details for a specific document ID.",
)
async def get_document(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(id)
    if not doc or doc.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return DocumentResponse.model_validate(doc)


@router.patch(
    "/{id}",
    response_model=DocumentResponse,
    summary="Update Document Metadata",
    description="Updates document metadata details (title, description, category, visibility).",
)
async def update_document(
    id: uuid.UUID,
    payload: UpdateDocumentRequest,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    updated = await DocumentService.update_document(id, payload, db)
    return DocumentResponse.model_validate(updated)


@router.delete(
    "/{id}",
    response_model=Dict[str, Any],
    summary="Soft Delete Document",
    description="Soft deletes a document and updates workspace storage counters.",
)
async def delete_document(
    id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await DocumentService.soft_delete_document(id, current_ws, db)
    return {
        "success": True,
        "message": f"Document '{id}' soft deleted successfully.",
    }


@router.post(
    "/{id}/favorite",
    response_model=DocumentResponse,
    summary="Toggle Document Favorite",
    description="Toggles the favorite flag for a document.",
)
async def toggle_favorite(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc = await DocumentService.toggle_favorite(id, db)
    return DocumentResponse.model_validate(doc)


@router.get(
    "/{id}/versions",
    response_model=List[VersionResponse],
    summary="List Document Versions",
    description="Returns version history for a document.",
)
async def list_versions(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[VersionResponse]:
    versions = await DocumentService.get_document_versions(id, db)
    return [VersionResponse.model_validate(v) for v in versions]


@router.post(
    "/{id}/restore",
    response_model=DocumentResponse,
    summary="Restore Deleted Document",
    description="Restores a soft deleted document.",
)
async def restore_document(
    id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc = await DocumentService.restore_document(id, current_ws, db)
    return DocumentResponse.model_validate(doc)
