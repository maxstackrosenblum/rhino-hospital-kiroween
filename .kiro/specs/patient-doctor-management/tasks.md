# Implementation Plan

- [x] 1. Create database models and migrations

  - Create Patient and Doctor SQLAlchemy models in backend/models.py
  - Generate Alembic migration files for both tables with proper indexes and constraints
  - Apply migrations to create the database tables
  - _Requirements: 1.3, 5.2, 8.1, 8.2_

- [x] 2. Create Pydantic schemas for data validation

  - Implement PatientBase, PatientCreate, PatientUpdate, and PatientResponse schemas
  - Implement DoctorBase, DoctorCreate, DoctorUpdate, and DoctorResponse schemas
  - Add proper validation rules for email, age, and required fields
  - _Requirements: 1.2, 1.4, 5.1, 8.1, 8.3_

- [x] 3. Implement role-based access control dependencies

  - Add require_receptionist_or_admin dependency function
  - Add require_patient_access dependency function for patient endpoints
  - Test access control with different user roles
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4. Create patient CRUD API endpoints

  - Implement POST /api/patients endpoint for patient creation
  - Implement GET /api/patients endpoint with search and pagination
  - Implement GET /api/patients/{patient_id} endpoint for individual patient retrieval
  - Implement PUT /api/patients/{patient_id} endpoint for patient updates
  - Implement DELETE /api/patients/{patient_id} endpoint for soft deletion
  - Add proper error handling and validation for all endpoints
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2_

- [x] 5. Create doctor CRUD API endpoints

  - Implement POST /api/doctors endpoint for doctor registration
  - Implement GET /api/doctors endpoint with search and pagination
  - Implement GET /api/doctors/{doctor_id} endpoint for individual doctor retrieval
  - Implement PUT /api/doctors/{doctor_id} endpoint for doctor updates
  - Implement DELETE /api/doctors/{doctor_id} endpoint for soft deletion
  - Add proper error handling and validation for all endpoints
  - _Requirements: 5.1, 5.2, 6.1, 6.2_

- [x] 6. Register API routers in main application

  - Create backend/routers/patients.py and backend/routers/doctors.py router files
  - Import and register patient and doctor routers in backend/main.py
  - Test all endpoints using FastAPI's Swagger UI at /docs
  - _Requirements: 1.1, 5.1_

- [x] 7. Create TypeScript interfaces for frontend

  - Define Patient and Doctor interfaces in frontend/src/types/index.ts
  - Add PatientCreate, PatientUpdate, DoctorCreate, DoctorUpdate types
  - Include proper typing for API responses and form data
  - _Requirements: 9.1, 9.2_

- [x] 8. Implement patient API service functions

  - Create frontend/src/api/patients.ts with React Query hooks
  - Implement usePatients hook for listing/searching patients
  - Implement useCreatePatient, useUpdatePatient, useDeletePatient mutation hooks
  - Add proper error handling and loading states
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 9.3_

- [x] 9. Implement doctor API service functions

  - Create frontend/src/api/doctors.ts with React Query hooks
  - Implement useDoctors hook for listing/searching doctors
  - Implement useCreateDoctor, useUpdateDoctor, useDeleteDoctor mutation hooks
  - Add proper error handling and loading states
  - _Requirements: 5.1, 6.1, 9.3_

- [x] 10. Create patient management interface

  - Create frontend/src/pages/Patients.jsx with Material-UI components
  - Implement patient list table with search functionality
  - Add inline editing capabilities for patient records
  - Include delete confirmation dialog
  - Add proper loading states and error handling
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 9.1, 9.4_

- [x] 11. Create patient form component

  - Create frontend/src/components/PatientForm.tsx as reusable form component
  - Implement form validation for all required fields
  - Add proper error messages and field validation
  - Support both create and update modes
  - _Requirements: 1.2, 1.4, 3.2, 8.1, 9.2_

- [x] 12. Create complete doctor management interface

  - Create frontend/src/pages/Doctors.tsx following the same pattern as Patients.tsx
  - Create frontend/src/components/doctors/DoctorForm.tsx as reusable form component
  - Create frontend/src/components/doctors/DoctorsTable.tsx for displaying doctor list
  - Create frontend/src/components/doctors/CreateDoctorDialog.tsx for adding new doctors
  - Create frontend/src/components/doctors/EditDoctorDialog.tsx for editing doctors
  - Create frontend/src/components/doctors/DeleteDoctorDialog.tsx for delete confirmation
  - Add role-based access control (admin only for doctor management)
  - Implement form validation for all required fields including unique doctor_id
  - Include proper loading states, error handling, and success messages
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 8.1, 9.1, 9.2, 9.4_

- [x] 13. Add navigation and routing

  - Update frontend/src/App.js to include Doctors route (admin only access)
  - Add "Doctors" menu item to navigation sidebar with proper role-based visibility
  - Ensure Patients menu item is visible to doctors, receptionists, and admins
  - Test navigation and access control for different user roles
  - _Requirements: 7.1, 7.2, 7.3, 9.1_

- [x] 14. Enhance search and filtering functionality

  - Verify search functionality works properly in both patient and doctor lists
  - Add search by multiple fields (name, email, phone for patients; name, email, doctor_id for doctors)
  - Implement real-time search with debouncing for better performance
  - Add empty state messages when no results are found
  - _Requirements: 2.2, 2.3, 6.2, 9.4_

- [x] 15. Enhance error handling and user feedback

  - Verify Alert components display success/error messages properly in both interfaces
  - Ensure form validation errors are shown clearly with proper field highlighting
  - Test network error handling and API failure scenarios
  - Confirm loading states and disabled buttons work during async operations
  - Add proper error boundaries for unexpected errors
  - _Requirements: 1.4, 3.3, 4.3, 5.3, 9.3_

- [ ] 16. Test complete patient management workflow

  - Test patient creation by receptionist and admin users
  - Test patient search and listing by doctor, receptionist, and admin users
  - Test patient updates by receptionist and admin users
  - Test patient deletion by admin users only
  - Verify role-based access control works correctly
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 4.1, 7.1, 7.2, 7.3_

- [ ] 17. Test complete doctor management workflow
  - Test doctor registration by admin users only
  - Test doctor search and listing by admin users only
  - Test doctor updates by admin users only
  - Test doctor deletion by admin users only
  - Verify all role restrictions are properly enforced
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 7.1_
