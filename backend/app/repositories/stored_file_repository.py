import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import FileTypeCategory
from app.models.stored_file import StoredFile
from app.repositories.base_repository import BaseRepository


class StoredFileRepository(BaseRepository[StoredFile]):
    """
    StoredFile Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(StoredFile, session)

    async def get_by_checksum(
        self, workspace_id: uuid.UUID, checksum: str
    ) -> Optional[StoredFile]:
        """
        Find existing active file by SHA-256 checksum within a workspace.
        """
        query = select(StoredFile).where(
            StoredFile.workspace_id == workspace_id,
            StoredFile.checksum == checksum,
            StoredFile.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_workspace_files(
        self,
        workspace_id: uuid.UUID,
        folder_id: Optional[uuid.UUID] = None,
        file_type: Optional[FileTypeCategory] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        include_deleted: bool = False,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace files with search, folder, and file_type filtering.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(StoredFile).where(StoredFile.workspace_id == workspace_id)

        if not include_deleted:
            query = query.where(StoredFile.is_deleted == False)  # noqa: E712

        if folder_id:
            query = query.where(StoredFile.folder_id == folder_id)

        if file_type:
            query = query.where(StoredFile.file_type == file_type)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    StoredFile.original_name.ilike(search_pattern),
                    StoredFile.extension.ilike(search_pattern),
                )
            )

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        query = query.order_by(StoredFile.created_at.desc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }

    async def get_storage_analytics(self, workspace_id: uuid.UUID) -> Dict[str, Any]:
        """
        Calculates storage metrics (total files, storage used per file type, avg size, etc.).
        """
        query = select(StoredFile).where(
            StoredFile.workspace_id == workspace_id,
            StoredFile.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        files = list(result.scalars().all())

        total_files = len(files)
        total_storage_bytes = sum(f.size for f in files)
        avg_size_bytes = total_storage_bytes / total_files if total_files > 0 else 0

        by_type: Dict[str, int] = {}
        for f in files:
            ft = f.file_type.value if hasattr(f.file_type, "value") else str(f.file_type)
            by_type[ft] = by_type.get(ft, 0) + f.size

        # Find largest files
        sorted_files = sorted(files, key=lambda x: x.size, reverse=True)[:5]
        largest_files = [
            {
                "id": str(sf.id),
                "name": sf.original_name,
                "size": sf.size,
                "file_type": sf.file_type,
            }
            for sf in sorted_files
        ]

        now = datetime.now(timezone.utc)
        uploads_today = sum(
            1 for f in files if f.created_at and f.created_at.date() == now.date()
        )
        uploads_this_month = sum(
            1
            for f in files
            if f.created_at
            and f.created_at.year == now.year
            and f.created_at.month == now.month
        )

        return {
            "total_files": total_files,
            "total_storage_bytes": total_storage_bytes,
            "average_size_bytes": round(avg_size_bytes, 2),
            "storage_by_type": by_type,
            "largest_files": largest_files,
            "uploads_today": uploads_today,
            "uploads_this_month": uploads_this_month,
        }
