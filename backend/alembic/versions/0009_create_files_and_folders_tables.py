"""create_files_and_folders_tables

Revision ID: 0009_create_files_and_folders_tables
Revises: 0008_create_teams_tables
Create Date: 2026-07-31 21:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from app.database.base import GUID

# revision identifiers, used by Alembic.
revision: str = "0009_create_files_and_folders_tables"
down_revision: Union[str, None] = "0008_create_teams_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create folders table
    op.create_table(
        "folders",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("workspace_id", GUID(), nullable=False),
        sa.Column("parent_folder_id", GUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("path", sa.String(length=500), nullable=False),
        sa.Column("created_by", GUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_folder_id"], ["folders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_folders_workspace_id"), "folders", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_folders_parent_folder_id"), "folders", ["parent_folder_id"], unique=False)

    # 2. Create stored_files table
    op.create_table(
        "stored_files",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("workspace_id", GUID(), nullable=False),
        sa.Column("owner_id", GUID(), nullable=False),
        sa.Column("folder_id", GUID(), nullable=True),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("stored_name", sa.String(length=255), nullable=False),
        sa.Column(
            "file_type",
            sa.Enum("IMAGE", "DOCUMENT", "DATASET", "AUDIO", "VIDEO", "ARCHIVE", "AI", "OTHER", name="filetypecategory"),
            nullable=False,
        ),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("extension", sa.String(length=20), nullable=False),
        sa.Column("size", sa.BigInteger(), nullable=False),
        sa.Column("storage_provider", sa.String(length=50), nullable=False, server_default="local"),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("public_url", sa.String(length=500), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column("checksum", sa.String(length=64), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["folder_id"], ["folders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_stored_files_workspace_id"), "stored_files", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_stored_files_owner_id"), "stored_files", ["owner_id"], unique=False)
    op.create_index(op.f("ix_stored_files_folder_id"), "stored_files", ["folder_id"], unique=False)
    op.create_index(op.f("ix_stored_files_file_type"), "stored_files", ["file_type"], unique=False)

    # 3. Create file_versions table
    op.create_table(
        "file_versions",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("file_id", GUID(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("size", sa.BigInteger(), nullable=False),
        sa.Column("uploaded_by", GUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["file_id"], ["stored_files.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_file_versions_file_id"), "file_versions", ["file_id"], unique=False)

    # 4. Create file_shares table
    op.create_table(
        "file_shares",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("file_id", GUID(), nullable=False),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", GUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["file_id"], ["stored_files.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_file_shares_file_id"), "file_shares", ["file_id"], unique=False)
    op.create_index(op.f("ix_file_shares_token"), "file_shares", ["token"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_file_shares_token"), table_name="file_shares")
    op.drop_index(op.f("ix_file_shares_file_id"), table_name="file_shares")
    op.drop_table("file_shares")

    op.drop_index(op.f("ix_file_versions_file_id"), table_name="file_versions")
    op.drop_table("file_versions")

    op.drop_index(op.f("ix_stored_files_file_type"), table_name="stored_files")
    op.drop_index(op.f("ix_stored_files_folder_id"), table_name="stored_files")
    op.drop_index(op.f("ix_stored_files_owner_id"), table_name="stored_files")
    op.drop_index(op.f("ix_stored_files_workspace_id"), table_name="stored_files")
    op.drop_table("stored_files")

    op.drop_index(op.f("ix_folders_parent_folder_id"), table_name="folders")
    op.drop_index(op.f("ix_folders_workspace_id"), table_name="folders")
    op.drop_table("folders")
