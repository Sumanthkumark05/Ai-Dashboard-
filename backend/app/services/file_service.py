import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, UploadFile, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import FileTypeCategory
from app.models.stored_file import StoredFile
from app.models.user import User
from app.repositories.stored_file_repository import StoredFileRepository
from app.services.activity_service import ActivityService
from app.services.storage.checksum import calculate_sha256
from app.services.storage.storage_factory import StorageFactory
from app.services.storage.thumbnail_service import ThumbnailService
from app.utils.filename import generate_unique_filename, is_executable_extension, sanitize_filename
from app.utils.mime import get_mime_type



class FileService:
    """
    Business Logic Service managing file upload, metadata categorization, duplicate checking, retrieval, and deletion.
    """

    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB limit

    IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "svg"}
    DOCUMENT_EXTENSIONS = {"pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "md"}
    DATASET_EXTENSIONS = {"csv", "json", "xlsx", "parquet"}
    AUDIO_EXTENSIONS = {"mp3", "wav", "aac", "ogg"}
    VIDEO_EXTENSIONS = {"mp4", "mov", "avi", "mkv", "webm"}
    ARCHIVE_EXTENSIONS = {"zip", "rar", "7z"}

    @classmethod
    def categorize_file(cls, extension: str) -> FileTypeCategory:
        """
        Categorizes file extension into FileTypeCategory.
        """
        ext = extension.lower().lstrip(".")
        if ext in cls.IMAGE_EXTENSIONS:
            return FileTypeCategory.IMAGE
        elif ext in cls.DOCUMENT_EXTENSIONS:
            return FileTypeCategory.DOCUMENT
        elif ext in cls.DATASET_EXTENSIONS:
            return FileTypeCategory.DATASET
        elif ext in cls.AUDIO_EXTENSIONS:
            return FileTypeCategory.AUDIO
        elif ext in cls.VIDEO_EXTENSIONS:
            return FileTypeCategory.VIDEO
        elif ext in cls.ARCHIVE_EXTENSIONS:
            return FileTypeCategory.ARCHIVE
        return FileTypeCategory.OTHER

    @classmethod
    async def upload_file(
        cls,
        workspace_id: uuid.UUID,
        uploader: User,
        file_obj: UploadFile,
        folder_id: Optional[uuid.UUID] = None,
        db: AsyncSession = None,
    ) -> StoredFile:
        """
        Uploads a single file, calculates checksum, saves to storage provider, and records metadata in database.
        """
        original_name = sanitize_filename(file_obj.filename or "file.bin")
        if not original_name or "." not in original_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file name or missing extension.",
            )

        extension = original_name.rsplit(".", 1)[-1].lower()

        # 1. Security Check: Executable Blocking
        if is_executable_extension(extension):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security alert: Executable extension '.{extension}' is forbidden.",
            )

        # 2. Read Content & Size Validation
        content = await file_obj.read()
        file_size = len(content)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty 0-byte file uploads are rejected.",
            )

        if file_size > cls.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed limit of {cls.MAX_FILE_SIZE // (1024 * 1024)} MB.",
            )

        # 3. Categorization & Checksum
        checksum = calculate_sha256(content)
        file_repo = StoredFileRepository(db)

        # Duplicate Check
        existing = await file_repo.get_by_checksum(workspace_id, checksum)
        if existing:
            logger.info(f"Duplicate file detected via checksum '{checksum}'. Returning existing file ID {existing.id}")
            return existing

        file_category = cls.categorize_file(extension)
        mime_type = get_mime_type(extension)
        stored_filename = generate_unique_filename(original_name)

        category_subfolder = file_category.value
        storage_path = f"uploads/{category_subfolder}/ws_{workspace_id}/{stored_filename}"

        # 4. Save via Storage Interface
        storage = StorageFactory.get_storage_provider()
        saved_path = await storage.save(content, storage_path)

        # 5. Thumbnail Generation for Images
        thumbnail_url = None
        if file_category == FileTypeCategory.IMAGE:
            thumb_path = f"uploads/thumbnails/ws_{workspace_id}/thumb_{stored_filename}"
            thumb_bytes = await ThumbnailService.generate_image_thumbnail(content, extension)
            if thumb_bytes:
                await storage.save(thumb_bytes, thumb_path)
                thumbnail_url = f"/api/v1/uploads/{thumb_path}"

        public_url = f"/api/v1/uploads/{saved_path}"

        # 6. Save StoredFile ORM
        stored_file = await file_repo.create(
            workspace_id=workspace_id,
            owner_id=uploader.id,
            folder_id=folder_id,
            original_name=original_name,
            stored_name=stored_filename,
            file_type=file_category,
            mime_type=mime_type,
            extension=extension,
            size=file_size,
            storage_provider=getattr(settings, "STORAGE_PROVIDER", "local"),
            storage_path=saved_path,
            public_url=public_url,
            thumbnail_url=thumbnail_url,
            checksum=checksum,
            version=1,
            is_public=False,
        )

        try:
            from app.models.file_version import FileVersion
            file_version = FileVersion(
                id=uuid.uuid4(),
                file_id=stored_file.id,
                version=1,
                storage_path=saved_path,
                size=file_size,
                uploaded_by=uploader.id,
            )
            db.add(file_version)
        except Exception as exc:
            logger.warning(f"Could not create initial FileVersion record for file {stored_file.id}: {exc}")

        await db.commit()
        await db.refresh(stored_file)

        await ActivityService.log_activity(
            user_id=uploader.id,
            action="UPLOAD_FILE",
            details={"file_id": str(stored_file.id), "filename": original_name, "size": file_size},
        )

        logger.info(f"File '{original_name}' uploaded successfully to Workspace ID {workspace_id}")
        return stored_file

    @classmethod
    async def upload_multiple_files(
        cls,
        workspace_id: uuid.UUID,
        uploader: User,
        files: List[UploadFile],
        folder_id: Optional[uuid.UUID] = None,
        db: AsyncSession = None,
    ) -> List[StoredFile]:
        """
        Uploads multiple files sequentially.
        """
        uploaded_records: List[StoredFile] = []
        for file_obj in files:
            rec = await cls.upload_file(
                workspace_id=workspace_id,
                uploader=uploader,
                file_obj=file_obj,
                folder_id=folder_id,
                db=db,
            )
            uploaded_records.append(rec)
        return uploaded_records

    @staticmethod
    async def update_file(
        file_id: uuid.UUID, payload: Any, db: AsyncSession
    ) -> StoredFile:
        """
        Updates file metadata (original name, folder location, public visibility).
        """
        file_repo = StoredFileRepository(db)
        file = await file_repo.get_by_id(file_id)
        if not file or file.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found.",
            )

        update_data = payload.model_dump(exclude_unset=True)
        updated = await file_repo.update(file_id, **update_data)
        await db.refresh(updated)
        return updated

    @staticmethod
    async def soft_delete_file(file_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Soft deletes a file.
        """
        file_repo = StoredFileRepository(db)
        file = await file_repo.get_by_id(file_id)
        if not file or file.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found.",
            )

        file.is_deleted = True
        db.add(file)
        await db.commit()
        logger.info(f"File ID {file_id} soft deleted.")
        return True

    @staticmethod
    async def permanent_delete_file(file_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Permanently deletes file metadata and storage payload.
        """
        file_repo = StoredFileRepository(db)
        file = await file_repo.get_by_id(file_id)
        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found.",
            )

        storage = StorageFactory.get_storage_provider()
        await storage.delete(file.storage_path)

        if file.thumbnail_url:
            thumb_storage_path = file.thumbnail_url.replace("/api/v1/uploads/", "")
            await storage.delete(thumb_storage_path)

        await file_repo.delete(file_id, soft=False)
        logger.info(f"File ID {file_id} permanently deleted.")
        return True

    @staticmethod
    async def get_workspace_files(
        workspace_id: uuid.UUID,
        folder_id: Optional[uuid.UUID] = None,
        file_type: Optional[FileTypeCategory] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace files.
        """
        file_repo = StoredFileRepository(db)
        return await file_repo.get_workspace_files(
            workspace_id=workspace_id,
            folder_id=folder_id,
            file_type=file_type,
            search=search,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    async def get_storage_analytics(
        workspace_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Retrieves storage usage metrics for a workspace.
        """
        file_repo = StoredFileRepository(db)
        return await file_repo.get_storage_analytics(workspace_id)
