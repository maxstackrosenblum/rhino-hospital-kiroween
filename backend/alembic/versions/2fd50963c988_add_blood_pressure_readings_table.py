"""add blood pressure readings table

Revision ID: 2fd50963c988
Revises: a8b9c0d1e2f3
Create Date: 2025-12-04 22:51:40.967797

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2fd50963c988'
down_revision = 'a8b9c0d1e2f3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create blood_pressure_checks table
    op.create_table(
        'blood_pressure_checks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('systolic', sa.Integer(), nullable=False),
        sa.Column('diastolic', sa.Integer(), nullable=True),
        sa.Column('reading_date', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_blood_pressure_checks_id', 'blood_pressure_checks', ['id'])
    op.create_index('ix_blood_pressure_checks_user_id', 'blood_pressure_checks', ['user_id'])
    op.create_index('ix_blood_pressure_checks_systolic', 'blood_pressure_checks', ['systolic'])
    op.create_index('ix_blood_pressure_checks_reading_date', 'blood_pressure_checks', ['reading_date'])
    op.create_index('ix_bp_user_date', 'blood_pressure_checks', ['user_id', 'reading_date'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_bp_user_date', 'blood_pressure_checks')
    op.drop_index('ix_blood_pressure_checks_reading_date', 'blood_pressure_checks')
    op.drop_index('ix_blood_pressure_checks_systolic', 'blood_pressure_checks')
    op.drop_index('ix_blood_pressure_checks_user_id', 'blood_pressure_checks')
    op.drop_index('ix_blood_pressure_checks_id', 'blood_pressure_checks')
    
    # Drop table
    op.drop_table('blood_pressure_checks')
