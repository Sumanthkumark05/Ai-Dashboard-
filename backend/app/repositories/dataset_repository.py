import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dataset import Dataset
from app.models.dataset_tag import DatasetTag
from app.models.dataset_version import DatasetVersion
from app.repositories.base_repository import BaseRepository


class DatasetRepository(BaseRepository[Dataset]):
    """
    Dataset Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Dataset, session)

    async def get_by_checksum(
        self, workspace_id: uuid.UUID, checksum: str
    ) -> Optional[Dataset]:
        """
        Find existing dataset matching checksum in the workspace.
        """
        query = select(Dataset).where(
            Dataset.workspace_id == workspace_id,
            Dataset.checksum == checksum,
            Dataset.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_workspace_datasets(
        self,
        workspace_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        dataset_type: Optional[str] = None,
        status_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace datasets with search and filtering support.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(Dataset).where(
            Dataset.workspace_id == workspace_id,
            Dataset.is_deleted == False,  # noqa: E712
        )

        if dataset_type:
            query = query.where(Dataset.dataset_type == dataset_type.lower().strip())

        if status_filter:
            query = query.where(Dataset.status == status_filter.lower().strip())

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Dataset.name.ilike(search_pattern),
                    Dataset.description.ilike(search_pattern),
                    Dataset.file_name.ilike(search_pattern),
                )
            )

        # Count matching
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        # Execute paginated query
        query = query.order_by(Dataset.created_at.desc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }

    async def count_workspace_datasets(self, workspace_id: uuid.UUID) -> int:
        """
        Count active datasets in a workspace.
        """
        query = select(func.count(Dataset.id)).where(
            Dataset.workspace_id == workspace_id,
            Dataset.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def sum_workspace_dataset_storage(self, workspace_id: uuid.UUID) -> int:
        """
        Sum total dataset storage in bytes for a workspace.
        """
        query = select(func.coalesce(func.sum(Dataset.file_size), 0)).where(
            Dataset.workspace_id == workspace_id,
            Dataset.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_workspace_dataset_stats(self, workspace_id: uuid.UUID) -> Dict[str, Any]:
        """
        Calculates dataset statistics for a workspace.
        """
        total_datasets = await self.count_workspace_datasets(workspace_id)
        total_bytes = await self.sum_workspace_dataset_storage(workspace_id)

        # Record count sum
        rec_query = select(func.coalesce(func.sum(Dataset.record_count), 0)).where(
            Dataset.workspace_id == workspace_id,
            Dataset.is_deleted == False,  # noqa: E712
        )
        rec_res = await self.session.execute(rec_query)
        total_records = rec_res.scalar() or 0

        # Dataset type breakdown
        type_query = (
            select(Dataset.dataset_type, func.count(Dataset.id))
            .where(
                Dataset.workspace_id == workspace_id,
                Dataset.is_deleted == False,  # noqa: E712
            )
            .group_by(Dataset.dataset_type)
        )
        type_res = await self.session.execute(type_query)
        type_breakdown = {row[0].value if hasattr(row[0], "value") else str(row[0]): row[1] for row in type_res.all()}

        return {
            "total_datasets": total_datasets,
            "total_records": total_records,
            "total_storage_bytes": total_bytes,
            "total_storage_mb": round(total_bytes / (1024 * 1024), 2),
            "dataset_type_breakdown": type_breakdown,
        }

    async def get_dataset_versions(
        self, dataset_id: uuid.UUID
    ) -> List[DatasetVersion]:
        """
        Fetch version history for a dataset.
        """
        query = (
            select(DatasetVersion)
            .where(DatasetVersion.dataset_id == dataset_id)
            .order_by(DatasetVersion.version_number.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_dataset_tags(self, dataset_id: uuid.UUID) -> List[str]:
        """
        Fetch list of tag strings for a dataset.
        """
        query = select(DatasetTag.tag).where(DatasetTag.dataset_id == dataset_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())

