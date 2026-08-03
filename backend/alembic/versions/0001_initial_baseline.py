"""Initial Baseline Infrastructure Migration

Revision ID: 0001_initial_baseline
Revises: 
Create Date: 2026-07-30 23:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0001_initial_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Initial empty baseline migration.
    Also widens alembic_version.version_num to 64 chars so long revision IDs work.
    """
    op.execute(
        "ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(64)"
    )


def downgrade() -> None:
    """Downgrade baseline migration."""
    pass
