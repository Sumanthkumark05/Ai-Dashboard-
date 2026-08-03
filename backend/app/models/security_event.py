import uuid
from typing import Any, Dict, Optional
from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class SecurityEvent(Base, UUIDMixin, TimestampMixin):
    """
    SecurityEvent ORM model tracking security anomalies, brute force attempts, rate limits, and access violations.
    """

    __tablename__ = "security_events"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    workspace_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="SET NULL"), index=True, nullable=True
    )

    event_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="MEDIUM", index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)

    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    user = relationship("User", lazy="selectin")
    workspace = relationship("Workspace", lazy="selectin")
