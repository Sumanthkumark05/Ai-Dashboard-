import uuid
from typing import Any, Dict, Optional
from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class AuditLog(Base, UUIDMixin, TimestampMixin):
    """
    AuditLog ORM model storing immutable system audit events, entity diffs (before/after values), and user actions.
    """

    __tablename__ = "audit_logs"

    workspace_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="SET NULL"), index=True, nullable=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )

    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)

    old_value: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    new_value: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="SUCCESS", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    request_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationships
    workspace = relationship("Workspace", lazy="selectin")
    user = relationship("User", lazy="selectin")
