import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class ReportStatus(str):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_CHANGES = "needs_changes"
    COMPLETED = "completed"


class ReportCategory(str):
    DAILY_UPDATE = "Daily Update"
    WEEKLY_REPORT = "Weekly Report"
    BUG_REPORT = "Bug Report"
    FEATURE_PROGRESS = "Feature Progress"
    RESEARCH = "Research"
    MEETING_SUMMARY = "Meeting Summary"
    GENERAL = "General"


class Report(Base, UUIDMixin, TimestampMixin):
    """
    Report ORM Model representing team reports, daily updates, and milestones inside Workspaces.
    """

    __tablename__ = "reports"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="General", nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="submitted", nullable=False)
    
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewer_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    workspace = relationship("Workspace", backref="workspace_reports", lazy="selectin")
    author = relationship("User", foreign_keys=[author_id], lazy="selectin")
    reviewer = relationship("User", foreign_keys=[reviewer_id], lazy="selectin")

    attachments = relationship(
        "ReportAttachment", back_populates="report", cascade="all, delete-orphan", lazy="selectin"
    )
    comments = relationship(
        "ReportComment", back_populates="report", cascade="all, delete-orphan", lazy="selectin"
    )
    activities = relationship(
        "ReportActivity", back_populates="report", cascade="all, delete-orphan", lazy="selectin"
    )


class ReportAttachment(Base, UUIDMixin, TimestampMixin):
    """
    Report Attachment ORM Model for files attached to reports.
    """

    __tablename__ = "report_attachments"

    report_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("reports.id", ondelete="CASCADE"), index=True, nullable=False
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    uploader_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # in bytes
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)

    report = relationship("Report", back_populates="attachments")
    uploader = relationship("User", lazy="selectin")


class ReportComment(Base, UUIDMixin, TimestampMixin):
    """
    Report Comment ORM Model for discussion threads on reports.
    """

    __tablename__ = "report_comments"

    report_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("reports.id", ondelete="CASCADE"), index=True, nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("report_comments.id", ondelete="CASCADE"), nullable=True
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)

    report = relationship("Report", back_populates="comments")
    author = relationship("User", lazy="selectin")
    replies = relationship("ReportComment", remote_side="ReportComment.id", cascade="all, delete-orphan", single_parent=True, lazy="selectin")


class ReportActivity(Base, UUIDMixin, TimestampMixin):
    """
    Report Activity Audit Trail ORM Model.
    """

    __tablename__ = "report_activities"

    report_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("reports.id", ondelete="CASCADE"), index=True, nullable=False
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    report = relationship("Report", back_populates="activities")
    actor = relationship("User", lazy="selectin")
