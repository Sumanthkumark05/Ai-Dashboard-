import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class MaintenanceMode(Base, UUIDMixin, TimestampMixin):
    """
    MaintenanceMode ORM model tracking system maintenance state, broadcast messages, and schedule.
    """

    __tablename__ = "maintenance_modes"

    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    message: Mapped[str] = mapped_column(
        String(500), default="System is currently under scheduled maintenance.", nullable=False
    )
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    enabled_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    modifier = relationship("User", lazy="selectin")
