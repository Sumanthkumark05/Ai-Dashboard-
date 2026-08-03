import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey
from app.models.user import User
from app.repositories.api_key_repository import ApiKeyRepository
from app.schemas.api_key import CreateApiKeyRequest, UpdateApiKeyRequest
from app.services.activity_service import ActivityService
from app.utils.hashing import hash_api_key
from app.utils.security import generate_api_key


class ApiKeyService:
    """
    Business Logic Service managing API Key creation, validation, rotation, and revocation.
    """

    @classmethod
    async def create_api_key(
        cls,
        workspace_id: uuid.UUID,
        user: User,
        payload: CreateApiKeyRequest,
        db: AsyncSession,
    ) -> Tuple[ApiKey, str]:
        """
        Creates an API key and returns tuple: (ApiKey model, unhashed raw_key secret).
        """
        repo = ApiKeyRepository(db)
        raw_key, prefix, key_hash = generate_api_key()

        api_key = await repo.create(
            workspace_id=workspace_id,
            user_id=user.id,
            name=payload.name.strip(),
            key_hash=key_hash,
            prefix=prefix,
            status="ACTIVE",
            permissions=payload.permissions or ["read", "write"],
        )

        await ActivityService.log_activity(
            user_id=user.id,
            action="CREATE_API_KEY",
            details={"api_key_id": str(api_key.id), "name": api_key.name},
        )

        logger.info(f"API Key '{api_key.name}' created for User ID {user.id}")
        return api_key, raw_key

    @classmethod
    async def verify_api_key(cls, raw_key: str, db: AsyncSession) -> Optional[ApiKey]:
        """
        Verifies raw API key against SHA-256 database digest and updates last_used_at timestamp.
        """
        key_hash = hash_api_key(raw_key)
        repo = ApiKeyRepository(db)
        api_key = await repo.get_by_hash(key_hash)

        if api_key:
            api_key.last_used_at = datetime.now(timezone.utc)
            db.add(api_key)
            await db.commit()

        return api_key

    @classmethod
    async def rotate_api_key(
        cls, key_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
    ) -> Tuple[ApiKey, str]:
        """
        Revokes old key and generates a new secret key for the same record.
        """
        repo = ApiKeyRepository(db)
        api_key = await repo.get_by_id(key_id)

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API Key not found.",
            )

        raw_key, prefix, key_hash = generate_api_key()
        api_key.prefix = prefix
        api_key.key_hash = key_hash
        api_key.status = "ACTIVE"

        db.add(api_key)
        await db.commit()
        await db.refresh(api_key)

        await ActivityService.log_activity(
            user_id=user_id,
            action="ROTATE_API_KEY",
            details={"api_key_id": str(api_key.id), "name": api_key.name},
        )

        logger.info(f"API Key ID {key_id} rotated successfully.")
        return api_key, raw_key

    @classmethod
    async def delete_api_key(
        cls, key_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
    ) -> bool:
        """
        Revokes/Deletes an API key.
        """
        repo = ApiKeyRepository(db)
        success = await repo.delete(key_id, soft=False)

        await ActivityService.log_activity(
            user_id=user_id,
            action="DELETE_API_KEY",
            details={"api_key_id": str(key_id)},
        )

        logger.info(f"API Key ID {key_id} deleted.")
        return success

    @staticmethod
    async def get_workspace_api_keys(
        workspace_id: uuid.UUID, db: AsyncSession
    ) -> List[ApiKey]:
        """
        Fetches all API keys in a workspace.
        """
        repo = ApiKeyRepository(db)
        return await repo.get_workspace_keys(workspace_id)
