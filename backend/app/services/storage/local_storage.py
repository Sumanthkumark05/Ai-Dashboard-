import os
from pathlib import Path
from typing import AsyncGenerator, Dict, List
from fastapi import HTTPException, status
from loguru import logger

from app.core.config import settings
from app.services.storage.storage_interface import StorageInterface


class LocalStorage(StorageInterface):
    """
    Local Filesystem implementation of StorageInterface.
    Stores files securely under the configured base storage directory with path traversal protection.
    """

    SUBFOLDERS: List[str] = [
        "documents",
        "datasets",
        "avatars",
        "workspaces",
        "organizations",
        "temp",
        "reports",
        "uploads",
        "thumbnails",
        "audio",
        "video",
        "images",
        "ai",
    ]

    def __init__(self, base_path: str = None) -> None:
        storage_dir = base_path or getattr(settings, "STORAGE_LOCAL_PATH", "storage")
        self.base_path = Path(storage_dir).resolve()
        self._ensure_directories()

    def _ensure_directories(self) -> None:
        """
        Creates root storage directory and subfolder structure if missing.
        """
        self.base_path.mkdir(parents=True, exist_ok=True)
        for folder in self.SUBFOLDERS:
            (self.base_path / folder).mkdir(parents=True, exist_ok=True)

    def _get_absolute_path(self, storage_path: str) -> Path:
        """
        Resolves storage path and enforces strict path traversal protection.
        """
        clean_path = storage_path.lstrip("/\\")
        full_path = (self.base_path / clean_path).resolve()

        # Path traversal security check
        if not str(full_path).startswith(str(self.base_path)):
            logger.error(f"Path traversal attempt blocked: {storage_path}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid storage path. Path traversal detected.",
            )
        return full_path

    async def save(
        self, file_bytes: bytes, destination_path: str, subfolder: str = "documents"
    ) -> str:
        """
        Saves raw bytes payload to destination path.
        """
        if "/" in destination_path or "\\" in destination_path:
            clean_path = destination_path.lstrip("/\\")
            target_file = (self.base_path / clean_path).resolve()
            target_file.parent.mkdir(parents=True, exist_ok=True)
            with open(target_file, "wb") as f:
                f.write(file_bytes)
            logger.info(f"File saved locally at '{clean_path}' ({len(file_bytes)} bytes)")
            return clean_path

        if subfolder not in self.SUBFOLDERS:
            subfolder = "documents"

        folder_path = self.base_path / subfolder
        folder_path.mkdir(parents=True, exist_ok=True)

        target_file = folder_path / destination_path
        target_file.parent.mkdir(parents=True, exist_ok=True)
        rel_storage_path = f"{subfolder}/{destination_path}"

        with open(target_file, "wb") as f:
            f.write(file_bytes)

        logger.info(f"File saved locally at '{rel_storage_path}' ({len(file_bytes)} bytes)")
        return rel_storage_path

    async def delete(self, storage_path: str) -> bool:
        """
        Deletes local file.
        """
        abs_path = self._get_absolute_path(storage_path)
        if abs_path.exists() and abs_path.is_file():
            abs_path.unlink()
            logger.info(f"File deleted locally at '{storage_path}'")
            return True
        return False

    async def exists(self, storage_path: str) -> bool:
        """
        Checks if local file exists.
        """
        abs_path = self._get_absolute_path(storage_path)
        return abs_path.exists() and abs_path.is_file()

    async def download(self, storage_path: str) -> bytes:
        """
        Reads complete file payload.
        """
        abs_path = self._get_absolute_path(storage_path)
        if not abs_path.exists() or not abs_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requested file payload not found in storage.",
            )

        with open(abs_path, "rb") as f:
            return f.read()

    async def stream(
        self, storage_path: str, chunk_size: int = 8192
    ) -> AsyncGenerator[bytes, None]:
        """
        Yields file content in chunks.
        """
        abs_path = self._get_absolute_path(storage_path)
        if not abs_path.exists() or not abs_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requested file payload not found in storage.",
            )

        with open(abs_path, "rb") as f:
            while chunk := f.read(chunk_size):
                yield chunk

    async def generate_url(
        self, storage_path: str, expires_in: int = 3600
    ) -> str:
        """
        Generates relative URL route for serving local file.
        """
        clean_path = storage_path.lstrip("/\\")
        return f"/api/v1/uploads/{clean_path}"

    async def move(self, source_path: str, destination_path: str) -> str:
        """
        Moves local file from source to destination.
        """
        src = self._get_absolute_path(source_path)
        dest = self._get_absolute_path(destination_path)
        dest.parent.mkdir(parents=True, exist_ok=True)

        os.rename(src, dest)
        return destination_path.lstrip("/\\")

    async def copy(self, source_path: str, destination_path: str) -> str:
        """
        Copies local file to destination.
        """
        payload = await self.download(source_path)
        return await self.save(payload, destination_path)

    async def rename(self, storage_path: str, new_name: str) -> str:
        """
        Renames local file inside same folder.
        """
        src = self._get_absolute_path(storage_path)
        dest = src.parent / new_name
        os.rename(src, dest)

        rel_dir = os.path.dirname(storage_path)
        return f"{rel_dir}/{new_name}" if rel_dir else new_name

    async def metadata(self, storage_path: str) -> Dict[str, str]:
        """
        Returns stat metadata (size, mime, timestamps) for local file.
        """
        abs_path = self._get_absolute_path(storage_path)
        if not abs_path.exists() or not abs_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requested file not found in storage.",
            )

        stat = abs_path.stat()
        return {
            "size": str(stat.st_size),
            "created_at": str(stat.st_ctime),
            "updated_at": str(stat.st_mtime),
            "storage_path": storage_path,
        }
