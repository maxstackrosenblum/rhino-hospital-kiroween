"""add_soft_delete_to_users

Revision ID: e3ae2dd02050
Revises: e30ab4c2dc0c
Create Date: 2025-12-02 10:49:11.288126

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e3ae2dd02050'
down_revision = 'e30ab4c2dc0c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'deleted_at')
