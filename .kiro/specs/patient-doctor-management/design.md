# Design Document

## Overview

The Patient and Doctor Management system extends the existing Hospital Management System to provide comprehensive CRUD operations for patient and doctor records. The design follows the established FastAPI backend architecture with React frontend, implementing role-based access control and maintaining consistency with existing patterns.

The system supports three user roles:

- **Admin**: Full CRUD access to both patients and doctors
- **Doctor**: Read-only access to patient records
- **Receptionist**: Full CRUD access to patient records only

## Architecture

### Backend Architecture

The backend follows the existing FastAPI pattern with clear separation of concerns:

```
backend/
├── models.py              # SQLAlchemy models (Patient, Doctor)
├── schemas.py             # Pydantic schemas for validation
├── routers/
│   ├── patients.py        # Patient CRUD endpoints
│   └── doctors.py         # Doctor CRUD endpoints
├── core/
│   └── dependencies.py    # Role-based access control
└── main.py               # Router registration
```

### Frontend Architecture

The frontend follows the existing React pattern with Material-UI components:

```
frontend/src/
├── api/
│   ├── patients.ts        # Patient API calls with React Query
│   └── doctors.ts         # Doctor API calls with React Query
├── pages/
│   ├── Patients.jsx       # Patient management interface
│   └── Doctors.jsx        # Doctor management interface
├── components/
│   ├── PatientForm.jsx    # Reusable patient form component
│   └── DoctorForm.jsx     # Reusable doctor form component
└── types/
    └── index.ts           # TypeScript interfaces
```

## Components and Interfaces

### Database Models

#### Patient Model

```python
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    gender = Column(String, nullable=False)  # 'male', 'female', 'other'
    phone = Column(String, nullable=False)
    city = Column(String, nullable=False)
    email = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    address = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None)  # Soft delete
```

#### Doctor Model

```python
class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(String, unique=True, nullable=False)  # Unique doctor identifier
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    gender = Column(String, nullable=False)  # 'male', 'female', 'other'
    phone = Column(String, nullable=False)
    city = Column(String, nullable=False)
    email = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    address = Column(String, nullable=False)
    qualification = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True, default=None)  # Soft delete
```

### Pydantic Schemas

#### Patient Schemas

```python
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    gender: str
    phone: str
    city: str
    email: EmailStr
    age: int
    address: str

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    phone: str | None = None
    city: str | None = None
    email: EmailStr | None = None
    age: int | None = None
    address: str | None = None

class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
```

#### Doctor Schemas

```python
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

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    doctor_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    phone: str | None = None
    city: str | None = None
    email: EmailStr | None = None
    age: int | None = None
    address: str | None = None
    qualification: str | None = None

class DoctorResponse(DoctorBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True
```

### API Endpoints

#### Patient Endpoints

```python
# GET /api/patients - List/search patients (Doctor, Receptionist, Admin)
# POST /api/patients - Create patient (Receptionist, Admin)
# GET /api/patients/{patient_id} - Get patient by ID (Doctor, Receptionist, Admin)
# PUT /api/patients/{patient_id} - Update patient (Receptionist, Admin)
# DELETE /api/patients/{patient_id} - Soft delete patient (Admin only)
```

#### Doctor Endpoints

```python
# GET /api/doctors - List/search doctors (Admin only)
# POST /api/doctors - Create doctor (Admin only)
# GET /api/doctors/{doctor_id} - Get doctor by ID (Admin only)
# PUT /api/doctors/{doctor_id} - Update doctor (Admin only)
# DELETE /api/doctors/{doctor_id} - Soft delete doctor (Admin only)
```

### Role-Based Access Control

Extended dependency functions in `core/dependencies.py`:

```python
def require_receptionist_or_admin(current_user: User = Depends(auth.get_current_user)) -> User:
    """Require receptionist or admin role"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionist or Admin access required"
        )
    return current_user

def require_patient_access(current_user: User = Depends(auth.get_current_user)) -> User:
    """Require doctor, receptionist, or admin role for patient access"""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor, Receptionist, or Admin access required"
        )
    return current_user
```

## Data Models

### Patient Data Flow

1. **Create**: Receptionist/Admin → Validation → Database → Response
2. **Read**: Doctor/Receptionist/Admin → Query with filters → Database → Response
3. **Update**: Receptionist/Admin → Validation → Database → Response
4. **Delete**: Admin → Soft delete → Database → Response

