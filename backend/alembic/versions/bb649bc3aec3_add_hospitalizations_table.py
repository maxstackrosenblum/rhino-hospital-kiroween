"""add_hospitalizations_table

Revision ID: bb649bc3aec3
Revises: c1d2e3f4g5h6
Create Date: 2025-12-03 14:26:14.048547

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'bb649bc3aec3'
down_revision = 'c1d2e3f4g5h6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create hospitalizations table
    op.create_table('hospitalizations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('patient_id', sa.Integer(), nullable=False),
    sa.Column('admission_date', sa.DateTime(), nullable=False),
    sa.Column('discharge_date', sa.DateTime(), nullable=True),
    sa.Column('diagnosis', sa.Text(), nullable=False),
    sa.Column('summary', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hospitalizations_id'), 'hospitalizations', ['id'], unique=False)
    op.create_index(op.f('ix_hospitalizations_patient_id'), 'hospitalizations', ['patient_id'], unique=False)


def downgrade() -> None:
    # Drop hospitalizations table
    op.drop_index(op.f('ix_hospitalizations_patient_id'), table_name='hospitalizations')
    op.drop_index(op.f('ix_hospitalizations_id'), table_name='hospitalizations')
    op.drop_table('hospitalizations')
