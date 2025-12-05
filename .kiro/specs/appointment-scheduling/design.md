# Design Document

## Overview

The appointment scheduling system is a FastAPI-based REST API that manages medical appointments between patients and doctors. The system integrates with existing user authentication, doctor shift schedules, and email notification infrastructure. It provides role-based access control, automatic patient profile creation, shift-aware scheduling, and comprehensive appointment lifecycle management.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  - Appointment booking forms                                 │
│  - Doctor availability calendar                              │
│  - Appointment management dashboard                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                  FastAPI Backend                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Appointment Router (/api/appointments)              │   │
│  │  - POST /                Create appointment          │   │
│  │  - GET /                 List appointments           │   │
│  │  - GET /{id}             Get appointment             │   │
│  │  - PUT /{id}             Update appointment          │   │
│  │  - PATCH /{id}/status    Update status               │   │
│  │  - DELETE /{id}          Cancel appointment          │   │
│  │  - GET /available-doctors                            │   │
│  │  - GET /doctors/{id}/available-slots                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication & Authorization                       │   │
│  │  - JWT token validation                               │   │
│  │  - Role-based access control                          │   │
│  │  - User context injection                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic Layer                                 │   │
│  │  - Patient profile auto-creation                      │   │
│  │  - Shift validation                                   │   │
│  │  - Conflict detection                                 │   │
│  │  - Slot generation                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Email Service                                        │   │
│  │  - Appointment confirmation emails                    │   │
│  │  - Status update notifications                        │   │
│  │  - Email preference checking                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQLAlchemy ORM
┌─────────────────────▼───────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  - users (authentication, email preferences)                 │
│  - patients (medical records)                                │
│  - doctors (specializations, departments)                    │
│  - appointments (scheduling data)                            │
│  - shifts (doctor availability)                              │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with HTTPBearer
- **Email**: SMTP with HTML templates
- **Validation**: Pydantic schemas
- **Testing**: Pytest with Hypothesis for property-based testing

## Components and Interfaces

### 1. Authentication & Authorization

**Dependencies:**
- `require_appointment_access`: Validates JWT token, allows all authenticated users
- `require_appointment_management`: Validates JWT token, requires doctor or admin role

**Role-Based Filtering:**
- **Patient/Undefined**: Can only access their own appointments
- **Doctor**: Can only access appointments assigned to them
- **Admin**: Full access to all appointments

### 2. Patient Profile Management

**Function:** `get_or_create_patient(db: Session, user: User) -> Patient`

**Behavior:**
- Checks if user has existing patient profile
- If not, creates new patient with generated medical record number
- Updates user role from UNDEFINED to PATIENT if needed
- Returns patient object for appointment creation

**Medical Record Number Generation:**
```python
format: "MRN-{timestamp}-{user_id}-{random_hex}"
```

### 3. Appointment Creation

**Endpoint:** `POST /api/appointments`

**Request Schema:**
```python
{
  "doctor_id": int,
  "appointment_date": str (ISO format),
  "disease": str
}
```

**Validation Flow:**
1. Get or create patient profile for current user
2. Verify doctor exists and is not deleted
3. Parse appointment date to datetime
4. Verify doctor has shift on requested date
5. Verify appointment time within shift hours
6. Check for conflicting appointments
7. Create appointment with status "pending"
8. Send confirmation email (if preferences allow)

**Response:** 201 Created with full appointment details

### 4. Appointment Listing

**Endpoint:** `GET /api/appointments`

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Records per page (default: 10, max: 100)
- `patient_id`: Filter by patient
- `doctor_id`: Filter by doctor
- `status`: Filter by status (pending, confirmed, completed, cancelled)
- `date_from`: Filter from date (YYYY-MM-DD)
- `date_to`: Filter to date (YYYY-MM-DD)

**Response:**
```python
{
  "appointments": [...],
  "total": int,
  "page": int,
  "page_size": int,
  "total_pages": int
}
```

### 5. Doctor Availability

**Endpoint:** `GET /api/appointments/available-doctors?date=YYYY-MM-DD`

**Returns:** List of doctors with shifts on specified date, including:
- Doctor information (name, specialization, department)
- Shift times (start, end)
- Current appointment count for that date

**Endpoint:** `GET /api/appointments/doctors/{doctor_id}/available-slots?date=YYYY-MM-DD&slot_duration=30`

**Returns:**
- Doctor's shift information
- List of available time slots
- List of booked time slots
- Boolean indicating if doctor has shift

### 6. Appointment Updates

