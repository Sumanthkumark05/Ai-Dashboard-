import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import JobPriority, JobStatus
from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class BackgroundJob(Base, UUIDMixin, TimestampMixin):
    """
    BackgroundJob ORM Model representing asynchronous task execution records, status, and results.
    """

    __tablename__ = "background_jobs"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    job_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    queue_name: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    task_id: Mapped[Optional[str]] = mapped_column(String(128), index=True, nullable=True)

    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=JobStatus.PENDING,
        index=True,
        nullable=False,
    )
    priority: Mapped[JobPriority] = mapped_column(
        Enum(JobPriority, values_callable=lambda obj: [e.value for e in obj]),
        default=JobPriority.NORMAL,
        index=True,
        nullable=False,
    )

    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    result: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    traceback: Mapped[Optional[str]] = mapped_column(String(4000), nullable=True)

    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    workspace = relationship("Workspace", lazy="selectin")
    creator = relationship("User", lazy="selectin")
