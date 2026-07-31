"""Create Workspaces Tables Migration

Revision ID: 0005_create_workspaces_tables
Revises: 0004_create_organizations_tables
Create Date: 2026-07-31 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0005_create_workspaces_tables"
down_revision: Union[str, None] = "0004_create_organizations_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create workspaces and workspace_members tables."""
    ws_visibility_enum = sa.Enum("private", "internal", "public", name="workspacevisibility")
    ws_status_enum = sa.Enum("active", "archived", "suspended", name="workspacestatus")
    ws_role_enum = sa.Enum("owner", "admin", "editor", "contributor", "viewer", name="workspacerole")
    member_status_enum = sa.Enum("pending", "active", "removed", "suspended", name="memberstatus", create_type=False)

    # 1. Workspaces Table
    op.create_table(
        "workspaces",
        sa.Column("id", sa.CHAR(36), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.CHAR(36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("icon", sa.String(length=100), nullable=True),
        sa.Column("color", sa.String(length=30), nullable=True),
        sa.Column("visibility", ws_visibility_enum, server_default="internal", nullable=False),
        sa.Column("status", ws_status_enum, server_default="active", nullable=False),
        sa.Column("created_by", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("storage_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("storage_limit", sa.Integer(), server_default="10240", nullable=False),
        sa.Column("dataset_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("document_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("chat_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("member_count", sa.Integer(), server_default="1", nullable=False),
        sa.Column("last_activity", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_workspaces_id"), "workspaces", ["id"], unique=False)
    op.create_index(op.f("ix_workspaces_organization_id"), "workspaces", ["organization_id"], unique=False)
    op.create_index(op.f("ix_workspaces_slug"), "workspaces", ["slug"], unique=False)

    # 2. Workspace Members Table
    op.create_table(
        "workspace_members",
        sa.Column("id", sa.CHAR(36), primary_key=True, nullable=False),
        sa.Column("workspace_id", sa.CHAR(36), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", ws_role_enum, server_default="contributor", nullable=False),
        sa.Column("status", member_status_enum, server_default="active", nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_accessed", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_workspace_members_id"), "workspace_members", ["id"], unique=False)
    op.create_index(op.f("ix_workspace_members_workspace_id"), "workspace_members", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_workspace_members_user_id"), "workspace_members", ["user_id"], unique=False)


def downgrade() -> None:
    """Drop workspaces and workspace_members tables."""
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
