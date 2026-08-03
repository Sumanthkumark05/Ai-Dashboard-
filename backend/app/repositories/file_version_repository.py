import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file_version import FileVersion
from app.repositories.base_repository import BaseRepository


class FileVersionRepository(BaseRepository[FileVersion]):
    """
    FileVersion Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(FileVersion, session)

    async def get_file_versions(self, file_id: uuid.UUID) -> List[FileVersion]:
        """
        Fetch version history list for a specific file.
        """
        query = select(FileVersion).where(FileVersion.file_id == file_id).order_by(FileVersion.version.desc())
        result = await self.session.execute(query)
        return list(result.scalars().all())
