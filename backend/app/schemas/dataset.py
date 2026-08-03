import uuid
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.core.constants import (
    DatasetProcessingStatus,
    DatasetStatus,
    DatasetType,
    DatasetVisibility,
)


class CreateDatasetRequest(BaseModel):
    """
    Pydantic schema for creating a new Dataset metadata entry inside a Workspace.
    """

    name: str = Field(..., min_length=2, max_length=200, description="Dataset Name")
    file_name: str = Field(..., max_length=255, description="Filename with extension")
    dataset_type: DatasetType = Field(default=DatasetType.CSV, description="Dataset format")
    mime_type: str = Field(..., max_length=100, description="File MIME Type")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    checksum: str = Field(..., max_length=128, description="File SHA-256 checksum")
    description: Optional[str] = Field(None, max_length=1000)
    source: str = Field(default="upload", max_length=100)
    language: str = Field(default="en", max_length=20)
    encoding: str = Field(default="utf-8", max_length=30)
    record_count: int = Field(default=0, ge=0)
    column_count: int = Field(default=0, ge=0)
    visibility: DatasetVisibility = Field(default=DatasetVisibility.WORKSPACE)
    tags: List[str] = Field(default=[], description="Dataset tags")


class UpdateDatasetRequest(BaseModel):
    """
    Pydantic schema for updating dataset metadata.
    """

    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    dataset_type: Optional[DatasetType] = None
    visibility: Optional[DatasetVisibility] = None
    tags: Optional[List[str]] = None


class DatasetResponse(BaseModel):
    """
    Pydantic response schema for Dataset details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    workspace_id: uuid.UUID
    uploaded_by: uuid.UUID
    name: str
    description: Optional[str] = None
    dataset_type: DatasetType = DatasetType.CSV
    source: str = "upload"
    file_name: str
    original_file_name: str
    storage_path: str
    mime_type: str
    extension: str
    checksum: str
    language: str = "en"
    encoding: str = "utf-8"
    file_size: int
    record_count: int = 0
    column_count: int = 0
    schema_version: int = 1
    visibility: DatasetVisibility = DatasetVisibility.WORKSPACE
    status: DatasetStatus = DatasetStatus.READY
    processing_status: DatasetProcessingStatus = DatasetProcessingStatus.COMPLETED
    is_favorite: bool = False
    version: int = 1
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime


class DatasetUploadResponse(BaseModel):
    """
    Response schema for dataset file upload.
    """

    success: bool = True
    message: str = "Dataset uploaded successfully."
    dataset: DatasetResponse


class DatasetListResponse(BaseModel):
    """
    Pydantic schema for paginated dataset list.
    """

    items: List[DatasetResponse]
    total_items: int
    page: int
    page_size: int


class DatasetStatisticsResponse(BaseModel):
    """
    Pydantic response schema for workspace dataset analytics.
    """

    total_datasets: int
    total_records: int
    total_storage_bytes: int
    total_storage_mb: float
    dataset_type_breakdown: Dict[str, int]


class DatasetVersionResponse(BaseModel):
    """
    Pydantic response schema for Dataset Version records.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dataset_id: uuid.UUID
    version_number: int
    file_name: str
    storage_path: str
    checksum: str
    file_size: int
    record_count: int = 0
    column_count: int = 0
    created_by: uuid.UUID
    created_at: datetime
