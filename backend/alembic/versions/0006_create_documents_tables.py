"""Create Documents Tables Migration

Revision ID: 0006_create_documents_tables
Revises: 0005_create_workspaces_tables
Create Date: 2026-07-31 00:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0006_create_documents_tables"
down_revision: Union[str, None] = "0005_create_workspaces_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create documents, document_versions, and document_tags tables."""
    doc_status_enum = sa.Enum("uploading", "processing", "ready", "failed", "archived", name="documentstatus")
    doc_visibility_enum = sa.Enum("private", "workspace", "organization", name="documentvisibility")
    doc_proc_status_enum = sa.Enum("pending", "queued", "processing", "completed", "failed", name="documentprocessingstatus")

    # 1. Documents Table
    op.create_table(
        "documents",
        sa.Column("id", sa.CHAR(36), primary_key=True, nullable=False),
        sa.Column("workspace_id", sa.CHAR(36), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.CHAR(36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("original_file_name", sa.String(length=255), nullable=False),
        sa.Column("file_extension", sa.String(length=20), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("checksum", sa.String(length=128), nullable=False),
        sa.Column("language", sa.String(length=20), server_default="en", nullable=False),
        sa.Column("category", sa.String(length=100), server_default="uncategorized", nullable=False),
        sa.Column("status", doc_status_enum, server_default="ready", nullable=False),
        sa.Column("visibility", doc_visibility_enum, server_default="workspace", nullable=False),
        sa.Column("processing_status", doc_proc_status_enum, server_default="completed", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_favorite", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_documents_id"), "documents", ["id"], unique=False)
    op.create_index(op.f("ix_documents_workspace_id"), "documents", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_documents_organization_id"), "documents", ["organization_id"], unique=False)
    op.create_index(op.f("ix_documents_uploaded_by"), "documents", ["uploaded_by"], unique=False)
    op.create_index(op.f("ix_documents_checksum"), "documents", ["checksum"], unique=False)

    # 2. Document Versions Table
    op.create_table(
        "document_versions",
        sa.Column("id", sa.CHAR(36), primary_key=True, nullable=False),
        sa.Column("document_id", sa.CHAR(36), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("checksum", sa.String(length=128), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_document_versions_id"), "document_versions", ["id"], unique=False)
    op.create_index(op.f("ix_document_versions_document_id"), "document_versions", ["document_id"], unique=False)

    # 3. Document Tags Table
    op.create_table(
        "document_tags",
        sa.Column("id", sa.CHAR(36), primary_key=True, nullable=False),
        sa.Column("document_id", sa.CHAR(36), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_document_tags_id"), "document_tags", ["id"], unique=False)
    op.create_index(op.f("ix_document_tags_document_id"), "document_tags", ["document_id"], unique=False)
    op.create_index(op.f("ix_document_tags_tag"), "document_tags", ["tag"], unique=False)


def downgrade() -> None:
    """Drop documents, document_versions, and document_tags tables."""
    op.drop_table("document_tags")
    op.drop_table("document_versions")
    op.drop_table("documents")
