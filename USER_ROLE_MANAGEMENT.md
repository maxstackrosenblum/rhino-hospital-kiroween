# User Role Management & Deletion Logic

## Overview

The Hospital Management System uses a unified user architecture where users have roles (admin, doctor, patient, medical_staff, receptionist) and can have associated profile records in separate tables. This document explains the deletion logic and role update constraints.

## Architecture

### User Table
- Central `users` table stores basic user information
- Each user has a `role` field (admin, doctor, patient, medical_staff, receptionist)
- Users can be soft-deleted (sets `deleted_at` timestamp)

### Profile Tables
- **patients** - One-to-one with users (role: patient)
- **doctors** - One-to-one with users (role: doctor)
- **medical_staff** - One-to-one with users (role: medical_staff OR receptionist)

## Deletion Logic

### Patient Deletion

**Location:** Patients Management Page → Delete button

**Process:**
1. Admin clicks delete on a patient record
2. System performs **soft delete** on both:
   - Patient profile record (sets `deleted_at`)
   - Associated user record (sets `deleted_at`)
3. Both records remain in database but are hidden from queries
4. User cannot log in (authentication checks `deleted_at`)

**Code:** `backend/routers/patients.py` - `delete_patient()`

```python
# Soft delete both records
delete_time = datetime.utcnow()
db_patient.deleted_at = delete_time
db_patient.user.deleted_at = delete_time
```

**Why soft delete?**
- Preserves medical history for compliance
- Maintains audit trail
- Can be restored if deleted by mistake
- Referential integrity maintained

---

### Doctor Deletion

**Location:** Doctors Management Page → Delete button

**Process:**
1. Admin clicks delete on a doctor record
2. System performs **soft delete** on both:
   - Doctor profile record (sets `deleted_at`)
   - Associated user record (sets `deleted_at`)
3. Both records remain in database but are hidden
4. User cannot log in

**Code:** `backend/routers/doctors.py` - `delete_doctor()`

```python
# Soft delete both records
delete_time = datetime.utcnow()
db_doctor.deleted_at = delete_time
db_doctor.user.deleted_at = delete_time
```

**Why soft delete?**
- Preserves doctor credentials and history
- Maintains patient-doctor relationship history
- Audit trail for medical records
- Can restore if needed

---

### Medical Staff / Receptionist Deletion

**Location:** Medical Staff Management Page → Delete button

**Process:**
1. Admin clicks delete on a medical staff/receptionist record
2. System performs **soft delete** on profile ONLY:
   - Medical staff profile record (sets `deleted_at`)
   - User record remains ACTIVE
3. User can still log in but has no profile
4. Profile can be recreated by completing profile again

**Code:** `backend/routers/medical_staff.py` - `delete_medical_staff()`

```python
# Soft delete profile only (user remains active)
db_medical_staff.deleted_at = datetime.utcnow()
```

**Why soft delete profile only?**
- User account may be needed for other purposes
- Staff may return and need profile recreated
- Preserves employment history
- Allows profile restoration with new data

**Profile Restoration:**
When creating a new profile for a user with a soft-deleted profile:
```python
if existing_staff.deleted_at is not None:
    # Restore soft-deleted record with new data
    existing_staff.job_title = new_data.job_title
    existing_staff.department = new_data.department
    existing_staff.shift_schedule = new_data.shift_schedule
    existing_staff.deleted_at = None  # Undelete
    existing_staff.updated_at = datetime.utcnow()
```

---

## Role Update Constraints

### Problem
If a user has a profile (patient, doctor, or medical staff), changing their role creates data inconsistency:
- User role says "doctor" but has a patient profile
- Orphaned profiles with no matching user role
- Confusion in the UI about which management page to use

### Solution: Role Change Validation

**Location:** Users Management Page → Edit user → Change role

**Validation Logic:**

When admin attempts to change a user's role, the system checks if the user has an active profile:

```python
# Check if role is being changed
if user_update.role and user_update.role.value != user.role:
    
    # Check for patient profile
    if user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(
            Patient.user_id == user.id,
            Patient.deleted_at.is_(None)
        ).first()
        if patient:
            raise HTTPException(
                status_code=400,
                detail="Cannot change role: User has an active patient profile. Delete the profile first."
            )
    
    # Check for doctor profile
    if user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(
            Doctor.user_id == user.id,
            Doctor.deleted_at.is_(None)
        ).first()
        if doctor:
            raise HTTPException(
                status_code=400,
                detail="Cannot change role: User has an active doctor profile. Delete the profile first."
            )
    
    # Check for medical staff profile
    if user.role in [UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
        medical_staff = db.query(MedicalStaff).filter(
            MedicalStaff.user_id == user.id,
            MedicalStaff.deleted_at.is_(None)
        ).first()
        if medical_staff:
            raise HTTPException(
                status_code=400,
                detail="Cannot change role: User has an active medical staff profile. Delete the profile first."
            )
```

