import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class WebSocketAuthData(BaseModel):
    """
    Decoded JWT Authentication payload for WebSocket connection context.
    """

    user_id: uuid.UUID
    email: str
    username: str
    roles: List[str] = Field(default_factory=list)


class WebSocketConnectionStats(BaseModel):
    """
    Real-time monitoring metrics for WebSocket connections and rooms.
    """

    connected_users_count: int
    active_connections_count: int
    active_workspaces_count: int
    active_teams_count: int
    messages_processed: int
