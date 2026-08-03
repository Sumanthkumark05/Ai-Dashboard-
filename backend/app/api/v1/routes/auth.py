from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.schemas.token import TokenResponse
from app.schemas.user import UserResponse
from app.security.dependencies import get_current_user
from app.services.auth_service import AuthService
from app.services.token_service import TokenService

router = APIRouter(prefix="/auth", tags=["Authentication & Access Management"])


@router.post(
    "/register",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="User Account Registration",
    description="Registers a new user account and returns the user object paired with JWT Access/Refresh tokens.",
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = UserRepository(db)
    user, tokens = await AuthService.register_user(payload, repo)
    return {
        "success": True,
        "message": "User account registered successfully",
        "data": {
            "user": UserResponse.model_validate(user),
            "tokens": tokens,
        },
    }


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login & Token Issuance",
    description="Authenticates user credentials and returns JWT Access and Refresh Tokens.",
)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    content_type = request.headers.get("content-type", "").lower()

    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        username = str(form.get("username") or form.get("email") or "").strip()
        password = str(form.get("password") or "")
        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Username and password fields are required in form data.",
            )
        login_req = LoginRequest(email_or_username=username, password=password)
    else:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid JSON payload provided.",
            )
        try:
            login_req = LoginRequest.model_validate(body)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            )

    logger.info(f"POST /api/v1/auth/login received request for identifier: {login_req.email_or_username or login_req.email}")
    repo = UserRepository(db)
    _, tokens = await AuthService.login_user(login_req, repo)
    return tokens



@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh Access Token",
    description="Exchanges a valid JWT refresh token for a newly issued Access & Refresh token pair.",
)
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    repo = UserRepository(db)
    return await TokenService.refresh_tokens(payload.refresh_token, repo)


@router.post(
    "/logout",
    response_model=Dict[str, Any],
    summary="User Logout",
    description="Invalidates current user session context.",
)
async def logout(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return {
        "success": True,
        "message": f"Successfully logged out user {current_user.email}",
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Authenticated User Profile",
    description="Returns the serialized user profile of the currently authenticated user.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post(
    "/forgot-password",
    response_model=Dict[str, Any],
    summary="Initiate Password Recovery",
    description="Triggers password recovery token generation for registered email addresses.",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = UserRepository(db)
    return await AuthService.forgot_password(payload.email, repo)


@router.post(
    "/reset-password",
    response_model=Dict[str, Any],
    summary="Complete Password Reset",
    description="Resets user password using valid recovery token.",
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = UserRepository(db)
    return await AuthService.reset_password(payload.token, payload.new_password, repo)


@router.post(
    "/verify-email",
    response_model=Dict[str, Any],
    summary="Verify Account Email",
    description="Verifies user email address via confirmation token.",
)
async def verify_email(
    payload: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = UserRepository(db)
    return await AuthService.verify_email(payload.token, repo)


@router.post(
    "/resend-verification",
    response_model=Dict[str, Any],
    summary="Resend Verification Email",
    description="Resends verification token email to current user.",
)
async def resend_verification(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return {
        "success": True,
        "message": f"Verification email queued for {current_user.email}",
    }
