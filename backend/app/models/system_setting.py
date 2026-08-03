import uuid
from datetime import datetime
from typing import Any, Optional
from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class SystemSetting(Base, UUIDMixin, TimestampMixin):
    """
    SystemSetting ORM model storing key-value system configurations.
    """

    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    value: Mapped[Any] = mapped_column(JSON, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    updater = relationship("User", lazy="selectin")
