import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey
from app.repositories.base_repository import BaseRepository


class ApiKeyRepository(BaseRepository[ApiKey]):
    """
    ApiKey Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ApiKey, session)

    async def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        """
        Retrieves active ApiKey record matching SHA-256 hash digest.
        """
        query = select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.status == "ACTIVE")
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_workspace_keys(self, workspace_id: uuid.UUID) -> List[ApiKey]:
        """
        Fetches all API keys in a workspace.
        """
        query = (
            select(ApiKey)
            .where(ApiKey.workspace_id == workspace_id)
            .order_by(ApiKey.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
