import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import WorkspaceStatus, WorkspaceVisibility
from app.database.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin


class Workspace(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Workspace ORM Model representing tenant collaboration environments within an Organization.
    """

    __tablename__ = "workspaces"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    visibility: Mapped[WorkspaceVisibility] = mapped_column(
        Enum(WorkspaceVisibility, values_callable=lambda obj: [e.value for e in obj]),
        default=WorkspaceVisibility.INTERNAL,
        nullable=False,
    )
    status: Mapped[WorkspaceStatus] = mapped_column(
        Enum(WorkspaceStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=WorkspaceStatus.ACTIVE,
        nullable=False,
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    storage_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # In MB
    storage_limit: Mapped[int] = mapped_column(Integer, default=10240, nullable=False)  # In MB
    dataset_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    document_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    chat_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    member_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    default_model: Mapped[Optional[str]] = mapped_column(String(100), default="openai/gpt-oss-120b", nullable=True)

    # Optional Project Scheduling & Calendar Synchronization Fields
    project_type: Mapped[Optional[str]] = mapped_column(String(20), default="internal", nullable=True)
    client_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    project_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    start_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # YYYY-MM-DD
    end_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)   # YYYY-MM-DD
    client_demo_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    internal_review_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    final_delivery_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    reminder_before_demo: Mapped[Optional[str]] = mapped_column(String(50), default="1 day before", nullable=True)
    reminder_before_deadline: Mapped[Optional[str]] = mapped_column(String(50), default="3 days before", nullable=True)
    meeting_duration: Mapped[Optional[int]] = mapped_column(Integer, default=60, nullable=True) # in minutes
    priority: Mapped[Optional[str]] = mapped_column(String(20), default="medium", nullable=True)

    last_activity: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
