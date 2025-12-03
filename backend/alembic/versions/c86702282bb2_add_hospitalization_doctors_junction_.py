"""add_hospitalization_doctors_junction_table

Revision ID: c86702282bb2
Revises: b8d7e0432427
Create Date: 2025-12-03 16:54:20.425870

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c86702282bb2'
down_revision = 'b8d7e0432427'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create junction table for hospitalization-doctor many-to-many relationship
    op.create_table(
        'hospitalization_doctors',
        sa.Column('hospitalization_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['hospitalization_id'], ['hospitalizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('hospitalization_id', 'doctor_id')
    )
    op.create_index('ix_hospitalization_doctors_hospitalization_id', 'hospitalization_doctors', ['hospitalization_id'])
    op.create_index('ix_hospitalization_doctors_doctor_id', 'hospitalization_doctors', ['doctor_id'])


def downgrade() -> None:
    op.drop_index('ix_hospitalization_doctors_doctor_id', table_name='hospitalization_doctors')
    op.drop_index('ix_hospitalization_doctors_hospitalization_id', table_name='hospitalization_doctors')
    op.drop_table('hospitalization_doctors')
