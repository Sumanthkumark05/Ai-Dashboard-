import uuid
from typing import Optional
from sqlalchemy import Boolean, Enum, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.constants import OrganizationPlan
from app.database.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin


class Organization(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Organization ORM Model representing tenant organizations in the multi-tenant SaaS application.
    """

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)

    plan: Mapped[OrganizationPlan] = mapped_column(
        Enum(OrganizationPlan, values_callable=lambda obj: [e.value for e in obj]),
        default=OrganizationPlan.FREE,
        nullable=False,
    )
    storage_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Storage used in MB
    storage_limit: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)  # Storage limit in MB
    member_limit: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    workspace_limit: Mapped[int] = mapped_column(Integer, default=100, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_by: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