**Code:** `backend/routers/users.py` - `update_user_by_admin()`

---

## Workflow Examples

### Example 1: Changing Patient to Doctor

**Scenario:** Admin wants to change a patient user to a doctor role.

**Steps:**
1. Admin goes to Patients Management page
2. Admin deletes the patient profile (soft delete)
3. Admin goes to Users Management page
4. Admin changes user role from "patient" to "doctor"
5. Admin goes to Doctors Management page
6. Admin completes doctor profile for the user

**Result:** User is now a doctor with a doctor profile.

---

### Example 2: Changing Medical Staff to Receptionist

**Scenario:** Admin wants to change a medical staff member to receptionist.

**Option A - Keep Profile:**
1. Admin goes to Users Management page
2. Admin changes role from "medical_staff" to "receptionist"
3. Profile remains valid (both roles use same table)
4. User appears in Medical Staff Management with "Receptionist" label

**Option B - New Profile:**
1. Admin goes to Medical Staff Management page
2. Admin deletes the medical staff profile
3. Admin goes to Users Management page
4. Admin changes role from "medical_staff" to "receptionist"
5. Admin goes to Medical Staff Management page
6. Admin completes new profile with receptionist-specific data

---

### Example 3: Attempting Invalid Role Change

**Scenario:** Admin tries to change a doctor with active profile to patient.

**Steps:**
1. Admin goes to Users Management page
2. Admin clicks edit on doctor user
3. Admin changes role to "patient"
4. Admin clicks save

**Result:**
- ❌ Error: "Cannot change role: User has an active doctor profile. Delete the profile first."
- Role change is blocked
- Admin must delete doctor profile first

---

## Summary Table

| Entity | Deletion Type | User Deleted? | Profile Deleted? | Can Restore? | Can Change Role? |
|--------|--------------|---------------|------------------|--------------|------------------|
| **Patient** | Soft Delete | ✅ Yes (soft) | ✅ Yes (soft) | ✅ Yes (restore both) | ❌ No (must delete profile first) |
| **Doctor** | Soft Delete | ✅ Yes (soft) | ✅ Yes (soft) | ✅ Yes (restore both) | ❌ No (must delete profile first) |
| **Medical Staff** | Soft Delete | ❌ No (stays active) | ✅ Yes (soft) | ✅ Yes (recreate profile) | ❌ No (must delete profile first) |
| **Receptionist** | Soft Delete | ❌ No (stays active) | ✅ Yes (soft) | ✅ Yes (recreate profile) | ❌ No (must delete profile first) |
| **Admin** | N/A | N/A | No profile table | N/A | ✅ Yes (no profile) |
| **Undefined** | N/A | N/A | No profile table | N/A | ✅ Yes (no profile) |

---

## Best Practices

### For Admins

1. **Before changing roles:**
   - Check if user has a profile in the corresponding management page
   - Delete the profile first if it exists
   - Then change the role in Users Management

2. **When deleting users:**
   - Use the specific management page (Patients, Doctors, Medical Staff)
   - Don't delete from Users Management directly
   - This ensures proper cleanup of profiles

3. **When staff leaves temporarily:**
   - Delete medical staff profile (user stays active)
   - User can still access system if needed
   - Recreate profile when they return

4. **When patients/doctors leave permanently:**
   - Delete from Patients/Doctors Management page
   - Both user and profile are soft-deleted
   - Data preserved for compliance

### For Developers

1. **Always check for active profiles before role changes**
2. **Use soft delete for audit trail**
3. **Maintain referential integrity**
4. **Provide clear error messages**
5. **Document deletion behavior**

---

## Related Documentation

- [MEDICAL_STAFF_MANAGEMENT.md](./MEDICAL_STAFF_MANAGEMENT.md) - Medical staff details
- [README.md](./README.md) - Project overview
- [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) - Authentication system

---

## Database Queries

### Check if user has any active profile

```sql
-- Check for patient profile
SELECT * FROM patients 
WHERE user_id = ? AND deleted_at IS NULL;

-- Check for doctor profile
SELECT * FROM doctors 
WHERE user_id = ? AND deleted_at IS NULL;

-- Check for medical staff profile
SELECT * FROM medical_staff 
WHERE user_id = ? AND deleted_at IS NULL;
```

### Restore soft-deleted user

```sql
-- Restore user
UPDATE users 
SET deleted_at = NULL 
WHERE id = ?;

-- Restore patient profile
UPDATE patients 
SET deleted_at = NULL 
WHERE user_id = ?;
```

### View all soft-deleted records

```sql
-- Soft-deleted users
SELECT * FROM users WHERE deleted_at IS NOT NULL;

-- Soft-deleted patients
SELECT u.*, p.* 
FROM users u 
JOIN patients p ON u.id = p.user_id 
WHERE p.deleted_at IS NOT NULL;
```
