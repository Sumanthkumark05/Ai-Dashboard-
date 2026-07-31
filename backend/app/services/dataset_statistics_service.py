import uuid
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.dataset_repository import DatasetRepository


class DatasetStatisticsService:
    """
    Service calculating workspace dataset analytics and metrics.
    """

    @staticmethod
    async def get_workspace_statistics(
        workspace_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Retrieves total datasets, total record counts, storage bytes, and dataset format breakdown.
        """
        ds_repo = DatasetRepository(db)
        return await ds_repo.get_workspace_dataset_stats(workspace_id)
