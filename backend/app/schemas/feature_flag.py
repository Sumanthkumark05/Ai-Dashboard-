import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateFeatureFlagRequest(BaseModel):
    """
    Pydantic schema to create a feature flag.
    """

    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    enabled: bool = Field(default=False)
    rollout_percentage: int = Field(default=100, ge=0, le=100)


class UpdateFeatureFlagRequest(BaseModel):
    """
    Pydantic schema to update a feature flag.
    """

    description: Optional[str] = Field(default=None, max_length=500)
    enabled: Optional[bool] = None
    rollout_percentage: Optional[int] = Field(default=None, ge=0, le=100)


class FeatureFlagResponse(BaseModel):
    """
    Pydantic schema for FeatureFlag output.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    enabled: bool
    rollout_percentage: int
    created_at: datetime
    updated_at: datetime
