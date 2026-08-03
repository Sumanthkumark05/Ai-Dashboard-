import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.core.constants import JobPriority, JobStatus


class CreateJobRequest(BaseModel):
    """
    Pydantic schema for enqueuing an asynchronous background job.
    """

    job_name: str = Field(..., description="Name of the job task (e.g. process_ai_document, preprocess_dataset, send_email)")
    priority: Optional[JobPriority] = Field(default=JobPriority.NORMAL, description="Queue priority level")
    payload: Optional[Dict[str, Any]] = Field(default=None, description="Task payload parameters")


class JobResponse(BaseModel):
    """
    Pydantic response schema for BackgroundJob details.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    created_by: uuid.UUID
    job_name: str
    queue_name: str
    task_id: Optional[str] = None
    status: JobStatus
    priority: JobPriority
    progress: int
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    traceback: Optional[str] = None
    retry_count: int
    max_retries: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    """
    Pydantic schema for paginated list of background jobs.
    """

    items: List[JobResponse]
    total_items: int
    page: int
    page_size: int


class JobStatisticsResponse(BaseModel):
    """
    Pydantic schema for workspace background job metrics.
    """

    total_jobs: int
    success_count: int
    failed_count: int
    running_count: int
    queued_count: int
    by_status: Dict[str, int]
    average_execution_seconds: float
