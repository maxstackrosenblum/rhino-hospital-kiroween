"""merge_migration_heads

Revision ID: 90d4fe9a91ae
Revises: abc123456789, b2c3d4e5f6g7
Create Date: 2025-12-03 04:15:03.732107

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '90d4fe9a91ae'
down_revision = ('abc123456789', 'b2c3d4e5f6g7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
