"""merge migration heads

Revision ID: 10756ff88a4d
Revises: 025ef4f306e3, ba7525d9a8f9
Create Date: 2025-12-02 21:52:11.211376

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '10756ff88a4d'
down_revision = ('025ef4f306e3', 'ba7525d9a8f9')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
