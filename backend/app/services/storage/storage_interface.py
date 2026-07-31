from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any


class StorageInterface(ABC):
    """
    Abstract Storage Provider Interface.
    Implemented by LocalStorage, S3Adapter, SupabaseStorage, etc.
    """

    @abstractmethod
    async def save(
        self, file_bytes: bytes, filename: str, subfolder: str = "documents"
    ) -> str:
        """
        Saves file content and returns canonical storage path.
        """
        pass

    @abstractmethod
    async def delete(self, storage_path: str) -> bool:
        """
        Deletes file from storage.
        """
        pass

    @abstractmethod
    async def exists(self, storage_path: str) -> bool:
        """
        Checks if file exists in storage.
        """
        pass

    @abstractmethod
    async def download(self, storage_path: str) -> bytes:
        """
        Reads complete file content as bytes.
        """
        pass

    @abstractmethod
    async def stream(
        self, storage_path: str, chunk_size: int = 65536
    ) -> AsyncGenerator[bytes, None]:
        """
        Streams file content in chunks.
        """
        pass

    @abstractmethod
    def generate_url(self, storage_path: str) -> str:
        """
        Generates public or presigned download URL for file.
        """
        pass

    @abstractmethod
    async def move(self, src_path: str, dest_path: str) -> str:
        """
        Moves file from src_path to dest_path.
        """
        pass

    @abstractmethod
    async def copy(self, src_path: str, dest_path: str) -> str:
        """
        Copies file from src_path to dest_path.
        """
        pass

    @abstractmethod
    async def rename(self, src_path: str, new_filename: str) -> str:
        """
        Renames file at src_path to new_filename.
        """
        pass

    @abstractmethod
    async def metadata(self, storage_path: str) -> Dict[str, Any]:
        """
        Retrieves file metadata (size, created_at, mime_type, etc.).
        """
        pass
