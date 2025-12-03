# Patient Management

## Overview

The Patient Management system handles patient records, profiles, and information within the hospital. It provides a centralized view of all patients, their demographics, medical information, and current hospitalization status.

## Purpose

- Manage patient demographic information
- Track patient profiles and medical records
- View patient hospitalization status
- Support medical staff in patient care
- Enable quick access to patient information
- Filter patients by hospitalization status and doctor assignments

## Database Schema

**Table: `patients`**

```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    medical_record_number VARCHAR UNIQUE,
    emergency_contact VARCHAR,
    insurance_info VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_medical_record_number ON patients(medical_record_number);
```

**Related Table: `users`** (Patient demographic data)

```sql
-- Patients are users with role='patient'
SELECT u.*, p.medical_record_number, p.emergency_contact, p.insurance_info
FROM users u
LEFT JOIN patients p ON u.id = p.user_id
WHERE u.role = 'patient';
```

### Fields

**Patient Table:**
- **id** - Unique identifier for the patient record
- **user_id** - Foreign key to users table (one-to-one relationship)
- **medical_record_number** - Unique medical record identifier
- **emergency_contact** - Emergency contact information
- **insurance_info** - Insurance details
- **created_at** - Record creation timestamp
- **updated_at** - Last update timestamp
- **deleted_at** - Soft delete timestamp (nullable)

**User Table (Patient Demographics):**
- **email** - Patient email address
- **username** - Unique username
- **first_name** - Patient first name
- **last_name** - Patient last name
- **phone** - Contact phone number
- **city** - City of residence
- **age** - Patient age
- **address** - Residential address
- **gender** - Gender (male, female, other)
- **role** - Always "patient" for patient records

### Relationships

- **One User → One Patient** - Each patient has one user account
- **One Patient → Many Hospitalizations** - A patient can have multiple hospitalization records
- **One Patient → Many Prescriptions** - A patient can have multiple prescriptions

## Access Control

### Permissions by Role

| Role | View | Create | Update | Delete | Filter |
|------|------|--------|--------|--------|--------|
| **Admin** | ✅ All | ✅ | ✅ | ✅ | All, Hospitalized |
| **Doctor** | ✅ All | ✅ | ✅ | ❌ | My Patients, Hospitalized, All |
| **Medical Staff** | ✅ All | ✅ | ✅ | ❌ | All, Hospitalized |
| **Receptionist** | ✅ All | ✅ | ✅ | ❌ | All, Hospitalized |
| **Patient** | ✅ Own | ❌ | ✅ Own | ❌ | N/A |

**Rationale:** 
- Doctors, medical staff, and receptionists need access to patient information for care coordination
- Doctors can filter to see only their assigned patients
- Only admins can delete patient records for data integrity
- Patients can view and update their own profile

## API Endpoints

### Base URL: `/api/patients`

All endpoints require authentication.

### GET `/api/patients`
Get list of all patients with optional search and filtering.

**Query Parameters:**
- `search` (optional) - Search by name, email, or phone
- `page` (optional) - Page number (default: 1)
- `page_size` (optional) - Records per page (default: 10, max: 100)
- `include_deleted` (optional) - Include soft-deleted records (Admin only)

**Response:**
```json
{
  "patients": [
    {
      "id": 1,
      "user_id": 5,
      "email": "john.doe@example.com",
      "username": "johndoe",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "555-0123",
      "city": "New York",
      "age": 45,
      "address": "123 Main St",
      "gender": "male",
      "role": "patient",
      "medical_record_number": "MRN001234",
      "emergency_contact": "Jane Doe - 555-0124",
      "insurance_info": "Blue Cross - Policy #12345",
      "profile_completed": true,
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-01T10:00:00Z",
      "deleted_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

### GET `/api/patients/{user_id}`
Get a specific patient by user ID.

**Response:** Single patient object

### POST `/api/patients/create-with-user`
Create a new patient with user account (Admin/Receptionist workflow).

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-0123",
  "city": "New York",
  "age": 45,
  "address": "123 Main St",
  "gender": "male",
  "medical_record_number": "MRN001234",
  "emergency_contact": "Jane Doe - 555-0124",
  "insurance_info": "Blue Cross - Policy #12345"
}
```

**Response:** Created patient object

### POST `/api/patients/profile`
Complete patient profile for existing user.

**Request Body:**
```json
{
  "medical_record_number": "MRN001234",
  "emergency_contact": "Jane Doe - 555-0124",
  "insurance_info": "Blue Cross - Policy #12345"
}
```

**Response:** Patient object with completed profile

### PUT `/api/patients/{patient_id}`
Update an existing patient record.

