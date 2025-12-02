# Design Document

## Overview

The User Table Restructuring feature transforms the Hospital Management System from a fragmented user data model to a unified architecture. Currently, the system maintains separate user, patient, and doctor tables with significant data duplication. This design consolidates all users into a single `users` table with role-based differentiation, while maintaining specialized information in linked `patients` and `doctors` tables.

The restructured system will:

- Eliminate data duplication across user types
- Centralize user authentication and authorization
- Maintain referential integrity through foreign key relationships
- Support the new "patient" user role
- Preserve existing functionality while improving data consistency

## Architecture

### Current Architecture Issues

The existing system has these problems:

- **Data Duplication**: Common fields (name, email, phone, etc.) are duplicated across users, patients, and doctors tables
- **Inconsistent User Management**: Patients and doctors exist independently of the users table
- **Authentication Gaps**: Patients and doctors cannot authenticate as they're not in the users table
- **Role Limitations**: No "patient" role exists in the current UserRole enum

### New Unified Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │    Patients     │    │    Doctors      │
│                 │    │                 │    │                 │
│ id (PK)         │◄───┤ user_id (FK)    │    │ user_id (FK)    ├───►│
│ email           │    │ medical_record  │    │ doctor_id       │
│ username        │    │ emergency_contact│    │ qualification   │
│ first_name      │    │ insurance_info  │    │ department      │
│ last_name       │    │ created_at      │    │ specialization  │
│ phone           │    │ updated_at      │    │ license_number  │
│ city            │    │ deleted_at      │    │ created_at      │
│ age             │    └─────────────────┘    │ updated_at      │
│ address         │                           │ deleted_at      │
│ gender          │                           └─────────────────┘
│ hashed_password │
│ role            │
│ created_at      │
│ updated_at      │
│ deleted_at      │
└─────────────────┘
```

### Database Schema Changes

#### Updated Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    age INTEGER NOT NULL,
    address TEXT NOT NULL,
    gender VARCHAR NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    hashed_password VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_name ON users(first_name, last_name);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

#### Restructured Patients Table

```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medical_record_number VARCHAR UNIQUE,
    emergency_contact VARCHAR,
    insurance_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_medical_record ON patients(medical_record_number);
CREATE INDEX idx_patients_deleted_at ON patients(deleted_at);
```

#### Restructured Doctors Table

```sql
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id VARCHAR UNIQUE NOT NULL,
    qualifications JSON NOT NULL, -- JSON array of qualifications
    department VARCHAR,
    specialization VARCHAR,
    license_number VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_doctor_id ON doctors(doctor_id);
CREATE INDEX idx_doctors_department ON doctors(department);
CREATE INDEX idx_doctors_deleted_at ON doctors(deleted_at);
```

## Components and Interfaces

### Updated SQLAlchemy Models

#### User Model

```python
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"
    PATIENT = "patient"  # New role

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False, index=True)
    last_name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    city = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    address = Column(Text, nullable=False)
    gender = Column(String, nullable=False)  # Gender enum
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, index=True)  # UserRole enum
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None)

    # Relationships
    patient = relationship("Patient", back_populates="user", uselist=False)
    doctor = relationship("Doctor", back_populates="user", uselist=False)
```

#### Patient Model

```python
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    medical_record_number = Column(String, unique=True, nullable=True)
    emergency_contact = Column(String, nullable=True)
    insurance_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None)

    # Relationships
    user = relationship("User", back_populates="patient")
```

#### Doctor Model

```python
class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(String, unique=True, nullable=False, index=True)
    qualifications = Column(JSON, nullable=False)  # List of qualifications
    department = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    license_number = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None)

    # Relationships
    user = relationship("User", back_populates="doctor")
```

### Updated Pydantic Schemas

#### User Schemas

```python
class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"
    PATIENT = "patient"  # New role

class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    phone: str
    city: str
    age: int
    address: str
    gender: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
