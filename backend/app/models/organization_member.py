import uuid
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.constants import MemberStatus, UserRole
from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class OrganizationMember(Base, UUIDMixin, TimestampMixin):
    """
    OrganizationMember ORM Model linking Users to Organizations with tenant roles.
    """

    __tablename__ = "organization_members"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda obj: [e.value for e in obj]),
        default=UserRole.MEMBER,
        nullable=False,
    )
    status: Mapped[MemberStatus] = mapped_column(
        Enum(MemberStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=MemberStatus.ACTIVE,
        nullable=False,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
