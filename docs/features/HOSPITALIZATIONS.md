# Hospitalizations Management

## Overview

The Hospitalizations Management system tracks patient admissions, stays, and discharges in the hospital. It provides a complete record of when patients were hospitalized, their diagnosis, treatment summary, and discharge information.

## Purpose

- Track patient hospital admissions and discharges
- Record diagnosis and treatment summaries
- Monitor active hospitalizations (patients currently admitted)
- Maintain historical records of past hospitalizations
- Support medical staff in patient care coordination

## Database Schema

**Table: `hospitalizations`**

```sql
CREATE TABLE hospitalizations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    admission_date TIMESTAMP NOT NULL,
    discharge_date TIMESTAMP,
    diagnosis TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_hospitalizations_patient_id ON hospitalizations(patient_id);
```

**Junction Table: `hospitalization_doctors`** (Many-to-Many Relationship)

```sql
CREATE TABLE hospitalization_doctors (
    hospitalization_id INTEGER NOT NULL REFERENCES hospitalizations(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (hospitalization_id, doctor_id)
);

CREATE INDEX idx_hospitalization_doctors_hospitalization_id ON hospitalization_doctors(hospitalization_id);
CREATE INDEX idx_hospitalization_doctors_doctor_id ON hospitalization_doctors(doctor_id);
```

### Fields

**Hospitalizations Table:**
- **id** - Unique identifier for the hospitalization record
- **patient_id** - Foreign key to patients table (which patient)
- **admission_date** - When the patient was admitted (required)
- **discharge_date** - When the patient was discharged (nullable for active admissions)
- **diagnosis** - Primary diagnosis or reason for admission (required)
- **summary** - Treatment summary, notes, or outcome (optional)
- **created_at** - Record creation timestamp
- **updated_at** - Last update timestamp
- **deleted_at** - Soft delete timestamp (nullable)

**Hospitalization-Doctors Junction Table:**
- **hospitalization_id** - Foreign key to hospitalizations table
- **doctor_id** - Foreign key to doctors table
- **created_at** - When the doctor was assigned to this hospitalization

### Relationships

- **One Patient → Many Hospitalizations** - A patient can have multiple hospitalization records over time
- **Many Doctors ↔ Many Hospitalizations** - Multiple doctors can be assigned to one hospitalization, and one doctor can be assigned to multiple hospitalizations

## Access Control

### Permissions by Role

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Doctor** | ✅ | ✅ | ✅ | ✅ |
| **Medical Staff** | ✅ | ✅ | ✅ | ✅ |
| **Receptionist** | ✅ | ✅ | ✅ | ✅ |
| **Patient** | ❌ | ❌ | ❌ | ❌ |

**Rationale:** Receptionists handle patient admissions and discharges as part of their front desk duties. Doctors and medical staff manage clinical aspects of hospitalizations. Admins have oversight access.

## API Endpoints

### Base URL: `/api/hospitalizations`

All endpoints require authentication (Admin, Doctor, Medical Staff, or Receptionist role).

### GET `/api/hospitalizations`
List all hospitalizations with optional patient filter.

