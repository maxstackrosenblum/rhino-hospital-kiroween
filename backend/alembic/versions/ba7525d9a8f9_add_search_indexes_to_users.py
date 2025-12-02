"""add_search_indexes_to_users

Revision ID: ba7525d9a8f9
Revises: e3ae2dd02050
Create Date: 2025-12-02 14:51:43.954466

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ba7525d9a8f9'
down_revision = 'e3ae2dd02050'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add indexes for search performance
    op.create_index('ix_users_first_name', 'users', ['first_name'])
    op.create_index('ix_users_last_name', 'users', ['last_name'])
    op.create_index('ix_users_role', 'users', ['role'])
    op.create_index('ix_users_deleted_at', 'users', ['deleted_at'])


def downgrade() -> None:
    op.drop_index('ix_users_deleted_at', 'users')
    op.drop_index('ix_users_role', 'users')
    op.drop_index('ix_users_last_name', 'users')
    op.drop_index('ix_users_first_name', 'users')