```

#### Patient Schemas

```python
class PatientSpecificBase(BaseModel):
    medical_record_number: str | None = None
    emergency_contact: str | None = None
    insurance_info: str | None = None

class PatientProfileCreate(PatientSpecificBase):
    """For users completing their patient profile"""
    pass

class PatientUpdate(BaseModel):
    # User fields
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: str | None = None

    # Patient-specific fields
    medical_record_number: str | None = None
    emergency_contact: str | None = None
    insurance_info: str | None = None

class PatientResponse(UserBase, PatientSpecificBase):
    id: int  # Patient table ID
    user_id: int  # User table ID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
```

#### Doctor Schemas

```python
class DoctorSpecificBase(BaseModel):
    doctor_id: str
    qualifications: list[str]  # List of qualifications
    department: str | None = None
    specialization: str | None = None
    license_number: str | None = None

class DoctorProfileCreate(DoctorSpecificBase):
    """For users completing their doctor profile"""
    pass

class DoctorUpdate(BaseModel):
    # User fields
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    age: int | None = None
    address: str | None = None
    gender: str | None = None

    # Doctor-specific fields
    doctor_id: str | None = None
    qualifications: list[str] | None = None  # List of qualifications
    department: str | None = None
    specialization: str | None = None
    license_number: str | None = None

class DoctorResponse(UserBase, DoctorSpecificBase):
    id: int  # Doctor table ID
    user_id: int  # User table ID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
