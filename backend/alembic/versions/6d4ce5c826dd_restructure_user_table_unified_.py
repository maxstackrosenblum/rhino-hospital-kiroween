"""restructure_user_table_unified_architecture

Revision ID: 6d4ce5c826dd
Revises: 7b328bb19b02
Create Date: 2025-12-02 13:10:18.254690

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6d4ce5c826dd'
down_revision = '7b328bb19b02'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing patients and doctors tables (development environment)
    op.drop_index('ix_patients_phone', table_name='patients')
    op.drop_index('ix_patients_last_name', table_name='patients')
    op.drop_index('ix_patients_id', table_name='patients')
    op.drop_index('ix_patients_first_name', table_name='patients')
    op.drop_index('ix_patients_email', table_name='patients')
    op.drop_table('patients')
    
    op.drop_index('ix_doctors_last_name', table_name='doctors')
    op.drop_index('ix_doctors_id', table_name='doctors')
    op.drop_index('ix_doctors_first_name', table_name='doctors')
    op.drop_index('ix_doctors_email', table_name='doctors')
    op.drop_index('ix_doctors_doctor_id', table_name='doctors')
    op.drop_table('doctors')
    
    # Update users table with new fields
    op.add_column('users', sa.Column('phone', sa.String(), nullable=False, server_default=''))
    op.add_column('users', sa.Column('city', sa.String(), nullable=False, server_default=''))
    op.add_column('users', sa.Column('age', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('address', sa.Text(), nullable=False, server_default=''))
    op.add_column('users', sa.Column('gender', sa.String(), nullable=False, server_default='other'))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Make first_name and last_name non-nullable
    op.alter_column('users', 'first_name', nullable=False, server_default='')
    op.alter_column('users', 'last_name', nullable=False, server_default='')
    
    # Remove server defaults after adding columns
    op.alter_column('users', 'phone', server_default=None)
    op.alter_column('users', 'city', server_default=None)
    op.alter_column('users', 'age', server_default=None)
    op.alter_column('users', 'address', server_default=None)
    op.alter_column('users', 'gender', server_default=None)
    op.alter_column('users', 'first_name', server_default=None)
    op.alter_column('users', 'last_name', server_default=None)
    
    # Create new patients table with foreign key to users
    op.create_table('patients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('medical_record_number', sa.String(), nullable=True),
        sa.Column('emergency_contact', sa.String(), nullable=True),
        sa.Column('insurance_info', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_patients_id', 'patients', ['id'], unique=False)
    op.create_index('ix_patients_user_id', 'patients', ['user_id'], unique=False)
    op.create_index('ix_patients_medical_record', 'patients', ['medical_record_number'], unique=True)
    op.create_index('ix_patients_deleted_at', 'patients', ['deleted_at'], unique=False)
    
    # Create new doctors table with foreign key to users
    op.create_table('doctors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.String(), nullable=False),
        sa.Column('qualifications', sa.JSON(), nullable=False),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('specialization', sa.String(), nullable=True),
        sa.Column('license_number', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_doctors_id', 'doctors', ['id'], unique=False)
    op.create_index('ix_doctors_user_id', 'doctors', ['user_id'], unique=False)
    op.create_index('ix_doctors_doctor_id', 'doctors', ['doctor_id'], unique=True)
    op.create_index('ix_doctors_department', 'doctors', ['department'], unique=False)
    op.create_index('ix_doctors_license_number', 'doctors', ['license_number'], unique=True)
    op.create_index('ix_doctors_deleted_at', 'doctors', ['deleted_at'], unique=False)


def downgrade() -> None:
    # Drop new tables
    op.drop_index('ix_doctors_deleted_at', table_name='doctors')
    op.drop_index('ix_doctors_license_number', table_name='doctors')
    op.drop_index('ix_doctors_department', table_name='doctors')
    op.drop_index('ix_doctors_doctor_id', table_name='doctors')
    op.drop_index('ix_doctors_user_id', table_name='doctors')
    op.drop_index('ix_doctors_id', table_name='doctors')
    op.drop_table('doctors')
    
    op.drop_index('ix_patients_deleted_at', table_name='patients')
    op.drop_index('ix_patients_medical_record', table_name='patients')
    op.drop_index('ix_patients_user_id', table_name='patients')
    op.drop_index('ix_patients_id', table_name='patients')
    op.drop_table('patients')
    
    # Remove new columns from users table
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'gender')
    op.drop_column('users', 'address')
    op.drop_column('users', 'age')
    op.drop_column('users', 'city')
    op.drop_column('users', 'phone')
    
    # Make first_name and last_name nullable again
    op.alter_column('users', 'first_name', nullable=True)
    op.alter_column('users', 'last_name', nullable=True)
    
    # Recreate old tables structure (simplified for downgrade)
    op.create_table('patients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('gender', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('city', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('address', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_patients_phone', 'patients', ['phone'], unique=False)
    op.create_index('ix_patients_last_name', 'patients', ['last_name'], unique=False)
    op.create_index('ix_patients_id', 'patients', ['id'], unique=False)
    op.create_index('ix_patients_first_name', 'patients', ['first_name'], unique=False)
    op.create_index('ix_patients_email', 'patients', ['email'], unique=False)
    
    op.create_table('doctors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('gender', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('city', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('address', sa.String(), nullable=False),
        sa.Column('qualification', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_doctors_last_name', 'doctors', ['last_name'], unique=False)
    op.create_index('ix_doctors_id', 'doctors', ['id'], unique=False)
    op.create_index('ix_doctors_first_name', 'doctors', ['first_name'], unique=False)
    op.create_index('ix_doctors_email', 'doctors', ['email'], unique=True)
    op.create_index('ix_doctors_doctor_id', 'doctors', ['doctor_id'], unique=True)