**Query Parameters:**
- `patient_id` (optional) - Filter by specific patient

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": 5,
    "admission_date": "2025-12-01T08:00:00Z",
    "discharge_date": "2025-12-05T14:30:00Z",
    "diagnosis": "Pneumonia",
    "summary": "Patient responded well to antibiotics. Discharged with oral medication.",
    "created_at": "2025-12-01T08:00:00Z",
    "updated_at": "2025-12-05T14:30:00Z",
    "deleted_at": null
  }
]
```

### GET `/api/hospitalizations/{id}`
Get a specific hospitalization record.

**Response:** Single hospitalization object

### POST `/api/hospitalizations`
Create a new hospitalization record with optional doctor assignments.

**Request Body:**
```json
{
  "patient_id": 5,
  "admission_date": "2025-12-01T08:00:00Z",
  "discharge_date": null,
  "diagnosis": "Acute appendicitis",
  "summary": "Emergency admission for appendectomy",
  "doctor_ids": [1, 3]
}
```

**Response:** Created hospitalization object with assigned doctors
```json
{
  "id": 1,
  "patient_id": 5,
  "admission_date": "2025-12-01T08:00:00Z",
  "discharge_date": null,
  "diagnosis": "Acute appendicitis",
  "summary": "Emergency admission for appendectomy",
  "patient_first_name": "John",
  "patient_last_name": "Doe",
  "patient_age": 45,
  "doctors": [
    {
      "id": 1,
      "doctor_id": "DOC001",
      "first_name": "Jane",
      "last_name": "Smith",
      "specialization": "General Surgery"
    },
    {
      "id": 3,
      "doctor_id": "DOC003",
      "first_name": "Robert",
      "last_name": "Johnson",
      "specialization": "Anesthesiology"
    }
  ],
  "created_at": "2025-12-01T08:00:00Z",
  "updated_at": "2025-12-01T08:00:00Z",
  "deleted_at": null
}
```

### PUT `/api/hospitalizations/{id}`
Update an existing hospitalization record, including doctor assignments.

**Request Body:**
```json
{
  "discharge_date": "2025-12-05T14:30:00Z",
  "summary": "Surgery successful. Patient recovered well.",
  "doctor_ids": [1, 3, 5]
}
```

**Response:** Updated hospitalization object with updated doctor assignments

### DELETE `/api/hospitalizations/{id}`
Soft delete a hospitalization record.

**Response:** 204 No Content

## Frontend Interface

### Location
`/hospitalizations` - Accessible from navigation menu

### Features

**Table View:**
- Patient Name and Age (with ID)
- Admission Date
- Discharge Date (shows "Active" if null)
- Diagnosis
- Assigned Doctors (displayed as chips)
- Summary
- Actions (Edit, Delete)

**Add Hospitalization:**
- Patient search (by name or email)
- Admission date picker
- Discharge date picker (optional)
- Diagnosis text area
- Doctor assignment (multi-select dropdown)
- Summary text area

**Edit Hospitalization:**
- Update admission/discharge dates
- Modify diagnosis
- Add/remove assigned doctors
- Update summary

**Delete Hospitalization:**
- Confirmation dialog
- Soft delete (preserves record)

## Use Cases

### 1. Admitting a Patient with Doctor Assignment

**Scenario:** Patient arrives at emergency room and needs to be admitted with a care team.

**Steps:**
1. Receptionist/Medical Staff clicks "Add Hospitalization"
2. Searches and selects patient by name
3. Sets admission date (usually current date/time)
4. Leaves discharge date empty
5. Enters diagnosis (e.g., "Chest pain, suspected MI")
6. Assigns doctors from dropdown (e.g., Cardiologist, ER Doctor)
7. Optionally adds initial summary
8. Clicks "Create"

**Result:** Active hospitalization record created with assigned doctors, patient shows as currently admitted with care team visible.

---

### 2. Discharging a Patient

**Scenario:** Patient is ready to go home after treatment.

**Steps:**
1. Doctor/Medical Staff finds the patient's active hospitalization
2. Clicks "Edit"
3. Sets discharge date (current date/time)
4. Updates summary with treatment outcome
5. Clicks "Update"

**Result:** Hospitalization record completed, patient no longer shows as active.

---

### 3. Viewing Patient History

**Scenario:** Doctor needs to see patient's hospitalization history.

**Steps:**
1. Navigate to Hospitalizations page
2. Filter by patient ID (or search)
3. View all past and current hospitalizations
4. Review diagnoses and summaries

**Result:** Complete hospitalization history visible.

---

### 4. Managing Doctor Assignments

**Scenario:** Patient's condition requires additional specialist consultation or doctor handoff.

**Steps:**
1. Find the active hospitalization record
2. Click "Edit"
3. In the "Assign Doctors" field, add or remove doctors:
   - Add a specialist (e.g., add Neurologist for complications)
   - Remove a doctor (e.g., remove ER doctor after transfer to ward)
4. Click "Update"

**Result:** Doctor assignments updated, new doctors can see the patient in their care list.

---

### 5. Correcting an Error

**Scenario:** Wrong admission date was entered.

**Steps:**
1. Find the hospitalization record
2. Click "Edit"
3. Correct the admission date
4. Click "Update"

**Result:** Record updated with correct information.

## Business Rules

### Validation Rules

1. **Patient Must Exist**
   - Patient ID must reference an existing, non-deleted patient
   - Error if patient not found

2. **Admission Date Required**
   - Cannot create hospitalization without admission date
   - Admission date can be in the past

3. **Discharge Date Optional**
   - Null discharge date = patient currently admitted
   - Discharge date should be after admission date (not enforced)

4. **Diagnosis Required**
   - Cannot be empty
   - Should describe reason for admission

5. **Summary Optional**
   - Can be added later
   - Typically completed at discharge

### Active vs. Completed

- **Active Hospitalization:** `discharge_date` is NULL
- **Completed Hospitalization:** `discharge_date` is set

### Soft Delete

- Deleted records have `deleted_at` timestamp
- Not shown in queries (filtered out)
- Preserves historical data for compliance
- Can be restored by setting `deleted_at` to NULL

## Data Flow

```
1. Patient Admission
   ↓
