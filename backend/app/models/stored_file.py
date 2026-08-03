import uuid
from typing import Optional
from sqlalchemy import BigInteger, Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import FileTypeCategory
from app.database.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin


class StoredFile(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    StoredFile ORM Model representing uploaded media and documents within Workspaces.
    """

    __tablename__ = "stored_files"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    folder_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("folders.id", ondelete="SET NULL"), index=True, nullable=True
    )

    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[FileTypeCategory] = mapped_column(
        Enum(FileTypeCategory, values_callable=lambda obj: [e.value for e in obj]),
        index=True,
        nullable=False,
    )
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    extension: Mapped[str] = mapped_column(String(20), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)

    storage_provider: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    public_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    workspace = relationship("Workspace", lazy="selectin")
    owner = relationship("User", lazy="selectin")
    folder = relationship("Folder", back_populates="files", lazy="selectin")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan", lazy="selectin")
    shares = relationship("FileShare", back_populates="file", cascade="all, delete-orphan", lazy="selectin")
