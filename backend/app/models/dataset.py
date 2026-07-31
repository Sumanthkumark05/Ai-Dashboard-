import uuid
from typing import Optional
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import (
    DatasetProcessingStatus,
    DatasetStatus,
    DatasetType,
    DatasetVisibility,
)
from app.database.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin


class Dataset(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Dataset ORM Model managing metadata for workspace datasets used by RAG, Chat, and AI models.
    """

    __tablename__ = "datasets"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    dataset_type: Mapped[DatasetType] = mapped_column(
        Enum(DatasetType, values_callable=lambda obj: [e.value for e in obj]),
        default=DatasetType.CSV,
        nullable=False,
    )
    source: Mapped[str] = mapped_column(String(100), default="upload", nullable=False)

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    extension: Mapped[str] = mapped_column(String(20), nullable=False)
    checksum: Mapped[str] = mapped_column(String(128), index=True, nullable=False)

    language: Mapped[str] = mapped_column(String(20), default="en", nullable=False)
    encoding: Mapped[str] = mapped_column(String(30), default="utf-8", nullable=False)

    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # Size in bytes
    record_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    column_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    schema_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    visibility: Mapped[DatasetVisibility] = mapped_column(
        Enum(DatasetVisibility, values_callable=lambda obj: [e.value for e in obj]),
        default=DatasetVisibility.WORKSPACE,
        nullable=False,
    )
    status: Mapped[DatasetStatus] = mapped_column(
        Enum(DatasetStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=DatasetStatus.READY,
        nullable=False,
    )
    processing_status: Mapped[DatasetProcessingStatus] = mapped_column(
        Enum(DatasetProcessingStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=DatasetProcessingStatus.COMPLETED,
        nullable=False,
    )

    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
