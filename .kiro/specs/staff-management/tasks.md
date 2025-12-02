# Implementation Plan

- [x] 1. Set up database models and migrations
- [x] 1.1 Create Receptionist and Worker SQLAlchemy models
  - Define Receptionist model with id, first_name, last_name, phone, created_at, updated_at fields
  - Define Worker model with id, first_name, last_name, phone, created_at, updated_at fields
  - Add indexes on first_name and last_name for search performance
  - Configure created_at to auto-set on creation
  - Configure updated_at to auto-set on creation and auto-update on modification
  - _Requirements: 11.1, 2.3, 7.3, 18.1, 18.2, 18.3_

- [x] 1.2 Create Alembic migration for staff tables
  - Generate migration script for receptionists and workers tables
  - Test migration up and down
  - _Requirements: 11.1_

- [x] 1.3 Git commit: Database models and migrations
  - Run: `git add backend/models.py backend/alembic/versions/*`
  - Commit: `git commit -m "feat: add staff database models and migration"`
  - Push: `git push` (pushes to current branch)

- [x] 2. Implement Pydantic schemas for staff management
- [x] 2.1 Create request and response schemas
  - Define StaffCreate schema with validation for first_name, last_name, phone
  - Define StaffUpdate schema with optional fields
  - Define StaffResponse schema with all fields including timestamps
  - Define StaffListResponse schema for list endpoints
  - Add validators to ensure fields are not empty or whitespace-only
  - _Requirements: 2.2, 7.2, 12.3, 13.1_

- [x] 2.2 Write property test for empty field rejection
  - **Property 4: Empty field rejection**
  - **Validates: Requirements 2.2, 2.5, 7.2, 7.5**

- [x] 2.3 Write property test for Pydantic validation enforcement
  - **Property 6: Pydantic validation enforcement**
  - **Validates: Requirements 13.1**

- [x] 2.4 Git commit: Pydantic schemas and validation tests
  - Run: `git add backend/schemas.py backend/tests/`
  - Commit: `git commit -m "feat: add Pydantic schemas with validation tests"`
  - Push: `git push` (pushes to current branch)

- [x] 3. Implement Repository Layer
- [x] 3.1 Create base repository interface
  - Define BaseStaffRepository abstract class with CRUD methods
  - Include methods: create, get_by_id, get_all, search, update, delete
  - _Requirements: 12.1_

- [x] 3.2 Implement ReceptionistRepository
  - Implement all CRUD operations for receptionists
  - Implement search functionality with LIKE queries on first_name and last_name
  - Handle database sessions via dependency injection
  - _Requirements: 5.2, 11.1, 11.2, 11.3_

- [x] 3.3 Implement WorkerRepository
  - Implement all CRUD operations for workers
  - Implement search functionality with LIKE queries on first_name and last_name
  - Handle database sessions via dependency injection
  - _Requirements: 10.2, 11.1, 11.2, 11.3_

- [x] 3.4 Write property test for staff registration round-trip
  - **Property 1: Staff registration round-trip consistency**
  - **Validates: Requirements 2.4, 7.4, 11.1**

- [x] 3.5 Write property test for staff update preserves unmodified fields
  - **Property 2: Staff update preserves unmodified fields**
  - **Validates: Requirements 11.2**

- [x] 3.6 Write property test for staff deletion completeness
  - **Property 3: Staff deletion completeness**
  - **Validates: Requirements 5.5, 10.8, 11.3**

- [x] 3.7 Write property test for search filter correctness
  - **Property 8: Search filter correctness**
  - **Validates: Requirements 5.2, 10.2**

- [x] 3.8 Git commit: Repository layer with tests
  - Run: `git add backend/repositories/ backend/tests/`
  - Commit: `git commit -m "feat: implement repository layer with property tests"`
  - Push: `git push` (pushes to current branch)

- [x] 4. Implement Service Layer with logging
- [x] 4.1 Set up structured logging
  - Configure structured JSON logging using Python's logging module
  - Create logger utility with PII masking functions
  - Implement log formatting for requests, errors, and operations
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 4.2 Create base staff service
  - Define BaseStaffService class with repository dependency
  - Implement register_staff method with validation and logging
  - Implement get_staff_list method with search support and logging
  - Implement update_staff method with validation and logging
  - Implement delete_staff method with logging
  - Add error handling and transformation
  - _Requirements: 12.1, 14.3_

- [x] 4.3 Implement ReceptionistService
  - Extend BaseStaffService for receptionist-specific logic
  - Inject ReceptionistRepository dependency
  - _Requirements: 2.1, 2.2, 3.1, 4.1, 5.2_

