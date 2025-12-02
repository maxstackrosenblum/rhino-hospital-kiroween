"""add_user_role

Revision ID: e30ab4c2dc0c
Revises: 5c8a90954df7
Create Date: 2025-12-01 19:17:45.743540

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e30ab4c2dc0c'
down_revision = '5c8a90954df7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type
    op.execute("CREATE TYPE userrole AS ENUM ('undefined', 'admin', 'doctor', 'receptionist')")
    
    # Add role column with default value
    op.add_column('users', sa.Column('role', sa.Enum('undefined', 'admin', 'doctor', 'receptionist', name='userrole'), nullable=False, server_default='undefined'))


def downgrade() -> None:
    # Drop role column
    op.drop_column('users', 'role')
    
    # Drop enum type
    op.execute("DROP TYPE userrole")