**Endpoint:** `PUT /api/appointments/{id}`

**Authorization:**
- Doctors can only update their own appointments
- Admins can update any appointment

**Validation:**
- Verify appointment exists
- If date changes, validate new shift and check conflicts
- Update fields and timestamp

**Endpoint:** `PATCH /api/appointments/{id}/status`

**Status Transitions:**
- pending → confirmed
- pending → cancelled
- confirmed → completed
- confirmed → cancelled

**Side Effects:**
- Sends status update email (if preferences allow)
- Logs email failures without failing the operation

### 7. Appointment Cancellation

**Endpoint:** `DELETE /api/appointments/{id}`

**Behavior:**
- Soft delete: Sets `deleted_at` timestamp
- Updates status to "cancelled"
- Returns 204 No Content

## Data Models

### Appointment Model

```python
class Appointment(Base):
    __tablename__ = "appointments"
    
    id: int (PK)
    patient_id: int (FK → patients.id)
    doctor_id: int (FK → doctors.id)
    appointment_date: datetime
    disease: str
    status: str (enum: pending, confirmed, completed, cancelled)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime (nullable, for soft delete)
    
    # Relationships
    patient: Patient
    doctor: Doctor
    
    # Indexes
    - (patient_id, deleted_at)
    - (doctor_id, deleted_at)
    - (appointment_date, deleted_at)
    - (status, deleted_at)
    - (doctor_id, appointment_date, deleted_at)
```

### Patient Model

```python
class Patient(Base):
    __tablename__ = "patients"
    
    id: int (PK)
    user_id: int (FK → users.id)
    medical_record_number: str (unique)
    emergency_contact: str (nullable)
    insurance_info: str (nullable)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime (nullable)
    
    # Relationships
    user: User
    appointments: List[Appointment]
```

### Doctor Model

```python
class Doctor(Base):
    __tablename__ = "doctors"
    
    id: int (PK)
    user_id: int (FK → users.id)
    doctor_id: str (unique)
    qualifications: JSON (list of strings)
    department: str (nullable)
    specialization: str (nullable)
    license_number: str (unique, nullable)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime (nullable)
    
    # Relationships
    user: User
    appointments: List[Appointment]
```

### Shift Model

```python
class Shift(Base):
    __tablename__ = "shifts"
    
    id: int (PK)
    user_id: int (FK → users.id)
    date: datetime
    start_time: datetime
    end_time: datetime
    total_hours: int (minutes)
    notes: str (nullable)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime (nullable)
    
    # Indexes
    - (user_id, date, deleted_at)
    - (date, deleted_at)
```

### User Model (Relevant Fields)

