import uuid
from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class FileVersion(Base, UUIDMixin, TimestampMixin):
    """
    FileVersion ORM Model tracking history and storage path for previous versions of a file.
    """

    __tablename__ = "file_versions"

    file_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("stored_files.id", ondelete="CASCADE"), index=True, nullable=False
    )

    version: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Relationship
    file = relationship("StoredFile", back_populates="versions", lazy="selectin")
