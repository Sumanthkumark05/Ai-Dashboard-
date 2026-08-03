import uuid
from typing import Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class Folder(Base, UUIDMixin, TimestampMixin):
    """
    Folder ORM Model representing hierarchical directory structures inside Workspaces.
    """

    __tablename__ = "folders"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    parent_folder_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("folders.id", ondelete="CASCADE"), index=True, nullable=True
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(50), default="#3B82F6", nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Relationships
    workspace = relationship("Workspace", backref="folders", lazy="selectin")
    parent_folder = relationship("Folder", remote_side="Folder.id", backref="subfolders", lazy="selectin")
    files = relationship("StoredFile", back_populates="folder", cascade="all, delete-orphan", lazy="selectin")
