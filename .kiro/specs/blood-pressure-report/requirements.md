# Requirements Document

## Introduction

This specification defines a User Blood Pressure Monitoring system - a web-based clinical data management application designed to monitor and analyze user blood pressure readings. The system allows any authenticated user to record their blood pressure readings, automatically identifies high-risk users based on clinical thresholds (systolic BP > 120 mmHg or < 90 mmHg), sends automated health recommendations via email, and provides comprehensive statistical reports. It serves as a personal health tracking tool that enables users to monitor their cardiovascular health while allowing medical staff to view aggregated data and identify users requiring medical attention.

## Glossary

- **BP Monitoring System**: The User Blood Pressure Monitoring web application
- **User**: Any authenticated person using the system to track their blood pressure
- **Medical Staff**: Healthcare professionals (doctors, nurses, receptionists, admins) with elevated access to view all user data
- **Systolic Blood Pressure**: The higher blood pressure reading measured in mmHg
- **Diastolic Blood Pressure**: The lower blood pressure reading measured in mmHg (optional)
- **High-Risk User**: A user with systolic blood pressure greater than 120 mmHg
- **Low-Risk User**: A user with systolic blood pressure less than 90 mmHg
- **Normal-Risk User**: A user with systolic blood pressure between 90-120 mmHg
- **BP Reading**: A database record containing user_id, systolic, diastolic (optional), and reading_date
- **Clinical Threshold**: The 120 mmHg (high) and 90 mmHg (low) systolic blood pressure values used to identify at-risk users
- **Statistical Summary**: Aggregated data including average blood pressure, user counts, and risk categories
- **Email Preferences**: User settings controlling which notification emails they receive
- **Health Recommendation Email**: Automated email sent when abnormal BP reading is detected

## Requirements

### Requirement 1

**User Story:** As a user, I want to record my blood pressure reading, so that I can track my cardiovascular health over time.

#### Acceptance Criteria

1. WHEN a user submits a BP reading with systolic value, THEN the BP Monitoring System SHALL create a new reading record with user_id, systolic, and current timestamp
2. WHEN a user submits a BP reading with both systolic and diastolic values, THEN the BP Monitoring System SHALL store both values in the reading record
3. WHEN a user submits a BP reading without specifying reading_date, THEN the BP Monitoring System SHALL default to current UTC time
4. WHEN a user submits a BP reading with custom reading_date, THEN the BP Monitoring System SHALL use the provided timestamp
5. WHEN a BP reading is created, THEN the BP Monitoring System SHALL automatically calculate and store is_high_risk flag (systolic > 120)
6. WHEN a BP reading is successfully created, THEN the BP Monitoring System SHALL return 201 Created with complete reading details

### Requirement 2

**User Story:** As a user, I want to receive health recommendations when my blood pressure is abnormal, so that I can take appropriate action.

#### Acceptance Criteria

1. WHEN a user creates a BP reading with systolic > 120 mmHg and has blood_pressure_alerts enabled, THEN the BP Monitoring System SHALL send a high blood pressure recommendation email
2. WHEN a user creates a BP reading with systolic < 90 mmHg and has blood_pressure_alerts enabled, THEN the BP Monitoring System SHALL send a low blood pressure recommendation email
3. WHEN a user has blood_pressure_alerts disabled in email preferences, THEN the BP Monitoring System SHALL not send recommendation emails
4. WHEN an abnormal BP reading is the first of the day for a user, THEN the BP Monitoring System SHALL send the recommendation email
5. WHEN an abnormal BP reading is not the first of the day for a user, THEN the BP Monitoring System SHALL not send duplicate emails
6. WHEN email sending fails, THEN the BP Monitoring System SHALL log the error but not fail the reading creation
7. WHEN sending recommendation email, THEN the BP Monitoring System SHALL include unsubscribe link for GDPR compliance

### Requirement 3

**User Story:** As a user, I want to view my blood pressure history, so that I can monitor trends in my cardiovascular health.

#### Acceptance Criteria

1. WHEN a user requests their BP readings, THEN the BP Monitoring System SHALL return only that user's readings in paginated format
2. WHEN requesting BP readings, THEN the BP Monitoring System SHALL support pagination with page and page_size parameters (default 10, max 100)
3. WHEN requesting BP readings, THEN the BP Monitoring System SHALL order results by reading_date descending (newest first)
4. WHEN requesting BP readings, THEN the BP Monitoring System SHALL support date range filtering with date_from and date_to parameters
5. WHEN requesting BP readings, THEN the BP Monitoring System SHALL support high_risk_only filter to show only readings with systolic > 120
6. WHEN displaying BP readings, THEN the BP Monitoring System SHALL include user information (first_name, last_name, email) with each reading

