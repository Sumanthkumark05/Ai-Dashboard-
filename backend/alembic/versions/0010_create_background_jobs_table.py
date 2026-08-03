"""create_background_jobs_table

Revision ID: 0010_create_background_jobs_table
Revises: 0009_create_files_and_folders_tables
Create Date: 2026-07-31 21:58:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from app.database.base import GUID

# revision identifiers, used by Alembic.
revision: str = "0010_create_background_jobs_table"
down_revision: Union[str, None] = "0009_create_files_and_folders_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "background_jobs",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("workspace_id", GUID(), nullable=False),
        sa.Column("created_by", GUID(), nullable=False),
        sa.Column("job_name", sa.String(length=100), nullable=False),
        sa.Column("queue_name", sa.String(length=50), nullable=False),
        sa.Column("task_id", sa.String(length=128), nullable=True),
        sa.Column(
            "status",
            sa.Enum("PENDING", "QUEUED", "RUNNING", "SUCCESS", "FAILED", "RETRYING", "CANCELLED", "EXPIRED", name="jobstatus"),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column(
            "priority",
            sa.Enum("CRITICAL", "HIGH", "NORMAL", "LOW", name="jobpriority"),
            nullable=False,
            server_default="NORMAL",
        ),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("error", sa.String(length=1000), nullable=True),
        sa.Column("traceback", sa.String(length=4000), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_background_jobs_workspace_id"), "background_jobs", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_background_jobs_created_by"), "background_jobs", ["created_by"], unique=False)
    op.create_index(op.f("ix_background_jobs_job_name"), "background_jobs", ["job_name"], unique=False)
    op.create_index(op.f("ix_background_jobs_queue_name"), "background_jobs", ["queue_name"], unique=False)
    op.create_index(op.f("ix_background_jobs_task_id"), "background_jobs", ["task_id"], unique=False)
    op.create_index(op.f("ix_background_jobs_status"), "background_jobs", ["status"], unique=False)
    op.create_index(op.f("ix_background_jobs_priority"), "background_jobs", ["priority"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_background_jobs_priority"), table_name="background_jobs")
    op.drop_index(op.f("ix_background_jobs_status"), table_name="background_jobs")
    op.drop_index(op.f("ix_background_jobs_task_id"), table_name="background_jobs")
    op.drop_index(op.f("ix_background_jobs_queue_name"), table_name="background_jobs")
    op.drop_index(op.f("ix_background_jobs_job_name"), table_name="background_jobs")
    op.drop_index(op.f("ix_background_jobs_created_by"), table_name="background_jobs")
    op.drop_index(op.f("ix_background_jobs_workspace_id"), table_name="background_jobs")
    op.drop_table("background_jobs")
