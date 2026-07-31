"""Create Datasets Tables Migration

Revision ID: 0007_create_datasets_tables
Revises: 0006_create_documents_tables
Create Date: 2026-07-31 00:07:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0007_create_datasets_tables"
down_revision: Union[str, None] = "0006_create_documents_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create datasets, dataset_versions, and dataset_tags tables."""
    ds_type_enum = sa.Enum("csv", "xlsx", "json", "parquet", "sql", "txt", "pdf", "docx", "markdown", "html", "xml", name="datasettype")
    ds_status_enum = sa.Enum("uploading", "ready", "processing", "failed", "archived", "deleted", name="datasetstatus")
    ds_proc_status_enum = sa.Enum("pending", "queued", "validating", "processing", "completed", "failed", name="datasetprocessingstatus")
    ds_visibility_enum = sa.Enum("private", "workspace", "organization", name="datasetvisibility")

    # 1. Datasets Table
    op.create_table(
        "datasets",
        sa.Column("id", sa.CHAR(36), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.CHAR(36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workspace_id", sa.CHAR(36), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("dataset_type", ds_type_enum, server_default="csv", nullable=False),
        sa.Column("source", sa.String(length=100), server_default="upload", nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("original_file_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("extension", sa.String(length=20), nullable=False),
        sa.Column("checksum", sa.String(length=128), nullable=False),
        sa.Column("language", sa.String(length=20), server_default="en", nullable=False),
        sa.Column("encoding", sa.String(length=30), server_default="utf-8", nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("record_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("column_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("schema_version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("visibility", ds_visibility_enum, server_default="workspace", nullable=False),
        sa.Column("status", ds_status_enum, server_default="ready", nullable=False),
        sa.Column("processing_status", ds_proc_status_enum, server_default="completed", nullable=False),
        sa.Column("is_favorite", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_datasets_id"), "datasets", ["id"], unique=False)
    op.create_index(op.f("ix_datasets_organization_id"), "datasets", ["organization_id"], unique=False)
    op.create_index(op.f("ix_datasets_workspace_id"), "datasets", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_datasets_uploaded_by"), "datasets", ["uploaded_by"], unique=False)
    op.create_index(op.f("ix_datasets_checksum"), "datasets", ["checksum"], unique=False)

    # 2. Dataset Versions Table
    op.create_table(
        "dataset_versions",
        sa.Column("id", sa.CHAR(36), primary_key=True, nullable=False),
        sa.Column("dataset_id", sa.CHAR(36), sa.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("checksum", sa.String(length=128), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("record_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("column_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_by", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_dataset_versions_id"), "dataset_versions", ["id"], unique=False)
    op.create_index(op.f("ix_dataset_versions_dataset_id"), "dataset_versions", ["dataset_id"], unique=False)

    # 3. Dataset Tags Table
    op.create_table(
        "dataset_tags",
        sa.Column("id", sa.CHAR(36), primary_key=True, nullable=False),
        sa.Column("dataset_id", sa.CHAR(36), sa.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_dataset_tags_id"), "dataset_tags", ["id"], unique=False)
    op.create_index(op.f("ix_dataset_tags_dataset_id"), "dataset_tags", ["dataset_id"], unique=False)
    op.create_index(op.f("ix_dataset_tags_tag"), "dataset_tags", ["tag"], unique=False)


def downgrade() -> None:
    """Drop datasets, dataset_versions, and dataset_tags tables."""
    op.drop_table("dataset_tags")
    op.drop_table("dataset_versions")
    op.drop_table("datasets")
