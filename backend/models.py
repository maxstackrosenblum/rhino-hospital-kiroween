from sqlalchemy import Column, Integer, String, DateTime, Index, Enum, ForeignKey, Text, ForeignKey, JSON, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database import Base
import enum

# Junction table for hospitalization-doctor many-to-many relationship
hospitalization_doctors = Table(
    'hospitalization_doctors',
    Base.metadata,
    Column('hospitalization_id', Integer, ForeignKey('hospitalizations.id', ondelete='CASCADE'), primary_key=True),
    Column('doctor_id', Integer, ForeignKey('doctors.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', DateTime, server_default=func.now(), nullable=False)
)

class UserRole(str, enum.Enum):
    UNDEFINED = "undefined"
    ADMIN = "admin"
    DOCTOR = "doctor"
    MEDICAL_STAFF = "medical_staff"
    RECEPTIONIST = "receptionist"
    PATIENT = "patient"
    ACCOUNTANT = "accountant"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False, index=True)
    last_name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)  # Optional for registration
    city = Column(String, nullable=True)   # Optional for registration
    age = Column(Integer, nullable=True)   # Optional for registration
    address = Column(Text, nullable=True)  # Optional for registration
    gender = Column(String, nullable=True) # Optional for registration - Gender enum
    hashed_password = Column(String, nullable=False)
    password_change_required = Column(Boolean, default=False, nullable=False, index=True)
    role = Column(String, nullable=False, index=True)  # UserRole enum
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)
    reset_token = Column(String, nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # Email preferences (JSON field for granular control)
    email_preferences = Column(JSON, nullable=False, default={
        "appointment_updates": True,
        "blood_pressure_alerts": True
    })

    # Relationship
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

    # Relationships
    patient = relationship("Patient", back_populates="user", uselist=False)
    doctor = relationship("Doctor", back_populates="user", uselist=False)
    medical_staff = relationship("MedicalStaff", back_populates="user", uselist=False)

    __table_args__ = (
        Index('ix_users_role_deleted', 'role', 'deleted_at'),
    )


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    medical_record_number = Column(String, unique=True, nullable=True, index=True)
    emergency_contact = Column(String, nullable=True)
    insurance_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)

    # Relationships
    user = relationship("User", back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(String, unique=True, nullable=False, index=True)
    qualifications = Column(JSON, nullable=False)  # List of qualifications
    department = Column(String, nullable=True, index=True)
    specialization = Column(String, nullable=True, index=True)
    license_number = Column(String, unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)
    # Relationships
    user = relationship("User", back_populates="doctor")

    __table_args__ = (
        Index('ix_doctors_dept_spec_deleted', 'department', 'specialization', 'deleted_at'),
    )


class MedicalStaff(Base):
    __tablename__ = "medical_staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True, index=True)
    job_title = Column(String(100), nullable=True, index=True)
    department = Column(String(100), nullable=True, index=True)
    shift_schedule = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)

    # Relationship to User
    user = relationship("User", back_populates="medical_staff")


class Hospitalization(Base):
    __tablename__ = "hospitalizations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    admission_date = Column(DateTime, nullable=False, index=True)
    discharge_date = Column(DateTime, nullable=True, index=True)
    diagnosis = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)

    # Relationship to Patient
    patient = relationship("Patient", backref="hospitalizations")
    
    # Many-to-many relationship with doctors
    doctors = relationship("Doctor", secondary=hospitalization_doctors, backref="hospitalizations")

    __table_args__ = (
        Index('ix_hospitalizations_patient_deleted', 'patient_id', 'deleted_at'),
        Index('ix_hospitalizations_admission_deleted', 'admission_date', 'deleted_at'),
    )


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    medicines = Column(JSON, nullable=False)  # Array of medicine objects
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)

    # Relationship to Patient
    patient = relationship("Patient", backref="prescriptions")

    __table_args__ = (
        Index('ix_prescriptions_patient_date_deleted', 'patient_id', 'date', 'deleted_at'),
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    jti = Column(String, unique=True, index=True, nullable=False)  # JWT ID (access token)
    refresh_jti = Column(String, unique=True, index=True, nullable=True)  # Refresh token JTI
    device_info = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    refresh_expires_at = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True, index=True)
    
    # Relationship
    user = relationship("User", back_populates="sessions")

    __table_args__ = (
        Index('ix_sessions_user_revoked_expires', 'user_id', 'revoked_at', 'expires_at'),
    )


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    total_hours = Column(Integer, nullable=False)  # Total hours in minutes
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)

    # Relationship to User
    user = relationship("User", backref="shifts")

    __table_args__ = (
        Index('ix_shifts_user_date', 'user_id', 'date', 'deleted_at'),
        Index('ix_shifts_date_deleted', 'date', 'deleted_at'),
    )


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False, index=True)
    appointment_date = Column(DateTime, nullable=False, index=True)
    disease = Column(Text, nullable=False)
    status = Column(String, nullable=False, default=AppointmentStatus.PENDING.value, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)

    # Relationships
    patient = relationship("Patient", backref="appointments")
    doctor = relationship("Doctor", backref="appointments")

    __table_args__ = (
        Index('ix_appointments_patient_deleted', 'patient_id', 'deleted_at'),
        Index('ix_appointments_doctor_deleted', 'doctor_id', 'deleted_at'),
        Index('ix_appointments_date_deleted', 'appointment_date', 'deleted_at'),
        Index('ix_appointments_status_deleted', 'status', 'deleted_at'),
        Index('ix_appointments_doctor_date', 'doctor_id', 'appointment_date', 'deleted_at'),
    )


class BloodPressureReading(Base):
    """
    Blood Pressure Reading model for tracking user blood pressure measurements.
    Supports the Patient Blood Pressure Report system for monitoring and analysis.
    Users can track their BP without being hospital patients.
    """
    __tablename__ = "blood_pressure_checks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    systolic = Column(Integer, nullable=False, index=True)  # Systolic blood pressure (mmHg)
    diastolic = Column(Integer, nullable=True)  # Diastolic blood pressure (mmHg) - optional
    reading_date = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="blood_pressure_readings")

    __table_args__ = (
        Index('ix_bp_user_date', 'user_id', 'reading_date'),
    )
