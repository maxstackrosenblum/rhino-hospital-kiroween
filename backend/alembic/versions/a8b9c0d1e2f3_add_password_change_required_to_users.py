"""add password_change_required to users

Revision ID: a8b9c0d1e2f3
Revises: f9c530882135
Create Date: 2024-12-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a8b9c0d1e2f3'
down_revision = 'd8706cfc50cf'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add password_change_required column to users table
    op.add_column('users', sa.Column('password_change_required', sa.Boolean(), nullable=False, server_default='false'))
    
    # Create index on password_change_required for efficient queries
    op.create_index(op.f('ix_users_password_change_required'), 'users', ['password_change_required'], unique=False)

def downgrade() -> None:
    # Drop index first
    op.drop_index(op.f('ix_users_password_change_required'), table_name='users')
    
    # Drop column
    op.drop_column('users', 'password_change_required')