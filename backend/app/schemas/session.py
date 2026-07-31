import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SessionResponse(BaseModel):
    """
    Pydantic schema for UserSession active device information.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    device_name: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    ip_address: Optional[str] = None
    last_activity: datetime
    expires_at: datetime
    is_active: bool


class LoginHistoryResponse(BaseModel):
    """
    Pydantic schema for LoginHistory audit log entries.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    login_time: datetime
    logout_time: Optional[datetime] = None
    device: Optional[str] = None
    browser: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    ip: Optional[str] = None
    status: str
