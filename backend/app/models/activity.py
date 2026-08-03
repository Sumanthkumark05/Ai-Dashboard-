import uuid
from typing import Any, Dict, Optional
from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class Activity(Base, UUIDMixin, TimestampMixin):
    """
    Activity ORM model for user-facing workspace timeline activity feeds.
    """

    __tablename__ = "activities"

    workspace_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    activity_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    workspace = relationship("Workspace", lazy="selectin")
    user = relationship("User", lazy="selectin")
