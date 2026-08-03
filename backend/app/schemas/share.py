import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateShareRequest(BaseModel):
    """
    Pydantic schema for creating a public file share link.
    """

    expires_in_days: Optional[int] = Field(None, ge=1, le=365, description="Optional link validity in days")


class FileShareResponse(BaseModel):
    """
    Pydantic response schema for FileShare details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_id: uuid.UUID
    token: str
    expires_at: Optional[datetime] = None
    is_active: bool
    share_url: Optional[str] = None
    created_at: datetime
