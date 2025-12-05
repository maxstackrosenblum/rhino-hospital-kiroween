"""add_email_preferences_to_users

Revision ID: 98435330ef3e
Revises: 2fd50963c988
Create Date: 2025-12-05 01:06:03.480706

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '98435330ef3e'
down_revision = '2fd50963c988'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email_preferences column with default value
    op.add_column('users', sa.Column('email_preferences', sa.JSON(), nullable=False, 
                                      server_default='{"appointment_updates": true, "blood_pressure_alerts": true}'))


def downgrade() -> None:
    # Remove email_preferences column
    op.drop_column('users', 'email_preferences')
