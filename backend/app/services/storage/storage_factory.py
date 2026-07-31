from app.core.config import settings
from app.services.storage.local_storage import LocalStorage
from app.services.storage.storage_interface import StorageInterface


class StorageFactory:
    """
    Factory creating storage provider instances based on application configuration.
    """

    _instance: StorageInterface = None

    @classmethod
    def get_storage_provider(cls) -> StorageInterface:
        """
        Returns singleton configured storage provider instance.
        """
        if cls._instance is None:
            provider = getattr(settings, "STORAGE_PROVIDER", "local").lower()
            if provider == "local":
                base_dir = getattr(settings, "STORAGE_LOCAL_DIR", "storage")
                cls._instance = LocalStorage(base_dir=base_dir)
            else:
                # Fallback to LocalStorage until S3/Supabase provider modules are attached
                cls._instance = LocalStorage(base_dir="storage")

        return cls._instance
