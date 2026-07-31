import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.core.constants import InvitationStatus, UserRole


class InvitationRequest(BaseModel):
    """
    Pydantic schema for inviting a member to an Organization.
    """

    email: EmailStr = Field(..., description="Invited user email address")
    role: UserRole = Field(default=UserRole.MEMBER, description="Assigned role upon joining")


class InvitationResponse(BaseModel):
    """
    Pydantic response schema for Organization Invitations.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    email: str
    role: UserRole
    token: str
    status: InvitationStatus
    expires_at: datetime
    created_by: uuid.UUID
    created_at: datetime


class AcceptInvitationRequest(BaseModel):
    """
    Schema for accepting an invitation via token.
    """

    token: str = Field(..., description="Invitation token string")


class RejectInvitationRequest(BaseModel):
    """
    Schema for rejecting an invitation via token.
    """

    token: str = Field(..., description="Invitation token string")
