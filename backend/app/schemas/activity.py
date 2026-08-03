import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ActivityResponse(BaseModel):
    """
    Pydantic schema for Activity item.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    activity_type: str
    title: str
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime


class ActivityListResponse(BaseModel):
    """
    Pydantic schema for paginated list of activities.
    """

    items: List[ActivityResponse]
    total_items: int
    page: int
    page_size: int
