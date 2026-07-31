from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.role import Role
from app.repositories.base_repository import BaseRepository


class RoleRepository(BaseRepository[Role]):
    """
    Role Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Role, session)

    async def get_by_name(self, name: str) -> Optional[Role]:
        """
        Fetch role entity by unique name string.
        """
        query = select(Role).where(Role.name == name.lower().strip())
        result = await self.session.execute(query)
        return result.scalars().first()
