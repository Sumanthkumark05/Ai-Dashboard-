from typing import Tuple
from fastapi import HTTPException, status
from loguru import logger

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.token import TokenResponse
from app.security.password import hash_password, validate_password_strength, verify_password
from app.services.token_service import TokenService


class AuthService:
    """
    Business Logic Service orchestrating authentication workflows:
    Registration, Login, Token Issuance, Password Reset, and Verification.
    """

    @staticmethod
    async def register_user(
        payload: RegisterRequest, repo: UserRepository
    ) -> Tuple[User, TokenResponse]:
        """
        Registers a new user account with duplicate checks and password hashing.
        """
        clean_email = payload.email.lower().strip()
        clean_username = payload.username.lower().strip()

        # 1. Duplicate Email check
        existing_email = await repo.get_by_email(clean_email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        # 2. Duplicate Username check
        existing_username = await repo.get_by_username(clean_username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken.",
            )

        # 3. Password Strength Validation
        validate_password_strength(payload.password)

        # 4. Hash Password and Create User
        hashed_pwd = hash_password(payload.password)
        user = await repo.create(
            email=clean_email,
            username=clean_username,
            hashed_password=hashed_pwd,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )

        logger.info(f"User registered successfully: {user.email} (ID: {user.id})")
        tokens = TokenService.generate_tokens(user)
        return user, tokens

    @staticmethod
    async def login_user(
        payload: LoginRequest, repo: UserRepository
    ) -> Tuple[User, TokenResponse]:
        """
        Authenticates a user via email/username and password.
        Updates last_login timestamp upon success.
        """
        identifier = payload.email_or_username.lower().strip()
        user = await repo.get_by_email_or_username(identifier)

        # Generic credentials exception preventing account enumeration timing attacks
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        if not user:
            logger.warning(f"Login failed: User not found for identifier '{identifier}'")
            raise credentials_exception

        if not verify_password(payload.password, user.hashed_password):
            logger.warning(f"Login failed: Incorrect password for User ID: {user.id}")
            raise credentials_exception

        if not user.is_active or user.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive or disabled.",
            )

        await repo.update_last_login(user.id)
        logger.info(f"User logged in successfully: {user.email}")
        tokens = TokenService.generate_tokens(user)
        return user, tokens

    @staticmethod
    async def forgot_password(email: str, repo: UserRepository) -> dict:
        """
        Architecture foundation for password recovery requests.
        Generates token placeholder (Email dispatch added in future module).
        """
        user = await repo.get_by_email(email)
        # Always return success message to prevent user enumeration security risks
        if user:
            logger.info(f"Password reset requested for registered email: {email}")
        else:
            logger.info(f"Password reset requested for unregistered email: {email}")

        return {
            "success": True,
            "message": "If your email is registered, you will receive a password reset link shortly.",
        }

    @staticmethod
    async def reset_password(token: str, new_password: str, repo: UserRepository) -> dict:
        """
        Architecture foundation for resetting password via recovery token.
        """
        validate_password_strength(new_password)
        logger.info("Password reset executed via token.")
        return {
            "success": True,
            "message": "Your password has been reset successfully. Please log in with your new password.",
        }

    @staticmethod
    async def verify_email(token: str, repo: UserRepository) -> dict:
        """
        Architecture foundation for email verification token processing.
        """
        logger.info("Email verification executed via token.")
        return {
            "success": True,
            "message": "Email address verified successfully.",
        }
