import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class FileUploadResponse(BaseModel):
    """
    Pydantic response schema for file upload metadata.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str = Field(..., description="Unique UUID-based storage filename")
    original_filename: str = Field(..., description="Original user filename")
    mime_type: str = Field(..., description="MIME content type")
    size: int = Field(..., description="File size in bytes")
    checksum: str = Field(..., description="SHA-256 hex checksum")
    storage_path: str = Field(..., description="Canonical storage path")
    url: str = Field(..., description="Public or API access URL")
    subfolder: str = Field(default="documents", description="Subfolder category")
    uploaded_at: datetime = Field(..., description="Upload timestamp")
