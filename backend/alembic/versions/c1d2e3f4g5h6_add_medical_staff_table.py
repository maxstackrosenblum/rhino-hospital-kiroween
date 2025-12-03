"""add medical_staff table

Revision ID: c1d2e3f4g5h6
Revises: b2c3d4e5f6g7
Create Date: 2025-12-03 05:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c1d2e3f4g5h6'
down_revision = 'b2c3d4e5f6g7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create medical_staff table
    op.create_table('medical_staff',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('job_title', sa.String(length=100), nullable=True),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('shift_schedule', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_medical_staff_id'), 'medical_staff', ['id'], unique=False)
    op.create_index(op.f('ix_medical_staff_user_id'), 'medical_staff', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop medical_staff table
    op.drop_index(op.f('ix_medical_staff_user_id'), table_name='medical_staff')
    op.drop_index(op.f('ix_medical_staff_id'), table_name='medical_staff')
    op.drop_table('medical_staff')
