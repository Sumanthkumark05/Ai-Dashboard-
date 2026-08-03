import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class LoginHistoryResponse(BaseModel):
    """
    Pydantic schema for LoginHistory record.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    ip_address: Optional[str] = None
    device: Optional[str] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    status: str
    created_at: datetime


class LoginHistoryListResponse(BaseModel):
    """
    Pydantic schema for paginated list of login history records.
    """

    items: List[LoginHistoryResponse]
    total_items: int
    page: int
    page_size: int
