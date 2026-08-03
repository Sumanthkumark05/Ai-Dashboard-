"""create_teams_tables

Revision ID: 0008_create_teams_tables
Revises: 0007_create_datasets_tables
Create Date: 2026-07-31 21:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from app.database.base import GUID

# revision identifiers, used by Alembic.
revision: str = "0008_create_teams_tables"
down_revision: Union[str, None] = "0007_create_datasets_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create teams table
    op.create_table(
        "teams",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("workspace_id", GUID(), nullable=False),
        sa.Column("owner_id", GUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("avatar", sa.String(length=500), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_teams_workspace_id"), "teams", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_teams_owner_id"), "teams", ["owner_id"], unique=False)
    op.create_index(op.f("ix_teams_name"), "teams", ["name"], unique=False)

    # 2. Create team_members table
    op.create_table(
        "team_members",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("team_id", GUID(), nullable=False),
        sa.Column("user_id", GUID(), nullable=False),
        sa.Column(
            "role",
            sa.Enum("OWNER", "ADMIN", "EDITOR", "VIEWER", name="teamrole"),
            nullable=False,
            server_default="VIEWER",
        ),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "INVITED", "PENDING", "REMOVED", name="teammemberstatus"),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_team_members_team_id"), "team_members", ["team_id"], unique=False)
    op.create_index(op.f("ix_team_members_user_id"), "team_members", ["user_id"], unique=False)
    op.create_index(op.f("ix_team_members_role"), "team_members", ["role"], unique=False)
    op.create_index(op.f("ix_team_members_status"), "team_members", ["status"], unique=False)

    # 3. Create team_invitations table
    op.create_table(
        "team_invitations",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("team_id", GUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column(
            "role",
            sa.Enum("OWNER", "ADMIN", "EDITOR", "VIEWER", name="teamrole"),
            nullable=False,
            server_default="VIEWER",
        ),
        sa.Column(
            "status",
            sa.Enum("PENDING", "ACCEPTED", "REJECTED", "EXPIRED", name="teaminvitationstatus"),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_team_invitations_team_id"), "team_invitations", ["team_id"], unique=False)
    op.create_index(op.f("ix_team_invitations_email"), "team_invitations", ["email"], unique=False)
    op.create_index(op.f("ix_team_invitations_token"), "team_invitations", ["token"], unique=True)
    op.create_index(op.f("ix_team_invitations_status"), "team_invitations", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_team_invitations_status"), table_name="team_invitations")
    op.drop_index(op.f("ix_team_invitations_token"), table_name="team_invitations")
    op.drop_index(op.f("ix_team_invitations_email"), table_name="team_invitations")
    op.drop_index(op.f("ix_team_invitations_team_id"), table_name="team_invitations")
    op.drop_table("team_invitations")

    op.drop_index(op.f("ix_team_members_status"), table_name="team_members")
    op.drop_index(op.f("ix_team_members_role"), table_name="team_members")
    op.drop_index(op.f("ix_team_members_user_id"), table_name="team_members")
    op.drop_index(op.f("ix_team_members_team_id"), table_name="team_members")
    op.drop_table("team_members")

    op.drop_index(op.f("ix_teams_name"), table_name="teams")
    op.drop_index(op.f("ix_teams_owner_id"), table_name="teams")
    op.drop_index(op.f("ix_teams_workspace_id"), table_name="teams")
    op.drop_table("teams")
