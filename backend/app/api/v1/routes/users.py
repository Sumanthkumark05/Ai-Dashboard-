from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest, UserResponse
from app.security.dependencies import get_current_user
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["User Account & Profile Management"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Details",
    description="Returns full profile information for the authenticated user.",
)
async def get_user_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update Profile Details",
    description="Updates first name, last name, avatar, bio, phone, language, or timezone for authenticated user.",
)
async def update_user_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    repo = UserRepository(db)
    updated = await UserService.update_profile(current_user, payload, repo)
    return UserResponse.model_validate(updated)


@router.patch(
    "/change-password",
    response_model=Dict[str, Any],
    summary="Change Password",
    description="Verifies current password and sets new password for authenticated user.",
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = UserRepository(db)
    await UserService.change_password(current_user, payload, repo)
    return {
        "success": True,
        "message": "Password changed successfully.",
    }
