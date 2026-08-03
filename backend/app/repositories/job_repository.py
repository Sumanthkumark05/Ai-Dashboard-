import uuid
from typing import Any, Dict, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobStatus
from app.models.background_job import BackgroundJob
from app.repositories.base_repository import BaseRepository


class JobRepository(BaseRepository[BackgroundJob]):
    """
    BackgroundJob Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(BackgroundJob, session)

    async def get_workspace_jobs(
        self,
        workspace_id: uuid.UUID,
        status: Optional[JobStatus] = None,
        queue_name: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Fetch paginated background jobs in a workspace with filters.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(BackgroundJob).where(BackgroundJob.workspace_id == workspace_id)

        if status:
            query = query.where(BackgroundJob.status == status)

        if queue_name:
            query = query.where(BackgroundJob.queue_name == queue_name)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        query = query.order_by(BackgroundJob.created_at.desc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }

    async def get_statistics(self, workspace_id: uuid.UUID) -> Dict[str, Any]:
        """
        Calculates job execution statistics for a workspace.
        """
        query = select(BackgroundJob).where(BackgroundJob.workspace_id == workspace_id)
        result = await self.session.execute(query)
        jobs = list(result.scalars().all())

        total_jobs = len(jobs)
        by_status: Dict[str, int] = {}
        for j in jobs:
            st = j.status.value if hasattr(j.status, "value") else str(j.status)
            by_status[st] = by_status.get(st, 0) + 1

        failed_jobs = by_status.get(JobStatus.FAILED.value, 0)
        success_jobs = by_status.get(JobStatus.SUCCESS.value, 0)
        running_jobs = by_status.get(JobStatus.RUNNING.value, 0)
        queued_jobs = by_status.get(JobStatus.QUEUED.value, 0)

        # Calculate average execution time
        durations = []
        for j in jobs:
            if j.started_at and j.completed_at:
                durations.append((j.completed_at - j.started_at).total_seconds())

        avg_duration = sum(durations) / len(durations) if durations else 0.0

        return {
            "total_jobs": total_jobs,
            "success_count": success_jobs,
            "failed_count": failed_jobs,
            "running_count": running_jobs,
            "queued_count": queued_jobs,
            "by_status": by_status,
            "average_execution_seconds": round(avg_duration, 2),
        }