**Request Body:**
```json
{
  "phone": "555-9999",
  "emergency_contact": "Jane Doe - 555-0124 (updated)",
  "insurance_info": "New Insurance - Policy #67890"
}
```

**Response:** Updated patient object

### DELETE `/api/patients/{patient_id}`
Soft delete a patient record (Admin only).

**Response:** 204 No Content

## Frontend Interface

### Location
`/patients` - Accessible from navigation menu

### Features

**Filter Options:**
- **My Patients** (Doctors only, default) - Shows only patients assigned to the current doctor through active hospitalizations
- **Currently Hospitalized** (Default for non-doctors) - Shows patients with active hospitalizations
- **All Patients** - Shows all patient records

**Search:**
- Real-time search by name, email, or phone
- 300ms debounce for performance
- Works with all filter options

**Table View:**
- Patient name and demographics
- Contact information
- Medical record number
- Profile completion status
- Emergency contact
- Insurance information
- Actions (View, Edit, Delete)

**Sorting:**
- Patients sorted by creation date (newest first)
- Ensures recently added patients appear at the top

**Add Patient:**
- Create user account and patient profile in one step
- All demographic fields
- Medical record number
- Emergency contact
- Insurance information

**Edit Patient:**
- Update demographic information
- Modify emergency contact
- Update insurance details

**Complete Profile:**
- For users with patient role but incomplete profile
- Add medical record number
- Add emergency contact
- Add insurance information

**Delete Patient:**
- Admin only
- Confirmation dialog
- Soft delete (preserves record)

## Use Cases

### 1. Admitting a New Patient (Receptionist)

**Scenario:** New patient arrives at hospital for first time.

**Steps:**
1. Receptionist clicks "Add Patient"
2. Fills in patient information:
   - Personal details (name, age, gender)
   - Contact information (email, phone, address)
   - Medical record number
   - Emergency contact
   - Insurance information
3. Creates account with temporary password
4. Clicks "Create"

**Result:** Patient record created, can now be admitted for hospitalization.

---

### 2. Doctor Viewing Their Patients

**Scenario:** Doctor wants to see only their assigned patients.

**Steps:**
1. Doctor navigates to Patients page
2. Filter automatically set to "My Patients"
3. Views list of patients they're currently treating
4. Can search within their patients
5. Can switch to "All Patients" if needed

**Result:** Doctor sees focused list of their active patients.

---

### 3. Finding a Hospitalized Patient

**Scenario:** Medical staff needs to find a currently admitted patient.

**Steps:**
1. Navigate to Patients page
2. Select "Currently Hospitalized" filter
3. Use search to find specific patient
4. Click on patient to view details

**Result:** Quick access to hospitalized patient information.

---

### 4. Updating Patient Information

**Scenario:** Patient's insurance information changed.

**Steps:**
1. Find patient in list
2. Click "Edit"
3. Update insurance information
4. Update emergency contact if needed
5. Click "Save"

**Result:** Patient record updated with new information.

---

### 5. Completing Patient Profile

**Scenario:** User registered as patient but didn't complete medical profile.

**Steps:**
1. Find patient with incomplete profile
2. Click "Complete Profile"
3. Add medical record number
4. Add emergency contact
5. Add insurance information
6. Click "Complete"

**Result:** Patient profile completed, ready for medical services.

## Business Rules

### Validation Rules

1. **Email Must Be Unique**
   - Cannot create patient with duplicate email
   - Email format validation

2. **Medical Record Number**
   - Must be unique across all patients
   - Optional but recommended

3. **Age Validation**
   - Must be between 0 and 150
   - Required field

4. **Phone Number**
   - Must contain at least 10 digits
   - Format flexible (allows various formats)

5. **Profile Completion**
   - User account can exist without patient profile
   - Patient profile requires medical record number for completion

### Filter Logic

**My Patients (Doctors):**
- Shows patients with active hospitalizations
- Where current doctor is assigned to the hospitalization
- Automatically updates as hospitalizations change

**Currently Hospitalized:**
- Shows patients with at least one active hospitalization
- Active = discharge_date is NULL
- Updates in real-time as patients are admitted/discharged

**All Patients:**
- Shows all patient records
- Includes patients never hospitalized
- Includes patients with past hospitalizations

## Data Flow

```
1. Patient Registration
   ↓
2. Create User Account (role=patient)
   ↓
3. Create Patient Profile
   - Medical record number
   - Emergency contact
   - Insurance info
   ↓
4. Patient Available for Services
   - Can be admitted (hospitalization)
   - Can receive prescriptions
   - Can be assigned to doctors
   ↓
5. Ongoing Care
   - Update information as needed
   - Track hospitalizations
   - Manage prescriptions
```

