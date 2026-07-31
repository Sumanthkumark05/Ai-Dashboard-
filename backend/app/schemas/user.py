import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.core.constants import UserRole


class UserResponse(BaseModel):
    """
    Pydantic schema for returning serialized user profiles.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    timezone: str = "UTC"
    language: str = "en"
    role: UserRole = UserRole.MEMBER
    is_active: bool = True
    is_verified: bool = False
    is_superuser: bool = False
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class UpdateProfileRequest(BaseModel):
    """
    Pydantic schema for user profile updates.
    """

    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=30)
    language: Optional[str] = Field(None, max_length=10)
    timezone: Optional[str] = Field(None, max_length=50)


class ChangePasswordRequest(BaseModel):
    """
    Pydantic schema for user password changes.
    """

    current_password: str = Field(..., description="User's existing password")
    new_password: str = Field(..., min_length=8, description="User's proposed new password")
