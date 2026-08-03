"""Update UserRole Enum Values Migration

Revision ID: 0014_update_userrole_enum
Revises: 0013_create_admin_tables
Create Date: 2026-08-01 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0014_update_userrole_enum"
down_revision: Union[str, None] = "0013_create_admin_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Adds missing Enum values to the PostgreSQL 'userrole' type:
    'super_admin', 'owner', 'manager', 'editor'.
    """
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'super_admin'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'owner'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'manager'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'editor'")


def downgrade() -> None:
    """Downgrade strategy."""
    pass
