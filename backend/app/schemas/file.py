import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.core.constants import FileTypeCategory


class UpdateFileRequest(BaseModel):
    """
    Pydantic schema for updating file metadata or location.
    """

    original_name: Optional[str] = Field(None, min_length=1, max_length=255)
    folder_id: Optional[uuid.UUID] = Field(None)
    is_public: Optional[bool] = Field(None)


class FileResponse(BaseModel):
    """
    Pydantic response schema for StoredFile details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    owner_id: uuid.UUID
    folder_id: Optional[uuid.UUID] = None
    name: str = ""
    original_name: str
    stored_name: str
    file_type: FileTypeCategory
    mime_type: str
    extension: str
    size: int
    size_bytes: int = 0
    storage_provider: str
    storage_path: str
    public_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    checksum: str
    version: int
    is_public: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def populate_defaults(self) -> "FileResponse":
        if not self.name:
            self.name = self.original_name or self.stored_name or "Unnamed File"
        if not self.size_bytes:
            self.size_bytes = self.size
        return self


class FileListResponse(BaseModel):
    """
    Pydantic schema for paginated file search and listing.
    """

    items: List[FileResponse]
    total_items: int
    page: int
    page_size: int


class StorageAnalyticsResponse(BaseModel):
    """
    Pydantic schema for workspace storage usage metrics.
    """

    total_files: int
    total_storage_bytes: int
    average_size_bytes: float
    storage_by_type: Dict[str, int]
    largest_files: List[Dict[str, Any]]
    uploads_today: int
    uploads_this_month: int