2. Create Hospitalization Record
   - admission_date = now
   - discharge_date = null
   - diagnosis = reason for admission
   ↓
3. During Stay (optional)
   - Update summary with treatment notes
   ↓
4. Patient Discharge
   - Update discharge_date = now
   - Complete summary with outcome
   ↓
5. Historical Record
   - Available for future reference
   - Used for patient history
```

## Integration Points

### With Patients
- Each hospitalization links to a patient record
- Patient profile can show hospitalization history
- Validates patient exists before creating record

### With Doctors
- **Many-to-Many Relationship** - Multiple doctors can be assigned to one hospitalization
- **Care Team Management** - Track all doctors involved in patient care
- **Specialization Tracking** - See which specialists are involved
- **Doctor Workload** - Doctors can see all their assigned hospitalizations
- **Handoff Support** - Easy to add/remove doctors as care transitions

**Use Cases:**
- **Multi-disciplinary Care** - Assign surgeon, anesthesiologist, and specialist
- **Shift Changes** - Add new attending doctor, keep previous for continuity
- **Consultations** - Add specialist for consultation without removing primary doctor
- **Emergency Response** - Quickly see which doctors are responsible for a patient

### With Prescriptions
- Prescriptions are validated against hospitalization dates
- Prescriptions can only be created during active hospitalization
- Track medications given during hospital stay
- Ensures prescriptions align with admission/discharge periods

## Reporting & Analytics

**Potential Reports:**
- Active admissions count
- Average length of stay
- Most common diagnoses
- Admission/discharge trends
- Bed occupancy rates

## Best Practices

### For Medical Staff

1. **Record Admission Immediately**
   - Create record as soon as patient is admitted
   - Assign initial care team (doctors)
   - Ensures accurate tracking

2. **Assign Appropriate Doctors**
   - Add all doctors involved in care
   - Include specialists for consultations
   - Update as care team changes

3. **Update Summary During Stay**
   - Add notes about treatment progress
   - Document significant events
   - Update doctor assignments as needed

4. **Complete at Discharge**
   - Set discharge date
   - Finalize summary with outcome
   - Include follow-up instructions
   - Ensure all doctors are properly documented

5. **Be Specific in Diagnosis**
   - Use clear, medical terminology
   - Include ICD codes if available

6. **Manage Doctor Transitions**
   - Add new doctors when specialists are consulted
   - Keep previous doctors for continuity
   - Remove doctors only when appropriate (e.g., ER doctor after transfer)

### For Developers

1. **Always Filter Deleted Records**
   - Use `deleted_at IS NULL` in queries
   - Soft delete preserves data

2. **Validate Patient Exists**
   - Check patient_id before creating
   - Handle foreign key errors gracefully

3. **Handle Timezones**
   - Store dates in UTC
   - Convert to local time in UI

4. **Index Patient ID**
   - Queries often filter by patient
   - Index improves performance

## Future Enhancements

**Potential Features:**
- Room/bed assignment tracking
- Attending doctor assignment
- Department/ward tracking
- Admission type (Emergency, Scheduled, Transfer)
- Discharge type (Home, Transfer, Deceased)
- Link to prescriptions during stay
- Link to procedures performed
- Insurance/billing information
- Estimated vs. actual length of stay
- Severity level tracking

## Related Documentation

- [User Role Management](../architecture/USER_ROLE_MANAGEMENT.md) - Role-based access control
- [Prescriptions](./PRESCRIPTIONS.md) - Prescription management
- [README](../../README.md) - Project overview

## Database Queries

### Find active hospitalizations
```sql
SELECT * FROM hospitalizations 
WHERE discharge_date IS NULL 
  AND deleted_at IS NULL
ORDER BY admission_date DESC;
```

### Find patient's hospitalization history
```sql
SELECT * FROM hospitalizations 
WHERE patient_id = ? 
  AND deleted_at IS NULL
ORDER BY admission_date DESC;
```

### Calculate length of stay
```sql
SELECT 
  id,
  patient_id,
  admission_date,
  discharge_date,
  EXTRACT(DAY FROM (discharge_date - admission_date)) as length_of_stay_days
FROM hospitalizations
WHERE discharge_date IS NOT NULL
  AND deleted_at IS NULL;
```

### Count active admissions
```sql
SELECT COUNT(*) as active_admissions
FROM hospitalizations
WHERE discharge_date IS NULL
  AND deleted_at IS NULL;
```

