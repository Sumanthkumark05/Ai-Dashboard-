import uuid
from typing import List
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file_version import FileVersion
from app.models.stored_file import StoredFile
from app.models.user import User
from app.repositories.file_version_repository import FileVersionRepository
from app.repositories.stored_file_repository import StoredFileRepository
from app.services.storage.checksum import calculate_sha256
from app.services.storage.storage_factory import StorageFactory


class VersionService:
    """
    Business Logic Service managing file versioning and restoration.
    """

    @staticmethod
    async def create_new_version(
        file: StoredFile,
        file_content: bytes,
        uploader: User,
        db: AsyncSession,
    ) -> StoredFile:
        """
        Creates a new version of an existing file. Saves previous version to FileVersion history.
        """
        file_repo = StoredFileRepository(db)
        version_repo = FileVersionRepository(db)
        storage = StorageFactory.get_storage_provider()

        # 1. Record current file state as a FileVersion history entry
        history_version = FileVersion(
            file_id=file.id,
            version=file.version,
            storage_path=file.storage_path,
            size=file.size,
            uploaded_by=file.owner_id,
        )
        db.add(history_version)

        # 2. Save new version payload to storage
        new_version_number = file.version + 1
        extension = file.extension
        category_dir = file.file_type.value if hasattr(file.file_type, "value") else str(file.file_type)
        new_storage_path = f"uploads/{category_dir}/v{new_version_number}_{file.stored_name}"

        await storage.save(file_content, new_storage_path)

        # 3. Update StoredFile ORM
        file.version = new_version_number
        file.storage_path = new_storage_path
        file.size = len(file_content)
        file.checksum = calculate_sha256(file_content)

        db.add(file)
        await db.commit()
        await db.refresh(file)

        logger.info(f"New version v{new_version_number} created for File ID {file.id}")
        return file

    @staticmethod
    async def get_file_versions(
        file_id: uuid.UUID, db: AsyncSession
    ) -> List[FileVersion]:
        """
        Returns version history list for a file.
        """
        version_repo = FileVersionRepository(db)
        return await version_repo.get_file_versions(file_id)

    @staticmethod
    async def restore_version(
        file: StoredFile,
        target_version_id: uuid.UUID,
        user: User,
        db: AsyncSession,
    ) -> StoredFile:
        """
        Restores a previous version of a file.
        """
        version_repo = FileVersionRepository(db)
        target_version = await version_repo.get_by_id(target_version_id)

        if not target_version or target_version.file_id != file.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Version record not found for this file.",
            )

        storage = StorageFactory.get_storage_provider()
        payload = await storage.download(target_version.storage_path)

        return await VersionService.create_new_version(
            file=file,
            file_content=payload,
            uploader=user,
            db=db,
        )
