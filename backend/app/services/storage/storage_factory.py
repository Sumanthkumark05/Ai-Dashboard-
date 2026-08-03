from typing import Dict, Type
from loguru import logger

from app.core.config import settings
from app.services.storage.azure_storage import AzureStorage
from app.services.storage.cloudinary_storage import CloudinaryStorage
from app.services.storage.google_storage import GoogleStorage
from app.services.storage.local_storage import LocalStorage
from app.services.storage.s3_storage import S3Storage
from app.services.storage.storage_interface import StorageInterface


class StorageFactory:
    """
    Factory creating instances of StorageInterface based on application configuration.
    """

    _providers: Dict[str, Type[StorageInterface]] = {
        "local": LocalStorage,
        "s3": S3Storage,
        "cloudinary": CloudinaryStorage,
        "google": GoogleStorage,
        "gcs": GoogleStorage,
        "azure": AzureStorage,
    }

    _instance: StorageInterface = None

    @classmethod
    def get_storage_provider(cls) -> StorageInterface:
        """
        Returns configured storage provider singleton instance.
        """
        if cls._instance is None:
            provider_name = getattr(settings, "STORAGE_PROVIDER", "local").lower().strip()
            provider_cls = cls._providers.get(provider_name, LocalStorage)

            logger.info(f"Initializing Storage Provider: '{provider_name}' ({provider_cls.__name__})")
            cls._instance = provider_cls()

        return cls._instance
