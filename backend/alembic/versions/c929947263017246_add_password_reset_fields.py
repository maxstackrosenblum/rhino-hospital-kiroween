"""add password reset fields

Revision ID: c929947263017246
Revises: 15bd4d5d60e5
Create Date: 2024-12-02 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c929947263017246'
down_revision = '15bd4d5d60e5'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('users', sa.Column('reset_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_users_reset_token'), 'users', ['reset_token'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_users_reset_token'), table_name='users')
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
