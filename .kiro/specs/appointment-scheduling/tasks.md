# Implementation Plan

## Overview
This implementation plan breaks down the appointment scheduling system into discrete, manageable coding tasks. Each task builds incrementally on previous work, integrating with the existing Hospital Management System infrastructure (FastAPI, PostgreSQL, JWT auth, email system).

---

## Tasks

- [ ] 1. Set up appointment data models and migrations
  - Add Appointment model to models.py with all fields (patient_id, doctor_id, appointment_date, disease, status)
  - Add AppointmentStatus enum (pending, confirmed, completed, cancelled)
  - Add composite indexes for (doctor_id, appointment_date, deleted_at) and (patient_id, deleted_at)
  - Create Alembic migration for appointments table
  - Run migration to create table in database
  - _Requirements: 5.3, 5.4_

- [ ] 2. Create Pydantic schemas for appointments
  - Create AppointmentCreate schema with doctor_id, appointment_date, disease fields
  - Add disease field validator to reject empty/whitespace values
  - Create AppointmentUpdate schema with optional fields
  - Create AppointmentStatusUpdate schema with status enum
  - Create AppointmentResponse schema with patient and doctor info fields
  - Create PaginatedAppointmentsResponse schema
  - Create AvailableDoctorsResponse and DoctorAvailableSlotsResponse schemas
  - _Requirements: 3.1, 3.2, 9.3_

- [ ]* 2.1 Write property test for required field validation
  - **Property 6: Required field validation**
  - **Validates: Requirements 3.1**

- [ ] 3. Implement patient profile auto-creation helper
  - Create get_or_create_patient() function in appointments router
  - Check if user has existing patient profile
  - Generate medical record number if creating new patient
  - Auto-create patient profile with MRN if doesn't exist
  - Update user role from UNDEFINED to PATIENT if needed
  - Return patient object for appointment creation
  - _Requirements: 5.1, 5.2_

- [ ]* 3.1 Write property test for auto-create patient profile
  - **Property 9: Auto-create patient profile**
  - **Validates: Requirements 5.1**

- [ ]* 3.2 Write property test for role promotion
  - **Property 10: Role promotion to patient**
  - **Validates: Requirements 5.2**

- [ ] 4. Implement shift validation logic
  - Create helper function to verify doctor has shift on appointment date
  - Query Shift table for doctor's shift on requested date
  - Validate appointment time falls within shift start_time and end_time
  - Return appropriate error if no shift or time outside shift hours
  - _Requirements: 10.1, 10.3, 10.5_

- [ ]* 4.1 Write property test for shift validation
  - **Property 22: Shift validation for appointment dates**
  - **Validates: Requirements 8.4, 10.1, 10.3**

- [ ] 5. Implement appointment conflict detection
  - Create helper function to check for existing appointments
  - Query for appointments with same doctor, date, time
  - Filter by status (pending, confirmed) and exclude deleted
  - Return conflict error if slot is taken
  - Allow appointments in cancelled/deleted slots
  - _Requirements: 4.1, 4.2, 4.4_

- [ ]* 5.1 Write property test for conflict detection
  - **Property 7: Appointment conflict detection**
  - **Validates: Requirements 4.1**

- [ ]* 5.2 Write property test for cancelled slots availability
  - **Property 8: Cancelled appointments don't block slots**
  - **Validates: Requirements 4.4**

- [ ] 6. Implement create appointment endpoint
  - Create POST /api/appointments endpoint
  - Require authentication with require_appointment_access dependency
  - Get or create patient profile for current user
  - Verify doctor exists and is not deleted
  - Parse appointment_date from ISO format string
  - Validate doctor has shift on requested date/time
  - Check for appointment conflicts
  - Create appointment with status=pending
  - Return 201 Created with complete appointment details
  - _Requirements: 3.1, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 6.1 Write property test for appointment creation completeness
  - **Property 11: Appointment creation completeness**
  - **Validates: Requirements 5.3**

- [ ]* 6.2 Write property test for default pending status
  - **Property 12: Default pending status**
  - **Validates: Requirements 5.4**

- [ ]* 6.3 Write property test for creation response completeness
  - **Property 13: Creation response completeness**
  - **Validates: Requirements 5.5**

