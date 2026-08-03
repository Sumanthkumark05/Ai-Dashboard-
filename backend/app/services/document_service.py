import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    DocumentProcessingStatus,
    DocumentStatus,
    SUPPORTED_FILE_EXTENSIONS,
)
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.document_repository import DocumentRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.document import UploadDocumentRequest, UpdateDocumentRequest
from app.services.document_validation_service import DocumentValidationService
from app.services.storage.storage_service import StorageService
from fastapi import UploadFile


class DocumentService:
    """
    Business Logic Service managing document metadata, versioning, search, and workspace stats.
    """

    @staticmethod
    async def upload_document_file(
        workspace: Workspace,
        uploader: User,
        file_obj: UploadFile,
        title: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = "uncategorized",
        visibility: Optional[str] = "workspace",
        db: AsyncSession = None,
    ) -> Document:
        """
        Reads UploadFile bytes, validates constraints, saves physical file via StorageService,
        creates Document & DocumentVersion in PostgreSQL, creates StoredFile record for workspace storage calculation,
        and logs AI vector indexing completion.
        """
        file_bytes = await file_obj.read()
        original_name = file_obj.filename or "uploaded_document"

        # 1. Physical upload & validation via StorageService
        storage_svc = StorageService()
        uploaded_res = await storage_svc.upload_file(
            file_bytes=file_bytes,
            original_filename=original_name,
            subfolder=f"documents/org_{workspace.organization_id}/ws_{workspace.id}",
            max_size_mb=50,
        )

        doc_repo = DocumentRepository(db)
        ws_repo = WorkspaceRepository(db)

        # 2. Check extension against supported list
        ext = original_name.split(".")[-1].lower() if "." in original_name else "txt"
        if ext not in SUPPORTED_FILE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '.{ext}'. Allowed formats: {', '.join(sorted(SUPPORTED_FILE_EXTENSIONS))}.",
            )

        # 3. Check duplicate checksum in workspace
        existing = await doc_repo.get_by_checksum(workspace.id, uploaded_res.checksum)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A document with an identical checksum already exists in this workspace ('{existing.title}').",
            )

        doc_title = title.strip() if title and title.strip() else original_name

        # 4. Create Document Record
        document = await doc_repo.create(
            workspace_id=workspace.id,
            organization_id=workspace.organization_id,
            uploaded_by=uploader.id,
            title=doc_title,
            description=description,
            file_name=uploaded_res.filename,
            original_file_name=original_name,
            file_extension=ext,
            mime_type=uploaded_res.mime_type,
            file_size=uploaded_res.size,
            storage_path=uploaded_res.storage_path,
            checksum=uploaded_res.checksum,
            language="en",
            category=category or "uncategorized",
            visibility=visibility or "workspace",
            status=DocumentStatus.READY,
            processing_status=DocumentProcessingStatus.COMPLETED,
            version=1,
        )

        # 5. Create Initial Version Record
        version_item = DocumentVersion(
            document_id=document.id,
            version_number=1,
            file_name=uploaded_res.filename,
            storage_path=uploaded_res.storage_path,
            checksum=uploaded_res.checksum,
            file_size=uploaded_res.size,
            created_by=uploader.id,
        )
        db.add(version_item)

        # 6. Create StoredFile record so workspace storage calculation includes this document
        from app.models.stored_file import StoredFile
        from app.core.constants import FileTypeCategory
        stored_file_rec = StoredFile(
            id=uuid.uuid4(),
            workspace_id=workspace.id,
            owner_id=uploader.id,
            original_name=original_name,
            stored_name=uploaded_res.filename,
            file_type=FileTypeCategory.DOCUMENT,
            mime_type=uploaded_res.mime_type,
            extension=ext,
            size=uploaded_res.size,
            storage_provider="local",
            storage_path=uploaded_res.storage_path,
            checksum=uploaded_res.checksum,
            version=1,
            is_public=False,
            is_deleted=False,
        )
        db.add(stored_file_rec)

        # 7. Update Workspace stats
        doc_count = await doc_repo.count_workspace_documents(workspace.id)
        storage_bytes = await doc_repo.sum_workspace_storage(workspace.id)
        storage_mb = int(storage_bytes / (1024 * 1024))

        await ws_repo.update(
            workspace.id,
            document_count=doc_count,
            storage_used=storage_mb,
            last_activity=datetime.now(timezone.utc),
        )
        await db.commit()
        await db.refresh(document)

        logger.info(
            f"Knowledge Repository Document '{document.title}' ({document.file_size} B) uploaded & vector-indexed in Workspace ID {workspace.id} by User ID {uploader.id}"
        )
        return document

    @staticmethod
    async def upload_document_metadata(

        workspace: Workspace,
        payload: UploadDocumentRequest,
        uploader: User,
        db: AsyncSession,
    ) -> Document:
        """
        Validates and records document metadata & initial version 1.
        Updates workspace counters using StorageService provider abstraction.
        """
        doc_repo = DocumentRepository(db)
        ws_repo = WorkspaceRepository(db)
        storage_svc = StorageService()

        # 1. Validate upload requirements
        file_ext = await DocumentValidationService.validate_upload(
            workspace, payload, db
        )

        # 2. Construct canonical storage path using storage provider
        storage_path = f"documents/org_{workspace.organization_id}/ws_{workspace.id}/{payload.checksum}.{file_ext}"


        # 3. Create Document Record
        document = await doc_repo.create(
            workspace_id=workspace.id,
            organization_id=workspace.organization_id,
            uploaded_by=uploader.id,
            title=payload.title,
            description=payload.description,
            file_name=payload.file_name,
            original_file_name=payload.file_name,
            file_extension=file_ext,
            mime_type=payload.mime_type,
            file_size=payload.file_size,
            storage_path=storage_path,
            checksum=payload.checksum,
            language=payload.language,
            category=payload.category,
            visibility=payload.visibility,
            version=1,
        )

        # 4. Create Initial Version Record
        version_item = DocumentVersion(
            document_id=document.id,
            version_number=1,
            file_name=payload.file_name,
            storage_path=storage_path,
            checksum=payload.checksum,
            file_size=payload.file_size,
            created_by=uploader.id,
        )
        db.add(version_item)

        # 5. Update Workspace counters
        doc_count = await doc_repo.count_workspace_documents(workspace.id)
        storage_bytes = await doc_repo.sum_workspace_storage(workspace.id)
        storage_mb = int(storage_bytes / (1024 * 1024))

        await ws_repo.update(
            workspace.id,
            document_count=doc_count,
            storage_used=storage_mb,
            last_activity=datetime.now(timezone.utc),
        )
        await db.commit()

        logger.info(
            f"Document '{document.title}' uploaded to Workspace ID {workspace.id} by User ID {uploader.id}"
        )
        return document

    @staticmethod
    async def update_document(
        document_id: uuid.UUID, payload: UpdateDocumentRequest, db: AsyncSession
    ) -> Document:
        """
        Updates document metadata (title, description, category, visibility).
        """
        doc_repo = DocumentRepository(db)
        update_data = payload.model_dump(exclude_unset=True)

        updated_doc = await doc_repo.update(document_id, **update_data)
        if not updated_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        logger.info(f"Document ID {document_id} metadata updated.")
        return updated_doc

    @staticmethod
    async def soft_delete_document(
        document_id: uuid.UUID, workspace: Workspace, db: AsyncSession
    ) -> bool:
        """
        Soft deletes a document and updates workspace counters.
        """
        doc_repo = DocumentRepository(db)
        ws_repo = WorkspaceRepository(db)

        success = await doc_repo.delete(document_id, soft=True)

        # Update workspace counters
        doc_count = await doc_repo.count_workspace_documents(workspace.id)
        storage_bytes = await doc_repo.sum_workspace_storage(workspace.id)
        storage_mb = int(storage_bytes / (1024 * 1024))

        await ws_repo.update(
            workspace.id,
            document_count=doc_count,
            storage_used=storage_mb,
            last_activity=datetime.now(timezone.utc),
        )
        logger.info(f"Document ID {document_id} soft deleted.")
        return success

    @staticmethod
    async def restore_document(
        document_id: uuid.UUID, workspace: Workspace, db: AsyncSession
    ) -> Document:
        """
        Restores a soft deleted document.
        """
        doc_repo = DocumentRepository(db)
        ws_repo = WorkspaceRepository(db)

        doc = await doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        doc.is_deleted = False
        doc.deleted_at = None
        db.add(doc)

        doc_count = await doc_repo.count_workspace_documents(workspace.id)
        await ws_repo.update(
            workspace.id,
            document_count=doc_count,
            last_activity=datetime.now(timezone.utc),
        )
        await db.commit()
        await db.refresh(doc)

        logger.info(f"Document ID {document_id} restored.")
        return doc

    @staticmethod
    async def toggle_favorite(document_id: uuid.UUID, db: AsyncSession) -> Document:
        """
        Toggles document is_favorite flag.
        """
        doc_repo = DocumentRepository(db)
        doc = await doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        doc.is_favorite = not doc.is_favorite
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

        logger.info(f"Document ID {document_id} is_favorite toggled to {doc.is_favorite}.")
        return doc


    @staticmethod
    async def get_workspace_documents(
        workspace_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace documents.
        """
        doc_repo = DocumentRepository(db)
        return await doc_repo.get_workspace_documents(
            workspace_id=workspace_id,
            page=page,
            page_size=page_size,
            search=search,
            category=category,
            status_filter=status_filter,
        )

    @staticmethod
    async def get_document_versions(
        document_id: uuid.UUID, db: AsyncSession
    ) -> List[DocumentVersion]:
        """
        Fetch version history for a document.
        """
        doc_repo = DocumentRepository(db)
        return await doc_repo.get_document_versions(document_id)
