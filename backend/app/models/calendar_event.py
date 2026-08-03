import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin


class CalendarEvent(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    CalendarEvent ORM Model representing scheduled project activities, client demos,
    meetings, deadlines, and report submissions.
    """

    __tablename__ = "calendar_events"

    workspace_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), default="Custom Event", nullable=False)
    client_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    project_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)

    start_date: Mapped[str] = mapped_column(String(20), index=True, nullable=False) # YYYY-MM-DD
    end_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    start_time: Mapped[Optional[str]] = mapped_column(String(20), default="09:00", nullable=True)
    end_time: Mapped[Optional[str]] = mapped_column(String(20), default="10:00", nullable=True)

    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False) # low, medium, high, urgent
    status: Mapped[str] = mapped_column(String(30), default="Scheduled", nullable=False) # Scheduled, Upcoming, Completed, Cancelled, Missed, Overdue

    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    color: Mapped[str] = mapped_column(String(30), default="#3b82f6", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    reminder_minutes: Mapped[Optional[int]] = mapped_column(Integer, default=60, nullable=True)
    is_all_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_auto_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    report_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("reports.id", ondelete="SET NULL"), nullable=True
    )
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    dataset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True
    )


class EventAssignment(Base, UUIDMixin, TimestampMixin):
    """
    EventAssignment ORM Model linking team users to calendar events.
    """

    __tablename__ = "event_assignments"

    event_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("calendar_events.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String(50), default="Attendee", nullable=True)
