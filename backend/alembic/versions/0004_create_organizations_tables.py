from sqlalchemy.dialects import postgresql as pg_dialect
"""Create Organizations Tables Migration

Revision ID: 0004_create_organizations_tables
Revises: 0003_create_rbac_and_sessions
Create Date: 2026-07-30 23:58:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0004_create_organizations_tables"
down_revision: Union[str, None] = "0003_create_rbac_and_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create organizations, organization_members, and organization_invitations tables."""
    org_plan_enum = sa.Enum("free", "starter", "pro", "business", "enterprise", name="organizationplan")
    member_status_enum = sa.Enum("pending", "active", "removed", "suspended", name="memberstatus")
    invitation_status_enum = sa.Enum("pending", "accepted", "expired", "cancelled", name="invitationstatus")

    # 1. Organizations Table
    op.create_table(
        "organizations",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("industry", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("timezone", sa.String(length=50), server_default="UTC", nullable=False),
        sa.Column("plan", org_plan_enum, server_default="free", nullable=False),
        sa.Column("storage_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("storage_limit", sa.Integer(), server_default="1024", nullable=False),
        sa.Column("member_limit", sa.Integer(), server_default="5", nullable=False),
        sa.Column("workspace_limit", sa.Integer(), server_default="3", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_by", sa.dialects.postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_organizations_id"), "organizations", ["id"], unique=False)
    op.create_index(op.f("ix_organizations_slug"), "organizations", ["slug"], unique=True)
    op.create_index(op.f("ix_organizations_is_active"), "organizations", ["is_active"], unique=False)

    # 2. Organization Members Table
    user_role_enum = sa.Enum("super_admin", "owner", "admin", "manager", "editor", "member", "viewer", "service_account", name="userrole", create_type=False)

    op.create_table(
        "organization_members",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.dialects.postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("status", member_status_enum, server_default="active", nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_organization_members_id"), "organization_members", ["id"], unique=False)
    op.create_index(op.f("ix_organization_members_organization_id"), "organization_members", ["organization_id"], unique=False)
    op.create_index(op.f("ix_organization_members_user_id"), "organization_members", ["user_id"], unique=False)

    # 3. Organization Invitations Table
    op.create_table(
        "organization_invitations",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.dialects.postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", invitation_status_enum, server_default="pending", nullable=False),
        sa.Column("created_by", sa.dialects.postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_organization_invitations_id"), "organization_invitations", ["id"], unique=False)
    op.create_index(op.f("ix_organization_invitations_organization_id"), "organization_invitations", ["organization_id"], unique=False)
    op.create_index(op.f("ix_organization_invitations_email"), "organization_invitations", ["email"], unique=False)
    op.create_index(op.f("ix_organization_invitations_token"), "organization_invitations", ["token"], unique=True)


def downgrade() -> None:
    """Drop organizations, organization_members, and organization_invitations tables."""
    op.drop_table("organization_invitations")
    op.drop_table("organization_members")
    op.drop_table("organizations")
