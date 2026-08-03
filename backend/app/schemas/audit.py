import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    """
    Pydantic schema for an AuditLog record.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    status: str
    description: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    """
    Pydantic schema for paginated list of audit logs.
    """

    items: List[AuditLogResponse]
    total_items: int
    page: int
    page_size: int


class AuditLogExportRequest(BaseModel):
    """
    Pydantic schema for requesting an audit log export file.
    """

    format: str = Field(default="csv", description="csv or json")
    workspace_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    action: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
