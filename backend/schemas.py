from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from enum import Enum
from typing import Optional

class UserRole(str, Enum):
    UNDEFINED = "undefined"
    ADMIN = "admin"
    DOCTOR = "doctor"
    MEDICAL_STAFF = "medical_staff"
    RECEPTIONIST = "receptionist"
    PATIENT = "patient"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

# Base schemas for user creation (admin creates basic user accounts)
class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    phone: str
    city: str
    age: int
    address: str
    gender: Gender
    role: UserRole

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()

    @validator('phone')
    def validate_phone(cls, v):
        if not v or not v.strip():
            raise ValueError('Phone number is required')
        phone_digits = ''.join(filter(str.isdigit, v))
        if len(phone_digits) < 10:
            raise ValueError('Phone number must contain at least 10 digits')
        return v.strip()

    @validator('age')
    def validate_age(cls, v):
        if v < 0:
            raise ValueError('Age cannot be negative')
        if v > 150:
            raise ValueError('Age cannot be greater than 150')
        return v

    @validator('city', 'address')
    def validate_required_fields(cls, v):
        if not v or not v.strip():
            raise ValueError('This field is required')
        return v.strip()

class UserCreate(UserBase):
    """Schema for admin to create basic user accounts with role selection"""
    password: str
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: str | None = None
    role: UserRole | None = None

    @validator('password')
    def validate_password(cls, v):
        if not v or len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserRegister(BaseModel):
    """Schema for user self-registration with minimal required fields"""
    email: EmailStr
    username: str
    password: str
    first_name: str
    last_name: str
    # Optional fields for registration
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: Gender | None = None
    role: UserRole = UserRole.UNDEFINED

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()

    @validator('password')
    def validate_password(cls, v):
        if not v or len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Phone number cannot be empty if provided')
            phone_digits = ''.join(filter(str.isdigit, v))
            if len(phone_digits) < 10:
                raise ValueError('Phone number must contain at least 10 digits')
            return v.strip()
        return v

    @validator('age')
    def validate_age(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('Age cannot be negative')
            if v > 150:
                raise ValueError('Age cannot be greater than 150')
        return v

    @validator('city', 'address')
    def validate_optional_fields(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('This field cannot be empty if provided')
            return v.strip()
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: Gender | None = None
    role: UserRole
    created_at: datetime
    updated_at: datetime | None = None
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: Gender | None = None
    password: str | None = None
    role: UserRole | None = None

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Name cannot be empty')
            if len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters long')
            return v.strip()
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Phone number cannot be empty')
            phone_digits = ''.join(filter(str.isdigit, v))
            if len(phone_digits) < 10:
                raise ValueError('Phone number must contain at least 10 digits')
            return v.strip()
        return v

    @validator('age')
    def validate_age(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('Age cannot be negative')
            if v > 150:
                raise ValueError('Age cannot be greater than 150')
        return v

    @validator('city', 'address')
    def validate_required_fields(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('This field cannot be empty')
            return v.strip()
        return v

    @validator('password')
    def validate_password(cls, v):
        if v is not None and len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class AdminUserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: Gender | None = None
    role: UserRole | None = None
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Name cannot be empty')
            if len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters long')
            return v.strip()
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Phone number cannot be empty')
            phone_digits = ''.join(filter(str.isdigit, v))
            if len(phone_digits) < 10:
                raise ValueError('Phone number must contain at least 10 digits')
            return v.strip()
        return v

    @validator('age')
    def validate_age(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('Age cannot be negative')
            if v > 150:
                raise ValueError('Age cannot be greater than 150')
        return v

    @validator('city', 'address')
    def validate_required_fields(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('This field cannot be empty')
            return v.strip()
        return v

# Staff Management Schemas

class MedicalStaffCreate(BaseModel):
    """Schema for creating a new medical staff member"""
    user_id: int
    job_title: str | None = None
    department: str | None = None
    shift_schedule: str | None = None


class MedicalStaffUpdate(BaseModel):
    """Schema for updating an existing medical staff member"""
    job_title: str | None = None
    department: str | None = None
    shift_schedule: str | None = None


class MedicalStaffResponse(BaseModel):
    """Schema for medical staff response"""
    id: int
    user_id: int
    job_title: str | None
    department: str | None
    shift_schedule: str | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    # User information for display
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None

    class Config:
        from_attributes = True

class PaginatedUsersResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# Patient Schemas
class PatientSpecificBase(BaseModel):
    medical_record_number: str | None = None
    emergency_contact: str | None = None
    insurance_info: str | None = None

class PatientProfileCreate(PatientSpecificBase):
    """Schema for users completing their patient profile (no user creation)"""
    pass

class PatientProfileStatus(BaseModel):
    """Schema for tracking patient profile completion status"""
    user_id: int
    has_patient_profile: bool
    profile_completed_at: datetime | None = None
    
    class Config:
        from_attributes = True

class PatientUpdate(BaseModel):
    # User fields
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: Gender | None = None

    # Patient-specific fields
    medical_record_number: str | None = None
    emergency_contact: str | None = None
    insurance_info: str | None = None

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Name cannot be empty')
            if len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters long')
            return v.strip()
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Phone number cannot be empty')
            phone_digits = ''.join(filter(str.isdigit, v))
            if len(phone_digits) < 10:
                raise ValueError('Phone number must contain at least 10 digits')
            return v.strip()
        return v

    @validator('age')
    def validate_age(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('Age cannot be negative')
            if v > 150:
                raise ValueError('Age cannot be greater than 150')
        return v

    @validator('city', 'address')
    def validate_required_fields(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('This field cannot be empty')
            return v.strip()
        return v

class PatientResponse(BaseModel):
    # Profile fields (nullable for incomplete profiles)
    id: Optional[int] = None  # Patient table ID
    medical_record_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    insurance_info: Optional[str] = None

    # User fields (always present)
    user_id: int  # User table ID
    email: str
    username: str
    first_name: str
    last_name: str
    phone: str
    city: str
    age: int
    address: str
    gender: Gender
    role: UserRole

    # Status fields
    profile_completed: bool
    profile_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Doctor Schemas
class DoctorSpecificBase(BaseModel):
    doctor_id: str
    qualifications: list[str]
    department: str | None = None
    specialization: str | None = None
    license_number: str | None = None

    @validator('doctor_id')
    def validate_doctor_id(cls, v):
        if not v or not v.strip():
            raise ValueError('Doctor ID is required')
        if len(v.strip()) < 3:
            raise ValueError('Doctor ID must be at least 3 characters long')
        return v.strip().upper()

    @validator('qualifications')
    def validate_qualifications(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one qualification is required')
        # Remove empty strings and strip whitespace
        cleaned = [qual.strip() for qual in v if qual and qual.strip()]
        if not cleaned:
            raise ValueError('At least one valid qualification is required')
        return cleaned

class DoctorProfileCreate(DoctorSpecificBase):
    """Schema for users completing their doctor profile (no user creation)"""
    pass

class DoctorProfileStatus(BaseModel):
    """Schema for tracking doctor profile completion status"""
    user_id: int
    has_doctor_profile: bool
    profile_completed_at: datetime | None = None
    
    class Config:
        from_attributes = True

# Combined profile status schema
class ProfileCompletionStatus(BaseModel):
    """Schema for tracking overall profile completion status"""
    user_id: int
    role: UserRole
    has_role_specific_profile: bool
    profile_completed_at: datetime | None = None
    requires_profile_completion: bool
    
    class Config:
        from_attributes = True

class DoctorUpdate(BaseModel):
    # User fields
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: Gender | None = None

    # Doctor-specific fields
    doctor_id: str | None = None
    qualifications: list[str] | None = None
    department: str | None = None
    specialization: str | None = None
    license_number: str | None = None

    @validator('doctor_id')
    def validate_doctor_id(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Doctor ID cannot be empty')
            if len(v.strip()) < 3:
                raise ValueError('Doctor ID must be at least 3 characters long')
            return v.strip().upper()
        return v

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Name cannot be empty')
            if len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters long')
            return v.strip()
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Phone number cannot be empty')
            phone_digits = ''.join(filter(str.isdigit, v))
            if len(phone_digits) < 10:
                raise ValueError('Phone number must contain at least 10 digits')
            return v.strip()
        return v

    @validator('age')
    def validate_age(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('Age cannot be negative')
            if v > 150:
                raise ValueError('Age cannot be greater than 150')
        return v

    @validator('city', 'address')
    def validate_required_fields(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('This field cannot be empty')
            return v.strip()
        return v

    @validator('qualifications')
    def validate_qualifications(cls, v):
        if v is not None:
            if not v or len(v) == 0:
                raise ValueError('At least one qualification is required')
            # Remove empty strings and strip whitespace
            cleaned = [qual.strip() for qual in v if qual and qual.strip()]
            if not cleaned:
                raise ValueError('At least one valid qualification is required')
            return cleaned
        return v

class DoctorResponse(BaseModel):
    # Profile fields (nullable for incomplete profiles)
    id: Optional[int] = None  # Doctor table ID
    doctor_id: Optional[str] = None
    qualifications: Optional[list[str]] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None

    # User fields (always present)
    user_id: int  # User table ID
    email: str
    username: str
    first_name: str
    last_name: str
    phone: str
    city: str
    age: int
    address: str
    gender: Gender
    role: UserRole

    # Status fields
    profile_completed: bool
    profile_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Paginated Response Schemas
class PaginatedPatientsResponse(BaseModel):
    patients: list[PatientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class PaginatedDoctorsResponse(BaseModel):
    doctors: list[DoctorResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class SessionResponse(BaseModel):
    id: int
    device_info: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True

class RefreshTokenRequest(BaseModel):
    refresh_token: str
