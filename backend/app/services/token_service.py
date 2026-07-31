import uuid
from typing import Dict, Any
from fastapi import HTTPException, status
from loguru import logger

from app.core.config import settings
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.token import TokenResponse
from app.security.jwt import create_access_token, create_refresh_token, decode_token


class TokenService:
    """
    Service responsible for JWT token issuance, validation, and renewal.
    """

    @staticmethod
    def generate_tokens(user: User) -> TokenResponse:
        """
        Issuance helper generating paired Access and Refresh Tokens for a User.
        """
        token_payload: Dict[str, Any] = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        }

        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(token_payload)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=15 * 60,  # 15 minutes in seconds
        )

    @staticmethod
    async def refresh_tokens(refresh_token_str: str, repo: UserRepository) -> TokenResponse:
        """
        Validates refresh token and issues a fresh Access and Refresh token pair.
        """
        payload = decode_token(refresh_token_str)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type provided for refresh request.",
            )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload.",
            )

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user identifier format.",
            )

        user = await repo.get_by_id(user_id)
        if not user or not user.is_active or user.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with refresh token is invalid or inactive.",
            )

        logger.info(f"Issuing refreshed tokens for User ID: {user.id}")
        return TokenService.generate_tokens(user)
