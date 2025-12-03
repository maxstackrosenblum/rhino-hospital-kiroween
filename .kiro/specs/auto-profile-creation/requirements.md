# Requirements Document

## Introduction

This feature modifies the doctor and patient list endpoints to show all users with doctor or patient roles, regardless of whether they have completed their profiles. Currently, users with doctor/patient roles exist only in the users table until they complete their profiles, which creates separate records in the doctors/patients tables. This change will ensure that doctor and patient users are immediately visible in their respective management interfaces with clear profile completion status, without requiring changes to the user creation or profile completion processes.

## Requirements

### Requirement 1

**User Story:** As an admin, I want to see all doctor users in the doctors list immediately after they are created, so that I can manage and track all doctors regardless of their profile completion status.

#### Acceptance Criteria

1. WHEN querying the doctors list THEN it SHALL include all users with role "doctor" from the users table
2. WHEN a doctor user has not completed their profile THEN the system SHALL show null values for doctor-specific fields (doctor_id, qualifications, department, specialization, license_number)
3. WHEN a doctor user has completed their profile THEN the system SHALL show the actual values from the doctors table
4. WHEN displaying doctor information THEN the system SHALL clearly indicate whether the profile is complete or incomplete

### Requirement 2

**User Story:** As an admin, I want to see all patient users in the patients list immediately after they are created, so that I can manage and track all patients regardless of their profile completion status.

#### Acceptance Criteria

1. WHEN querying the patients list THEN it SHALL include all users with role "patient" from the users table
2. WHEN a patient user has not completed their profile THEN the system SHALL show null values for patient-specific fields (medical_record_number, emergency_contact, insurance_info)
3. WHEN a patient user has completed their profile THEN the system SHALL show the actual values from the patients table
4. WHEN displaying patient information THEN the system SHALL clearly indicate whether the profile is complete or incomplete

### Requirement 3

**User Story:** As a doctor or patient, I want the existing profile completion process to remain unchanged, so that I can complete my profile using the same familiar interface.

#### Acceptance Criteria

1. WHEN a doctor/patient user accesses their profile completion endpoint THEN it SHALL work exactly as before
2. WHEN profile completion is successful THEN the system SHALL create the profile record as it currently does
3. WHEN a profile is already complete THEN the existing update functionality SHALL continue to work
4. WHEN profile completion fails THEN the system SHALL return the same error messages as before

### Requirement 4

**User Story:** As an admin, I want to distinguish between complete and incomplete profiles in the management interface, so that I can identify which users need to complete their profiles.

#### Acceptance Criteria

1. WHEN retrieving doctor/patient lists THEN each record SHALL include a profile_completed boolean field
2. WHEN a profile is incomplete THEN profile_completed SHALL be false and profile-specific fields SHALL be null
3. WHEN a profile is complete THEN profile_completed SHALL be true and profile-specific fields SHALL contain actual values
4. WHEN searching or filtering THEN the system SHALL work across both user fields and profile fields

### Requirement 5

**User Story:** As a system administrator, I want this change to be backward compatible, so that existing functionality is not disrupted.

#### Acceptance Criteria

1. WHEN existing completed profiles are queried THEN they SHALL appear exactly as they did before
2. WHEN profile completion endpoints are used THEN they SHALL continue to work without modification
3. WHEN user creation processes are used THEN they SHALL continue to work without modification
4. WHEN the system is deployed THEN no database migrations SHALL be required
