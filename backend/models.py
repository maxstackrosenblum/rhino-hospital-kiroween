from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base
import enum

class UserRole(str, enum.Enum):
    UNDEFINED = "undefined"
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="undefined", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False, index=True)
    last_name = Column(String, nullable=False, index=True)
    gender = Column(String, nullable=False)  # Gender enum: 'male', 'female', 'other'
    phone = Column(String, nullable=False, index=True)
    city = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    age = Column(Integer, nullable=False)
    address = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None)  # Soft delete


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(String, unique=True, nullable=False, index=True)  # Unique doctor identifier
    first_name = Column(String, nullable=False, index=True)
    last_name = Column(String, nullable=False, index=True)
    gender = Column(String, nullable=False)  # Gender enum: 'male', 'female', 'other'
    phone = Column(String, nullable=False)
    city = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    age = Column(Integer, nullable=False)
    address = Column(String, nullable=False)
    qualification = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None)  # Soft delete
