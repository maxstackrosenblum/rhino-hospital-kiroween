"""merge_user_indexes_and_patient_doctor_tables

Revision ID: 7b328bb19b02
Revises: ba7525d9a8f9, e3e048dd019b
Create Date: 2025-12-02 11:26:59.469692

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7b328bb19b02'
down_revision = ('ba7525d9a8f9', 'e3e048dd019b')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
