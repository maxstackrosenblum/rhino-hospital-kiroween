"""add_performance_indexes

Revision ID: f9c530882135
Revises: c86702282bb2
Create Date: 2025-12-03 18:03:47.672124

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f9c530882135'
down_revision = 'c86702282bb2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # Drop and recreate unique constraints as unique indexes
    # Doctors: license_number
    conn.execute(sa.text("ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_license_number_key"))
    conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_doctors_license_number ON doctors (license_number)"))
    
    # Patients: medical_record_number
    conn.execute(sa.text("ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_medical_record_number_key"))
    conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_patients_medical_record_number ON patients (medical_record_number)"))
    
    # Medical Staff: user_id
    conn.execute(sa.text("ALTER TABLE medical_staff DROP CONSTRAINT IF EXISTS medical_staff_user_id_key"))
    conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_medical_staff_user_id ON medical_staff (user_id)"))
    
    # Create single-column indexes
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_doctors_deleted_at ON doctors (deleted_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_doctors_department ON doctors (department)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_doctors_specialization ON doctors (specialization)"))
    
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hospitalizations_admission_date ON hospitalizations (admission_date)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hospitalizations_discharge_date ON hospitalizations (discharge_date)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hospitalizations_deleted_at ON hospitalizations (deleted_at)"))
    
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_medical_staff_deleted_at ON medical_staff (deleted_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_medical_staff_department ON medical_staff (department)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_medical_staff_job_title ON medical_staff (job_title)"))
    
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_patients_deleted_at ON patients (deleted_at)"))
    
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_prescriptions_date ON prescriptions (date)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_prescriptions_deleted_at ON prescriptions (deleted_at)"))
    
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_sessions_expires_at ON sessions (expires_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_sessions_revoked_at ON sessions (revoked_at)"))
    
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_users_deleted_at ON users (deleted_at)"))
    
    # Create composite indexes
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_doctors_dept_spec_deleted ON doctors (department, specialization, deleted_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hospitalizations_admission_deleted ON hospitalizations (admission_date, deleted_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hospitalizations_patient_deleted ON hospitalizations (patient_id, deleted_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_prescriptions_patient_date_deleted ON prescriptions (patient_id, date, deleted_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_sessions_user_revoked_expires ON sessions (user_id, revoked_at, expires_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_users_role_deleted ON users (role, deleted_at)"))
    
    # Drop unnecessary indexes on junction table (primary keys are already indexed)
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_hospitalization_doctors_doctor_id"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_hospitalization_doctors_hospitalization_id"))


def downgrade() -> None:
    conn = op.get_bind()
    
    # Drop composite indexes
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_users_role_deleted"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_sessions_user_revoked_expires"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_prescriptions_patient_date_deleted"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_hospitalizations_patient_deleted"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_hospitalizations_admission_deleted"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_doctors_dept_spec_deleted"))
    
    # Drop single-column indexes
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_users_deleted_at"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_sessions_revoked_at"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_sessions_expires_at"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_prescriptions_deleted_at"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_prescriptions_date"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_patients_deleted_at"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_medical_staff_job_title"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_medical_staff_department"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_medical_staff_deleted_at"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_hospitalizations_discharge_date"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_hospitalizations_deleted_at"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_hospitalizations_admission_date"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_doctors_specialization"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_doctors_department"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_doctors_deleted_at"))
    
    # Restore unique constraints (drop unique indexes first)
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_doctors_license_number"))
    conn.execute(sa.text("ALTER TABLE doctors ADD CONSTRAINT doctors_license_number_key UNIQUE (license_number)"))
    
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_patients_medical_record_number"))
    conn.execute(sa.text("ALTER TABLE patients ADD CONSTRAINT patients_medical_record_number_key UNIQUE (medical_record_number)"))
    
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_medical_staff_user_id"))
    conn.execute(sa.text("ALTER TABLE medical_staff ADD CONSTRAINT medical_staff_user_id_key UNIQUE (user_id)"))
    
    # Recreate junction table indexes
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hospitalization_doctors_hospitalization_id ON hospitalization_doctors (hospitalization_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hospitalization_doctors_doctor_id ON hospitalization_doctors (doctor_id)"))