- [x] 4.4 Implement WorkerService
  - Extend BaseStaffService for worker-specific logic
  - Inject WorkerRepository dependency
  - _Requirements: 7.1, 7.2, 8.1, 9.1, 10.2_

- [x] 4.5 Write property test for automatic timestamp generation
  - **Property 14: Automatic timestamp generation**
  - **Validates: Requirements 2.3, 7.3**

- [x] 4.6 Write property test for input sanitization
  - **Property 5: Input sanitization**
  - **Validates: Requirements 13.5**

- [x] 4.7 Write property test for PII masking in logs
  - **Property 18: PII masking in logs**
  - **Validates: Requirements 14.4**

- [x] 4.8 Write property test for no credential exposure in logs
  - **Property 19: No credential exposure in logs**
  - **Validates: Requirements 14.5**

- [x] 4.9 Git commit: Service layer with logging and tests
  - Run: `git add backend/services/ backend/core/ backend/tests/`
  - Commit: `git commit -m "feat: implement service layer with structured logging"`
  - Push: `git push` (pushes to current branch)

- [x] 5. Implement API routes with error handling
- [x] 5.1 Create receptionist router
  - Implement POST /api/receptionists endpoint for registration
  - Implement GET /api/receptionists endpoint for listing with optional search
  - Implement GET /api/receptionists/{id} endpoint for retrieving by ID
  - Implement PUT /api/receptionists/{id} endpoint for updates
  - Implement DELETE /api/receptionists/{id} endpoint for deletion
  - Add authentication dependency to all endpoints (verify JWT token and admin role)
  - Add request/response models with Pydantic
  - Return 404 errors for non-existent staff IDs
  - _Requirements: 2.1, 5.1, 5.3, 5.4, 5.5, 17.1, 17.2, 17.3, 19.1, 19.2, 19.3_

- [x] 5.2 Create worker router
  - Implement POST /api/workers endpoint for registration
  - Implement GET /api/workers endpoint for listing with optional search
  - Implement GET /api/workers/{id} endpoint for retrieving by ID
  - Implement PUT /api/workers/{id} endpoint for updates
  - Implement DELETE /api/workers/{id} endpoint for deletion
  - Add authentication dependency to all endpoints (verify JWT token and admin role)
  - Add request/response models with Pydantic
  - Return 404 errors for non-existent staff IDs
  - _Requirements: 7.1, 10.1, 10.6, 10.7, 10.8, 17.1, 17.2, 17.3, 19.1, 19.2, 19.3_

- [x] 5.3 Implement global error handler
  - Create exception handler for validation errors (400)
  - Create exception handler for not found errors (404)
  - Create exception handler for server errors (500)
  - Create exception handler for database errors (connection failures, transaction failures, constraint violations)
  - Implement transaction rollback on database failures
  - Ensure structured JSON error responses
  - Sanitize error messages to prevent information leakage
  - Log all errors with full context
  - _Requirements: 15.1, 15.2, 15.4, 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 5.4 Register routers in main application
  - Add receptionist and worker routers to FastAPI app
  - Configure CORS for frontend access
  - _Requirements: 2.1, 7.1_

- [x] 5.5 Write property test for structured error responses
  - **Property 20: Structured error responses**
  - **Validates: Requirements 15.1**

- [x] 5.6 Write property test for no stack trace exposure
  - **Property 21: No stack trace exposure**
  - **Validates: Requirements 15.2**

- [x] 5.7 Write property test for field-specific validation errors
  - **Property 23: Field-specific validation errors**
  - **Validates: Requirements 15.4**

- [x] 5.8 Write property test for request logging
  - **Property 15: Request logging**
  - **Validates: Requirements 14.1**

- [x] 5.9 Write property test for error logging
  - **Property 16: Error logging**
  - **Validates: Requirements 14.2**

- [x] 5.10 Write property test for success operation logging
  - **Property 17: Success operation logging**
  - **Validates: Requirements 14.3**

- [x] 5.11 Write property test for response schema compliance
  - **Property 7: Response schema compliance**
  - **Validates: Requirements 13.2**

- [x] 5.12 Write property test for unauthorized access rejection
  - **Property 28: Unauthorized access rejection**
  - **Validates: Requirements 17.1**

- [x] 5.13 Write property test for non-admin access rejection
  - **Property 29: Non-admin access rejection**
  - **Validates: Requirements 17.2**

- [x] 5.14 Write property test for updated timestamp on modification
  - **Property 31: Updated timestamp on modification**
  - **Validates: Requirements 18.3, 18.4**

