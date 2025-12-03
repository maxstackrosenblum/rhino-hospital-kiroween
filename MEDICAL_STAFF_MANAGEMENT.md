# Medical Staff Management

## Overview

The Medical Staff Management system handles both **Medical Staff** (nurses, technicians, etc.) and **Receptionists** in a unified interface. Both roles share the same database table and management workflow but are distinguished by their user role.

## Architecture

### Database Schema

**Table: `medical_staff`**
- Stores profile information for both medical staff and receptionist users
- One-to-one relationship with `users` table via `user_id`
- Supports soft deletion via `deleted_at` timestamp

```sql
CREATE TABLE medical_staff (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    job_title VARCHAR(100),
    department VARCHAR(100),
    shift_schedule VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

### User Roles

Two roles use the medical_staff table:
- `medical_staff` - Medical personnel (nurses, technicians, lab staff, etc.)
- `receptionist` - Front desk and administrative staff

Both roles share the same fields but are visually distinguished in the UI.

## Workflow

### 1. User Creation
**Location:** Users Management Page (`/users`)  
**Permission:** Admin only

1. Admin creates a new user account
2. Assigns role as either `medical_staff` or `receptionist`
3. User appears in Medical Staff Management page with incomplete profile

### 2. Profile Completion
**Location:** Medical Staff Management Page (`/medical-staff`)  
**Permission:** Admin only

1. User with `medical_staff` or `receptionist` role appears in the list
2. Profile shows as incomplete (id is null)
3. Admin clicks "Complete Profile" button
4. Dialog opens with profile fields:
   - **Job Title** (optional) - e.g., "Nurse", "Receptionist", "Lab Technician"
   - **Department** (optional) - e.g., "Emergency", "Surgery", "Front Desk"
   - **Shift Schedule** (optional) - e.g., "Monday-Friday 9AM-5PM"
5. Admin submits the form
6. Profile is created and linked to the user

### 3. Profile Management
**Location:** Medical Staff Management Page (`/medical-staff`)  
**Permission:** Admin only

**Edit Profile:**
- Click edit icon on any completed profile
- Update job title, department, or shift schedule
- Changes are saved immediately

**Delete Profile:**
- Click delete icon on any completed profile
- Confirmation dialog appears
- Soft delete is performed (sets `deleted_at` timestamp)
- User account remains but profile is hidden

**Search:**
- Search by first name, last name, or email
- Real-time filtering with 300ms debounce
- Works across both medical staff and receptionist roles

## API Endpoints

### Base URL: `/api/medical-staff`

All endpoints require **Admin** authentication.

### GET `/api/medical-staff`
List all medical staff and receptionists.

**Query Parameters:**
- `search` (optional) - Search by name or email

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 5,
      "job_title": "Nurse",
      "department": "Emergency",
      "shift_schedule": "Monday-Friday 9AM-5PM",
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane.doe@hospital.com",
      "phone": "555-0123",
      "role": "medical_staff",
      "created_at": "2025-12-03T10:00:00Z",
      "updated_at": "2025-12-03T10:00:00Z",
      "deleted_at": null
    }
  ],
  "total": 1
}
```

### POST `/api/medical-staff`
Create a medical staff profile for an existing user.

**Request Body:**
```json
{
  "user_id": 5,
  "job_title": "Nurse",
  "department": "Emergency",
  "shift_schedule": "Monday-Friday 9AM-5PM"
}
```

**Validation:**
- User must exist and not be soft-deleted
- User must have `medical_staff` or `receptionist` role
- User cannot already have a medical staff profile

**Response:** Medical staff profile object

### GET `/api/medical-staff/{id}`
Get a specific medical staff profile by ID.

**Response:** Medical staff profile object

### PUT `/api/medical-staff/{id}`
Update a medical staff profile.

**Request Body:**
```json
{
  "job_title": "Senior Nurse",
  "department": "ICU",
  "shift_schedule": "Monday-Friday 7AM-3PM"
}
```

**Response:** Updated medical staff profile object

### DELETE `/api/medical-staff/{id}`
Soft delete a medical staff profile.

**Response:** 204 No Content

## Frontend Components

### Pages
- **MedicalStaffList** (`/medical-staff`) - Main management page

### Components
Located in `frontend/src/components/medical-staff/`:

- **MedicalStaffTable** - Displays list with search and actions
- **CompleteMedicalStaffProfileDialog** - Profile completion form
- **EditMedicalStaffDialog** - Profile editing form
- **DeleteMedicalStaffDialog** - Delete confirmation
- **MedicalStaffForm** - Reusable form component

### State Management
Uses React Query for data fetching and mutations:
- `useMedicalStaff(search)` - Fetch list with optional search
- `useCreateMedicalStaff()` - Create profile mutation
- `useUpdateMedicalStaff()` - Update profile mutation
- `useDeleteMedicalStaff()` - Delete profile mutation

## Permissions

### Admin
- View all medical staff and receptionists
- Create, edit, and delete profiles
- Search and filter

### Medical Staff / Receptionist
- No access to medical staff management
- Can view their own profile in user settings

### Doctor / Patient
- No access to medical staff management

## UI Features

### Table Display
- **User ID** - Unique identifier
- **Name** - First and last name
- **Role** - Medical Staff or Receptionist (color-coded)
- **Email** - Contact email
- **Phone** - Contact phone
- **Job Title** - Position/role
- **Department** - Work department
- **Shift Schedule** - Working hours
- **Actions** - Complete Profile, Edit, Delete

### Visual Indicators
- **Incomplete Profile** - Shows "Complete Profile" button (warning color)
- **Receptionist Role** - Displayed in primary color
- **Medical Staff Role** - Displayed in default text color
- **Empty Fields** - Shown as "Not set" in italic gray text

### Search & Filter
- Real-time search with debouncing
- Searches across: first name, last name, email
- Case-insensitive matching
- Loading indicator during search

## Error Handling

### Backend Errors
- **404** - User or profile not found
- **400** - Invalid data or user doesn't have correct role
- **409** - Profile already exists for user
- **403** - Insufficient permissions
- **500** - Server error

### Frontend Error Display
- Form validation errors shown inline
- API errors displayed in alert at top of dialog
- Network errors handled globally
- Success messages shown as snackbar notifications

## Testing

### Backend Tests
Located in `backend/tests/test_medical_staff_basic.py`:
- Create medical staff profile
- Retrieve by ID
- Update profile fields
- Soft delete functionality
- Unique user constraint validation

Run tests:
```bash
docker exec fastapi_backend pytest tests/test_medical_staff_basic.py -v
```

## Database Migrations

### Current Migration
**File:** `backend/alembic/versions/c1d2e3f4g5h6_add_medical_staff_table.py`

Creates the `medical_staff` table with:
- Primary key and indexes
- Foreign key to users table
- Unique constraint on user_id
- Timestamp fields with automatic updates

Run migration:
```bash
docker exec fastapi_backend alembic upgrade head
```

## Related Documentation

- [README.md](./README.md) - Project overview
- [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) - Authentication system
- [FEATURES.md](./FEATURES.md) - Feature list

## Future Enhancements

Potential improvements:
- Bulk profile creation
- Export to CSV/Excel
- Advanced filtering (by department, shift)
- Profile completion reminders
- Shift scheduling integration
- Performance metrics tracking