- [ ] 7. Implement appointment confirmation email
  - Check patient's email_preferences for appointment_updates
  - Send confirmation email if preference is enabled
  - Include patient name, doctor name, appointment date, department, disease
  - Add unsubscribe link to email
  - Log email sending but don't fail appointment creation on email errors
  - _Requirements: 6.1, 6.2, 6.4_

- [ ]* 7.1 Write property test for email preference respect
  - **Property 14: Email preference respect for confirmations**
  - **Validates: Requirements 6.1**

- [ ]* 7.2 Write property test for email content completeness
  - **Property 15: Confirmation email completeness**
  - **Validates: Requirements 6.2**

- [ ]* 7.3 Write property test for email failure resilience
  - **Property 16: Email failure resilience**
  - **Validates: Requirements 6.4**

- [ ] 8. Checkpoint - Ensure appointment creation tests pass
  - Ensure all tests pass, ask the user if questions arise

- [ ] 9. Implement get appointments list endpoint
  - Create GET /api/appointments endpoint with pagination
  - Accept page, page_size, patient_id, doctor_id, status, date_from, date_to filters
  - Apply role-based filtering (patient sees own, doctor sees assigned, admin sees all)
  - Join with Patient and User tables to get patient info
  - Join with Doctor and User tables to get doctor info
  - Exclude soft-deleted appointments, patients, doctors, users
  - Return paginated response with total count and page info
  - _Requirements: 7.1, 7.2, 7.6, 7.7, 7.8_

- [ ]* 9.1 Write property test for pagination correctness
  - **Property 17: Pagination correctness**
  - **Validates: Requirements 7.1**

- [ ]* 9.2 Write property test for listing response completeness
  - **Property 18: Listing response completeness**
  - **Validates: Requirements 7.2**

- [ ]* 9.3 Write property test for filter effectiveness
  - **Property 19: Filter effectiveness**
  - **Validates: Requirements 7.7**

- [ ]* 9.4 Write property test for soft-delete exclusion
  - **Property 20: Soft-delete exclusion**
  - **Validates: Requirements 7.8**

- [ ] 10. Implement role-based access control for listings
  - Apply patient data isolation (show only own appointments)
  - Apply doctor data isolation (show only assigned appointments)
  - Apply admin full access (show all appointments)
  - Handle users without patient/doctor profiles gracefully
  - _Requirements: 2.4, 2.5, 2.6_

- [ ]* 10.1 Write property test for patient data isolation
  - **Property 3: Patient data isolation**
  - **Validates: Requirements 2.4**

- [ ]* 10.2 Write property test for doctor data isolation
  - **Property 4: Doctor data isolation**
  - **Validates: Requirements 2.5**

- [ ]* 10.3 Write property test for admin full access
  - **Property 5: Admin full access**
  - **Validates: Requirements 2.6**

- [ ] 11. Implement get single appointment endpoint
  - Create GET /api/appointments/{id} endpoint
  - Verify appointment exists and is not deleted
  - Apply role-based access control (patient/doctor ownership, admin full access)
  - Return 403 Forbidden if user doesn't have permission
  - Return complete appointment details with patient and doctor info
  - _Requirements: 13.1, 13.2, 13.3, 13.6_

- [ ]* 11.1 Write property test for patient access control
  - **Property 33: Patient access control for viewing**
  - **Validates: Requirements 13.3**

- [ ] 12. Implement update appointment endpoint
  - Create PUT /api/appointments/{id} endpoint
  - Require doctor or admin role with require_appointment_management
  - Verify doctor can only update their own appointments
  - Validate appointment exists and is not deleted
  - If date changes, validate new shift and check conflicts
  - Update appointment fields and updated_at timestamp
  - Return updated appointment with populated info
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.7_

- [ ]* 12.1 Write property test for doctor ownership verification
  - **Property 21: Doctor ownership verification for updates**
  - **Validates: Requirements 8.2**

- [ ]* 12.2 Write property test for update field persistence
  - **Property 23: Update field persistence**
  - **Validates: Requirements 8.6**

- [ ] 13. Implement update appointment status endpoint
  - Create PATCH /api/appointments/{id}/status endpoint
  - Require doctor or admin role
  - Verify doctor can only update their own appointments
  - Validate status is valid enum value
  - Update status and updated_at timestamp
  - Send status update email if status changed and preference enabled
  - Return updated appointment
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 13.1 Write property test for status enum validation
  - **Property 24: Status enum validation**
  - **Validates: Requirements 9.3**

