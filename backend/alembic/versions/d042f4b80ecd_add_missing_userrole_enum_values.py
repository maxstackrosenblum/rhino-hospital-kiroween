"""add_missing_userrole_enum_values

Revision ID: d042f4b80ecd
Revises: 90d4fe9a91ae
Create Date: 2025-12-03 04:34:07.603817

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd042f4b80ecd'
down_revision = '90d4fe9a91ae'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing enum values to userrole type
    # Note: ALTER TYPE ADD VALUE cannot be run inside a transaction block in PostgreSQL
    # These values may already exist, so we use IF NOT EXISTS (PostgreSQL 9.1+)
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'patient'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'receptionist'")


def downgrade() -> None:
    # Note: PostgreSQL does not support removing enum values
    # This would require recreating the enum type and all dependent columns
    pass