- [x] 5.15 Write property test for not found errors
  - **Property 32: Not found error for non-existent staff**
  - **Validates: Requirements 19.1, 19.2, 19.3, 19.4**

- [x] 5.16 Write property test for database error handling
  - **Property 34: Database error graceful handling**
  - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5**

- [x] 5.17 Write property test for transaction rollback
  - **Property 35: Transaction rollback on failure**
  - **Validates: Requirements 20.2**

- [x] 5.18 Git commit: API routes with comprehensive tests
  - Run: `git add backend/routers/ backend/main.py backend/tests/`
  - Commit: `git commit -m "feat: add API routes with error handling and auth"`
  - Push: `git push` (pushes to current branch)

- [x] 6. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6.1 Git commit: Backend checkpoint - all tests passing
  - Run: `git add .`
  - Commit: `git commit -m "test: backend checkpoint - all tests passing"`
  - Push: `git push` (pushes to current branch)

- [x] 7. Set up frontend interfaces and API client
- [x] 7.1 Create type definitions for staff management
  - Note: The existing frontend is JavaScript. We can either convert to TypeScript or use JSDoc for type annotations
  - Define Staff interface/type matching backend StaffResponse
  - Define StaffCreate interface/type matching backend schema
  - Define StaffUpdate interface/type matching backend schema
  - Define StaffListResponse interface/type
  - Define ApiError interface/type for error handling
  - _Requirements: 12.4, 13.4_

- [x] 7.2 Implement API client utility
  - Create centralized fetch wrapper with authentication
  - Add JWT token to Authorization header for all requests
  - Add request/response type safety
  - Implement error transformation and handling
  - Add retry logic for network errors
  - Handle 401/403 errors by redirecting to login
  - _Requirements: 15.5, 17.5_

- [x] 7.3 Create staff API functions
  - Implement createReceptionist function
  - Implement getReceptionists function with search parameter
  - Implement updateReceptionist function
  - Implement deleteReceptionist function
  - Implement createWorker function
  - Implement getWorkers function with search parameter
  - Implement updateWorker function
  - Implement deleteWorker function
  - _Requirements: 2.1, 5.1, 7.1, 10.1_

- [x] 7.4 Git commit: Frontend API client and types
  - Run: `git add frontend/src/api/ frontend/src/types/`
  - Commit: `git commit -m "feat: add frontend API client with type definitions"`
  - Push: `git push` (pushes to current branch)

- [x] 8. Implement frontend custom hooks
- [x] 8.1 Create useStaffList hook
  - Implement state management for staff list, loading, and errors
  - Implement search query state and filtering
  - Implement refreshList function to fetch staff
  - Implement deleteStaff function with optimistic updates
  - Implement updateStaff function with optimistic updates
  - Add error handling and user-friendly error messages
  - _Requirements: 5.2, 10.2, 15.3_

- [x] 8.2 Create useStaffForm hook
  - Implement form data state management
  - Implement field-level validation
  - Implement error state for validation messages
  - Implement handleChange for input updates
  - Implement handleSubmit for form submission
  - Implement resetForm to clear form after success
  - Add loading state during submission
  - _Requirements: 1.2, 6.2, 15.4_

- [x] 8.3 Write property test for network error handling
  - **Property 24: Network error handling**
  - **Validates: Requirements 15.5**

- [x] 8.4 Write property test for JWT token inclusion
  - **Property 30: JWT token inclusion**
  - **Validates: Requirements 17.5**

- [x] 8.5 Write property test for user-friendly not found messages
  - **Property 33: User-friendly not found messages**
  - **Validates: Requirements 19.5**

- [x] 8.6 Git commit: Frontend hooks with tests
  - Run: `git add frontend/src/hooks/ frontend/src/tests/`
  - Commit: `git commit -m "feat: add custom hooks for staff management"`
  - Push: `git push` (pushes to current branch)

- [x] 9. Implement receptionist UI components
- [x] 9.1 Create AddReceptionist page component
  - Implement form UI with first_name, last_name, phone fields
  - Use useStaffForm hook for form logic
  - Display validation errors inline
  - Show loading spinner during submission
  - Display success notification and redirect on success
  - Display error notification on failure
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 3.2, 4.1, 4.2_

- [x] 9.2 Create ReceptionistList page component
  - Implement table UI with columns for all receptionist fields
  - Add search input with real-time filtering
  - Use useStaffList hook for data management
  - Add edit and delete buttons for each row
  - Implement edit modal with form
  - Show loading spinner while fetching data
  - Display empty state message when no results
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9.3 Write property test for form validation state
  - **Property 25: Form validation state**
  - **Validates: Requirements 1.2, 6.2**