```python
class User(Base):
    __tablename__ = "users"
    
    id: int (PK)
    email: str (unique)
    role: str (enum: undefined, admin, doctor, patient, etc.)
    email_preferences: JSON {
        "appointment_updates": bool,
        "blood_pressure_alerts": bool
    }
    deleted_at: datetime (nullable)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Authentication token validation
*For any* API request with a JWT token in the Authorization header, the token validation should either succeed and attach user information to the request, or fail with appropriate error
**Validates: Requirements 1.1**

### Property 2: Role-based management access
*For any* appointment management operation (update, status change), only users with doctor or admin roles should be granted access
**Validates: Requirements 2.2**

### Property 3: Patient data isolation
*For any* patient or undefined user requesting appointment listings, the results should contain only appointments belonging to that user's patient profile
**Validates: Requirements 2.4**

### Property 4: Doctor data isolation
*For any* doctor requesting appointment listings, the results should contain only appointments assigned to that doctor
**Validates: Requirements 2.5**

### Property 5: Admin full access
*For any* admin user requesting appointment listings, the results should contain all appointments without filtering
**Validates: Requirements 2.6**

### Property 6: Required field validation
*For any* appointment creation request, if any required field (doctor_id, appointment_date, disease) is missing or empty, the request should be rejected with validation error
**Validates: Requirements 3.1**

### Property 7: Appointment conflict detection
*For any* appointment creation or update, if an existing non-deleted appointment with pending or confirmed status exists for the same doctor, date, and time, the operation should be rejected with 409 Conflict error
**Validates: Requirements 4.1**

### Property 8: Cancelled appointments don't block slots
*For any* time slot with a cancelled or deleted appointment, creating a new appointment for that slot should succeed without conflict
**Validates: Requirements 4.4**

### Property 9: Auto-create patient profile
*For any* user without a patient profile creating an appointment, a patient profile with generated medical record number should be automatically created
**Validates: Requirements 5.1**

### Property 10: Role promotion to patient
*For any* user with undefined role creating an appointment, the user role should be updated to patient
**Validates: Requirements 5.2**

### Property 11: Appointment creation completeness
*For any* valid appointment creation request, the created appointment should contain all provided fields (patient_id, doctor_id, appointment_date, disease) stored correctly in the database
**Validates: Requirements 5.3**

### Property 12: Default pending status
*For any* newly created appointment, the status should be set to "pending" by default
**Validates: Requirements 5.4**

### Property 13: Creation response completeness
*For any* successfully created appointment, the response should include complete appointment details with patient and doctor information
**Validates: Requirements 5.5**

### Property 14: Email preference respect for confirmations
*For any* appointment creation, a confirmation email should be sent if and only if the patient has appointment_updates email preference enabled
**Validates: Requirements 6.1**

### Property 15: Confirmation email completeness
*For any* confirmation email sent, the email content should include patient full name, appointment date/time, department, doctor information, disease, and unsubscribe link
**Validates: Requirements 6.2**

### Property 16: Email failure resilience
*For any* appointment creation where email sending fails, the appointment should still be created successfully
**Validates: Requirements 6.4**

### Property 17: Pagination correctness
*For any* appointment listing request with page and page_size parameters, the results should be correctly paginated with accurate total count and page calculations
**Validates: Requirements 7.1**

### Property 18: Listing response completeness
*For any* appointment in listing results, the response should include patient details (first_name, last_name, age, phone) and doctor information (first_name, last_name, specialization, department)
**Validates: Requirements 7.2**

### Property 19: Filter effectiveness
*For any* appointment listing request with filters (patient_id, doctor_id, status, date_from, date_to), the results should contain only appointments matching all specified filters
**Validates: Requirements 7.7**

### Property 20: Soft-delete exclusion
*For any* appointment listing request, the results should exclude all soft-deleted appointments, and appointments with deleted patients, doctors, or users
**Validates: Requirements 7.8**

### Property 21: Doctor ownership verification for updates
*For any* doctor attempting to update an appointment, the operation should succeed only if the appointment is assigned to that doctor
**Validates: Requirements 8.2**

### Property 22: Shift validation for appointment dates
*For any* appointment creation or update with a new date, the operation should succeed only if the doctor has a shift on that date and the time falls within shift hours
**Validates: Requirements 8.4, 10.1, 10.3**

### Property 23: Update field persistence
*For any* successful appointment update, all provided fields should be updated in the database and the updated_at timestamp should be set to current time
**Validates: Requirements 8.6**

### Property 24: Status enum validation
*For any* status update request, only valid status values from the enum (pending, confirmed, completed, cancelled) should be accepted
**Validates: Requirements 9.3**

### Property 25: Status update persistence
*For any* successful status update, both the status field and updated_at timestamp should be updated in the database
**Validates: Requirements 9.4**

### Property 26: Status change notifications
*For any* status update where the status actually changes and the patient has appointment_updates enabled, a status update email should be sent with old status, new status, and appointment details
**Validates: Requirements 9.5**

### Property 27: Doctor availability query accuracy
*For any* date, the available doctors query should return all and only non-deleted doctors who have non-deleted shifts scheduled on that date
**Validates: Requirements 11.1**

### Property 28: Available doctor response completeness
*For any* doctor in the available doctors response, the data should include doctor_id, user_id, first_name, last_name, specialization, department, shift_start, and shift_end
**Validates: Requirements 11.2**

### Property 29: Appointment count accuracy
*For any* doctor in the available doctors response, the total_appointments count should equal the number of pending and confirmed appointments for that doctor on that date
**Validates: Requirements 11.3**

### Property 30: Time slot generation correctness
*For any* doctor with a shift on a date, the generated time slots should cover the entire shift period from start to end time with intervals matching the slot_duration parameter
**Validates: Requirements 12.4**

### Property 31: Booked slot exclusion
*For any* time slot with an existing pending or confirmed appointment, that slot should appear in booked_slots list and not in available_slots list
**Validates: Requirements 12.5**

### Property 32: Slot response format
*For any* available slots response, it should contain separate available_slots and booked_slots lists with times in ISO format
**Validates: Requirements 12.6**

### Property 33: Patient access control for viewing
*For any* patient or undefined user attempting to view a specific appointment, access should be granted only if the appointment belongs to that user's patient profile
**Validates: Requirements 13.3**

### Property 34: Soft delete behavior
*For any* appointment cancellation, the appointment should have deleted_at timestamp set, status changed to cancelled, and should not appear in subsequent listing queries
**Validates: Requirements 14.6**

## Error Handling

### Validation Errors (400 Bad Request)
- Invalid date format in appointment_date
- Doctor not available on requested date
- Appointment time outside shift hours
- Invalid date format in query parameters

### Authentication Errors (401 Unauthorized)
- Missing JWT token
- Invalid or expired JWT token

### Authorization Errors (403 Forbidden)
- User role not authorized for operation
- Doctor attempting to access another doctor's appointment
- Patient attempting to access another patient's appointment

### Not Found Errors (404 Not Found)
- Doctor ID does not exist or is deleted
- Appointment ID does not exist or is deleted

### Conflict Errors (409 Conflict)
- Appointment slot already taken by pending or confirmed appointment

### Validation Errors (422 Unprocessable Entity)
- Disease field empty or whitespace only
- Required fields missing from request body

### Server Errors (500 Internal Server Error)
- Database connection failures
- Unexpected exceptions during processing
- Note: Email failures do NOT cause 500 errors

### Error Response Format
```json
{
  "detail": "Human-readable error message"
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Authentication & Authorization:**
- Missing token returns 401
- Invalid token returns 401
- Non-doctor/admin attempting management returns 403
- Patient accessing other patient's appointment returns 403

**Validation:**
- Empty disease field returns 422
- Invalid date format returns 400
- Non-existent doctor returns 404
- Whitespace-only fields rejected

**Shift Integration:**
- Appointment on date without shift returns 400
- Appointment outside shift hours returns 400

**Conflict Detection:**
- Duplicate appointment at same time returns 409
- Cancelled appointment doesn't block slot

**Soft Delete:**
- Deleted appointments excluded from listings
- Deleted doctors/patients excluded from results

**Email Preferences:**
- Email sent when preference enabled
- Email skipped when preference disabled
- Email failure doesn't fail operation

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **Hypothesis** library for Python.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `# Feature: appointment-scheduling, Property {number}: {property_text}`
- Tests should use smart generators that constrain to valid input space

**Test Categories:**

1. **Authentication Properties (Properties 1-2)**
   - Generate random valid/invalid tokens
   - Generate users with various roles
   - Verify access control rules hold universally

2. **Data Isolation Properties (Properties 3-5)**
   - Generate random appointments for multiple patients/doctors
   - Verify each user sees only their authorized data
   - Verify admins see all data

3. **Validation Properties (Properties 6, 24)**
   - Generate random appointment requests with missing/invalid fields
   - Generate random status values including invalid ones
   - Verify all invalid inputs rejected

4. **Conflict Detection Properties (Properties 7-8)**
   - Generate random overlapping appointments
   - Generate cancelled appointments and new appointments for same slots
   - Verify conflicts detected correctly

5. **Auto-Creation Properties (Properties 9-10)**
   - Generate users without patient profiles
   - Generate users with undefined roles
   - Verify profiles created and roles updated

6. **Data Persistence Properties (Properties 11-13, 23, 25)**
   - Generate random valid appointments
   - Verify all fields stored correctly
   - Verify timestamps updated on changes

7. **Email Properties (Properties 14-16, 26)**
   - Generate users with various email preferences
   - Simulate email failures
   - Verify emails sent/skipped correctly and failures don't break operations

8. **Pagination Properties (Property 17)**
   - Generate random numbers of appointments
   - Generate various page/page_size combinations
   - Verify pagination math correct

9. **Response Completeness Properties (Properties 13, 15, 18, 28, 32)**
   - Generate random appointments
   - Verify all required fields present in responses
   - Verify email content complete

10. **Filtering Properties (Properties 19-20)**
    - Generate random appointments with various attributes
    - Generate various filter combinations
    - Verify filters work correctly and deleted records excluded

11. **Access Control Properties (Properties 21, 33)**
    - Generate appointments for different doctors/patients
    - Verify ownership checks work correctly

12. **Shift Integration Properties (Property 22, 27, 30-31)**
    - Generate random shifts and appointments
    - Verify shift validation works
    - Verify slot generation correct
    - Verify available doctors query accurate

13. **Appointment Counting Property (Property 29)**
    - Generate random appointments for doctors
    - Verify counts accurate for each status

14. **Soft Delete Property (Property 34)**
    - Generate appointments and delete them
    - Verify soft delete behavior correct

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Appointment Lifecycle:**
   - User creates appointment → profile auto-created → email sent
   - Doctor updates status → email sent
   - Patient cancels → soft deleted

2. **Shift-Aware Scheduling:**
   - Query available doctors → create appointment → verify slot taken
   - Query available slots → book slot → verify no longer available

3. **Role-Based Workflows:**
   - Patient creates and views own appointments
   - Doctor manages assigned appointments
   - Admin manages all appointments

4. **Filter and Pagination:**
   - Create multiple appointments → filter by various criteria → verify results
   - Create many appointments → paginate through results → verify completeness

### Test Data Generators

**Hypothesis Strategies:**

```python
# User generator with various roles
@st.composite
def user_strategy(draw):
    role = draw(st.sampled_from([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN, UserRole.UNDEFINED]))
    email_prefs = draw(st.fixed_dictionaries({
        'appointment_updates': st.booleans(),
        'blood_pressure_alerts': st.booleans()
    }))
    return User(role=role, email_preferences=email_prefs, ...)

# Appointment generator with valid data
@st.composite
def appointment_strategy(draw):
    doctor_id = draw(st.integers(min_value=1, max_value=100))
    date = draw(st.datetimes(min_value=datetime.now(), max_value=datetime.now() + timedelta(days=365)))
    disease = draw(st.text(min_size=1, max_size=200).filter(lambda s: s.strip()))
    return AppointmentCreate(doctor_id=doctor_id, appointment_date=date.isoformat(), disease=disease)

# Shift generator aligned with appointment times
@st.composite
def shift_strategy(draw):
    date = draw(st.dates(min_value=date.today(), max_value=date.today() + timedelta(days=365)))
    start_hour = draw(st.integers(min_value=8, max_value=16))
    duration = draw(st.integers(min_value=4, max_value=10))
    return Shift(date=date, start_time=time(start_hour, 0), end_time=time(start_hour + duration, 0), ...)
```

### Test Execution

**Running Tests:**
```bash
# Run all tests
pytest backend/tests/

# Run only property tests
pytest backend/tests/ -m property

# Run with coverage
pytest backend/tests/ --cov=backend/routers/appointments --cov-report=html

# Run specific property test
pytest backend/tests/test_appointments_properties.py::test_property_7_conflict_detection -v
```

**Continuous Integration:**
- All tests run on every commit
- Property tests run with 100 iterations in CI
- Coverage threshold: 80% minimum

## Performance Considerations

### Database Optimization

**Indexes:**
- Composite index on (doctor_id, appointment_date, deleted_at) for conflict detection
- Index on (patient_id, deleted_at) for patient filtering
- Index on (status, deleted_at) for status filtering
- Index on (appointment_date, deleted_at) for date range queries

**Query Optimization:**
- Use eager loading for patient/doctor relationships to avoid N+1 queries
- Limit pagination to max 100 records per page
- Use database-level filtering for soft deletes

### Caching Strategy

**Potential Caching:**
- Doctor availability for specific dates (cache for 5 minutes)
- Available time slots (cache for 1 minute)
- User role and permissions (cache for session duration)

**Cache Invalidation:**
- Clear doctor availability cache when shifts change
- Clear slot cache when appointments created/cancelled
- Clear user cache when roles updated

### Scalability

**Horizontal Scaling:**
- Stateless API design allows multiple instances
- Database connection pooling for concurrent requests
- Async email sending to avoid blocking

**Load Handling:**
- Rate limiting on appointment creation (e.g., 10 per minute per user)
- Pagination prevents large result sets
- Background job queue for email sending

## Security Considerations

### Authentication
- JWT tokens with expiration
- Token validation on every request
- Secure token storage in HTTP-only cookies (frontend)

### Authorization
- Role-based access control enforced at API level
- Ownership verification for doctor/patient operations
- Admin-only operations clearly separated

### Data Protection
- Soft delete preserves audit trail
- Email preferences respected for GDPR compliance
- Unsubscribe links in all notification emails
- No sensitive data in logs

### Input Validation
- Pydantic schemas validate all inputs
- SQL injection prevented by ORM
- XSS prevention in email templates
- Date/time validation prevents invalid data

## Deployment Considerations

### Environment Variables
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=https://your-frontend.com
```

### Database Migrations
```bash
# Create migration for appointments table
alembic revision --autogenerate -m "Add appointments table"

# Apply migrations
alembic upgrade head
```

### Monitoring
- Log all appointment operations
- Track email sending success/failure rates
- Monitor API response times
- Alert on high error rates

### Backup Strategy
- Daily database backups
- Retain soft-deleted records for 90 days
- Point-in-time recovery capability
