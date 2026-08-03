import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class EnableMaintenanceRequest(BaseModel):
    """
    Pydantic schema to enable maintenance mode.
    """

    message: str = Field(
        default="System is currently undergoing scheduled maintenance. Please check back shortly.",
        max_length=500,
    )
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class MaintenanceModeResponse(BaseModel):
    """
    Pydantic schema for MaintenanceMode response.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    enabled: bool
    message: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    enabled_by: Optional[uuid.UUID] = None
    updated_at: datetime
