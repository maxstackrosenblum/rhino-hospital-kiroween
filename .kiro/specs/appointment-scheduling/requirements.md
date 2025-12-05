# Requirements Document

## Introduction

This specification defines a medical appointment scheduling system that facilitates the booking, management, and tracking of healthcare consultations between patients and medical professionals. The system provides secure authentication and authorization mechanisms, enables patients to schedule appointments with doctors for specific medical conditions, and allows healthcare providers to manage their appointment schedules effectively. The system includes automated confirmation notifications, appointment status tracking throughout the consultation lifecycle, comprehensive appointment management capabilities, and integration with doctor shift schedules to ensure availability.

## Glossary

- **Appointment System**: The medical appointment scheduling application
- **Patient**: A registered user seeking medical consultation (automatically created if user doesn't have patient profile)
- **Doctor**: A medical professional who provides healthcare services
- **Admin**: A system administrator with elevated privileges
- **Receptionist**: Staff member who can view appointments but has limited modification rights
- **JWT Token**: JSON Web Token used for authentication
- **Appointment Record**: A database entry containing appointment details
- **Appointment Status**: The current state of an appointment (pending, confirmed, completed, cancelled)
- **Time Slot**: A specific date and time for an appointment
- **Shift**: A scheduled work period for a doctor with start and end times
- **Authorization Header**: HTTP header containing the JWT token
- **Role-Based Access Control**: Permission system based on user roles
- **Soft Delete**: Marking records as deleted without removing them from the database
- **Email Preferences**: User settings controlling which notification emails they receive

## Requirements

### Requirement 1

**User Story:** As a Patient, I want to authenticate my identity with a valid token, so that I can securely access the appointment scheduling system.

#### Acceptance Criteria

1. WHEN a user makes a request with a JWT token in the Authorization header, THEN the Appointment System SHALL validate the token and attach verified user information to the request
2. WHEN a user makes a request without a token in the Authorization header, THEN the Appointment System SHALL return a 401 Unauthorized error
3. WHEN a user provides an invalid or expired token, THEN the Appointment System SHALL return a 401 Unauthorized error with appropriate error message
4. WHEN token validation succeeds, THEN the Appointment System SHALL allow the authenticated user to proceed to the appointment operation

### Requirement 2

**User Story:** As an Admin, I want the system to verify user role-based permissions, so that only authorized users can perform appointment operations.

#### Acceptance Criteria

1. WHEN processing any appointment request, THEN the Appointment System SHALL validate the JWT token from the Authorization header and retrieve user information
2. WHEN a user with doctor or admin role requests appointment management operations, THEN the Appointment System SHALL grant access to the requested operation
3. WHEN a user without proper role attempts appointment management operations, THEN the Appointment System SHALL return a 403 Forbidden error
4. WHEN a patient or undefined user requests appointment listings, THEN the Appointment System SHALL apply filtering to show only that user's own appointments
5. WHEN a doctor requests appointment listings, THEN the Appointment System SHALL apply filtering to show only appointments assigned to that doctor
6. WHEN an admin requests appointment listings, THEN the Appointment System SHALL grant full appointment access without filtering restrictions

### Requirement 3

**User Story:** As a Patient, I want the system to validate all required appointment fields, so that I can ensure my appointment request is complete and accurate.

#### Acceptance Criteria

1. WHEN creating an appointment, THEN the Appointment System SHALL validate that doctor_id, appointment_date, and disease fields are provided and not empty
2. WHEN the disease field is empty or contains only whitespace, THEN the Appointment System SHALL return a 422 validation error
3. WHEN the appointment_date is in invalid ISO format, THEN the Appointment System SHALL return a 400 Bad Request error with message indicating invalid date format
4. WHEN all required fields are valid, THEN the Appointment System SHALL convert the appointment date string to a datetime object
5. WHEN the doctor_id does not exist or references a deleted doctor, THEN the Appointment System SHALL return a 404 Not Found error

### Requirement 4

**User Story:** As a Patient, I want to check if my desired appointment slot is available, so that I can avoid scheduling conflicts.

#### Acceptance Criteria

1. WHEN a patient requests an appointment, THEN the Appointment System SHALL query the database to check if an existing non-deleted appointment with pending or confirmed status exists for the requested doctor, date, and time
2. WHEN the appointment slot is already taken by a pending or confirmed appointment, THEN the Appointment System SHALL return a 409 Conflict error with message "Appointment slot already taken"
3. WHEN the appointment slot is available, THEN the Appointment System SHALL allow the appointment creation to proceed
4. WHEN checking availability, THEN the Appointment System SHALL exclude cancelled and deleted appointments from conflict detection

### Requirement 5

**User Story:** As a Patient, I want to create a new appointment record with my doctor and medical details, so that I can schedule my medical consultation.

#### Acceptance Criteria

1. WHEN a user without a patient profile creates an appointment, THEN the Appointment System SHALL automatically create a patient profile with a generated medical record number
2. WHEN a user with undefined role creates an appointment, THEN the Appointment System SHALL update the user role to patient
3. WHEN all validations pass and the slot is available, THEN the Appointment System SHALL create a new appointment record in the database with patient_id, doctor_id, appointment_date, and disease
4. WHEN creating the appointment record, THEN the Appointment System SHALL set the status to "pending" by default
5. WHEN the appointment is successfully created, THEN the Appointment System SHALL return a 201 Created response with complete appointment details including patient and doctor information

### Requirement 6

**User Story:** As a Patient, I want to receive an automated email confirmation with my appointment details, so that I have a record of my scheduled appointment.

#### Acceptance Criteria

1. WHEN an appointment is successfully created and the patient has appointment_updates email preference enabled, THEN the Appointment System SHALL send an automated email notification to the patient's registered email address
2. WHEN sending the confirmation email, THEN the Appointment System SHALL include the patient's full name, appointment date and time, department name, doctor information, disease/reason, and an unsubscribe link
3. WHEN the patient has disabled appointment_updates in email preferences, THEN the Appointment System SHALL skip sending the confirmation email
4. WHEN email sending fails, THEN the Appointment System SHALL log the error but not fail the appointment creation

### Requirement 7

**User Story:** As a Doctor, I want to view paginated appointment listings, so that I can manage and review all scheduled appointments efficiently.

#### Acceptance Criteria

1. WHEN any authenticated user requests appointment listings, THEN the Appointment System SHALL display paginated results with configurable page_size (default 10, max 100)
2. WHEN displaying appointments, THEN the Appointment System SHALL include patient details (first_name, last_name, age, phone) and doctor information (first_name, last_name, specialization, department)
3. WHEN a patient or undefined user requests listings, THEN the Appointment System SHALL show only appointments for that user's patient profile
4. WHEN a doctor requests listings, THEN the Appointment System SHALL apply role-based filtering to show only appointments assigned to that doctor
5. WHEN an admin requests listings, THEN the Appointment System SHALL show all appointments without filtering restrictions
6. WHEN processing pagination, THEN the Appointment System SHALL accept page and page_size parameters from the query string with defaults of 1 and 10
7. WHEN filtering is requested, THEN the Appointment System SHALL support optional filters for patient_id, doctor_id, status, date_from, and date_to
8. WHEN appointments are retrieved, THEN the Appointment System SHALL exclude soft-deleted appointments, patients, doctors, and users from results

### Requirement 8

**User Story:** As a Doctor, I want to update appointment information including patient, doctor, disease, and date, so that I can modify appointments as needed.

#### Acceptance Criteria

1. WHEN a doctor or admin updates an appointment, THEN the Appointment System SHALL require doctor or admin role authorization
2. WHEN a doctor updates an appointment, THEN the Appointment System SHALL verify the appointment belongs to that doctor
3. WHEN updating an appointment, THEN the Appointment System SHALL verify that the appointment ID exists and is not deleted
4. WHEN a new appointment date is provided, THEN the Appointment System SHALL verify the doctor has a shift on the new date and the time falls within shift hours
5. WHEN a new appointment date is provided, THEN the Appointment System SHALL check for conflicts with existing pending or confirmed appointments for that doctor
6. WHEN no conflicts exist, THEN the Appointment System SHALL update the appointment record with the provided fields and set updated_at timestamp
7. WHEN the update is successful, THEN the Appointment System SHALL return the updated appointment with populated patient and doctor information

### Requirement 9

**User Story:** As a Doctor, I want to update appointment status through valid transitions, so that I can track the appointment lifecycle from pending to completion.

#### Acceptance Criteria

1. WHEN updating appointment status, THEN the Appointment System SHALL validate that the user has doctor or admin role permissions
2. WHEN a doctor updates appointment status, THEN the Appointment System SHALL verify the appointment belongs to that doctor
3. WHEN a status update is requested, THEN the Appointment System SHALL accept only valid appointment status values from the defined enum (pending, confirmed, completed, cancelled)
4. WHEN a valid status is provided, THEN the Appointment System SHALL update the appointment status and updated_at timestamp
5. WHEN the status changes and the patient has appointment_updates email preference enabled, THEN the Appointment System SHALL send a status update email with old status, new status, and appointment details
6. WHEN the patient has disabled appointment_updates in email preferences, THEN the Appointment System SHALL skip sending the status update email
7. WHEN email sending fails, THEN the Appointment System SHALL log the error but not fail the status update operation

### Requirement 10

**User Story:** As a Patient, I want to verify that my doctor is available on my desired appointment date, so that I can schedule appointments only during their working hours.

#### Acceptance Criteria

1. WHEN creating an appointment, THEN the Appointment System SHALL verify the doctor has a shift scheduled on the requested appointment date
2. WHEN the doctor has no shift on the requested date, THEN the Appointment System SHALL return a 400 Bad Request error with message "Doctor is not available on this date"
3. WHEN the doctor has a shift, THEN the Appointment System SHALL verify the appointment time falls within the shift start_time and end_time
4. WHEN the appointment time is outside shift hours, THEN the Appointment System SHALL return a 400 Bad Request error indicating the valid time range
5. WHEN updating an appointment date, THEN the Appointment System SHALL perform the same shift validation for the new date

### Requirement 11

**User Story:** As a Patient, I want to view available doctors on a specific date, so that I can choose from doctors who are working that day.

#### Acceptance Criteria

1. WHEN a user requests available doctors for a date, THEN the Appointment System SHALL return all non-deleted doctors who have shifts scheduled on that date
2. WHEN displaying available doctors, THEN the Appointment System SHALL include doctor_id, user_id, first_name, last_name, specialization, department, shift_start, and shift_end
3. WHEN displaying available doctors, THEN the Appointment System SHALL include the count of pending and confirmed appointments for each doctor on that date
4. WHEN the date format is invalid, THEN the Appointment System SHALL return a 400 Bad Request error
5. WHEN no doctors have shifts on the requested date, THEN the Appointment System SHALL return an empty list

### Requirement 12

**User Story:** As a Patient, I want to view available time slots for a specific doctor on a specific date, so that I can choose a convenient appointment time.

#### Acceptance Criteria

1. WHEN a user requests available slots for a doctor and date, THEN the Appointment System SHALL verify the doctor exists and is not deleted
2. WHEN the doctor does not exist, THEN the Appointment System SHALL return a 404 Not Found error
3. WHEN the doctor has no shift on the requested date, THEN the Appointment System SHALL return has_shift as false with empty slot lists
4. WHEN the doctor has a shift, THEN the Appointment System SHALL generate time slots from shift start to end time based on slot_duration parameter (default 30 minutes)
5. WHEN generating slots, THEN the Appointment System SHALL exclude slots that have existing pending or confirmed appointments
6. WHEN returning slots, THEN the Appointment System SHALL provide separate lists of available_slots and booked_slots in ISO format
7. WHEN the date format is invalid, THEN the Appointment System SHALL return a 400 Bad Request error

### Requirement 13

**User Story:** As a Patient, I want to view details of a specific appointment, so that I can review my appointment information.

#### Acceptance Criteria

1. WHEN a user requests a specific appointment by ID, THEN the Appointment System SHALL verify the appointment exists and is not deleted
2. WHEN the appointment does not exist, THEN the Appointment System SHALL return a 404 Not Found error
3. WHEN a patient or undefined user requests an appointment, THEN the Appointment System SHALL verify the appointment belongs to that user's patient profile
4. WHEN a doctor requests an appointment, THEN the Appointment System SHALL verify the appointment is assigned to that doctor
5. WHEN a user attempts to access an appointment they don't have permission for, THEN the Appointment System SHALL return a 403 Forbidden error
6. WHEN the user has permission, THEN the Appointment System SHALL return complete appointment details with populated patient and doctor information

### Requirement 14

**User Story:** As a Patient, I want to cancel my appointment, so that I can free up the time slot if I cannot attend.

#### Acceptance Criteria

1. WHEN a user requests to delete an appointment, THEN the Appointment System SHALL verify the appointment exists and is not already deleted
2. WHEN the appointment does not exist, THEN the Appointment System SHALL return a 404 Not Found error
3. WHEN a patient or undefined user cancels an appointment, THEN the Appointment System SHALL verify the appointment belongs to that user's patient profile
4. WHEN a doctor cancels an appointment, THEN the Appointment System SHALL verify the appointment is assigned to that doctor
5. WHEN a user attempts to cancel an appointment they don't have permission for, THEN the Appointment System SHALL return a 403 Forbidden error
6. WHEN the user has permission, THEN the Appointment System SHALL perform a soft delete by setting deleted_at timestamp and status to cancelled
7. WHEN the cancellation is successful, THEN the Appointment System SHALL return a 204 No Content response
