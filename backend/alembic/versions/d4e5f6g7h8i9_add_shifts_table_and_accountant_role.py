"""add_shifts_table_and_accountant_role

Revision ID: d4e5f6g7h8i9
Revises: f9c530882135
Create Date: 2025-12-03 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e5f6g7h8i9'
down_revision = 'f9c530882135'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # Create shifts table
    op.create_table('shifts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('total_hours', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_shifts_id ON shifts (id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_shifts_user_id ON shifts (user_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_shifts_date ON shifts (date)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_shifts_deleted_at ON shifts (deleted_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_shifts_user_date ON shifts (user_id, date, deleted_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_shifts_date_deleted ON shifts (date, deleted_at)"))


def downgrade() -> None:
    conn = op.get_bind()
    
    # Drop indexes
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_shifts_date_deleted"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_shifts_user_date"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_shifts_deleted_at"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_shifts_date"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_shifts_user_id"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_shifts_id"))
    
    # Drop table
    op.drop_table('shifts')
