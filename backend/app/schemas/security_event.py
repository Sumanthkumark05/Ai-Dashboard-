import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SecurityEventResponse(BaseModel):
    """
    Pydantic schema for SecurityEvent.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    workspace_id: Optional[uuid.UUID] = None
    event_type: str
    severity: str
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime


class SecurityEventListResponse(BaseModel):
    """
    Pydantic schema for paginated list of security events.
    """

    items: List[SecurityEventResponse]
    total_items: int
    page: int
    page_size: int
