from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file_share import FileShare
from app.repositories.base_repository import BaseRepository


class FileShareRepository(BaseRepository[FileShare]):
    """
    FileShare Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(FileShare, session)

    async def get_by_token(self, token: str) -> Optional[FileShare]:
        """
        Fetch FileShare record by public share token string.
        """
        query = select(FileShare).where(FileShare.token == token)
        result = await self.session.execute(query)
        return result.scalars().first()
