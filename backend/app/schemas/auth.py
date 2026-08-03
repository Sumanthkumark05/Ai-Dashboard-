from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field, model_validator


class RegisterRequest(BaseModel):
    """
    Pydantic schema for user account registration.
    """

    email: EmailStr = Field(..., description="User primary email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=8, description="Account password")
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    terms_accepted: Optional[bool] = Field(True, description="Accepted Terms & Conditions")


class LoginRequest(BaseModel):
    """
    Pydantic schema for user login authentication.
    Supports email, username, or email_or_username.
    """

    email_or_username: Optional[str] = Field(None, description="Registered Email or Username")
    email: Optional[str] = Field(None, description="Registered Email Address")
    username: Optional[str] = Field(None, description="Registered Username")
    password: str = Field(..., description="Plaintext password")

    @model_validator(mode="before")
    @classmethod
    def populate_identifier(cls, data: Any) -> Any:
        if isinstance(data, dict):
            identifier = data.get("email_or_username") or data.get("email") or data.get("username")
            if identifier:
                data["email_or_username"] = identifier
                data["email"] = identifier
                data["username"] = identifier
        return data

    @model_validator(mode="after")
    def validate_identifier(self) -> "LoginRequest":
        if not self.email_or_username or not str(self.email_or_username).strip():
            raise ValueError("Either email, username, or email_or_username must be provided.")
        return self


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
