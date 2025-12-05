# Design Document

## Overview

The User Blood Pressure Monitoring system is a web-based application that allows users to track their blood pressure readings, receive automated health recommendations, and view statistical summaries. The system integrates with the existing Hospital Management System infrastructure (FastAPI backend, React frontend, PostgreSQL database, JWT authentication, email system) and provides role-based access control for users and medical staff.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  - Blood pressure entry form                                 │
│  - Reading history with pagination                           │
│  - Statistical dashboard                                     │
│  - Filtering and search                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                  FastAPI Backend                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Blood Pressure Router (/api/blood-pressure)         │   │
│  │  - POST /                Create BP reading            │   │
│  │  - GET /                 List readings (paginated)    │   │
│  │  - GET /statistics       Get statistics               │   │
│  │  - DELETE /{id}          Delete reading               │   │
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
│  │  - BP reading validation (50-300 systolic)            │   │
│  │  - High-risk identification (>120 or <90)             │   │
│  │  - Statistical calculations                           │   │
│  │  - Email rate limiting (once per day)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Email Service                                        │   │
│  │  - Health recommendation emails                       │   │
│  │  - Email preference checking                          │   │
│  │  - Unsubscribe link generation                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQLAlchemy ORM
┌─────────────────────▼───────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  - users (authentication, email preferences)                 │
│  - blood_pressure_checks (BP readings)                       │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with HTTPBearer
- **Email**: SMTP with HTML templates
- **Frontend**: React with modern CSS
- **Validation**: Pydantic schemas

## Components and Interfaces

### 1. Authentication & Authorization

**Dependencies:**
- `require_blood_pressure_access`: Validates JWT token, allows all authenticated users
- `require_medical_staff`: Validates JWT token, requires medical staff/doctor/receptionist/admin role

**Role-Based Access:**
- **Regular Users**: Can only access their own BP readings
- **Medical Staff/Doctors/Receptionists/Admins**: Can access all users' BP readings with search and filters

### 2. Create BP Reading Endpoint

**Endpoint:** `POST /api/blood-pressure`

**Request Schema:**
```python
{
  "systolic": int (50-300),
  "diastolic": int (30-200, optional),
  "reading_date": datetime (optional, defaults to now)
}
```

**Process:**
1. Validate systolic (50-300 mmHg) and diastolic (30-200 mmHg if provided)
2. Default reading_date to current UTC time if not provided
3. Create BloodPressureReading with user_id from current_user
4. Calculate is_high_risk (systolic > 120)
5. Check if abnormal (systolic > 120 or < 90)
6. If abnormal and first reading of the day, send health recommendation email
7. Return 201 Created with reading details

**Response:** 201 Created with BloodPressureResponse

### 3. Health Recommendation Email

**Function:** `send_blood_pressure_recommendation(user, systolic, reading_date)`

**Logic:**
```python
if systolic > 120:
    send high BP recommendation
elif systolic < 90:
    send low BP recommendation
else:
    no email needed

# Rate limiting
if already_sent_email_today:
    skip email
```

**Email Content:**
- High BP: Recommendations for reducing BP (diet, exercise, stress management)
- Low BP: Recommendations for increasing BP (hydration, salt intake)
- Unsubscribe link for GDPR compliance

### 4. List BP Readings Endpoint

**Endpoint:** `GET /api/blood-pressure`

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Records per page (default: 10, max: 100)
- `search`: Search by user name or email (medical staff only)
- `date_from`: Filter from date (YYYY-MM-DD)
- `date_to`: Filter to date (YYYY-MM-DD)
- `high_risk_only`: Show only high-risk readings (boolean)

**Role-Based Filtering:**
- Regular users: See only their own readings
- Medical staff: See all readings with search capability

**Response:**
```python
{
  "readings": [...],
  "total": int,
  "page": int,
  "page_size": int,
  "total_pages": int
}
```

### 5. Statistics Endpoint

**Endpoint:** `GET /api/blood-pressure/statistics`

**Calculations:**
- `total_readings`: Count of all readings
- `high_risk_count`: Count where systolic > 120
- `normal_count`: total - high_risk
- `average_systolic`: Average of all systolic values (rounded to 1 decimal)
- `average_diastolic`: Average of non-null diastolic values (rounded to 1 decimal)
- `latest_reading_date`: Most recent reading timestamp

