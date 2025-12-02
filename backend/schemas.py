from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    UNDEFINED = "undefined"
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"
    WORKER = "worker"

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    password: str
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: str | None = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: str | None
    last_name: str | None
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: str | None = None
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
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: str | None = None
    password: str | None = None
    role: UserRole | None = None

class AdminUserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole | None = None

# Staff Management Schemas

class ReceptionistCreate(BaseModel):
    """Schema for creating a new receptionist"""
    user_id: int
    shift_schedule: str | None = None
    desk_number: str | None = None


class ReceptionistUpdate(BaseModel):
    """Schema for updating an existing receptionist"""
    shift_schedule: str | None = None
    desk_number: str | None = None


class ReceptionistResponse(BaseModel):
    """Schema for receptionist response"""
    id: int
    user_id: int
    shift_schedule: str | None
    desk_number: str | None
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


class WorkerCreate(BaseModel):
    """Schema for creating a new worker"""
    user_id: int
    job_title: str | None = None
    department: str | None = None
    shift_schedule: str | None = None


class WorkerUpdate(BaseModel):
    """Schema for updating an existing worker"""
    job_title: str | None = None
    department: str | None = None
    shift_schedule: str | None = None


class WorkerResponse(BaseModel):
    """Schema for worker response"""
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
