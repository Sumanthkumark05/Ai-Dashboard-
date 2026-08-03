import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import TeamMemberStatus, TeamRole
from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class TeamMember(Base, UUIDMixin, TimestampMixin):
    """
    TeamMember ORM Model linking users to teams with granular RBAC roles and status.
    """

    __tablename__ = "team_members"

    team_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("teams.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    role: Mapped[TeamRole] = mapped_column(
        Enum(TeamRole, values_callable=lambda obj: [e.value for e in obj]),
        default=TeamRole.VIEWER,
        index=True,
        nullable=False,
    )
    status: Mapped[TeamMemberStatus] = mapped_column(
        Enum(TeamMemberStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=TeamMemberStatus.ACTIVE,
        index=True,
        nullable=False,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    team = relationship("Team", back_populates="members", lazy="selectin")
    user = relationship("User", lazy="selectin")
