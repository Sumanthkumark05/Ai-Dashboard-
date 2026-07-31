import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.core.constants import MemberStatus, UserRole


class MemberResponse(BaseModel):
    """
    Pydantic response schema for Organization Members.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    role: UserRole
    status: MemberStatus
    joined_at: datetime


class UpdateMemberRoleRequest(BaseModel):
    """
    Pydantic schema for updating a member's role.
    """

    role: UserRole = Field(..., description="New role for the member")
