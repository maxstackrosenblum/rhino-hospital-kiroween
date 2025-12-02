"""add staff tables for receptionists and workers

Revision ID: rgmqjko6hdnp
Revises: 5c8a90954df7
Create Date: 2025-12-01 18:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'rgmqjko6hdnp'
down_revision = '5c8a90954df7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create receptionists table
    op.create_table('receptionists',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_receptionists_id'), 'receptionists', ['id'], unique=False)
    op.create_index('idx_receptionists_name', 'receptionists', ['first_name', 'last_name'], unique=False)
    
    # Create workers table
    op.create_table('workers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workers_id'), 'workers', ['id'], unique=False)
    op.create_index('idx_workers_name', 'workers', ['first_name', 'last_name'], unique=False)


def downgrade() -> None:
    # Drop workers table
    op.drop_index('idx_workers_name', table_name='workers')
    op.drop_index(op.f('ix_workers_id'), table_name='workers')
    op.drop_table('workers')
    
    # Drop receptionists table
    op.drop_index('idx_receptionists_name', table_name='receptionists')
    op.drop_index(op.f('ix_receptionists_id'), table_name='receptionists')
    op.drop_table('receptionists')
