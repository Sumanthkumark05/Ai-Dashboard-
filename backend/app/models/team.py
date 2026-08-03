import uuid
from typing import Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, GUID, SoftDeleteMixin, TimestampMixin, UUIDMixin


class Team(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Team ORM Model representing collaborative groups inside a Workspace.
    """

    __tablename__ = "teams"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    workspace = relationship("Workspace", backref="teams", lazy="selectin")
    owner = relationship("User", foreign_keys=[owner_id], lazy="selectin")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan", lazy="selectin")
    invitations = relationship("TeamInvitation", back_populates="team", cascade="all, delete-orphan", lazy="selectin")
