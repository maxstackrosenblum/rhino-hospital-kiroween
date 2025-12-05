# Implementation Plan

## Overview
This implementation plan documents the existing User Blood Pressure Monitoring system - a web-based application integrated with the Hospital Management System. The system is already implemented and operational.

---

## Implemented Features

- [x] 1. Blood pressure data model and database
  - BloodPressureReading model with user_id, systolic, diastolic, reading_date
  - Index on (user_id, reading_date) for performance
  - Hard delete (no soft delete for BP readings)
  - _Requirements: 1.1, 1.4_

- [x] 2. Create BP reading endpoint
  - POST /api/blood-pressure endpoint
  - Pydantic validation (systolic 50-300, diastolic 30-200)
  - Auto-calculate is_high_risk flag (systolic > 120)
  - Default reading_date to current time if not provided
  - Return 201 Created with complete reading details
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3_

- [x] 3. Health recommendation email system
  - Detect abnormal readings (systolic > 120 or < 90)
  - Check email preferences (blood_pressure_alerts)
  - Rate limiting (one email per day per user)
  - Send high BP recommendations (diet, exercise, stress management)
  - Send low BP recommendations (hydration, salt intake)
  - Include unsubscribe link for GDPR compliance
  - Email failures don't block reading creation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 8.1, 8.2, 8.3, 8.4_

- [x] 4. List BP readings endpoint with role-based access
  - GET /api/blood-pressure endpoint
  - Pagination (page, page_size with default 10, max 100)
  - Regular users see only their own readings
  - Medical staff see all readings
  - Search by user name or email (medical staff only)
  - Date range filtering (date_from, date_to)
  - High-risk filtering (high_risk_only)
  - Exclude deleted users from results
  - Order by reading_date descending
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Statistics endpoint with role-based data
  - GET /api/blood-pressure/statistics endpoint
  - Calculate total_readings, high_risk_count, normal_count
  - Calculate average_systolic and average_diastolic (rounded to 1 decimal)
  - Get latest_reading_date
  - Regular users get their own statistics
  - Medical staff get population statistics
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 6. Delete BP reading endpoint
  - DELETE /api/blood-pressure/{id} endpoint
  - Users can delete their own readings
  - Medical staff can delete any reading
  - Hard delete (not soft delete)
  - Return 204 No Content on success
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Input validation
  - Systolic range validation (50-300 mmHg)
  - Diastolic range validation (30-200 mmHg)
  - Pydantic validators in BloodPressureCreate schema
  - Clear error messages for invalid values
  - Return 422 Unprocessable Entity for validation errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Email preferences integration
  - Check blood_pressure_alerts in user.email_preferences
  - Respect user opt-out preferences
  - Unsubscribe link updates preferences
  - Immediate application of preference changes
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Error handling
  - 401 Unauthorized for invalid tokens
  - 403 Forbidden for unauthorized access
  - 404 Not Found for non-existent readings
  - 422 Unprocessable Entity for validation errors
  - 500 Internal Server Error for database failures
  - Email failures logged but don't fail requests
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Authentication and authorization
  - JWT token validation on all endpoints
  - require_blood_pressure_access for authenticated users
  - require_medical_staff for elevated access
  - Role-based data isolation
  - _Requirements: All_

## System Architecture

**Backend:** FastAPI with SQLAlchemy ORM
**Database:** PostgreSQL (blood_pressure_checks table)
**Frontend:** React (integrated with Hospital Management System)
**Email:** SMTP with HTML templates
**Auth:** JWT tokens with HTTPBearer

## API Endpoints

- `POST /api/blood-pressure` - Create BP reading
- `GET /api/blood-pressure` - List readings (paginated, filtered)
- `GET /api/blood-pressure/statistics` - Get statistics
- `DELETE /api/blood-pressure/{id}` - Delete reading

## Key Features

1. **Direct Data Entry** - Users enter BP readings via API (no file uploads)
2. **Automated Health Alerts** - Email recommendations for abnormal readings
3. **Role-Based Access** - Users see own data, medical staff see all
4. **Email Preferences** - GDPR-compliant opt-in/opt-out
5. **Rate Limiting** - One email per day for abnormal readings
6. **Statistical Analysis** - Personal and population health trends
