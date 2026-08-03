import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin


class EmailAccount(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    EmailAccount ORM Model representing connected Google Workspace Gmail accounts.
    Stores only OAuth tokens and metadata; passwords are never stored.
    """

    __tablename__ = "email_accounts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    google_user_id: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)

    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    is_connected: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sync_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unread_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class EmailMessage(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    EmailMessage ORM Model storing synchronized email metadata and messages.
    """

    __tablename__ = "email_messages"

    account_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("email_accounts.id", ondelete="CASCADE"), index=True, nullable=False
    )
    workspace_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="SET NULL"), index=True, nullable=True
    )

    message_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    thread_id: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)

    sender_email: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    recipient_emails: Mapped[str] = mapped_column(Text, nullable=False) # comma-separated
    cc_emails: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bcc_emails: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    snippet: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    body_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    folder: Mapped[str] = mapped_column(String(50), default="inbox", index=True, nullable=False) # inbox, unread, starred, important, sent, drafts, spam, trash, archive
    category: Mapped[str] = mapped_column(String(50), default="primary", index=True, nullable=False) # primary, updates, promotions, social

    is_unread: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    is_starred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_important: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_attachments: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_calendar_invite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class EmailAttachment(Base, UUIDMixin, TimestampMixin):
    """
    EmailAttachment ORM Model linking attachments to EmailMessages, StoredFiles, and Documents.
    """

    __tablename__ = "email_attachments"

    email_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("email_messages.id", ondelete="CASCADE"), index=True, nullable=False
    )

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False) # bytes
    file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    stored_file_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("stored_files.id", ondelete="SET NULL"), nullable=True
    )
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
