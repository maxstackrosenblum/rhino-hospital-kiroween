# Shifts Management System

## Overview

The Shifts Management System allows medical staff (doctors, medical staff, receptionists) to log their working hours, and enables administrators and accountants to view comprehensive reports of all staff working hours.

## Features

### For Staff (Doctors, Medical Staff, Receptionists)

#### My Shifts Page (`/shifts`)
- **Log Working Hours**: Record daily shifts with date, start time, end time, and optional notes
- **View Personal History**: See all logged shifts in a paginated table
- **Edit Shifts**: Modify previously logged shifts
- **Delete Shifts**: Remove incorrect shift records
- **Auto-calculation**: Total hours are automatically calculated from start and end times

**Access**: Doctors, Medical Staff, Receptionists

### For Administrators & Accountants

#### Shifts Report Page (`/shifts-report`)
- **Comprehensive Reporting**: View all staff working hours across the organization
- **Two View Modes**:
  - **Detailed View**: See individual shift records with full details
  - **Summary View**: See aggregated hours per staff member
- **Advanced Filtering**:
  - Date range selection
  - Filter by role (doctor, medical staff, receptionist)
  - Search by name, email, or username
- **Export-Ready Data**: Easy to review for payroll and accounting purposes

**Access**: Admins, Accountants

## User Roles

### Accountant Role
- New role specifically for financial/HR staff
- Orange color badge in the system
- Can view all shifts reports but cannot modify them
- Cannot access patient data or medical records

## Database Schema

### Shifts Table
```sql
CREATE TABLE shifts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date DATETIME NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    total_hours INTEGER NOT NULL,  -- stored in minutes
    notes TEXT,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW(),
    deleted_at DATETIME  -- soft delete support
);
```

### Indexes
- `ix_shifts_user_id` - Fast lookup by user
- `ix_shifts_date` - Fast filtering by date
- `ix_shifts_deleted_at` - Efficient soft delete queries
- `ix_shifts_user_date` - Composite index for user + date queries
- `ix_shifts_date_deleted` - Composite index for date range + active records

## API Endpoints

### POST `/api/shifts`
Create a new shift record for the current user.

**Request Body**:
```json
{
  "date": "2025-12-03",
  "start_time": "09:00",
  "end_time": "17:00",
  "notes": "Regular shift"
}
```

**Response**: Shift object with calculated total_hours

**Access**: Doctors, Medical Staff, Receptionists

---

### GET `/api/shifts`
Get paginated list of shifts with filtering.

**Query Parameters**:
- `page` (default: 1) - Page number
- `page_size` (default: 10, max: 100) - Items per page
- `user_id` - Filter by specific user (admin/accountant only)
- `start_date` - Filter from date (YYYY-MM-DD)
- `end_date` - Filter to date (YYYY-MM-DD)
- `role` - Filter by user role (admin/accountant only)
- `search` - Search by name, email, username (admin/accountant only)

**Response**:
```json
{
  "shifts": [...],
  "total": 150,
  "page": 1,
  "page_size": 10,
  "total_pages": 15
}
```

**Access Control**:
- Staff: Can only see their own shifts
- Admins/Accountants: Can see all shifts with full filtering

---

### GET `/api/shifts/{shift_id}`
Get a specific shift by ID.

**Access Control**:
- Staff: Can only view their own shifts
- Admins/Accountants: Can view any shift

---

### PUT `/api/shifts/{shift_id}`
Update a shift record.

**Request Body**: Same as POST (all fields optional)

**Access Control**:
- Staff: Can only update their own shifts
- Admins/Accountants: Cannot update shifts (read-only)

---

### DELETE `/api/shifts/{shift_id}`
Soft delete a shift record.

**Access Control**:
- Staff: Can only delete their own shifts
- Admins/Accountants: Cannot delete shifts (read-only)

## Frontend Components

### My Shifts Page (`/shifts`)

**Features**:
- Add new shift with dialog form
- Table showing all personal shifts
- Edit and delete actions per row
- Server-side pagination (10, 25, 50, 100 per page)
- Time display in 12-hour format
- Total hours shown as "Xh Ym" format

**State Management**:
- Uses React Query for data fetching and caching
- Optimistic updates on create/edit/delete
- Auto-refresh on mutations

---

### Shifts Report Page (`/shifts-report`)

**View Modes**:

1. **Detailed View**:
   - Shows individual shift records
   - Columns: Staff Member, Role, Date, Start Time, End Time, Total Hours, Notes
   - Full pagination support
   - Sortable by date (newest first)

2. **Summary View**:
   - Shows one row per staff member
   - Columns: Staff Member, Role, Total Hours, Shifts Count
   - Sorted by total hours (highest first)
   - No pagination (shows all users in filtered dataset)
   - Perfect for payroll overview

**Filters**:
- Search bar (name, email, username)
- Date range picker (defaults to current month)
- Role filter dropdown
- All filters work in both view modes

**Summary Banner**:
- Shows total hours for selected period
- Shows total number of shift records
- Updates based on current filters

## Use Cases

### 1. Daily Shift Logging
**Actor**: Doctor  
**Flow**:
1. Navigate to "My Shifts"
2. Click "Log Shift"
3. Select date (defaults to today)
4. Enter start time (e.g., 09:00)
5. Enter end time (e.g., 17:00)
6. Add optional notes
7. Click "Log Shift"
8. System calculates 8h 0m automatically

---

### 2. Monthly Payroll Report
**Actor**: Accountant  
**Flow**:
1. Navigate to "Reports"
2. Select date range (e.g., December 1-31)
3. Click "Summary View"
4. See all staff with total hours worked
5. Export or review for payroll processing

---

### 3. Staff Hours Audit
**Actor**: Admin  
**Flow**:
1. Navigate to "Reports"
2. Search for specific staff member
3. Select date range
4. View detailed shift records
5. Verify times and notes
6. Check for anomalies or overtime

---

### 4. Department Hours Analysis
**Actor**: Admin  
**Flow**:
1. Navigate to "Reports"
2. Filter by role (e.g., "Medical Staff")
3. Select date range (e.g., last quarter)
4. Switch to "Summary View"
5. Analyze total hours by staff member
6. Identify staffing patterns

## Validation Rules

### Time Validation
- End time must be after start time
- Minimum shift duration: 1 minute
- Maximum shift duration: 24 hours (no validation, but unusual)

### Date Validation
- Can log shifts for past dates
- Can log shifts for future dates (for scheduling)
- Date format: YYYY-MM-DD or ISO 8601

### Field Requirements
- **Required**: date, start_time, end_time
- **Optional**: notes
- **Auto-calculated**: total_hours (in minutes)

## Performance Optimizations

### Database Indexes
- Composite indexes for common query patterns
- Separate indexes for soft delete filtering
- Optimized for date range queries

### Frontend
- Server-side pagination (reduces data transfer)
- Debounced search (300ms delay)
- React Query caching (reduces API calls)
- Optimistic updates (instant UI feedback)

### Backend
- Efficient SQL queries with proper joins
- Pagination at database level
- Case-insensitive search with ILIKE
- Soft delete filtering in all queries

## Security & Access Control

### Role-Based Access
- **Doctors, Medical Staff, Receptionists**: Can manage their own shifts only
- **Admins**: Full read access to all shifts, no write access to others' shifts
- **Accountants**: Read-only access to all shifts reports
- **Patients**: No access to shifts system

### Data Privacy
- Staff can only see their own shift data
- Admins/Accountants see aggregated data for reporting
- No sensitive medical data in shifts records

### Audit Trail
- `created_at` timestamp on all shifts
- `updated_at` timestamp tracks modifications
- Soft delete with `deleted_at` (data retained for audit)

## Future Enhancements

### Potential Features
1. **Shift Templates**: Save common shift patterns
2. **Bulk Import**: Upload shifts from CSV/Excel
3. **Export to Excel**: Download reports in spreadsheet format
4. **Shift Approval Workflow**: Manager approval before finalizing
5. **Overtime Alerts**: Notify when staff exceeds threshold
6. **Schedule Integration**: Link with appointment scheduling
7. **Mobile App**: Log shifts on mobile devices
8. **Biometric Integration**: Auto-log with fingerprint/face scan
9. **Break Time Tracking**: Separate paid/unpaid breaks
10. **Shift Swapping**: Allow staff to trade shifts

### Reporting Enhancements
1. **Charts & Graphs**: Visual representation of hours
2. **Comparison Reports**: Month-over-month, year-over-year
3. **Department Analytics**: Hours by department
4. **Cost Analysis**: Calculate labor costs
5. **Compliance Reports**: Track required hours/certifications

## Technical Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Authentication**: JWT tokens

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router
- **Forms**: Controlled components with validation

## Migration

### Database Migration
```bash
# Run the migration
docker-compose exec backend alembic upgrade head
```

Migration file: `d4e5f6g7h8i9_add_shifts_table_and_accountant_role.py`

### Changes
1. Creates `shifts` table with all columns and indexes
2. Adds `accountant` role to UserRole enum
3. Safe to run multiple times (uses IF NOT EXISTS)

## Testing

### Manual Testing Checklist

**Staff User**:
- [ ] Can log a new shift
- [ ] Can view own shifts
- [ ] Can edit own shift
- [ ] Can delete own shift
- [ ] Cannot see other staff shifts
- [ ] Pagination works correctly
- [ ] Total hours calculated correctly

**Admin/Accountant**:
- [ ] Can view all shifts
- [ ] Can filter by date range
- [ ] Can filter by role
- [ ] Can search by name/email
- [ ] Detailed view shows all columns
- [ ] Summary view shows aggregated data
- [ ] Summary view sorted by hours
- [ ] Cannot edit other staff shifts
- [ ] Cannot delete other staff shifts

## Troubleshooting

### Common Issues

**Issue**: "End time must be after start time"  
**Solution**: Ensure end time is later than start time. Check AM/PM if using 12-hour format.

**Issue**: Shifts not appearing in report  
**Solution**: Check date range filter. Ensure shifts are within selected dates.

**Issue**: Cannot see other staff shifts  
**Solution**: Only admins and accountants can see all shifts. Regular staff see only their own.

**Issue**: Pagination not working  
**Solution**: Clear browser cache. Check network tab for API errors.

**Issue**: Search not finding users  
**Solution**: Search is case-insensitive. Try partial names. Check spelling.

## Support

For issues or questions about the Shifts Management System:
1. Check this documentation
2. Review API documentation at `/docs` (Swagger UI)
3. Check browser console for errors
4. Contact system administrator

---

**Last Updated**: December 3, 2025  
**Version**: 1.0.0