**Role-Based Data:**
- Regular users: Statistics for their own readings only
- Medical staff: Statistics for all users' readings

### 6. Delete BP Reading Endpoint

**Endpoint:** `DELETE /api/blood-pressure/{reading_id}`

**Authorization:**
- Users can delete their own readings
- Medical staff can delete any reading

**Behavior:**
- Hard delete (not soft delete)
- Returns 204 No Content on success

## Data Models

### BloodPressureReading Model

```python
class BloodPressureReading(Base):
    __tablename__ = "blood_pressure_checks"
    
    id: int (PK)
    user_id: int (FK → users.id, CASCADE)
    systolic: int (50-300 mmHg)
    diastolic: int (30-200 mmHg, nullable)
    reading_date: datetime (defaults to now)
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    user: User
    
    # Indexes
    - (user_id, reading_date)
```

### User Model (Relevant Fields)

```python
class User(Base):
    __tablename__ = "users"
    
    id: int (PK)
    email: str (unique)
    first_name: str
    last_name: str
    role: str (enum: undefined, admin, doctor, medical_staff, receptionist, patient)
    email_preferences: JSON {
        "appointment_updates": bool,
        "blood_pressure_alerts": bool
    }
    deleted_at: datetime (nullable)
```

## Error Handling

### Validation Errors (422 Unprocessable Entity)
- Systolic BP out of range (50-300 mmHg)
- Diastolic BP out of range (30-200 mmHg)
- Invalid date format

### Authentication Errors (401 Unauthorized)
- Missing JWT token
- Invalid or expired JWT token

### Authorization Errors (403 Forbidden)
- User attempting to access another user's readings
- User attempting to delete another user's reading

### Not Found Errors (404 Not Found)
- BP reading ID does not exist

### Server Errors (500 Internal Server Error)
- Database connection failures
- Unexpected exceptions
- Note: Email failures do NOT cause 500 errors

### Error Response Format
```json
{
  "detail": "Human-readable error message"
}
```

## Email System

### Email Preferences

Users control email notifications via `email_preferences` JSON field:
```json
{
  "appointment_updates": true,
  "blood_pressure_alerts": true
}
```

### Rate Limiting

- Only send one email per day for abnormal readings
- Check: Count readings created today before sending email
- If count > 1, skip email (already sent today)

### Email Content

**High BP Email:**
- Subject: "Important: High Blood Pressure Reading Detected"
- Recommendations: Reduce salt, exercise, manage stress, limit alcohol
- Medical advice: Schedule doctor appointment

**Low BP Email:**
- Subject: "Important: Low Blood Pressure Reading Detected"
- Recommendations: Increase salt, drink water, eat frequent meals
- Medical advice: Consult doctor for underlying cause

**Both Include:**
- Reading value and date
- Unsubscribe link
- GDPR-compliant footer

## Security Considerations

### Authentication
- JWT tokens with expiration
- Token validation on every request
- Secure token storage in HTTP-only cookies (frontend)

### Authorization
- Role-based access control enforced at API level
- Users can only access their own data (unless medical staff)
- Medical staff verified by role check

### Data Protection
- Email preferences respected for GDPR compliance
- Unsubscribe links in all notification emails
- No sensitive data in logs
- Hard delete for user-requested deletions

### Input Validation
- Pydantic schemas validate all inputs
- BP values validated against realistic ranges
- SQL injection prevented by ORM
- XSS prevention in email templates

## Performance Considerations

### Database Optimization
- Index on (user_id, reading_date) for fast user queries
- Pagination prevents large result sets
- Efficient aggregation queries for statistics

### Email System
- Async email sending to avoid blocking
- Rate limiting prevents email spam
- Email failures don't block reading creation

### Scalability
- Stateless API design allows horizontal scaling
- Database connection pooling
- Pagination limits memory usage

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
# Create migration for blood_pressure_checks table
alembic revision --autogenerate -m "Add blood pressure checks table"

# Apply migrations
alembic upgrade head
```

### Monitoring
- Log all BP reading operations
- Track email sending success/failure rates
- Monitor API response times
- Alert on high error rates
