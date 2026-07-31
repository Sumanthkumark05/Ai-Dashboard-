import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.core.constants import (
    DocumentProcessingStatus,
    DocumentStatus,
    DocumentVisibility,
)


class UploadDocumentRequest(BaseModel):
    """
    Pydantic schema for uploading document metadata into a Workspace.
    """

    title: str = Field(..., min_length=2, max_length=200, description="Document Title")
    file_name: str = Field(..., max_length=255, description="Filename with extension")
    mime_type: str = Field(..., max_length=100, description="File MIME Type")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    checksum: str = Field(..., max_length=128, description="File SHA-256 checksum")
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(default="uncategorized", max_length=100)
    visibility: DocumentVisibility = Field(default=DocumentVisibility.WORKSPACE)
    language: str = Field(default="en", max_length=20)


class UpdateDocumentRequest(BaseModel):
    """
    Pydantic schema for updating document metadata.
    """

    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    visibility: Optional[DocumentVisibility] = None


class DocumentResponse(BaseModel):
    """
    Pydantic response schema for Document details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    organization_id: uuid.UUID
    uploaded_by: uuid.UUID
    title: str
    description: Optional[str] = None
    file_name: str
    original_file_name: str
    file_extension: str
    mime_type: str
    file_size: int
    storage_path: str
    checksum: str
    language: str = "en"
    category: str = "uncategorized"
    status: DocumentStatus = DocumentStatus.READY
    visibility: DocumentVisibility = DocumentVisibility.WORKSPACE
    processing_status: DocumentProcessingStatus = DocumentProcessingStatus.COMPLETED
    version: int = 1
    is_favorite: bool = False
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    """
    Pydantic schema for paginated document list.
    """

    items: List[DocumentResponse]
    total_items: int
    page: int
    page_size: int


class VersionResponse(BaseModel):
    """
    Pydantic response schema for Document Version records.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    version_number: int
    file_name: str
    storage_path: str
    checksum: str
    file_size: int
    created_by: uuid.UUID
    created_at: datetime
