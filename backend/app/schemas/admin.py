import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AdminDashboardMetrics(BaseModel):
    """
    Pydantic schema for global platform administration metrics dashboard.
    """

    total_users: int
    active_users: int
    suspended_users: int
    total_workspaces: int
    total_teams: int
    total_documents: int
    total_datasets: int
    total_files: int
    total_storage_bytes: int
    total_jobs: int
    failed_jobs: int
    connected_ws_clients: int
    security_events_count: int
    audit_logs_count: int


class AdminUserItem(BaseModel):
    """
    Pydantic schema for Admin User view item.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    username: str
    is_active: bool
    is_superuser: bool
    role_id: Optional[uuid.UUID] = None
    created_at: datetime


class AdminUserListResponse(BaseModel):
    """
    Paginated Admin User listing response.
    """

    items: List[AdminUserItem]
    total_items: int
    page: int
    page_size: int


class AdminWorkspaceItem(BaseModel):
    """
    Pydantic schema for Admin Workspace view item.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    organization_id: uuid.UUID
    is_archived: bool
    created_at: datetime


class AdminWorkspaceListResponse(BaseModel):
    """
    Paginated Admin Workspace listing response.
    """

    items: List[AdminWorkspaceItem]
    total_items: int
    page: int
    page_size: int


class BroadcastNotificationRequest(BaseModel):
    """
    Request payload to broadcast platform announcement to all users.
    """

    title: str = Field(..., max_length=255)
    message: str = Field(...)
    level: str = Field(default="INFO", description="INFO, WARNING, ERROR, SUCCESS")
