"""add refresh token to sessions

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2024-12-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('sessions', sa.Column('refresh_jti', sa.String(), nullable=True))
    op.add_column('sessions', sa.Column('refresh_expires_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_sessions_refresh_jti'), 'sessions', ['refresh_jti'], unique=True)

def downgrade() -> None:
    op.drop_index(op.f('ix_sessions_refresh_jti'), table_name='sessions')
    op.drop_column('sessions', 'refresh_expires_at')
    op.drop_column('sessions', 'refresh_jti')
