from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class WebSocketEventType(str, Enum):
    """
    Standardized real-time WebSocket event type categories.
    """

    NOTIFICATION_CREATED = "notification.created"
    NOTIFICATION_READ = "notification.read"
    NOTIFICATION_DELETED = "notification.deleted"

    CHAT_STARTED = "chat.started"
    CHAT_CHUNK = "chat.chunk"
    CHAT_COMPLETED = "chat.completed"
    CHAT_TYPING = "chat.typing"
    CHAT_ERROR = "chat.error"

    JOB_CREATED = "job.created"
    JOB_PROGRESS = "job.progress"
    JOB_COMPLETED = "job.completed"
    JOB_FAILED = "job.failed"
    JOB_CANCELLED = "job.cancelled"

    ANALYTICS_UPDATED = "analytics.updated"
    DASHBOARD_UPDATED = "dashboard.updated"
    WORKSPACE_UPDATED = "workspace.updated"
    TEAM_UPDATED = "team.updated"

    PRESENCE_ONLINE = "presence.online"
    PRESENCE_OFFLINE = "presence.offline"
    USER_JOINED = "user.joined"
    USER_LEFT = "user.left"

    HEARTBEAT_PING = "heartbeat.ping"
    HEARTBEAT_PONG = "heartbeat.pong"


class WebSocketMessage(BaseModel):
    """
    Standardized payload format for incoming and outgoing WebSocket events.
    """

    event: str = Field(..., description="Event type identifier")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp",
    )
    data: Dict[str, Any] = Field(default_factory=dict, description="Event payload data")
    room_id: Optional[str] = Field(default=None, description="Optional target channel/room ID")