- [ ]* 13.2 Write property test for status update persistence
  - **Property 25: Status update persistence**
  - **Validates: Requirements 9.4**

- [ ]* 13.3 Write property test for status change notifications
  - **Property 26: Status change notifications**
  - **Validates: Requirements 9.5**

- [ ] 14. Implement status update email notification
  - Create send_appointment_status_update_email() function
  - Include old status, new status, appointment details
  - Add unsubscribe link to email
  - Check email preferences before sending
  - Log errors but don't fail status update on email failures
  - _Requirements: 9.5, 9.6, 9.7_

- [ ] 15. Implement delete appointment endpoint
  - Create DELETE /api/appointments/{id} endpoint
  - Verify appointment exists and is not deleted
  - Apply role-based access control (patient/doctor ownership, admin full access)
  - Perform soft delete by setting deleted_at timestamp
  - Set status to cancelled
  - Return 204 No Content
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6, 14.7_

- [ ]* 15.1 Write property test for soft delete behavior
  - **Property 34: Soft delete behavior**
  - **Validates: Requirements 14.6**

- [ ] 16. Checkpoint - Ensure CRUD operations tests pass
  - Ensure all tests pass, ask the user if questions arise

- [ ] 17. Implement get available doctors endpoint
  - Create GET /api/appointments/available-doctors endpoint
  - Accept date query parameter
  - Query shifts for requested date
  - Join with Doctor and User tables
  - Filter by non-deleted doctors with shifts on date
  - Count pending/confirmed appointments for each doctor
  - Return list with doctor info, shift times, appointment count
  - _Requirements: 11.1, 11.2, 11.3_

- [ ]* 17.1 Write property test for doctor availability query
  - **Property 27: Doctor availability query accuracy**
  - **Validates: Requirements 11.1**

- [ ]* 17.2 Write property test for available doctor response
  - **Property 28: Available doctor response completeness**
  - **Validates: Requirements 11.2**

- [ ]* 17.3 Write property test for appointment count accuracy
  - **Property 29: Appointment count accuracy**
  - **Validates: Requirements 11.3**

- [ ] 18. Implement get available slots endpoint
  - Create GET /api/appointments/doctors/{id}/available-slots endpoint
  - Accept date and slot_duration query parameters
  - Verify doctor exists and is not deleted
  - Get doctor's shift for requested date
  - Generate time slots from shift start to end with slot_duration intervals
  - Query existing pending/confirmed appointments
  - Separate slots into available and booked lists
  - Return slots in ISO format with shift info
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ]* 18.1 Write property test for slot generation
  - **Property 30: Time slot generation correctness**
  - **Validates: Requirements 12.4**

- [ ]* 18.2 Write property test for booked slot exclusion
  - **Property 31: Booked slot exclusion**
  - **Validates: Requirements 12.5**

- [ ]* 18.3 Write property test for slot response format
  - **Property 32: Slot response format**
  - **Validates: Requirements 12.6**

- [ ] 19. Implement authentication and authorization
  - Ensure require_appointment_access dependency validates JWT tokens
  - Ensure require_appointment_management checks for doctor/admin roles
  - Add proper error responses for missing/invalid tokens
  - Add proper error responses for insufficient permissions
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ]* 19.1 Write property test for authentication token validation
  - **Property 1: Authentication token validation**
  - **Validates: Requirements 1.1**

- [ ]* 19.2 Write property test for role-based management access
  - **Property 2: Role-based management access**
  - **Validates: Requirements 2.2**

- [ ] 20. Register appointment router in main application
  - Import appointment router in main.py
  - Register router with app.include_router()
  - Verify all endpoints are accessible at /api/appointments
  - Test endpoints in Swagger UI at /docs
  - _Requirements: All_

- [ ] 21. Final checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 22. Write integration tests for complete workflows
  - Test: Create appointment → Send email → List appointments → Update status → Send email
  - Test: Create appointment → Check conflict → Reject duplicate
  - Test: Query available doctors → Get slots → Book appointment
  - Test: Patient creates → Patient views own → Doctor views assigned → Admin views all

