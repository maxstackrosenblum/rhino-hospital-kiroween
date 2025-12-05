# Blood Pressure Monitoring System

## Overview

The Blood Pressure Monitoring System is a comprehensive health tracking feature that allows users to log and monitor their blood pressure readings. The system provides automated health alerts via email when abnormal readings are detected, helping users stay informed about their cardiovascular health.

## Key Features

### 1. Universal Access for Blood Pressure Logging
- **All authenticated users** can log their own blood pressure readings
- Available to:
  - Patients
  - Users without assigned roles (undefined role)
  - Medical staff (doctors, nurses, medical staff)
  - Administrative staff (receptionists, admins)
- No special permissions required to add personal readings

### 2. Automated Health Alerts

#### Email Notifications
When a user logs an abnormal blood pressure reading, the system automatically sends a personalized email with:

**High Blood Pressure Alert (Systolic > 120 mmHg)**
- Clear indication of elevated reading
- Personalized recommendations:
  - **Consult with your doctor before making any changes**
  - Reduce salt intake
  - Engage in regular physical activity (30 minutes daily)
  - Maintain healthy weight
  - Limit alcohol consumption
  - Manage stress through relaxation techniques
  - Avoid smoking and caffeine
- Medical advice about potential complications (heart disease, stroke)
- Encouragement to schedule a doctor's appointment

**Low Blood Pressure Alert (Systolic < 90 mmHg)**
- Clear indication of low reading
- Personalized recommendations:
  - Increase salt intake moderately (with doctor consultation)
  - Drink more water to increase blood volume
  - Eat small, frequent meals
  - Avoid standing up quickly
  - Wear compression stockings
  - Avoid prolonged standing
- Medical advice about potential complications (dizziness, fainting, shock)
- Encouragement to consult with a doctor

#### Email Frequency Control
- Emails are sent **once per day** for the first abnormal reading
- Prevents email fatigue from multiple readings in the same day
- Ensures users receive timely alerts without being overwhelmed

### 3. Role-Based Access Control

#### Regular Users (Patients & Undefined Role)
**Can:**
- Add their own blood pressure readings
- View their own reading history
- See their personal statistics (averages, high-risk count)
- Delete their own readings
- Receive email alerts for abnormal readings

**Cannot:**
- View other users' blood pressure data
- Access system-wide statistics
- Search for other users' readings

#### Medical Personnel (Doctors, Nurses, Medical Staff, Receptionists, Admins)
**Can:**
- Add their own blood pressure readings
- View **all users'** blood pressure readings
- Search readings by patient name or email
- Filter readings by date range
- Filter to show only high-risk readings
- View system-wide statistics across all users
- Delete any reading (for data management)
- Monitor patient health trends

**Additional Capabilities:**
- Access to comprehensive patient blood pressure history
- Ability to identify patients requiring immediate attention
- System-wide health monitoring and reporting

### 4. Data Tracking & Validation

#### Required Information
- **Systolic pressure** (required): 50-300 mmHg
- **Diastolic pressure** (optional): 30-200 mmHg
- **Reading date** (optional): Defaults to current time if not provided

#### Automatic Calculations
- **High-risk status**: Automatically flagged if systolic > 120 mmHg
- **Timestamps**: Automatic creation and update timestamps
- **User association**: Readings linked to the user who created them

### 5. Search & Filtering (Medical Staff Only)

Medical personnel can filter readings by:
- **Patient search**: Name or email
- **Date range**: From/to dates
- **Risk level**: Show only high-risk readings
- **Pagination**: Configurable page size (1-100 records)

### 6. Statistics Dashboard

#### Personal Statistics (All Users)
- Total number of readings
- High-risk reading count
- Normal reading count
- Average systolic pressure
- Average diastolic pressure
- Date of latest reading

#### System-Wide Statistics (Medical Staff)
- Aggregated data across all patients
- Helps identify health trends
- Supports population health management

## Technical Implementation

### Database Schema
```sql
Table: blood_pressure_checks
- id (Primary Key)
- user_id (Foreign Key → users.id, CASCADE delete)
- systolic (Integer, indexed)
- diastolic (Integer, nullable)
- reading_date (DateTime, indexed)
- created_at (DateTime)
- updated_at (DateTime)

Indexes:
- ix_bp_user_date (user_id, reading_date) - Composite index for efficient queries
```

### API Endpoints

#### POST /api/blood-pressure
Create a new blood pressure reading
- **Authentication**: Required (any authenticated user)
- **Access**: Users can only create readings for themselves
- **Response**: Returns reading with high-risk flag and user info
- **Side Effect**: Sends email if reading is abnormal (once per day)

#### GET /api/blood-pressure
Get paginated list of readings
- **Authentication**: Required
- **Access**: 
  - Regular users: Own readings only
  - Medical staff: All readings with search/filter
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `page_size`: Records per page (1-100, default: 10)
  - `search`: Search by name/email (medical staff only)
  - `date_from`: Filter from date (YYYY-MM-DD)
  - `date_to`: Filter to date (YYYY-MM-DD)
  - `high_risk_only`: Show only high-risk readings (boolean)

#### GET /api/blood-pressure/statistics
Get blood pressure statistics
- **Authentication**: Required
- **Access**:
  - Regular users: Personal statistics
  - Medical staff: System-wide statistics

#### DELETE /api/blood-pressure/{reading_id}
Delete a blood pressure reading
- **Authentication**: Required
- **Access**:
  - Regular users: Can delete own readings only
  - Medical staff: Can delete any reading

