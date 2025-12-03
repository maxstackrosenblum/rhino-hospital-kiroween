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
    ACCOUNTANT = "accountant"

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
    role: UserRole = UserRole.UNDEFINED

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
    phone: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    gender: Optional[Gender] = None
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
    phone: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    gender: Optional[Gender] = None
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


# Hospitalization Schemas
class HospitalizationCreate(BaseModel):
    patient_id: int
    admission_date: str  # ISO format datetime string
    discharge_date: str | None = None
    diagnosis: str
    summary: str | None = None
    doctor_ids: list[int] = []  # List of doctor IDs to assign

class HospitalizationUpdate(BaseModel):
    admission_date: str | None = None
    discharge_date: str | None = None
    diagnosis: str | None = None
    summary: str | None = None
    doctor_ids: list[int] | None = None  # List of doctor IDs to assign

class DoctorInfo(BaseModel):
    id: int
    doctor_id: str
    first_name: str
    last_name: str
    specialization: str | None = None

class HospitalizationResponse(BaseModel):
    id: int
    patient_id: int
    admission_date: datetime
    discharge_date: datetime | None
    diagnosis: str
    summary: str | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    # Patient info (computed fields)
    patient_first_name: str | None = None
    patient_last_name: str | None = None
    patient_age: int | None = None
    # Doctors assigned to this hospitalization
    doctors: list[DoctorInfo] = []
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# Prescription Schemas
class MedicineItem(BaseModel):
    name: str
    dosage: str | None = None
    frequency: str | None = None
    duration: str | None = None

class PrescriptionCreate(BaseModel):
    patient_id: int
    start_date: str  # ISO format datetime string
    end_date: str  # ISO format datetime string
    medicines: list[MedicineItem]

class PrescriptionUpdate(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
    medicines: list[MedicineItem] | None = None

class PrescriptionResponse(BaseModel):
    id: int
    patient_id: int
    date: datetime
    medicines: list[dict]  # JSON field
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    # Patient info (computed fields)
    patient_first_name: str | None = None
    patient_last_name: str | None = None
    patient_age: int | None = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class PrescriptionBulkCreateResponse(BaseModel):
    created_count: int
    prescriptions: list[PrescriptionResponse]


# Paginated Response Schemas for Hospitalizations and Prescriptions
class PaginatedHospitalizationsResponse(BaseModel):
    hospitalizations: list[HospitalizationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class PaginatedPrescriptionsResponse(BaseModel):
    prescriptions: list[PrescriptionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Shift Schemas
class ShiftCreate(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM or ISO format
    end_time: str  # HH:MM or ISO format
    notes: Optional[str] = None

class ShiftUpdate(BaseModel):
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None

class ShiftResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    start_time: datetime
    end_time: datetime
    total_hours: int  # in minutes
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    # User info (computed fields)
    user_first_name: Optional[str] = None
    user_last_name: Optional[str] = None
    user_role: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class PaginatedShiftsResponse(BaseModel):
    shifts: list[ShiftResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