### Doctor Data Flow

1. **Create**: Admin → Validation → Database → Response
2. **Read**: Admin → Query with filters → Database → Response
3. **Update**: Admin → Validation → Database → Response
4. **Delete**: Admin → Soft delete → Database → Response

### Search and Filtering

Both patients and doctors support:

- **Text search**: By first name, last name, or combined full name
- **Pagination**: Limit and offset parameters
- **Soft delete filtering**: Include/exclude deleted records
- **Sorting**: By creation date, name, or other fields

## Error Handling

### Backend Error Handling

- **Validation Errors**: 422 Unprocessable Entity with detailed field errors
- **Not Found**: 404 Not Found for non-existent records
- **Unauthorized**: 401 Unauthorized for invalid authentication
- **Forbidden**: 403 Forbidden for insufficient permissions
- **Conflict**: 409 Conflict for duplicate unique fields (doctor_id, email)
- **Server Error**: 500 Internal Server Error with generic message

### Frontend Error Handling

- **Form Validation**: Real-time validation with error messages
- **API Errors**: Toast notifications or alert components
- **Loading States**: Spinners and disabled states during operations
- **Network Errors**: Retry mechanisms and offline indicators

## Testing Strategy

### Manual Testing

- **API Testing**: Use FastAPI's built-in Swagger UI at `/docs` for endpoint testing
- **Frontend Testing**: Manual testing of user workflows and form interactions
- **Role-Based Testing**: Verify access control by testing with different user roles
- **Error Scenarios**: Test error handling and validation manually

### Database Migration Testing

- **Migration Validation**: Test new table creation in development environment
- **Schema Verification**: Ensure proper constraints and indexes are created
- **Rollback Testing**: Verify migration rollback procedures work correctly

## Security Considerations

### Data Protection

- **Input Validation**: Comprehensive validation on both frontend and backend
- **SQL Injection Prevention**: SQLAlchemy ORM usage
- **XSS Prevention**: Proper data sanitization and encoding
- **CSRF Protection**: Token-based authentication

### Access Control

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Granular permission control
- **Session Management**: Proper token expiration and refresh
- **Audit Logging**: Track all CRUD operations

### Data Privacy

- **Soft Deletes**: Maintain data integrity while allowing recovery
- **Data Encryption**: Sensitive data encryption at rest
- **Access Logging**: Monitor data access patterns
- **GDPR Compliance**: Data export and deletion capabilities

## Performance Considerations

### Database Optimization

- **Indexing**: Proper indexes on frequently queried fields
- **Query Optimization**: Efficient SQL queries with proper joins
- **Connection Pooling**: Database connection management
- **Pagination**: Limit large result sets

### Frontend Optimization

- **React Query**: Efficient data fetching and caching
- **Virtual Scrolling**: Handle large lists efficiently
- **Code Splitting**: Lazy loading of components
- **Memoization**: Prevent unnecessary re-renders

### Caching Strategy

- **API Response Caching**: Cache frequently accessed data
- **Browser Caching**: Optimize static asset delivery
- **Database Query Caching**: Cache expensive queries
- **CDN Integration**: Global content delivery

## Deployment and Monitoring

### Database Migration Strategy

The implementation requires creating two new database tables using Alembic migrations:

1. **Patients Table Migration**:

   - Create `patients` table with all required fields
   - Add proper indexes for search performance (first_name, last_name, email, phone)
   - Set up constraints for data integrity
   - Include soft delete support with `deleted_at` field

2. **Doctors Table Migration**:
   - Create `doctors` table with all required fields including unique `doctor_id`
   - Add proper indexes for search performance (first_name, last_name, doctor_id, email)
   - Set up unique constraints for `doctor_id` and `email`
   - Include soft delete support with `deleted_at` field

### Migration Process

- **Migration Files**: Create separate migration files for each table
- **Index Creation**: Add database indexes for frequently queried fields
- **Constraint Setup**: Implement proper foreign key and unique constraints
- **Rollback Support**: Ensure migrations can be safely rolled back

### Migration Commands

```bash
# Generate migration files
alembic revision --autogenerate -m "create patients table"
alembic revision --autogenerate -m "create doctors table"

# Apply migrations
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

### Monitoring and Logging

- **Application Metrics**: Track API performance and usage
- **Error Tracking**: Comprehensive error logging and alerting
- **User Activity**: Monitor user interactions and patterns
- **System Health**: Database and application health checks
