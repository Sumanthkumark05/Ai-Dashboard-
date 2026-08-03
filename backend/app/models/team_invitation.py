import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import TeamInvitationStatus, TeamRole
from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class TeamInvitation(Base, UUIDMixin, TimestampMixin):
    """
    TeamInvitation ORM Model representing invitations sent to user emails to join a Team.
    """

    __tablename__ = "team_invitations"

    team_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("teams.id", ondelete="CASCADE"), index=True, nullable=False
    )

    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)

    role: Mapped[TeamRole] = mapped_column(
        Enum(TeamRole, values_callable=lambda obj: [e.value for e in obj]),
        default=TeamRole.VIEWER,
        nullable=False,
    )
    status: Mapped[TeamInvitationStatus] = mapped_column(
        Enum(TeamInvitationStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=TeamInvitationStatus.PENDING,
        index=True,
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="invitations", lazy="selectin")
