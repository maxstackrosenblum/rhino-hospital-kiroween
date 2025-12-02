from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from enum import Enum
from typing import Optional

class UserRole(str, Enum):
    UNDEFINED = "undefined"
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: str | None
    last_name: str | None
    role: UserRole
    created_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    password: str | None = None
    role: UserRole | None = None

class AdminUserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole | None = None

class PaginatedUsersResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# Patient Schemas
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    gender: str
    phone: str
    city: str
    email: EmailStr
    age: int
    address: str

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()

    @validator('gender')
    def validate_gender(cls, v):
        valid_genders = ['male', 'female', 'other']
        if v.lower() not in valid_genders:
            raise ValueError('Gender must be one of: male, female, other')
        return v.lower()

    @validator('phone')
    def validate_phone(cls, v):
        if not v or not v.strip():
            raise ValueError('Phone number is required')
        # Remove spaces and special characters for validation
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


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    address: Optional[str] = None

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Name cannot be empty')
            if len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters long')
            return v.strip()
        return v

    @validator('gender')
    def validate_gender(cls, v):
        if v is not None:
            valid_genders = ['male', 'female', 'other']
            if v.lower() not in valid_genders:
                raise ValueError('Gender must be one of: male, female, other')
            return v.lower()
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


class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Doctor Schemas
class DoctorBase(BaseModel):
    doctor_id: str
    first_name: str
    last_name: str
    gender: str
    phone: str
    city: str
    email: EmailStr
    age: int
    address: str
    qualification: str

    @validator('doctor_id')
    def validate_doctor_id(cls, v):
        if not v or not v.strip():
            raise ValueError('Doctor ID is required')
        if len(v.strip()) < 3:
            raise ValueError('Doctor ID must be at least 3 characters long')
        return v.strip().upper()

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()

    @validator('gender')
    def validate_gender(cls, v):
        valid_genders = ['male', 'female', 'other']
        if v.lower() not in valid_genders:
            raise ValueError('Gender must be one of: male, female, other')
        return v.lower()

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

    @validator('city', 'address', 'qualification')
    def validate_required_fields(cls, v):
        if not v or not v.strip():
            raise ValueError('This field is required')
        return v.strip()


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    doctor_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    address: Optional[str] = None
    qualification: Optional[str] = None

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

    @validator('gender')
    def validate_gender(cls, v):
        if v is not None:
            valid_genders = ['male', 'female', 'other']
            if v.lower() not in valid_genders:
                raise ValueError('Gender must be one of: male, female, other')
            return v.lower()
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

    @validator('city', 'address', 'qualification')
    def validate_required_fields(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('This field cannot be empty')
            return v.strip()
        return v


class DoctorResponse(DoctorBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
