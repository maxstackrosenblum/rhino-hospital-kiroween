# Implementation Plan

- [x] 1. Update backend schemas and doctors endpoints

  - Modify DoctorResponse schema to make profile fields optional and add profile_completed field
  - Update get_doctors endpoint to query User table with LEFT JOIN to Doctor table
  - Update get_doctor endpoint to handle users without completed profiles
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Update backend schemas and patients endpoints

  - Modify PatientResponse schema to make profile fields optional and add profile_completed field
  - Update get_patients endpoint to query User table with LEFT JOIN to Patient table
  - Update get_patient endpoint to handle users without completed profiles
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update frontend types and components

  - Update TypeScript interfaces for DoctorResponse and PatientResponse
  - Modify DoctorsTable and PatientsTable components to show profile completion status
  - Handle null values and add visual indicators for incomplete profiles
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4. Test the updated functionality
  - Test that doctors/patients lists show all users with respective roles
  - Verify profile_completed field accuracy and backward compatibility
  - Test frontend displays incomplete profiles correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