## Integration Points

### With Users
- Each patient is a user with role="patient"
- User table stores demographic information
- Patient table stores medical-specific information

### With Hospitalizations
- Patients can have multiple hospitalizations
- Filter shows currently hospitalized patients
- Doctors see patients they're assigned to via hospitalizations

### With Prescriptions
- Prescriptions linked to patients
- Prescriptions validated against hospitalization dates
- Track medication history per patient

### With Doctors
- Doctors assigned to patients through hospitalizations
- "My Patients" filter shows doctor's assigned patients
- Many-to-many relationship via hospitalization_doctors

## Reporting & Analytics

**Potential Reports:**
- Total patient count
- New patients per month
- Currently hospitalized patients
- Patients per doctor
- Profile completion rate
- Demographics breakdown (age, gender, location)
- Insurance coverage statistics

## Best Practices

### For Receptionists

1. **Complete All Fields**
   - Fill in all required information during registration
   - Verify emergency contact details
   - Confirm insurance information

2. **Verify Identity**
   - Check patient ID before creating record
   - Avoid duplicate records

3. **Update Promptly**
   - Update patient information when changes occur
   - Keep emergency contacts current

### For Doctors

1. **Use "My Patients" Filter**
   - Start with your assigned patients
   - Focus on active cases
   - Switch to "All" when needed for consultations

2. **Review Patient History**
   - Check past hospitalizations
   - Review prescription history
   - Note emergency contacts

### For Medical Staff

1. **Keep Information Current**
   - Update patient details during visits
   - Verify contact information
   - Note any changes in insurance

2. **Use Search Effectively**
   - Search by name for quick access
   - Use filters to narrow results
   - Check profile completion status

### For Developers

1. **Always Filter Deleted Records**
   - Use `deleted_at IS NULL` in queries
   - Soft delete preserves data

2. **Join User and Patient Tables**
   - Patient demographics in users table
   - Medical info in patients table
   - Use LEFT JOIN for incomplete profiles

3. **Handle Incomplete Profiles**
   - User can exist without patient profile
   - Check `profile_completed` flag
   - Provide profile completion workflow

4. **Optimize Queries**
   - Index on user_id and medical_record_number
   - Use pagination for large datasets
   - Cache frequently accessed data

## Future Enhancements

**Potential Features:**
- Patient portal for self-service
- Appointment scheduling
- Medical history timeline
- Document upload (lab results, imaging)
- Family member linking
- Allergy tracking
- Chronic condition management
- Medication history
- Visit notes and progress tracking
- Billing integration
- Insurance verification
- Referral management

## Related Documentation

- [User Role Management](../architecture/USER_ROLE_MANAGEMENT.md) - Role-based access control
- [Hospitalizations](./HOSPITALIZATIONS.md) - Hospitalization management
- [Prescriptions](./PRESCRIPTIONS.md) - Prescription management
- [README](../../README.md) - Project overview

## Database Queries

### Find all currently hospitalized patients
```sql
SELECT DISTINCT p.*, u.first_name, u.last_name
FROM patients p
JOIN users u ON p.user_id = u.id
JOIN hospitalizations h ON p.id = h.patient_id
WHERE h.discharge_date IS NULL
  AND h.deleted_at IS NULL
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;
```

### Find patients assigned to a specific doctor
```sql
SELECT DISTINCT p.*, u.first_name, u.last_name
FROM patients p
JOIN users u ON p.user_id = u.id
JOIN hospitalizations h ON p.id = h.patient_id
JOIN hospitalization_doctors hd ON h.id = hd.hospitalization_id
WHERE hd.doctor_id = ?
  AND h.discharge_date IS NULL
  AND h.deleted_at IS NULL
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;
```

### Search patients by name or email
```sql
SELECT p.*, u.first_name, u.last_name, u.email
FROM patients p
JOIN users u ON p.user_id = u.id
WHERE (
  u.first_name ILIKE '%search%'
  OR u.last_name ILIKE '%search%'
  OR u.email ILIKE '%search%'
  OR u.phone ILIKE '%search%'
)
AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;
```

### Count patients by status
```sql
SELECT 
  COUNT(*) as total_patients,
  COUNT(CASE WHEN h.id IS NOT NULL AND h.discharge_date IS NULL THEN 1 END) as hospitalized,
  COUNT(CASE WHEN p.medical_record_number IS NOT NULL THEN 1 END) as profile_complete
FROM patients p
LEFT JOIN hospitalizations h ON p.id = h.patient_id AND h.deleted_at IS NULL
WHERE p.deleted_at IS NULL;
```

