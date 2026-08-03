import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobStatus
from app.database.dependency import get_db
from app.models.background_job import BackgroundJob
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.job_repository import JobRepository
from app.schemas.job import (
    CreateJobRequest,
    JobListResponse,
    JobResponse,
    JobStatisticsResponse,
)
from app.security.dependencies import get_current_user
from app.security.workspace_dependency import get_current_workspace
from app.services.job_service import JobService
from app.services.worker_service import WorkerService

router = APIRouter(prefix="/jobs", tags=["Background Jobs & Task Queue"])


@router.post(
    "/create",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enqueue Background Job",
    description="Enqueues an asynchronous background job into the Celery task queue.",
)
async def create_job(
    payload: CreateJobRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    job = await JobService.create_job(current_ws.id, current_user, payload, db)
    return JobResponse.model_validate(job)


@router.get(
    "",
    response_model=JobListResponse,
    summary="List Workspace Jobs",
    description="Returns paginated background jobs in the active workspace with status and queue filters.",
)
async def list_jobs(
    status: Optional[JobStatus] = Query(default=None, description="Filter by JobStatus"),
    queue_name: Optional[str] = Query(default=None, description="Filter by Queue Name"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> JobListResponse:
    data = await JobService.get_workspace_jobs(
        workspace_id=current_ws.id,
        status=status,
        queue_name=queue_name,
        page=page,
        page_size=page_size,
        db=db,
    )
    items = [JobResponse.model_validate(j) for j in data["items"]]
    return JobListResponse(
        items=items,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.get(
    "/statistics",
    response_model=Dict[str, Any],
    summary="Job & Worker Statistics",
    description="Returns workspace job metrics and Celery worker cluster status.",
)
async def get_job_statistics(
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    job_stats = await JobService.get_statistics(current_ws.id, db)
    worker_stats = WorkerService.get_worker_status()

    return {
        "job_statistics": job_stats,
        "worker_cluster": worker_stats,
    }


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get Job Details",
    description="Returns details, execution progress, and result payload for a specific job ID.",
)
async def get_job(
    job_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    repo = JobRepository(db)
    job = await repo.get_by_id(job_id)
    if not job or job.workspace_id != current_ws.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Background job not found.",
        )
    return JobResponse.model_validate(job)


@router.post(
    "/{job_id}/cancel",
    response_model=JobResponse,
    summary="Cancel Job",
    description="Cancels a pending, queued, or running background job.",
)
async def cancel_job(
    job_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    cancelled = await JobService.cancel_job(job_id, db)
    return JobResponse.model_validate(cancelled)


@router.post(
    "/{job_id}/retry",
    response_model=JobResponse,
    summary="Retry Job",
    description="Re-enqueues a failed or dead-letter background job.",
)
async def retry_job(
    job_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    retried = await JobService.retry_job(job_id, db)
    return JobResponse.model_validate(retried)


@router.delete(
    "/{job_id}",
    response_model=Dict[str, Any],
    summary="Delete Job Record",
    description="Deletes a background job execution record.",
)
async def delete_job(
    job_id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await JobService.delete_job(job_id, db)
    return {
        "success": True,
        "message": f"Job record '{job_id}' deleted successfully.",
    }
