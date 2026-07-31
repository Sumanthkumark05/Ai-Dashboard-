from typing import Optional
from pydantic import BaseModel, Field
from app.core.constants import UserRole


class TokenResponse(BaseModel):
    """
    Schema returned upon successful authentication containing JWT tokens.
    """

    access_token: str = Field(..., description="JWT Access Token")
    refresh_token: str = Field(..., description="JWT Refresh Token")
    token_type: str = Field(default="bearer", description="Token Authorization Type")
    expires_in: int = Field(..., description="Access token expiration window in seconds")


class TokenPayload(BaseModel):
    """
    Internal decoded JWT claim payload model.
    """

    sub: str  # User UUID string
    email: str
    role: UserRole
    type: str  # "access" or "refresh"
    exp: Optional[int] = None
