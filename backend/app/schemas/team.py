import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CreateTeamRequest(BaseModel):
    """
    Pydantic schema for creating a new Team inside a Workspace.
    """

    name: str = Field(..., min_length=3, max_length=100, description="Team Name")
    description: Optional[str] = Field(None, max_length=500, description="Team Description")
    avatar: Optional[str] = Field(None, max_length=500, description="Team Avatar URL")


class UpdateTeamRequest(BaseModel):
    """
    Pydantic schema for updating Team metadata.
    """

    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    avatar: Optional[str] = Field(None, max_length=500)


class TransferOwnershipRequest(BaseModel):
    """
    Pydantic schema for transferring Team ownership to another member.
    """

    new_owner_id: uuid.UUID = Field(..., description="User ID of the new Team Owner")


class TeamResponse(BaseModel):
    """
    Pydantic response schema for Team details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: Optional[str] = None
    avatar: Optional[str] = None
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TeamListResponse(BaseModel):
    """
    Pydantic schema for paginated list of teams.
    """

    items: List[TeamResponse]
    total_items: int
    page: int
    page_size: int
