import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncGenerator, Dict, Any
from fastapi import HTTPException, status
from loguru import logger

from app.services.storage.storage_interface import StorageInterface
from app.utils.mime import get_mime_type


class LocalStorage(StorageInterface):
    """
    Local Filesystem Storage Provider.
    """

    SUBFOLDERS = {
        "documents",
        "datasets",
        "avatars",
        "workspaces",
        "organizations",
        "temp",
        "reports",
    }

    def __init__(self, base_dir: str = "storage") -> None:
        self.base_path = Path(base_dir).resolve()
        self._ensure_directories()

    def _ensure_directories(self) -> None:
        """
        Creates root storage directory and subfolders automatically.
        """
        self.base_path.mkdir(parents=True, exist_ok=True)
        for folder in self.SUBFOLDERS:
            (self.base_path / folder).mkdir(parents=True, exist_ok=True)

    def _get_absolute_path(self, storage_path: str) -> Path:
        """
        Resolves storage path and enforces path traversal security.
        """
        clean_path = storage_path.lstrip("/").strip()
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
        self, file_bytes: bytes, filename: str, subfolder: str = "documents"
    ) -> str:
        if subfolder not in self.SUBFOLDERS:
            subfolder = "documents"

        folder_path = self.base_path / subfolder
        folder_path.mkdir(parents=True, exist_ok=True)

        target_file = folder_path / filename
        rel_storage_path = f"{subfolder}/{filename}"

        with open(target_file, "wb") as f:
            f.write(file_bytes)

        logger.info(f"File saved locally at '{rel_storage_path}' ({len(file_bytes)} bytes)")
        return rel_storage_path

    async def delete(self, storage_path: str) -> bool:
        abs_path = self._get_absolute_path(storage_path)
        if abs_path.exists() and abs_path.is_file():
            abs_path.unlink()
            logger.info(f"File deleted locally at '{storage_path}'")
            return True
        return False

    async def exists(self, storage_path: str) -> bool:
        abs_path = self._get_absolute_path(storage_path)
        return abs_path.exists() and abs_path.is_file()

    async def download(self, storage_path: str) -> bytes:
        abs_path = self._get_absolute_path(storage_path)
        if not abs_path.exists() or not abs_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found at '{storage_path}'.",
            )
        with open(abs_path, "rb") as f:
            return f.read()

    async def stream(
        self, storage_path: str, chunk_size: int = 65536
    ) -> AsyncGenerator[bytes, None]:
        abs_path = self._get_absolute_path(storage_path)
        if not abs_path.exists() or not abs_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found at '{storage_path}'.",
            )
        with open(abs_path, "rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk

    def generate_url(self, storage_path: str) -> str:
        return f"/api/v1/uploads/{storage_path}"

    async def move(self, src_path: str, dest_path: str) -> str:
        abs_src = self._get_absolute_path(src_path)
        abs_dest = self._get_absolute_path(dest_path)
        abs_dest.parent.mkdir(parents=True, exist_ok=True)

        shutil.move(str(abs_src), str(abs_dest))
        logger.info(f"File moved from '{src_path}' to '{dest_path}'")
        return dest_path

    async def copy(self, src_path: str, dest_path: str) -> str:
        abs_src = self._get_absolute_path(src_path)
        abs_dest = self._get_absolute_path(dest_path)
        abs_dest.parent.mkdir(parents=True, exist_ok=True)

        shutil.copy2(str(abs_src), str(abs_dest))
        logger.info(f"File copied from '{src_path}' to '{dest_path}'")
        return dest_path

    async def rename(self, src_path: str, new_filename: str) -> str:
        abs_src = self._get_absolute_path(src_path)
        new_dest = abs_src.parent / new_filename
        abs_src.rename(new_dest)
        rel_dest = str(new_dest.relative_to(self.base_path))
        logger.info(f"File renamed from '{src_path}' to '{rel_dest}'")
        return rel_dest

    async def metadata(self, storage_path: str) -> Dict[str, Any]:
        abs_path = self._get_absolute_path(storage_path)
        if not abs_path.exists() or not abs_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found at '{storage_path}'.",
            )
        stat = abs_path.stat()
        return {
            "storage_path": storage_path,
            "filename": abs_path.name,
            "size": stat.st_size,
            "mime_type": get_mime_type(abs_path.name),
            "created_at": datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
            "updated_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        }
