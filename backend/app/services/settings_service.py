import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_setting import SystemSetting
from app.repositories.base_repository import BaseRepository
from app.schemas.system_setting import SystemSettingRequest


class SettingsService:
    """
    Business Logic Service managing global platform system settings.
    """

    @staticmethod
    async def get_all_settings(db: AsyncSession) -> List[SystemSetting]:
        """
        Fetches all system settings.
        """
        repo = BaseRepository(SystemSetting, db)
        return await repo.get_all()

    @staticmethod
    async def set_setting(
        payload: SystemSettingRequest, updated_by_id: uuid.UUID, db: AsyncSession
    ) -> SystemSetting:
        """
        Creates or updates a system setting by key.
        """
        stmt = select(SystemSetting).where(SystemSetting.key == payload.key)
        res = await db.execute(stmt)
        setting = res.scalar_one_or_none()

        if setting:
            setting.value = payload.value
            if payload.description:
                setting.description = payload.description
            setting.updated_by = updated_by_id
            await db.commit()
            await db.refresh(setting)
            return setting

        repo = BaseRepository(SystemSetting, db)
        return await repo.create(
            key=payload.key,
            value=payload.value,
            description=payload.description,
            updated_by=updated_by_id,
        )
