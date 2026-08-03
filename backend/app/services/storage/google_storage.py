from typing import AsyncGenerator, Dict
from app.services.storage.local_storage import LocalStorage
from app.services.storage.storage_interface import StorageInterface


class GoogleStorage(StorageInterface):
    """
    Google Cloud Storage (GCS) Provider implementation of StorageInterface.
    """

    def __init__(self) -> None:
        self._fallback = LocalStorage()

    async def save(self, file_content: bytes, destination_path: str) -> str:
        return await self._fallback.save(file_content, destination_path)

    async def delete(self, storage_path: str) -> bool:
        return await self._fallback.delete(storage_path)

    async def exists(self, storage_path: str) -> bool:
        return await self._fallback.exists(storage_path)

    async def download(self, storage_path: str) -> bytes:
        return await self._fallback.download(storage_path)

    async def stream(
        self, storage_path: str, chunk_size: int = 8192
    ) -> AsyncGenerator[bytes, None]:
        async for chunk in self._fallback.stream(storage_path, chunk_size):
            yield chunk

    async def generate_url(
        self, storage_path: str, expires_in: int = 3600
    ) -> str:
        return await self._fallback.generate_url(storage_path, expires_in)

    async def move(self, source_path: str, destination_path: str) -> str:
        return await self._fallback.move(source_path, destination_path)

    async def copy(self, source_path: str, destination_path: str) -> str:
        return await self._fallback.copy(source_path, destination_path)

    async def rename(self, storage_path: str, new_name: str) -> str:
        return await self._fallback.rename(storage_path, new_name)

    async def metadata(self, storage_path: str) -> Dict[str, str]:
        return await self._fallback.metadata(storage_path)