- [x] 9.4 Write property test for form submission prevention
  - **Property 26: Form submission prevention on invalid input**
  - **Validates: Requirements 1.3, 6.3**

- [x] 9.5 Write property test for loading indicator display
  - **Property 27: Loading indicator display**
  - **Validates: Requirements 16.2**

- [x] 9.6 Git commit: Receptionist UI components with tests
  - Run: `git add frontend/src/pages/ frontend/src/components/ frontend/src/tests/`
  - Commit: `git commit -m "feat: add receptionist management UI components"`
  - Push: `git push` (pushes to current branch)

- [x] 10. Implement worker UI components
- [x] 10.1 Create AddWorker page component
  - Implement form UI with first_name, last_name, phone fields
  - Use useStaffForm hook for form logic
  - Display validation errors inline
  - Show loading spinner during submission
  - Display success notification and redirect on success
  - Display error notification on failure
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 8.1, 8.2, 9.1_

- [x] 10.2 Create WorkerList page component
  - Implement table UI with columns for all worker fields
  - Add search input with real-time filtering
  - Use useStaffList hook for data management
  - Add edit and delete buttons for each row
  - Implement edit modal with form
  - Show loading spinner while fetching data
  - Display empty state message when no results
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [x] 10.3 Write property test for search reactivity
  - **Property 9: Search reactivity**
  - **Validates: Requirements 10.3**

- [x] 10.4 Write property test for success notification
  - **Property 10: Success notification on successful registration**
  - **Validates: Requirements 3.1, 3.2, 8.1, 8.2**

- [x] 10.5 Write property test for error notification
  - **Property 11: Error notification on failed registration**
  - **Validates: Requirements 4.1, 4.3, 9.1, 9.3**

- [x] 10.6 Write property test for no partial data on failure
  - **Property 12: No partial data on failure**
  - **Validates: Requirements 4.3, 9.3**

- [x] 10.7 Write property test for newly registered staff in list
  - **Property 13: Newly registered staff appears in list**
  - **Validates: Requirements 8.3**

- [x] 10.8 Write property test for user-friendly error messages
  - **Property 22: User-friendly error messages**
  - **Validates: Requirements 15.3**

- [x] 10.9 Git commit: Worker UI components with tests
  - Run: `git add frontend/src/pages/ frontend/src/components/ frontend/src/tests/`
  - Commit: `git commit -m "feat: add worker management UI components"`
  - Push: `git push` (pushes to current branch)

- [x] 11. Add navigation and routing
- [x] 11.1 Update App.js with staff management routes
  - Add route for /receptionists/add
  - Add route for /receptionists
  - Add route for /workers/add
  - Add route for /workers
  - Protect all routes with authentication
  - _Requirements: 1.1, 5.1, 6.1, 10.1_

- [x] 11.2 Update Navbar with staff management links
  - Add navigation links for receptionist management
  - Add navigation links for worker management
  - Ensure links are only visible to authenticated admins
  - _Requirements: 1.1, 6.1_

- [x] 11.3 Git commit: Navigation and routing
  - Run: `git add frontend/src/App.js frontend/src/components/Navbar.js`
  - Commit: `git commit -m "feat: add staff management routes and navigation"`
  - Push: `git push` (pushes to current branch)

- [x] 12. Implement responsive styling and accessibility
- [x] 12.1 Style staff management forms
  - Apply consistent styling to form inputs
  - Add responsive layout for mobile devices
  - Ensure proper spacing and visual hierarchy
  - Add focus states for keyboard navigation
  - _Requirements: 16.1, 16.3_

- [x] 12.2 Style staff list tables
  - Apply consistent table styling
  - Make tables responsive with horizontal scroll on mobile
  - Add hover states for interactive elements
  - Ensure proper contrast for accessibility
  - _Requirements: 16.1_

- [x] 12.3 Add loading and empty state components
  - Create reusable LoadingSpinner component
  - Create EmptyState component for no results
  - Ensure loading states are accessible to screen readers
  - _Requirements: 16.2_

- [x] 12.4 Git commit: Styling and accessibility
  - Run: `git add frontend/src/App.css frontend/src/components/`
  - Commit: `git commit -m "style: add responsive styling and accessibility features"`
  - Push: `git push` (pushes to current branch)

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13.1 Git commit: Final implementation complete
  - Run: `git add .`
  - Commit: `git commit -m "feat: complete staff management feature implementation"`
  - Push: `git push` (pushes to current branch)
