import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.core.constants import MemberStatus, WorkspaceRole


class AddWorkspaceMemberRequest(BaseModel):
    """
    Pydantic schema for adding an Organization member to a Workspace.
    """

    user_id: uuid.UUID = Field(..., description="User ID of the organization member")
    role: WorkspaceRole = Field(default=WorkspaceRole.CONTRIBUTOR, description="Workspace role")


class UpdateWorkspaceMemberRequest(BaseModel):
    """
    Pydantic schema for updating a workspace member's role.
    """

    role: WorkspaceRole = Field(..., description="New workspace role")


class WorkspaceMemberResponse(BaseModel):
    """
    Pydantic response schema for Workspace Members.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    role: WorkspaceRole
    status: MemberStatus
    joined_at: datetime
    last_accessed: datetime
