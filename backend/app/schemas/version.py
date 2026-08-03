import uuid
from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict


class FileVersionResponse(BaseModel):
    """
    Pydantic response schema for FileVersion details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_id: uuid.UUID
    version: int
    storage_path: str
    size: int
    uploaded_by: uuid.UUID
    created_at: datetime


class FileVersionListResponse(BaseModel):
    """
    Pydantic schema for listing version history of a file.
    """

    items: List[FileVersionResponse]
