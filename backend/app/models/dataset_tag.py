import uuid
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class DatasetTag(Base, UUIDMixin, TimestampMixin):
    """
    DatasetTag ORM Model attaching tags to datasets.
    """

    __tablename__ = "dataset_tags"

    dataset_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("datasets.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tag: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
