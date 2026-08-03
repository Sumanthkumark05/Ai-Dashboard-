import uuid
from typing import Any, Dict, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.folder import Folder
from app.repositories.base_repository import BaseRepository


class FolderRepository(BaseRepository[Folder]):
    """
    Folder Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Folder, session)

    async def get_by_name(
        self,
        workspace_id: uuid.UUID,
        name: str,
        parent_folder_id: Optional[uuid.UUID] = None,
    ) -> Optional[Folder]:
        """
        Find folder by name within a parent folder in a workspace.
        """
        query = select(Folder).where(
            Folder.workspace_id == workspace_id,
            func.lower(Folder.name) == name.lower().strip(),
        )
        if parent_folder_id:
            query = query.where(Folder.parent_folder_id == parent_folder_id)
        else:
            query = query.where(Folder.parent_folder_id == None)  # noqa: E711

        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_workspace_folders(
        self,
        workspace_id: uuid.UUID,
        parent_folder_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace folders with search support.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(Folder).where(Folder.workspace_id == workspace_id)

        if parent_folder_id:
            query = query.where(Folder.parent_folder_id == parent_folder_id)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(Folder.name.ilike(search_pattern))

        # Count total matching
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        # Execute query
        query = query.order_by(Folder.created_at.desc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }
