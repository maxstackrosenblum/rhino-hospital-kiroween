# Prescriptions Management

## Overview

The Prescriptions Management system handles medication prescriptions for patients. It supports creating prescriptions for date ranges (bulk creation), tracking medicines with dosage and frequency, and provides role-based access control.

## Purpose

- Record medication prescriptions for patients
- Support date range prescriptions (one record per day)
- Track medicine details (name, dosage, frequency, duration)
- Provide read-only access for medical staff
- Maintain prescription history

## Database Schema

**Table: `prescriptions`**

```sql
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    medicines JSON NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
```

### Fields

- **id** - Unique identifier
- **patient_id** - Foreign key to patients table
- **start_date** - Prescription start date (required)
- **end_date** - Prescription end date (required)
- **medicines** - JSON array of medicine objects (required)
- **created_at** - Record creation timestamp
- **updated_at** - Last update timestamp
- **deleted_at** - Soft delete timestamp (nullable)

### Medicine Object Structure

```json
{
  "name": "Aspirin",
  "dosage": "500mg",
  "frequency": "twice daily",
  "duration": "7 days"
}
```

## Access Control

### Permissions by Role

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Doctor** | ✅ | ✅ | ✅ | ✅ |
| **Medical Staff** | ❌ | ✅ | ❌ | ❌ |
| **Receptionist** | ❌ | ❌ | ❌ | ❌ |
| **Patient** | ❌ | ❌ | ❌ | ❌ |

**Rationale:** Only doctors can prescribe medications. Medical staff can view prescriptions to administer them. Admins have oversight access.

## API Endpoints

### Base URL: `/api/prescriptions`

### GET `/api/prescriptions`
List all prescriptions with optional patient filter.

**Query Parameters:**
- `patient_id` (optional) - Filter by specific patient

**Authentication:** Admin, Doctor, or Medical Staff

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": 5,
    "start_date": "2025-12-01T00:00:00Z",
    "end_date": "2025-12-01T00:00:00Z",
    "medicines": [
      {
        "name": "Amoxicillin",
        "dosage": "500mg",
        "frequency": "three times daily",
        "duration": "7 days"
      }
    ],
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-01T10:00:00Z",
    "deleted_at": null
  }
]
```

### GET `/api/prescriptions/{id}`
Get a specific prescription.

**Authentication:** Admin, Doctor, or Medical Staff

**Response:** Single prescription object

### POST `/api/prescriptions`
Create prescriptions for a date range (bulk creation).

**Authentication:** Admin or Doctor only

**Request Body:**
```json
{
  "patient_id": 5,
  "start_date": "2025-12-01T00:00:00Z",
  "end_date": "2025-12-07T00:00:00Z",
  "medicines": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "three times daily",
      "duration": "7 days"
    },
    {
      "name": "Ibuprofen",
      "dosage": "400mg",
      "frequency": "as needed for pain"
    }
  ]
}
```

**Response:**
```json
{
  "created_count": 7,
  "prescriptions": [
    { "id": 1, "start_date": "2025-12-01", ... },
    { "id": 2, "start_date": "2025-12-02", ... },
    ...
  ]
}
```

**Behavior:**
- Creates one prescription record per day in the date range
- Example: Dec 1 to Dec 7 = 7 prescription records
- Each record has same medicines list
- All records created in single transaction

### PUT `/api/prescriptions/{id}`
Update a single prescription record.

**Authentication:** Admin or Doctor only

**Request Body:**
```json
{
  "start_date": "2025-12-02T00:00:00Z",
  "end_date": "2025-12-02T00:00:00Z",
  "medicines": [
    {
      "name": "Amoxicillin",
      "dosage": "750mg",
      "frequency": "twice daily"
    }
  ]
}
```

**Response:** Updated prescription object

### DELETE `/api/prescriptions/{id}`
Soft delete a prescription.

**Authentication:** Admin or Doctor only

**Response:** 204 No Content

## Frontend Interface

### Location
`/prescriptions` - Accessible from navigation menu

### Features

**Table View:**
- Patient ID
- Date (start_date displayed)
- Medicines list with details
- Actions (Delete for Admin/Doctor)

**Add Prescription Dialog:**
- Patient ID input
- Start Date picker (required)
- End Date picker (required)
- Medicine details:
  - Name (required)
  - Dosage (optional)
  - Frequency (optional)
  - Duration (optional)

**Read-Only for Medical Staff:**
- Can view all prescriptions
- Cannot create, edit, or delete
- No action buttons shown

## Use Cases

### 1. Prescribing Medication for a Week

**Scenario:** Doctor prescribes antibiotics for 7 days.

**Steps:**
1. Doctor clicks "Add Prescription"
2. Enters patient ID: 5
3. Sets start date: Dec 1, 2025
4. Sets end date: Dec 7, 2025
5. Enters medicine:
   - Name: Amoxicillin
   - Dosage: 500mg
   - Frequency: three times daily
   - Duration: 7 days
6. Clicks "Create"

**Result:** 7 prescription records created (one per day from Dec 1-7).

---

### 2. Medical Staff Checking Prescriptions

**Scenario:** Nurse needs to see what medications to administer.

**Steps:**
1. Medical staff navigates to Prescriptions page
2. Views all prescriptions (read-only)
3. Filters by patient ID if needed
4. Sees medicine details for administration

**Result:** Medical staff can view but not modify prescriptions.

---

### 3. Correcting a Prescription

**Scenario:** Doctor realizes wrong dosage was prescribed.

**Steps:**
1. Doctor finds the prescription record
2. Clicks "Edit" (if implemented)
3. Updates dosage
4. Clicks "Update"

**Result:** Single prescription record updated.

**Note:** Currently simplified UI only supports delete, not edit.

---

### 4. Canceling a Prescription

**Scenario:** Patient has allergic reaction, need to stop medication.

**Steps:**
1. Doctor finds the prescription records
2. Clicks "Delete" on each relevant record
3. Confirms deletion
4. Creates new prescription with alternative medication

**Result:** Old prescriptions soft-deleted, new ones created.

## Business Rules

### Date Range Logic

1. **One Record Per Day**
   - Start date: Dec 1, End date: Dec 7 = 7 records
   - Each record has start_date = end_date = that specific day

2. **Date Validation**
   - End date must be >= start date
   - Both dates required
   - Dates can be in the past or future

3. **Bulk Creation**
   - All records created in single transaction
   - If any fails, all fail (rollback)
   - Returns count of created records

### Medicine Data

1. **JSON Storage**
   - Flexible structure for multiple medicines
   - Each prescription can have multiple medicines
   - Medicine details stored as JSON array

2. **Required Fields**
   - Medicine name is required
   - Other fields (dosage, frequency, duration) are optional

3. **No Validation**
   - System doesn't validate medicine names against database
   - Free-text entry for flexibility
   - Future: Could add medicine database for validation

## Error Handling

### Common Errors

**404 - Patient Not Found**
```json
{
  "detail": "Patient not found"
}
```

**400 - Invalid Date Range**
```json
{
  "detail": "End date must be after or equal to start date"
}
```

**403 - Insufficient Permissions**
```json
{
  "detail": "Access denied. Only admins and doctors can create/modify prescriptions."
}
```

**500 - Server Error**
```json
{
  "detail": "Failed to create prescriptions"
}
```

## Integration Points

### With Patients
- Each prescription links to a patient
- Patient profile could show prescription history
- Validates patient exists

### With Hospitalizations
- Prescriptions during hospitalization
- Could link prescription to hospitalization record
- Track inpatient vs. outpatient prescriptions

### With Pharmacy (Future)
- Export prescriptions to pharmacy system
- Track prescription fulfillment
- Refill management

## Future Enhancements

**Potential Features:**
- Edit individual prescription records
- Add multiple medicines in one form
- Medicine database with autocomplete
- Drug interaction checking
- Allergy checking against patient profile
- Prescription templates for common conditions
- E-prescription integration
- Refill tracking
- Prescription history view per patient
- Print prescription format
- Dosage calculator
- Controlled substance tracking

## Related Documentation

- [Hospitalizations](./HOSPITALIZATIONS.md) - Hospitalization management
- [User Role Management](../architecture/USER_ROLE_MANAGEMENT.md) - Role-based access
- [README](../../README.md) - Project overview

## Database Queries

### Find prescriptions for a patient
```sql
SELECT * FROM prescriptions 
WHERE patient_id = ? 
  AND deleted_at IS NULL
ORDER BY start_date DESC;
```

### Find active prescriptions (current date in range)
```sql
SELECT * FROM prescriptions 
WHERE patient_id = ?
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE
  AND deleted_at IS NULL;
```

### Count prescriptions by date range
```sql
SELECT 
  DATE(start_date) as prescription_date,
  COUNT(*) as prescription_count
FROM prescriptions
WHERE deleted_at IS NULL
GROUP BY DATE(start_date)
ORDER BY prescription_date DESC;
```

### Find prescriptions for specific medicine
```sql
SELECT * FROM prescriptions
WHERE medicines::text LIKE '%Amoxicillin%'
  AND deleted_at IS NULL;
```