### Requirement 4

**User Story:** As medical staff, I want to view all users' blood pressure readings, so that I can identify users requiring medical attention.

#### Acceptance Criteria

1. WHEN medical staff (doctor, nurse, receptionist, admin) requests BP readings, THEN the BP Monitoring System SHALL return all users' readings with pagination
2. WHEN medical staff requests BP readings, THEN the BP Monitoring System SHALL support search by user name or email
3. WHEN medical staff requests BP readings, THEN the BP Monitoring System SHALL support all filters (date range, high_risk_only)
4. WHEN displaying readings to medical staff, THEN the BP Monitoring System SHALL exclude readings from deleted users
5. WHEN a regular user (non-medical staff) requests BP readings, THEN the BP Monitoring System SHALL apply data isolation to show only their own readings

### Requirement 5

**User Story:** As a user or medical staff, I want to view statistical summaries of blood pressure data, so that I can understand health trends.

#### Acceptance Criteria

1. WHEN a user requests statistics, THEN the BP Monitoring System SHALL calculate and return statistics for only that user's readings
2. WHEN medical staff requests statistics, THEN the BP Monitoring System SHALL calculate and return statistics for all users' readings
3. WHEN calculating statistics, THEN the BP Monitoring System SHALL include total_readings count
4. WHEN calculating statistics, THEN the BP Monitoring System SHALL include high_risk_count (systolic > 120)
5. WHEN calculating statistics, THEN the BP Monitoring System SHALL include normal_count (total - high_risk)
6. WHEN calculating statistics, THEN the BP Monitoring System SHALL include average_systolic rounded to 1 decimal place
7. WHEN calculating statistics, THEN the BP Monitoring System SHALL include average_diastolic rounded to 1 decimal place (excluding null values)
8. WHEN calculating statistics, THEN the BP Monitoring System SHALL include latest_reading_date

### Requirement 6

**User Story:** As a user, I want to delete my blood pressure readings, so that I can remove incorrect or unwanted data.

#### Acceptance Criteria

1. WHEN a user requests to delete a BP reading, THEN the BP Monitoring System SHALL verify the reading belongs to that user
2. WHEN a user attempts to delete another user's reading, THEN the BP Monitoring System SHALL return 403 Forbidden error
3. WHEN medical staff requests to delete any BP reading, THEN the BP Monitoring System SHALL allow the deletion
4. WHEN a BP reading is deleted, THEN the BP Monitoring System SHALL perform hard delete (not soft delete)
5. WHEN a BP reading is successfully deleted, THEN the BP Monitoring System SHALL return 204 No Content

### Requirement 7

**User Story:** As a user, I want to validate my blood pressure input, so that I can ensure I'm recording accurate data.

#### Acceptance Criteria

1. WHEN a user submits systolic BP value, THEN the BP Monitoring System SHALL validate it is between 50 and 300 mmHg
2. WHEN a user submits diastolic BP value, THEN the BP Monitoring System SHALL validate it is between 30 and 200 mmHg
3. WHEN a user submits invalid BP values, THEN the BP Monitoring System SHALL return 422 Unprocessable Entity with clear error message
4. WHEN a user submits systolic value without diastolic, THEN the BP Monitoring System SHALL accept the reading (diastolic is optional)

### Requirement 8

**User Story:** As a user, I want my email preferences respected, so that I only receive notifications I've opted into.

#### Acceptance Criteria

1. WHEN a user has blood_pressure_alerts set to true in email_preferences, THEN the BP Monitoring System SHALL send health recommendation emails for abnormal readings
2. WHEN a user has blood_pressure_alerts set to false in email_preferences, THEN the BP Monitoring System SHALL not send any BP-related emails
3. WHEN a user clicks unsubscribe link in BP email, THEN the BP Monitoring System SHALL update blood_pressure_alerts to false
4. WHEN email preferences are updated, THEN the BP Monitoring System SHALL apply changes immediately to future readings

### Requirement 9

**User Story:** As a system administrator, I want the system to handle errors gracefully, so that users have a reliable experience.

#### Acceptance Criteria

1. WHEN database connection fails, THEN the BP Monitoring System SHALL return 500 Internal Server Error with generic message
2. WHEN email service fails, THEN the BP Monitoring System SHALL log the error but complete the BP reading creation successfully
3. WHEN invalid authentication token is provided, THEN the BP Monitoring System SHALL return 401 Unauthorized error
4. WHEN a user requests a non-existent BP reading, THEN the BP Monitoring System SHALL return 404 Not Found error
5. WHEN validation fails, THEN the BP Monitoring System SHALL return 422 Unprocessable Entity with specific field errors
