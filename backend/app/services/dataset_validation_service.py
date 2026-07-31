from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.repositories.dataset_repository import DatasetRepository
from app.schemas.dataset import CreateDatasetRequest
from app.utils.dataset_validator import (
    validate_dataset_extension,
    validate_dataset_size,
)


class DatasetValidationService:
    """
    Service validating dataset constraints, extensions, storage quotas, and duplicate checksums.
    """

    @staticmethod
    async def validate_creation(
        workspace: Workspace, payload: CreateDatasetRequest, db: AsyncSession
    ) -> str:
        """
        Validates dataset extension, size limits, workspace storage quota, and duplicate checksums.
        Returns validated file extension string.
        """
        ds_repo = DatasetRepository(db)

        # 1. Validate extension
        ext = validate_dataset_extension(payload.file_name)

        # 2. Validate maximum file size (100 MB)
        validate_dataset_size(payload.file_size, max_size_mb=100)

        # 3. Validate workspace storage quota
        current_used_bytes = await ds_repo.sum_workspace_dataset_storage(workspace.id)
        new_total_mb = (current_used_bytes + payload.file_size) / (1024 * 1024)
        if new_total_mb > workspace.storage_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dataset upload exceeds workspace storage limit of {workspace.storage_limit} MB.",
            )

        # 4. Check duplicate checksum in workspace
        existing = await ds_repo.get_by_checksum(workspace.id, payload.checksum)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A dataset with an identical checksum already exists in this workspace ('{existing.name}').",
            )

        return ext
