# Requirements Document

## Introduction

This feature restructures the Hospital Management System's user management architecture to consolidate all users (patients, doctors, receptionists, and admins) into a unified user table with role-based differentiation. The current system has separate patient and doctor tables with duplicate common information. This restructuring will eliminate data duplication, improve data consistency, and create a more maintainable architecture where the user table contains common user information and specialized tables contain role-specific data.

## Requirements

### Requirement 1: Unified User Table Architecture

**User Story:** As a system administrator, I want all users to be stored in a unified user table with role-based differentiation so that user management is centralized and data duplication is eliminated.

#### Acceptance Criteria

1. WHEN the system is restructured THEN all users (patients, doctors, receptionists, admins) SHALL be stored in the users table
2. WHEN a new patient role is added THEN the system SHALL support "patient" as a valid user role alongside existing roles
3. WHEN common user information is stored THEN the users table SHALL contain fields: id, email, username, first_name, last_name, phone, city, age, address, gender, hashed_password, role, created_at, updated_at, deleted_at
4. WHEN role-specific information is needed THEN patient and doctor tables SHALL contain only specialized fields with foreign key references to users table
5. WHEN data integrity is maintained THEN the system SHALL ensure referential integrity between users and their role-specific tables

### Requirement 2: Patient Table Restructuring and Workflow

**User Story:** As a developer, I want the patient table to contain only patient-specific information so that common user data is not duplicated across tables, and I want a clear separation between user account creation and profile completion.

#### Acceptance Criteria

1. WHEN the patient table is restructured THEN it SHALL contain only patient-specific fields: id, user_id (foreign key), medical_record_number, emergency_contact, insurance_info, created_at, updated_at, deleted_at
2. WHEN an admin creates a patient user THEN the system SHALL create only a user record with role "patient" and basic user information
3. WHEN a patient user completes their profile THEN the system SHALL create the linked patient record with medical-specific information
4. WHEN patient information is retrieved THEN the system SHALL join user and patient tables to provide complete patient information
5. WHEN a patient is deleted THEN the system SHALL soft delete both the user and patient records
6. WHEN patient data is updated THEN the system SHALL update the appropriate table (users or patients) based on the field being modified

### Requirement 3: Doctor Table Restructuring and Workflow

**User Story:** As a developer, I want the doctor table to contain only doctor-specific information so that common user data is centralized in the users table, and I want a clear separation between user account creation and profile completion.

#### Acceptance Criteria

1. WHEN the doctor table is restructured THEN it SHALL contain only doctor-specific fields: id, user_id (foreign key), doctor_id (unique identifier), qualifications (array), department, specialization, license_number, created_at, updated_at, deleted_at
2. WHEN an admin creates a doctor user THEN the system SHALL create only a user record with role "doctor" and basic user information
3. WHEN a doctor user completes their profile THEN the system SHALL create the linked doctor record with professional-specific information
4. WHEN doctor information is retrieved THEN the system SHALL join user and doctor tables to provide complete doctor information
5. WHEN a doctor is deleted THEN the system SHALL soft delete both the user and doctor records
6. WHEN doctor data is updated THEN the system SHALL update the appropriate table (users or doctors) based on the field being modified

### Requirement 4: Data Migration Strategy

**User Story:** As a system administrator, I want existing patient and doctor data to be migrated to the new structure so that no data is lost during the restructuring process.

#### Acceptance Criteria

1. WHEN the migration is executed THEN all existing patient records SHALL be converted to user records with role "patient"
2. WHEN the migration is executed THEN all existing doctor records SHALL be converted to user records with role "doctor"
3. WHEN patient data is migrated THEN common fields SHALL be moved to the users table and patient-specific fields SHALL remain in the patients table
4. WHEN doctor data is migrated THEN common fields SHALL be moved to the users table and doctor-specific fields SHALL remain in the doctors table
5. WHEN the migration is complete THEN all foreign key relationships SHALL be properly established and data integrity SHALL be maintained

### Requirement 5: API Endpoint Updates

**User Story:** As a frontend developer, I want the existing API endpoints to continue working with the new data structure so that frontend applications require minimal changes.

#### Acceptance Criteria

1. WHEN patient API endpoints are called THEN the system SHALL return complete patient information by joining users and patients tables
2. WHEN doctor API endpoints are called THEN the system SHALL return complete doctor information by joining users and doctors tables
3. WHEN patient or doctor records are created THEN the system SHALL create both user and role-specific records in a single transaction
4. WHEN patient or doctor records are updated THEN the system SHALL update the appropriate tables based on the fields being modified
5. WHEN API responses are returned THEN the structure SHALL remain compatible with existing frontend expectations

### Requirement 6: Authentication and Authorization Updates

**User Story:** As a security administrator, I want the authentication system to work seamlessly with the new unified user structure so that login and access control continue to function properly.

#### Acceptance Criteria

1. WHEN users authenticate THEN the system SHALL use the unified users table for credential verification
2. WHEN role-based access control is applied THEN the system SHALL use the role field from the users table
3. WHEN patient users log in THEN they SHALL have appropriate access to patient-specific features
4. WHEN doctor users log in THEN they SHALL have appropriate access to doctor-specific features
5. WHEN user sessions are managed THEN the system SHALL maintain compatibility with existing JWT token structure

### Requirement 7: Database Schema Validation

**User Story:** As a database administrator, I want the new database schema to maintain data integrity and performance so that the system remains reliable and efficient.

#### Acceptance Criteria

1. WHEN the new schema is implemented THEN all foreign key constraints SHALL be properly defined between users and role-specific tables
2. WHEN database indexes are created THEN they SHALL be optimized for common query patterns (user lookup, role filtering, name searches)
3. WHEN unique constraints are applied THEN they SHALL prevent duplicate emails, usernames, and doctor IDs
4. WHEN soft delete is implemented THEN it SHALL work consistently across users and related tables
5. WHEN database performance is measured THEN query performance SHALL be maintained or improved compared to the current structure

### Requirement 8: Data Consistency and Validation

**User Story:** As a data administrator, I want the new structure to maintain data consistency and validation so that data quality is preserved and improved.

#### Acceptance Criteria

1. WHEN user data is created or updated THEN all validation rules SHALL be applied consistently across the unified structure
2. WHEN role-specific data is managed THEN the system SHALL ensure that users have the appropriate role for their specialized records
3. WHEN data relationships are maintained THEN orphaned records SHALL be prevented through proper foreign key constraints
4. WHEN data is deleted THEN the system SHALL maintain referential integrity by properly handling cascading deletes
5. WHEN data validation fails THEN the system SHALL provide clear error messages indicating which table and field caused the validation failure

### Requirement 9: User Account Creation and Profile Management Workflow

**User Story:** As an admin, I want to create basic user accounts for patients and doctors, and as a user, I want to complete my own profile with role-specific information so that account creation is separated from profile completion.

#### Acceptance Criteria

1. WHEN an admin creates a patient account THEN the system SHALL create a user record with role "patient" and basic information only
2. WHEN an admin creates a doctor account THEN the system SHALL create a user record with role "doctor" and basic information only
3. WHEN a patient user logs in for the first time THEN they SHALL be prompted to complete their medical profile
4. WHEN a doctor user logs in for the first time THEN they SHALL be prompted to complete their professional profile
5. WHEN users complete their profiles THEN the system SHALL create the appropriate role-specific records (patient or doctor table entries)
6. WHEN users update their profiles THEN they SHALL be able to modify both basic user information and role-specific information
7. WHEN profile completion is required THEN users SHALL not have full system access until their profiles are complete
