from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from enum import Enum

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


# Staff Management Schemas

class StaffCreate(BaseModel):
    """Schema for creating a new staff member (receptionist or worker)"""
    first_name: str
    last_name: str
    phone: str

    @field_validator('first_name', 'last_name', 'phone')
    @classmethod
    def not_empty(cls, v: str) -> str:
        """Validate that fields are not empty or whitespace-only"""
        if not v or not v.strip():
            raise ValueError('Field cannot be empty or whitespace-only')
        return v.strip()


class StaffUpdate(BaseModel):
    """Schema for updating an existing staff member"""
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None

    @field_validator('first_name', 'last_name', 'phone')
    @classmethod
    def not_empty_if_provided(cls, v: str | None) -> str | None:
        """Validate that fields are not empty or whitespace-only if provided"""
        if v is not None and (not v or not v.strip()):
            raise ValueError('Field cannot be empty or whitespace-only')
        return v.strip() if v else None


class StaffResponse(BaseModel):
    """Schema for staff member response"""
    id: int
    first_name: str
    last_name: str
    phone: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StaffListResponse(BaseModel):
    """Schema for list of staff members"""
    items: list[StaffResponse]
    total: int
