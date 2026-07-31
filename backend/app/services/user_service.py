from fastapi import HTTPException, status
from loguru import logger

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest
from app.security.password import hash_password, validate_password_strength, verify_password


class UserService:
    """
    Business Logic Service managing user profiles, settings, and credentials.
    """

    @staticmethod
    async def update_profile(
        user: User, payload: UpdateProfileRequest, repo: UserRepository
    ) -> User:
        """
        Updates user profile attributes cleanly.
        """
        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return user

        updated_user = await repo.update(user.id, **update_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User record not found for update.",
            )

        logger.info(f"User profile updated successfully for User ID: {user.id}")
        return updated_user

    @staticmethod
    async def change_password(
        user: User, payload: ChangePasswordRequest, repo: UserRepository
    ) -> None:
        """
        Validates existing password, checks new password strength, and updates hash.
        """
        # 1. Verify current password
        if not verify_password(payload.current_password, user.hashed_password):
            logger.warning(f"Invalid current password attempt for User ID: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        # 2. Validate new password strength
        validate_password_strength(payload.new_password)

        # 3. Hash and save new password
        new_hash = hash_password(payload.new_password)
        await repo.update(user.id, hashed_password=new_hash)
        logger.info(f"Password changed successfully for User ID: {user.id}")
