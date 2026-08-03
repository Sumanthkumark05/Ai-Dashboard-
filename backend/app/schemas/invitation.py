import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.core.constants import InvitationStatus, TeamInvitationStatus, TeamRole, UserRole


class InvitationRequest(BaseModel):
    """
    Schema for inviting a member to an Organization via email.
    """

    email: EmailStr = Field(..., description="Recipient user email address")
    role: UserRole = Field(default=UserRole.MEMBER, description="Assigned Organization Role")


class InvitationResponse(BaseModel):
    """
    Pydantic response schema for Organization Invitation details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    email: EmailStr
    role: UserRole
    token: str
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    status: InvitationStatus
    created_by: uuid.UUID
    created_at: datetime


class AcceptInvitationRequest(BaseModel):
    """
    Schema for accepting an invitation by token.
    """

    token: str = Field(..., description="Invitation token string")


class RejectInvitationRequest(BaseModel):
    """
    Schema for rejecting an invitation by token.
    """

    token: str = Field(..., description="Invitation token string")


class TeamInvitationResponse(BaseModel):
    """
    Pydantic response schema for Team Invitation details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    team_id: uuid.UUID
    email: EmailStr
    token: str
    role: TeamRole
    status: TeamInvitationStatus
    expires_at: datetime
    accepted: bool
    created_at: datetime


class TeamInvitationListResponse(BaseModel):
    """
    Pydantic schema for list of team invitations.
    """

    items: List[TeamInvitationResponse]
    total_items: int
