# Design Document

## Overview

This design modifies the GET endpoints for doctors and patients to show all users with doctor/patient roles, regardless of whether they have completed their profiles. This is a minimal change that leverages the existing user role system and profile completion endpoints without requiring architectural changes.

## Architecture

### Current Architecture (Maintained)

- Users are created with roles (doctor/patient) in the users table
- Profile completion creates separate records in doctors/patients tables
- Profile completion endpoints remain unchanged

### Simple Enhancement

- GET endpoints query users table by role and LEFT JOIN with profile tables
- Show profile completion status based on existence of profile records
- Maintain all existing functionality while improving visibility

## Components and Interfaces

### 1. Modified GET Endpoints Only

**Doctor Endpoints:**

- `GET /api/doctors/` → Modified to show all users with role="doctor"
- `GET /api/doctors/{user_id}` → Modified to accept user_id and show profile status
- All other endpoints remain unchanged

**Patient Endpoints:**

- `GET /api/patients/` → Modified to show all users with role="patient"
- `GET /api/patients/{user_id}` → Modified to accept user_id and show profile status
- All other endpoints remain unchanged

### 2. Query Logic Enhancement

**New Query Pattern:**

```python
# For doctors list
query = db.query(User).outerjoin(Doctor, User.id == Doctor.user_id).filter(
    and_(
        User.role == UserRole.DOCTOR,
        User.deleted_at.is_(None)
    )
)

# For patients list
query = db.query(User).outerjoin(Patient, User.id == Patient.user_id).filter(
    and_(
        User.role == UserRole.PATIENT,
        User.deleted_at.is_(None)
    )
)
```

### 3. Profile Completion Status Logic

**Completion Criteria:**

- **Profile Complete:** Corresponding record exists in doctors/patients table
- **Profile Incomplete:** No record in doctors/patients table

**Status Response Format:**

```json
{
  "id": null, // null if profile incomplete
  "user_id": 123,
  "profile_completed": false,
  "profile_completed_at": null,
  // User fields always present
  "email": "doctor@example.com",
  "first_name": "John",
  "last_name": "Doe",
  // Profile fields null if incomplete
  "doctor_id": null,
  "qualifications": null
}
```

## Data Models

### Enhanced Response Schemas

```python
class DoctorResponse(BaseModel):
    # Profile fields (nullable for incomplete profiles)
    id: Optional[int] = None
    doctor_id: Optional[str] = None
    qualifications: Optional[List[str]] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None

    # User fields (always present)
    user_id: int
    email: str
    username: str
    first_name: str
    last_name: str
    phone: str
    city: str
    age: int
    address: str
    gender: str
    role: str

    # Status fields
    profile_completed: bool
    profile_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

class PatientResponse(BaseModel):
    # Profile fields (nullable for incomplete profiles)
    id: Optional[int] = None
    medical_record_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    insurance_info: Optional[str] = None

    # User fields (always present)
    user_id: int
    email: str
    username: str
    first_name: str
    last_name: str
    phone: str
    city: str
    age: int
    address: str
    gender: str
    role: str

    # Status fields
    profile_completed: bool
    profile_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
```

## Error Handling

### Backward Compatibility

- Existing completed profiles continue to work unchanged
- Profile completion endpoints remain functional
- No breaking changes to existing API contracts

### Edge Cases

- Handle users with doctor/patient role but no profile gracefully
- Maintain proper sorting and pagination with mixed complete/incomplete profiles
- Ensure search functionality works across both user and profile fields

## Testing Strategy

### Unit Tests

- Test query logic for users with and without profiles
- Test response format for complete and incomplete profiles
- Test pagination and sorting with mixed profile states

### Integration Tests

- Verify all doctor users appear in doctors list regardless of profile status
- Verify all patient users appear in patients list regardless of profile status
- Test profile completion flow remains unchanged
- Test search functionality across user and profile fields

### API Tests

- Test GET /api/doctors/ returns users with role="doctor"
- Test GET /api/patients/ returns users with role="patient"
- Verify profile_completed field accuracy
- Test backward compatibility with existing completed profiles

## Migration Strategy

### No Database Changes Required

- Existing tables and relationships remain unchanged
- No migration scripts needed
- Zero downtime deployment possible

### Code Changes Only

1. Update GET endpoints query logic to use LEFT JOIN with users table
2. Update response schemas to include profile_completed field
3. Update frontend to handle new response format with completion status
4. All other endpoints remain unchanged

### Rollback Plan

- Simple code rollback to previous query logic
- No database changes to revert
- Existing functionality preserved
