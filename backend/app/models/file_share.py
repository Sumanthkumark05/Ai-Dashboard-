import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class FileShare(Base, UUIDMixin, TimestampMixin):
    """
    FileShare ORM Model managing public access tokens and link expiry for file sharing.
    """

    __tablename__ = "file_shares"

    file_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("stored_files.id", ondelete="CASCADE"), index=True, nullable=False
    )

    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Relationship
    file = relationship("StoredFile", back_populates="shares", lazy="selectin")
