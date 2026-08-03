import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateFolderRequest(BaseModel):
    """
    Pydantic schema for creating a new folder in a workspace.
    """

    name: str = Field(..., min_length=1, max_length=100, description="Folder Name")
    parent_folder_id: Optional[uuid.UUID] = Field(None, description="Optional Parent Folder ID")


class UpdateFolderRequest(BaseModel):
    """
    Pydantic schema for updating a folder name.
    """

    name: str = Field(..., min_length=1, max_length=100, description="New Folder Name")


class FolderResponse(BaseModel):
    """
    Pydantic response schema for Folder details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    parent_folder_id: Optional[uuid.UUID] = None
    name: str
    path: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime


class FolderListResponse(BaseModel):
    """
    Pydantic schema for list of folders.
    """

    items: List[FolderResponse]
    total_items: int
    page: int
    page_size: int
