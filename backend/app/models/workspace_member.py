import uuid
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import MemberStatus, WorkspaceRole
from app.database.base import Base, GUID, TimestampMixin, UUIDMixin


class WorkspaceMember(Base, UUIDMixin, TimestampMixin):
    """
    WorkspaceMember ORM Model linking Users to Workspaces with workspace-level roles.
    """

    __tablename__ = "workspace_members"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role: Mapped[WorkspaceRole] = mapped_column(
        Enum(WorkspaceRole, values_callable=lambda obj: [e.value for e in obj]),
        default=WorkspaceRole.CONTRIBUTOR,
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
    last_accessed: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
