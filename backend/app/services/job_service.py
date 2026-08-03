import uuid
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobPriority, JobStatus
from app.models.background_job import BackgroundJob
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.schemas.job import CreateJobRequest
from app.services.activity_service import ActivityService
from app.services.queue_service import QueueService


class JobService:
    """
    Business Logic Service managing background job enqueuing, progress tracking, cancellation, retries, and deletion.
    """

    @classmethod
    async def create_job(
        cls,
        workspace_id: uuid.UUID,
        creator: User,
        payload: CreateJobRequest,
        db: AsyncSession,
    ) -> BackgroundJob:
        """
        Creates a BackgroundJob record in DB and dispatches task to Celery queue broker.
        """
        job_repo = JobRepository(db)
        priority = payload.priority or JobPriority.NORMAL
        queue_name = QueueService.get_queue_name(priority)

        job = await job_repo.create(
            workspace_id=workspace_id,
            created_by=creator.id,
            job_name=payload.job_name.strip(),
            queue_name=queue_name,
            status=JobStatus.QUEUED,
            priority=priority,
            progress=0,
            retry_count=0,
            max_retries=3,
        )

        task_id = QueueService.dispatch_task(
            job_id=str(job.id),
            job_name=payload.job_name,
            priority=priority,
            task_kwargs=payload.payload,
        )

        job.task_id = task_id
        db.add(job)
        await db.commit()
        await db.refresh(job)

        await ActivityService.log_activity(
            user_id=creator.id,
            action="CREATE_BACKGROUND_JOB",
            details={"job_id": str(job.id), "job_name": job.job_name, "priority": priority.value},
        )

        logger.info(f"BackgroundJob '{job.job_name}' created with ID {job.id} on queue '{queue_name}'")
        return job

    @classmethod
    async def cancel_job(cls, job_id: uuid.UUID, db: AsyncSession) -> BackgroundJob:
        """
        Cancels a pending, queued, or running background job.
        """
        job_repo = JobRepository(db)
        job = await job_repo.get_by_id(job_id)

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Background job not found.",
            )

        if job.status in [JobStatus.SUCCESS, JobStatus.CANCELLED, JobStatus.EXPIRED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job cannot be cancelled in status '{job.status.value}'.",
            )

        if job.task_id:
            QueueService.revoke_task(job.task_id)

        job.status = JobStatus.CANCELLED
        db.add(job)
        await db.commit()
        await db.refresh(job)

        logger.info(f"BackgroundJob ID {job_id} cancelled.")
        return job

    @classmethod
    async def retry_job(cls, job_id: uuid.UUID, db: AsyncSession) -> BackgroundJob:
        """
        Manually retries a failed or dead-letter background job.
        """
        job_repo = JobRepository(db)
        job = await job_repo.get_by_id(job_id)

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Background job not found.",
            )

        job.retry_count += 1
        job.status = JobStatus.QUEUED
        job.error = None
        job.traceback = None
        job.progress = 0

        task_id = QueueService.dispatch_task(
            job_id=str(job.id),
            job_name=job.job_name,
            priority=job.priority,
        )

        job.task_id = task_id
        db.add(job)
        await db.commit()
        await db.refresh(job)

        logger.info(f"BackgroundJob ID {job_id} retried (Attempt {job.retry_count}).")
        return job

    @staticmethod
    async def delete_job(job_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Deletes a job record.
        """
        job_repo = JobRepository(db)
        success = await job_repo.delete(job_id, soft=False)
        logger.info(f"BackgroundJob ID {job_id} deleted.")
        return success

    @staticmethod
    async def get_workspace_jobs(
        workspace_id: uuid.UUID,
        status: Optional[JobStatus] = None,
        queue_name: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated background jobs for a workspace.
        """
        job_repo = JobRepository(db)
        return await job_repo.get_workspace_jobs(
            workspace_id=workspace_id,
            status=status,
            queue_name=queue_name,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    async def get_statistics(
        workspace_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Fetch job execution metrics for a workspace.
        """
        job_repo = JobRepository(db)
        return await job_repo.get_statistics(workspace_id)