### Email System Integration

The system uses the hospital's email infrastructure to send personalized health alerts:

**Email Features:**
- Professional HTML template with hospital branding
- Color-coded alerts (red for high, orange for low)
- Detailed medical recommendations
- Reading details with timestamp
- Responsive design for mobile devices
- Automated delivery (no manual intervention)

**Email Reliability:**
- Graceful error handling (reading saved even if email fails)
- Logging for troubleshooting
- Daily frequency limit to prevent spam

## User Interface

### Dashboard Integration
- Quick access card on main dashboard
- Shows "Blood Pressure Check" option
- Available to patients and users without roles

### Blood Pressure Monitoring Page
Features:
- **Statistics cards**: Visual summary of readings
- **Add reading button**: Quick access to log new reading
- **Readings table**: Chronological list with risk indicators
- **Search & filters**: For medical staff
- **Pagination controls**: Navigate through history
- **Delete functionality**: Remove incorrect readings
- **Empty state**: Helpful guidance for first-time users

### Navigation
- Accessible from main navigation bar
- Available in mobile menu
- Visible to: admin, doctor, nurse, medical_staff, patient, undefined roles

## Security & Privacy

### Data Protection
- Readings associated with user accounts (CASCADE delete on user deletion)
- Role-based access ensures users only see authorized data
- JWT authentication required for all endpoints
- Input validation prevents invalid data entry

### HIPAA Considerations
- Patient health data stored securely
- Access logs for audit trails
- Role-based access control (RBAC)
- Secure email delivery for health alerts

## Use Cases

### Use Case 1: Patient Self-Monitoring
**Actor**: Patient or user without role
**Flow**:
1. User logs into the system
2. Navigates to "Blood Pressure Checks"
3. Clicks "Add Reading"
4. Enters systolic (and optionally diastolic) pressure
5. Submits reading
6. System saves reading and displays in history
7. If abnormal, user receives email with recommendations

### Use Case 2: Medical Staff Monitoring
**Actor**: Doctor, Nurse, or Medical Staff
**Flow**:
1. Medical staff logs into system
2. Navigates to "Blood Pressure Checks"
3. Views all patients' readings
4. Searches for specific patient by name
5. Filters to show only high-risk readings
6. Reviews patient history
7. Identifies patients needing follow-up care

### Use Case 3: Emergency Alert Response
**Actor**: Patient with high blood pressure
**Flow**:
1. Patient logs reading of 165 mmHg (high)
2. System immediately sends email alert
3. Patient receives email with:
   - Clear indication of high reading
   - Lifestyle recommendations
   - Advice to schedule doctor appointment
4. Patient contacts doctor for follow-up
5. Early intervention prevents complications

## Benefits

### For Patients
- **Proactive health monitoring**: Track cardiovascular health over time
- **Early warning system**: Immediate alerts for abnormal readings
- **Actionable guidance**: Personalized recommendations for improvement
- **Convenience**: Log readings anytime, anywhere
- **Historical tracking**: View trends and patterns

### For Medical Staff
- **Population health management**: Monitor all patients' blood pressure
- **Risk identification**: Quickly identify high-risk patients
- **Data-driven care**: Make decisions based on historical data
- **Efficiency**: Automated alerts reduce manual monitoring
- **Comprehensive view**: Access to complete patient BP history

### For Healthcare System
- **Preventive care**: Reduce emergency visits through early intervention
- **Patient engagement**: Encourage active health participation
- **Data collection**: Build health trend database
- **Quality metrics**: Track population health indicators
- **Cost reduction**: Prevent complications through early detection

## Future Enhancements

Potential improvements for future versions:
- **Trend analysis**: Graphical visualization of BP trends over time
- **Goal setting**: Allow users to set target BP ranges
- **Medication tracking**: Link BP readings to medication adherence
- **Doctor notifications**: Alert assigned doctors for critical readings
- **Mobile app integration**: Sync with BP monitoring devices
- **Export functionality**: Download readings as PDF/CSV
- **Reminders**: Scheduled notifications to log readings
- **Family sharing**: Allow caregivers to monitor family members

## Configuration

### Email Settings
Configured via environment variables:
- `SMTP_HOST`: Email server hostname
- `SMTP_PORT`: Email server port
- `SMTP_USERNAME`: Email account username
- `SMTP_PASSWORD`: Email account password
- `SMTP_FROM_EMAIL`: Sender email address

### Thresholds
Current thresholds (configurable in code):
- **High blood pressure**: Systolic > 120 mmHg
- **Low blood pressure**: Systolic < 90 mmHg
- **Email frequency**: Once per day per user

### Validation Limits
- **Systolic range**: 50-300 mmHg
- **Diastolic range**: 30-200 mmHg (optional)
- **Page size**: 1-100 records per page

## Conclusion

The Blood Pressure Monitoring System provides a comprehensive, user-friendly solution for cardiovascular health tracking. By combining universal access for personal logging with role-based access for medical oversight, the system empowers patients while supporting clinical care. Automated email alerts ensure timely intervention for abnormal readings, potentially preventing serious health complications.

The system's design prioritizes:
- **Accessibility**: Easy for all users to log readings
- **Privacy**: Role-based access protects patient data
- **Actionability**: Clear recommendations drive behavior change
- **Scalability**: Supports individual and population health management
- **Reliability**: Robust error handling and validation

This feature represents a significant step toward proactive, patient-centered healthcare delivery.
