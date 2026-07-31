from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """
    Pydantic schema for user account registration.
    """

    email: EmailStr = Field(..., description="User primary email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=8, description="Account password")
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    """
    Pydantic schema for user login authentication.
    """

    email_or_username: str = Field(..., description="Registered Email or Username")
    password: str = Field(..., description="Plaintext password")


class RefreshTokenRequest(BaseModel):
    """
    Pydantic schema for requesting a new access token via refresh token.
    """

    refresh_token: str = Field(..., description="Valid JWT Refresh Token")


class ForgotPasswordRequest(BaseModel):
    """
    Pydantic schema for password recovery request.
    """

    email: EmailStr = Field(..., description="Registered account email")


class ResetPasswordRequest(BaseModel):
    """
    Pydantic schema for completing password reset via token.
    """

    token: str = Field(..., description="Password reset verification token")
    new_password: str = Field(..., min_length=8, description="New proposed password")


class VerifyEmailRequest(BaseModel):
    """
    Pydantic schema for verifying email address.
    """

    token: str = Field(..., description="Email verification token")
