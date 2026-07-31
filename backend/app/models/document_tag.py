import uuid
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class DocumentTag(Base, UUIDMixin, TimestampMixin):
    """
    DocumentTag ORM Model attaching tags to documents.
    """

    __tablename__ = "document_tags"

    document_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tag: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
