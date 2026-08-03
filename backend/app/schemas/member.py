import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.core.constants import TeamMemberStatus, TeamRole


class InviteMemberRequest(BaseModel):
    """
    Pydantic schema for inviting a member to a Team via email.
    """

    email: EmailStr = Field(..., description="Recipient user email address")
    role: TeamRole = Field(default=TeamRole.VIEWER, description="Assigned Team RBAC Role")


class UpdateMemberRoleRequest(BaseModel):
    """
    Pydantic schema for updating a member's Team RBAC Role.
    """

    role: TeamRole = Field(..., description="New Team RBAC Role")


class TeamMemberResponse(BaseModel):
    """
    Pydantic response schema for Team Member details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    team_id: uuid.UUID
    user_id: uuid.UUID
    role: TeamRole
    status: TeamMemberStatus
    joined_at: datetime
    user: Optional[Dict[str, Any]] = None


class TeamMemberListResponse(BaseModel):
    """
    Pydantic schema for paginated list of team members.
    """

    items: List[TeamMemberResponse]
    total_items: int
    page: int
    page_size: int
