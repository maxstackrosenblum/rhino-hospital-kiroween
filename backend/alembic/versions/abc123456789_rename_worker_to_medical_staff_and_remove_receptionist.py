"""rename worker to medical_staff and remove receptionist

Revision ID: abc123456789
Revises: dd6918e75e16
Create Date: 2025-12-02 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'abc123456789'
down_revision = '97e19a832ff2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename workers table to medical_staff
    op.rename_table('workers', 'medical_staff')
    
    # Drop receptionists table
    op.drop_table('receptionists')
    
    # Update UserRole enum to remove RECEPTIONIST and rename WORKER to MEDICAL_STAFF
    # Drop the default temporarily
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    
    # Convert column to text temporarily
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE text")
    
    # Update any existing 'worker' or 'receptionist' values to 'medical_staff'
    op.execute("UPDATE users SET role = 'medical_staff' WHERE role IN ('worker', 'receptionist')")
    
    # Drop old enum type
    op.execute("DROP TYPE userrole")
    
    # Create new enum type
    op.execute("CREATE TYPE userrole AS ENUM ('undefined', 'admin', 'doctor', 'medical_staff')")
    
    # Convert column back to enum
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")
    
    # Restore the default
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'undefined'::userrole")


def downgrade() -> None:
    # Recreate receptionists table
    op.create_table('receptionists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('shift_schedule', sa.String(length=255), nullable=True),
        sa.Column('desk_number', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_receptionists_id'), 'receptionists', ['id'], unique=False)
    
    # Rename medical_staff back to workers
    op.rename_table('medical_staff', 'workers')
    
    # Restore old UserRole enum
    op.execute("ALTER TYPE userrole RENAME TO userrole_old")
    op.execute("CREATE TYPE userrole AS ENUM ('undefined', 'admin', 'doctor', 'receptionist', 'worker')")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::text::userrole")
    op.execute("DROP TYPE userrole_old")
