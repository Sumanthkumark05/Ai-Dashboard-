import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class SystemSettingRequest(BaseModel):
    """
    Pydantic schema to create/update a system setting.
    """

    key: str = Field(..., max_length=100)
    value: Any = Field(...)
    description: Optional[str] = Field(default=None, max_length=500)


class SystemSettingResponse(BaseModel):
    """
    Pydantic schema for SystemSetting output.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    value: Any
    description: Optional[str] = None
    updated_by: Optional[uuid.UUID] = None
    updated_at: datetime
