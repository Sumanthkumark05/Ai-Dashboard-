import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateApiKeyRequest(BaseModel):
    """
    Pydantic schema for creating a new workspace API key.
    """

    name: str = Field(..., max_length=100, description="Descriptive label for the API Key")
    permissions: Optional[List[str]] = Field(
        default_factory=lambda: ["read", "write"],
        description="Assigned permissions (e.g. ['read', 'write', 'admin'])",
    )


class UpdateApiKeyRequest(BaseModel):
    """
    Pydantic schema for updating API key status or name.
    """

    name: Optional[str] = Field(default=None, max_length=100)
    status: Optional[str] = Field(default=None, description="ACTIVE or REVOKED")


class ApiKeyResponse(BaseModel):
    """
    Pydantic response schema for ApiKey metadata.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    prefix: str
    status: str
    permissions: Optional[List[str]] = None
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CreateApiKeyResponse(BaseModel):
    """
    Pydantic response schema returned upon creation. Contains unhashed raw API key (shown only once).
    """

    api_key: ApiKeyResponse
    raw_key: str = Field(..., description="Unhashed API key secret. Save securely; it cannot be recovered.")
