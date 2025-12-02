"""unified_user_patient_doctor_architecture

Revision ID: 15bd4d5d60e5
Revises: ba7525d9a8f9
Create Date: 2025-12-02 16:00:50.873715

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '15bd4d5d60e5'
down_revision = 'ba7525d9a8f9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update users table with new fields - make them nullable for registration
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(), nullable=True))
    op.add_column('users', sa.Column('age', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('gender', sa.String(), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Make first_name and last_name non-nullable (required for registration)
    op.alter_column('users', 'first_name', nullable=False, server_default='')
    op.alter_column('users', 'last_name', nullable=False, server_default='')
    
    # Remove server defaults after adding columns
    op.alter_column('users', 'first_name', server_default=None)
    op.alter_column('users', 'last_name', server_default=None)
    
    # Convert role from enum to string if needed
    op.alter_column('users', 'role', type_=sa.String(), existing_nullable=False)
    
    # Create patients table
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
    op.create_index('ix_patients_medical_record_number', 'patients', ['medical_record_number'], unique=True)
    op.create_index('ix_patients_deleted_at', 'patients', ['deleted_at'], unique=False)
    
    # Create doctors table
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
    op.create_index('ix_doctors_specialization', 'doctors', ['specialization'], unique=False)
    op.create_index('ix_doctors_license_number', 'doctors', ['license_number'], unique=True)
    op.create_index('ix_doctors_deleted_at', 'doctors', ['deleted_at'], unique=False)


def downgrade() -> None:
    # Drop doctors table
    op.drop_index('ix_doctors_deleted_at', table_name='doctors')
    op.drop_index('ix_doctors_license_number', table_name='doctors')
    op.drop_index('ix_doctors_specialization', table_name='doctors')
    op.drop_index('ix_doctors_department', table_name='doctors')
    op.drop_index('ix_doctors_doctor_id', table_name='doctors')
    op.drop_index('ix_doctors_user_id', table_name='doctors')
    op.drop_index('ix_doctors_id', table_name='doctors')
    op.drop_table('doctors')
    
    # Drop patients table
    op.drop_index('ix_patients_deleted_at', table_name='patients')
    op.drop_index('ix_patients_medical_record_number', table_name='patients')
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
    
    # Make first_name and last_name nullable again (if they were before)
    op.alter_column('users', 'first_name', nullable=True)
    op.alter_column('users', 'last_name', nullable=True)
