import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, Any
from loguru import logger

from app.schemas.upload import FileUploadResponse
from app.services.storage.checksum import calculate_sha256
from app.services.storage.file_validator import validate_file_upload
from app.services.storage.storage_factory import StorageFactory
from app.utils.filename import generate_unique_filename
from app.utils.mime import get_mime_type


class StorageService:
    """
    Centralized high-level storage service managing file uploads, downloads, streaming, and metadata.
    """

    def __init__(self) -> None:
        self.provider = StorageFactory.get_storage_provider()

    async def upload_file(
        self,
        file_bytes: bytes,
        original_filename: str,
        subfolder: str = "documents",
        max_size_mb: int = 50,
    ) -> FileUploadResponse:
        """
        Validates upload, generates unique filename, calculates checksum, saves to storage provider.
        """
        # 1. Validation
        clean_filename = validate_file_upload(file_bytes, original_filename, max_size_mb)

        # 2. Generate unique filename & checksum
        unique_name = generate_unique_filename(clean_filename)
        checksum_val = calculate_sha256(file_bytes)
        mime_type = get_mime_type(clean_filename)

        # 3. Save via storage provider
        storage_path = await self.provider.save(file_bytes, unique_name, subfolder=subfolder)
        url = self.provider.generate_url(storage_path)

        file_id = uuid.uuid4()
        now = datetime.now(timezone.utc)

        logger.info(
            f"File '{original_filename}' uploaded successfully to '{storage_path}' (Checksum: {checksum_val})"
        )

        return FileUploadResponse(
            id=file_id,
            filename=unique_name,
            original_filename=clean_filename,
            mime_type=mime_type,
            size=len(file_bytes),
            checksum=checksum_val,
            storage_path=storage_path,
            url=url,
            subfolder=subfolder,
            uploaded_at=now,
        )

    async def get_file_metadata(self, storage_path: str) -> Dict[str, Any]:
        """
        Retrieves file metadata from storage provider.
        """
        return await self.provider.metadata(storage_path)

    async def download_file(self, storage_path: str) -> bytes:
        """
        Downloads complete file as bytes.
        """
        return await self.provider.download(storage_path)

    async def stream_file(
        self, storage_path: str, chunk_size: int = 65536
    ) -> AsyncGenerator[bytes, None]:
        """
        Streams file content in chunks.
        """
        async for chunk in self.provider.stream(storage_path, chunk_size=chunk_size):
            yield chunk

    async def delete_file(self, storage_path: str) -> bool:
        """
        Deletes file from storage provider.
        """
        return await self.provider.delete(storage_path)
