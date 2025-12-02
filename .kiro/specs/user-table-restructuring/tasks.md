# Implementation Plan

- [x] 1. Update backend models and database schema

  - Add PATIENT role to UserRole enum in backend/models.py
  - Update User model to include phone, city, age, address, gender fields with relationships
  - Update Patient and Doctor models to remove duplicate fields, add user_id foreign keys
  - Change Doctor qualification field to qualifications JSON array
  - Create Alembic migration to recreate tables with new structure and indexes
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 3.1, 7.1, 7.2, 7.3_

- [x] 2. Update backend schemas for new workflow

  - Add PATIENT role to UserRole enum in backend/schemas.py (already done)
  - Create separate schemas for user creation vs profile completion (UserCreate, PatientProfileCreate, DoctorProfileCreate)
  - Update existing schemas to support the new workflow separation
  - Remove combined create schemas that mix user and role-specific data
  - Add profile completion status tracking schemas
  - _Requirements: 9.1, 9.2, 9.5, 9.6_

- [x] 3. Update backend API endpoints for new workflow

  - Create user management endpoints for admin to create basic user accounts
  - Update Patient API endpoints to separate profile completion from user creation
  - Update Doctor API endpoints to separate profile completion from user creation
  - Add profile completion endpoints for patients and doctors
  - Update authentication system to handle profile completion requirements
  - Add role-based access control for new workflow
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 9.1, 9.2, 9.3, 9.4, 9.7_

- [x] 4. Update frontend interfaces and API services for new workflow

  - Add PATIENT role to UserRole enum in frontend/src/types/index.ts (already done)
  - Update User, Patient, and Doctor interfaces for new unified structure (already done)
  - Create separate interfaces for user creation vs profile completion
  - Update patient and doctor API service functions to handle new workflow
  - Update qualifications handling to support arrays in doctor services
  - Add user management API service functions
  - _Requirements: 5.1, 5.2, 5.3, 9.1, 9.2, 9.5, 9.6_

- [x] 5. Update frontend form components for new workflow

  - Create UserForm component for admin to create basic user accounts with role selection
  - Update PatientForm component to be a profile completion/update form (no user creation)
  - Update DoctorForm component to be a profile completion/update form with qualifications array
  - Add UI for managing multiple qualifications (add/remove functionality)
  - Update form validation for separated user creation vs profile completion workflow
  - _Requirements: 8.1, 8.2, 8.5, 9.1, 9.2, 9.5, 9.6_

- [ ] 6. Test complete system integration
  - Test new user creation workflow: admin creates user, user completes profile
  - Test patient workflow: profile completion, authentication, CRUD operations with unified structure
  - Test doctor workflow: profile completion, authentication, CRUD with qualifications array
  - Validate data consistency, referential integrity, and transaction handling
  - Test role-based access control with new PATIENT role and profile completion requirements
  - Performance test JOINs and optimize queries as needed
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