```

## Data Models

### Data Flow for User and Profile Operations

#### Create Patient User (Admin)

```
1. Receive UserCreate request with role="patient"
2. Validate basic user data
3. Create User record with role="patient"
4. Return UserResponse (no patient-specific data yet)
```

#### Complete Patient Profile (User)

```
1. Receive PatientProfileCreate request
2. Validate user has role="patient" and no existing patient record
3. Begin database transaction
4. Create Patient record with user_id foreign key
5. Commit transaction
6. Return combined PatientResponse
```

#### Read Patient

```
1. Query patients table with JOIN to users table
2. Filter by patient ID or search criteria
3. Apply role-based access control
4. Return combined data as PatientResponse
```

#### Update Patient

```
1. Receive PatientUpdate request
2. Identify which fields belong to users vs patients table
3. Begin database transaction
4. Update users table with user-related fields
5. Update patients table with patient-specific fields
6. Update updated_at timestamps
7. Commit transaction
8. Return updated PatientResponse
```

#### Delete Patient

```
1. Begin database transaction
2. Soft delete patient record (set deleted_at)
3. Soft delete associated user record (set deleted_at)
4. Commit transaction
5. Return success confirmation
```

#### Create Doctor User (Admin)

```
1. Receive UserCreate request with role="doctor"
2. Validate basic user data
3. Create User record with role="doctor"
4. Return UserResponse (no doctor-specific data yet)
```

#### Complete Doctor Profile (User)

```
1. Receive DoctorProfileCreate request
2. Validate user has role="doctor" and no existing doctor record
3. Begin database transaction
4. Create Doctor record with user_id foreign key
5. Commit transaction
6. Return combined DoctorResponse
```

### Authentication Flow

```
1. User submits login credentials (username/password)
2. Query users table for username
3. Verify password hash
4. Generate JWT token with user_id and role
5. Return token for subsequent API calls
6. For role-specific operations, check user.role field
```

## Error Handling

### Database Constraint Violations

- **Unique Constraint Violations**: Return 409 Conflict for duplicate emails, usernames, doctor_ids
- **Foreign Key Violations**: Return 400 Bad Request for invalid user_id references
- **Check Constraint Violations**: Return 422 Unprocessable Entity for invalid enum values

### Transaction Management

- **Atomic Operations**: All create/update/delete operations use database transactions
- **Rollback on Failure**: Any failure in multi-table operations triggers complete rollback
- **Deadlock Handling**: Implement retry logic for database deadlocks

### Validation Errors

- **Schema Validation**: Pydantic validates all input data before database operations
- **Business Logic Validation**: Custom validators ensure data consistency
- **Cross-Table Validation**: Ensure role consistency between users and specialized tables

## Testing Strategy

### Database Migration Testing

1. **Migration Scripts**: Create Alembic migrations for schema changes
2. **Data Migration**: Script to migrate existing patient/doctor data to new structure
3. **Rollback Testing**: Verify migration rollback procedures
4. **Data Integrity**: Validate all foreign key relationships after migration

### API Testing

1. **CRUD Operations**: Test all create, read, update, delete operations
2. **Transaction Testing**: Verify atomic operations and rollback scenarios
3. **Role-Based Access**: Test access control with different user roles
4. **Error Scenarios**: Test constraint violations and error handling

### Integration Testing

1. **Authentication Flow**: Test login with new patient role
2. **Cross-Table Operations**: Test operations that span multiple tables
3. **Performance Testing**: Verify query performance with JOINs
4. **Data Consistency**: Validate referential integrity

## Security Considerations

### Access Control

- **Role-Based Authorization**: Enforce role-based access at API level
- **Resource Ownership**: Patients can only access their own data
- **Admin Privileges**: Admins have full access to all user types

### Data Protection

- **Password Security**: Continue using bcrypt for password hashing
- **Soft Deletes**: Maintain audit trail with soft delete functionality
- **Data Encryption**: Encrypt sensitive fields like medical records

### API Security

- **JWT Validation**: Validate tokens on all protected endpoints
- **Input Sanitization**: Sanitize all user inputs to prevent injection
- **Rate Limiting**: Implement rate limiting on authentication endpoints

## Performance Considerations

### Database Optimization

- **Indexing Strategy**: Create indexes on frequently queried fields
- **Query Optimization**: Use efficient JOINs for combined data retrieval
- **Connection Pooling**: Maintain database connection pools
- **Query Caching**: Cache frequently accessed user data

### API Performance

- **Response Optimization**: Return only necessary fields in API responses
- **Pagination**: Implement pagination for large result sets
- **Lazy Loading**: Load related data only when needed
- **Caching Strategy**: Cache user sessions and role information

## Database Recreation Strategy

Since this is a development branch not used by anyone, we can simply recreate the database tables with the new structure:

1. **Drop Existing Tables**: Remove current patients and doctors tables
2. **Update Users Table**: Add new fields (phone, city, age, address, gender) and patient role
3. **Create New Tables**: Create new patients and doctors tables with foreign key relationships
4. **Fresh Start**: No data migration needed - start with clean tables

## API Endpoint Changes

### User Management Endpoints (New)

```python
# POST /api/users - Create basic user account (admin only)
# GET /api/users - List all users (admin only)
# GET /api/users/{user_id} - Get user by ID
# PUT /api/users/{user_id} - Update user basic info
# PUT /api/users/{user_id}/role - Update user role (admin only)
# DELETE /api/users/{user_id} - Delete user (admin only)
```

### Patient Profile Endpoints (Updated)

```python
# POST /api/patients/profile - Complete patient profile (patient user only)
# GET /api/patients - List patients (JOINs users and patients tables)
# GET /api/patients/{patient_id} - Get patient (JOINs tables)
# PUT /api/patients/{patient_id} - Update patient profile (updates both tables)
# DELETE /api/patients/{patient_id} - Delete patient (admin only)
```

### Doctor Profile Endpoints (Updated)

```python
# POST /api/doctors/profile - Complete doctor profile (doctor user only)
# GET /api/doctors - List doctors (JOINs users and doctors tables)
# GET /api/doctors/{doctor_id} - Get doctor (JOINs tables)
# PUT /api/doctors/{doctor_id} - Update doctor profile (updates both tables)
# DELETE /api/doctors/{doctor_id} - Delete doctor (admin only)
```

This design provides a robust, scalable foundation for unified user management while maintaining the specialized functionality required for patients and doctors.
