import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feature_flag import FeatureFlag
from app.repositories.base_repository import BaseRepository
from app.schemas.feature_flag import CreateFeatureFlagRequest, UpdateFeatureFlagRequest


class FeatureFlagService:
    """
    Business Logic Service managing feature flags and dynamic feature toggling.
    """

    @staticmethod
    async def list_flags(db: AsyncSession) -> List[FeatureFlag]:
        """
        Retrieves all feature flags.
        """
        repo = BaseRepository(FeatureFlag, db)
        return await repo.get_all()

    @staticmethod
    async def get_flag_by_id(flag_id: uuid.UUID, db: AsyncSession) -> Optional[FeatureFlag]:
        """
        Retrieves a feature flag by UUID.
        """
        repo = BaseRepository(FeatureFlag, db)
        return await repo.get_by_id(flag_id)

    @staticmethod
    async def create_flag(payload: CreateFeatureFlagRequest, db: AsyncSession) -> FeatureFlag:
        """
        Creates a new feature flag.
        """
        repo = BaseRepository(FeatureFlag, db)
        return await repo.create(
            name=payload.name,
            description=payload.description,
            enabled=payload.enabled,
            rollout_percentage=payload.rollout_percentage,
        )

    @staticmethod
    async def update_flag(
        flag_id: uuid.UUID, payload: UpdateFeatureFlagRequest, db: AsyncSession
    ) -> Optional[FeatureFlag]:
        """
        Updates an existing feature flag.
        """
        repo = BaseRepository(FeatureFlag, db)
        flag = await repo.get_by_id(flag_id)
        if not flag:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        return await repo.update(flag, **update_data)

    @staticmethod
    async def delete_flag(flag_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Deletes a feature flag.
        """
        repo = BaseRepository(FeatureFlag, db)
        flag = await repo.get_by_id(flag_id)
        if not flag:
            return False
        await repo.delete(flag)
        return True
