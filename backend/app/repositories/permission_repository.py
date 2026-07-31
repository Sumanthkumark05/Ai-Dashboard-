from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.permission import Permission
from app.repositories.base_repository import BaseRepository


class PermissionRepository(BaseRepository[Permission]):
    """
    Permission Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Permission, session)

    async def get_by_name(self, name: str) -> Optional[Permission]:
        """
        Fetch permission by unique string key (e.g. 'workspace:create').
        """
        query = select(Permission).where(Permission.name == name.lower().strip())
        result = await self.session.execute(query)
        return result.scalars().first()
