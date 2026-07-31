import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset import Dataset
from app.models.dataset_tag import DatasetTag
from app.models.dataset_version import DatasetVersion
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.dataset_repository import DatasetRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.dataset import CreateDatasetRequest, UpdateDatasetRequest
from app.services.dataset_validation_service import DatasetValidationService


from app.services.storage.storage_service import StorageService

class DatasetService:
    """
    Business Logic Service managing dataset metadata, versioning, tags, and workspace stats.
    """

    @staticmethod
    async def create_dataset(
        workspace: Workspace,
        payload: CreateDatasetRequest,
        uploader: User,
        db: AsyncSession,
    ) -> Dataset:
        """
        Creates dataset metadata entry, initial version 1 record, tags, and updates workspace stats via StorageService.
        """
        ds_repo = DatasetRepository(db)
        ws_repo = WorkspaceRepository(db)
        storage_svc = StorageService()

        # 1. Validation
        file_ext = await DatasetValidationService.validate_creation(
            workspace, payload, db
        )

        # 2. Canonical Storage Path
        storage_path = f"datasets/org_{workspace.organization_id}/ws_{workspace.id}/{payload.checksum}.{file_ext}"


        # 3. Create Dataset
        dataset = await ds_repo.create(
            organization_id=workspace.organization_id,
            workspace_id=workspace.id,
            uploaded_by=uploader.id,
            name=payload.name,
            description=payload.description,
            dataset_type=payload.dataset_type,
            source=payload.source,
            file_name=payload.file_name,
            original_file_name=payload.file_name,
            storage_path=storage_path,
            mime_type=payload.mime_type,
            extension=file_ext,
            checksum=payload.checksum,
            language=payload.language,
            encoding=payload.encoding,
            file_size=payload.file_size,
            record_count=payload.record_count,
            column_count=payload.column_count,
            visibility=payload.visibility,
            version=1,
        )

        # 4. Create Initial Version Record
        version_item = DatasetVersion(
            dataset_id=dataset.id,
            version_number=1,
            file_name=payload.file_name,
            storage_path=storage_path,
            checksum=payload.checksum,
            file_size=payload.file_size,
            record_count=payload.record_count,
            column_count=payload.column_count,
            created_by=uploader.id,
        )
        db.add(version_item)

        # 5. Create Tags
        if payload.tags:
            for tag_str in payload.tags:
                clean_tag = tag_str.strip().lower()
                if clean_tag:
                    db.add(DatasetTag(dataset_id=dataset.id, tag=clean_tag))

        # 6. Update Workspace counters
        dataset_count = await ds_repo.count_workspace_datasets(workspace.id)
        storage_bytes = await ds_repo.sum_workspace_dataset_storage(workspace.id)
        storage_mb = int(storage_bytes / (1024 * 1024))

        await ws_repo.update(
            workspace.id,
            dataset_count=dataset_count,
            storage_used=storage_mb,
            last_activity=datetime.now(timezone.utc),
        )
        await db.commit()
        await db.refresh(dataset)

        logger.info(
            f"Dataset '{dataset.name}' created in Workspace ID {workspace.id} by User ID {uploader.id}"
        )
        return dataset

    @staticmethod
    async def update_dataset(
        dataset_id: uuid.UUID, payload: UpdateDatasetRequest, db: AsyncSession
    ) -> Dataset:
        """
        Updates dataset metadata.
        """
        ds_repo = DatasetRepository(db)
        update_data = payload.model_dump(exclude_unset=True, exclude={"tags"})

        updated_ds = await ds_repo.update(dataset_id, **update_data)
        if not updated_ds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found.",
            )

        # Update tags if specified
        if payload.tags is not None:

            for tag_str in payload.tags:
                clean_tag = tag_str.strip().lower()
                if clean_tag:
                    db.add(DatasetTag(dataset_id=dataset_id, tag=clean_tag))
            await db.commit()

        await db.refresh(updated_ds)
        logger.info(f"Dataset ID {dataset_id} metadata updated.")
        return updated_ds

    @staticmethod
    async def soft_delete_dataset(
        dataset_id: uuid.UUID, workspace: Workspace, db: AsyncSession
    ) -> bool:
        """
        Soft deletes a dataset and updates workspace counters.
        """
        ds_repo = DatasetRepository(db)
        ws_repo = WorkspaceRepository(db)

        success = await ds_repo.delete(dataset_id, soft=True)

        dataset_count = await ds_repo.count_workspace_datasets(workspace.id)
        storage_bytes = await ds_repo.sum_workspace_dataset_storage(workspace.id)
        storage_mb = int(storage_bytes / (1024 * 1024))

        await ws_repo.update(
            workspace.id,
            dataset_count=dataset_count,
            storage_used=storage_mb,
            last_activity=datetime.now(timezone.utc),
        )
        logger.info(f"Dataset ID {dataset_id} soft deleted.")
        return success

    @staticmethod
    async def restore_dataset(
        dataset_id: uuid.UUID, workspace: Workspace, db: AsyncSession
    ) -> Dataset:
        """
        Restores a soft deleted dataset.
        """
        ds_repo = DatasetRepository(db)
        ws_repo = WorkspaceRepository(db)

        ds = await ds_repo.get_by_id(dataset_id)
        if not ds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found.",
            )

        ds.is_deleted = False
        ds.deleted_at = None
        db.add(ds)

        dataset_count = await ds_repo.count_workspace_datasets(workspace.id)
        await ws_repo.update(
            workspace.id,
            dataset_count=dataset_count,
            last_activity=datetime.now(timezone.utc),
        )
        await db.commit()
        await db.refresh(ds)

        logger.info(f"Dataset ID {dataset_id} restored.")
        return ds

    @staticmethod
    async def toggle_favorite(dataset_id: uuid.UUID, db: AsyncSession) -> Dataset:
        """
        Toggles dataset is_favorite flag.
        """
        ds_repo = DatasetRepository(db)
        ds = await ds_repo.get_by_id(dataset_id)
        if not ds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found.",
            )

        ds.is_favorite = not ds.is_favorite
        db.add(ds)
        await db.commit()
        await db.refresh(ds)

        logger.info(f"Dataset ID {dataset_id} is_favorite toggled to {ds.is_favorite}.")
        return ds

    @staticmethod
    async def get_workspace_datasets(
        workspace_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        dataset_type: Optional[str] = None,
        status_filter: Optional[str] = None,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace datasets.
        """
        ds_repo = DatasetRepository(db)
        return await ds_repo.get_workspace_datasets(
            workspace_id=workspace_id,
            page=page,
            page_size=page_size,
            search=search,
            dataset_type=dataset_type,
            status_filter=status_filter,
        )

    @staticmethod
    async def get_dataset_versions(
        dataset_id: uuid.UUID, db: AsyncSession
    ) -> List[DatasetVersion]:
        """
        Fetch version history for a dataset.
        """
        ds_repo = DatasetRepository(db)
        return await ds_repo.get_dataset_versions(dataset_id)
