from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import UploadDocumentRequest
from app.utils.file_validation import (
    validate_file_extension,
    validate_max_file_size,
)


class DocumentValidationService:
    """
    Service validating document upload constraints, file extensions, and storage quotas.
    """

    @staticmethod
    async def validate_upload(
        workspace: Workspace, payload: UploadDocumentRequest, db: AsyncSession
    ) -> str:
        """
        Validates extension, size limits, workspace storage quota, and duplicate checksums.
        Returns validated file extension string.
        """
        doc_repo = DocumentRepository(db)

        # 1. Validate extension
        ext = validate_file_extension(payload.file_name)

        # 2. Validate maximum file size (50 MB)
        validate_max_file_size(payload.file_size, max_size_mb=50)

        # 3. Validate workspace storage quota limit
        current_used_bytes = await doc_repo.sum_workspace_storage(workspace.id)
        new_total_mb = (current_used_bytes + payload.file_size) / (1024 * 1024)
        if new_total_mb > workspace.storage_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Upload exceeds workspace storage limit of {workspace.storage_limit} MB.",
            )

        # 4. Check duplicate checksum in workspace
        existing = await doc_repo.get_by_checksum(workspace.id, payload.checksum)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A document with an identical checksum already exists in this workspace ('{existing.title}').",
            )

        return ext
