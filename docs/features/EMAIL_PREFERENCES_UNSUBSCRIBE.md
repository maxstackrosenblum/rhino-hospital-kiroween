# Email Preferences & Unsubscribe Feature

## Overview

A comprehensive email notification management system that allows users to control which emails they receive and provides one-click unsubscribe links in all automated emails.

## Features

### 1. Granular Email Preferences

Users can control three types of email notifications:

| Preference | Description | Used For |
|-----------|-------------|----------|
| **Appointment Updates** | Appointment confirmations and status changes | - New appointment confirmation<br>- Status updates (confirmed, completed, cancelled) |
| **Blood Pressure Alerts** | Abnormal blood pressure warnings | - High blood pressure alerts (>120 mmHg)<br>- Low blood pressure alerts (<90 mmHg) |

**Note**: Security-related emails (password reset, account changes) cannot be disabled and will always be sent.

### 2. Profile Settings Integration

Users can manage email preferences directly from their profile page:
- Clear checkbox interface with descriptions
- Real-time updates
- Saved with other profile changes

### 3. One-Click Unsubscribe Links

Every automated email includes an unsubscribe link in the footer:
- **Blood Pressure Alerts**: Unsubscribe from blood pressure alerts only
- **Appointment Emails**: Unsubscribe from appointment updates only
- **General Option**: Unsubscribe from all emails

### 4. Unsubscribe Page

Dedicated unsubscribe page (`/unsubscribe`) with:
- Token verification (no login required)
- User information display
- Granular preference selection
- Success confirmation
- Link back to home

## Implementation Details

### Backend

#### 1. Database Schema

**New Column**: `users.email_preferences` (JSON)
```json
{
  "appointment_updates": true,
  "blood_pressure_alerts": true
}
```

**Migration**: `98435330ef3e_add_email_preferences_to_users.py`

#### 2. API Endpoints

**Update User Profile** - `PUT /api/me`
```json
{
  "email_preferences": {
    "appointment_updates": false,
    "blood_pressure_alerts": true
  }
}
```

**Unsubscribe** - `POST /api/unsubscribe`
- Query params: `token` (required), `preference` (all|appointments|blood_pressure)
- No authentication required (uses token)
- Returns updated preferences

**Verify Unsubscribe Token** - `GET /api/unsubscribe/verify`
- Query param: `token`
- Returns user info and current preferences
- Used by frontend to display unsubscribe page

#### 3. Token System

**Unsubscribe Tokens**:
- Generated using JWT
- Valid for 90 days
- Contains user_id and type="unsubscribe"
- Functions:
  - `create_unsubscribe_token(user_id)` - Generate token
  - `verify_unsubscribe_token(token)` - Verify and extract user_id

#### 4. Email Preference Checks

Before sending any email, the system checks user preferences:

**Blood Pressure Alerts**:
```python
email_prefs = user.email_preferences or {}
if not email_prefs.get("blood_pressure_alerts", True):
    return False  # Skip sending
```

**Appointment Emails**:
```python
email_prefs = patient_user.email_preferences or {}
if email_prefs.get("appointment_updates", True):
    send_appointment_email(...)
```

#### 5. Unsubscribe Links in Emails

All automated emails include unsubscribe links:

**Blood Pressure Email Footer**:
```html
<p style="margin-top: 12px;">
    Don't want to receive blood pressure alerts? 
    <a href="{unsubscribe_url}">Unsubscribe from blood pressure alerts</a>
</p>
```

**Appointment Email Footer**:
```html
<p style="margin-top: 12px;">
    Don't want to receive appointment updates? 
    <a href="{unsubscribe_url}">Unsubscribe from appointment updates</a>
</p>
```

### Frontend

#### 1. Profile Page Updates

**Location**: `frontend/src/pages/Profile.tsx`

Added email preferences section with:
- Three checkboxes for each preference type
- Descriptions for each option
- Note about security emails
- Saved together with profile updates

#### 2. Unsubscribe Page

**Location**: `frontend/src/pages/Unsubscribe.tsx`
**Route**: `/unsubscribe?token={token}&preference={type}`

Features:
- Token verification on load
- Display user email and name
- Checkbox selection for preferences to unsubscribe
- Success/error states
- Navigation back to home

#### 3. Route Configuration

Added to `App.tsx`:
```tsx
<Route path="/unsubscribe" element={<Unsubscribe />} />
```

No authentication required - uses token from email link.

## User Flows

### Flow 1: Update Preferences in Profile

1. User logs in
2. Navigates to Profile page
3. Scrolls to "Email Notification Preferences"
4. Unchecks unwanted notifications
5. Clicks "Save Changes"
6. Preferences updated immediately

### Flow 2: Unsubscribe from Email Link

1. User receives blood pressure alert email
2. Clicks "Unsubscribe from blood pressure alerts" link
3. Redirected to `/unsubscribe?token=...&preference=blood_pressure`
4. Page verifies token and shows user info
5. Blood pressure alerts checkbox is pre-selected
6. User clicks "Unsubscribe"
7. Success message displayed
8. Future blood pressure emails will not be sent

### Flow 3: Selective Unsubscribe

1. User clicks unsubscribe link in any email
2. Unsubscribe page loads with pre-selected preference
3. User can check/uncheck other preferences
4. Clicks "Unsubscribe"
5. Only selected preferences are disabled

## Email Behavior

### Before Sending Any Email

1. Check if user has email address
2. Check user's email preferences
3. If preference is disabled, skip sending and log
4. If enabled, proceed with email

### Email Types and Preferences

| Email Type | Preference Check | Can Be Disabled? |
|-----------|------------------|------------------|
| Appointment Confirmation | `appointment_updates` | ✅ Yes |
| Appointment Status Update | `appointment_updates` | ✅ Yes |
| Blood Pressure Alert (High) | `blood_pressure_alerts` | ✅ Yes |
| Blood Pressure Alert (Low) | `blood_pressure_alerts` | ✅ Yes |
| Password Reset | None | ❌ No (Security) |
| Account Created | None | ❌ No (Security) |

## Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
FRONTEND_URL=http://localhost:5173  # Used for unsubscribe links
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000  # API endpoint
```

## Legal Compliance

### CAN-SPAM Act (US)
✅ Unsubscribe link in every email
✅ Processed within 10 business days (instant in our case)
✅ Clear identification of sender
✅ Accurate subject lines

### GDPR (EU)
✅ User control over personal data
✅ Easy opt-out mechanism
✅ Granular consent options
✅ Transparent about data usage

## Testing

### Backend Tests

```bash
# Test email preference update
PUT /api/me
{
  "email_preferences": {
    "appointment_updates": false
  }
}

# Test unsubscribe endpoint
POST /api/unsubscribe?token={valid_token}&preference=blood_pressure

# Verify token
GET /api/unsubscribe/verify?token={valid_token}
```

### Frontend Tests

1. **Profile Page**:
   - Load profile page
   - Verify checkboxes reflect current preferences
   - Toggle preferences
   - Save and verify update

2. **Unsubscribe Page**:
   - Visit with valid token
   - Verify user info displayed
   - Select preferences
   - Unsubscribe and verify success

3. **Email Links**:
   - Receive test email
   - Click unsubscribe link
   - Verify correct preference pre-selected

## Database Migration

Run migration to add email_preferences column:

```bash
cd backend
alembic upgrade head
```

Or with Docker:
```bash
docker-compose exec backend alembic upgrade head
```

## Future Enhancements

1. **Email Frequency Control**
   - Daily digest option
   - Weekly summary option

2. **Additional Preferences**
   - General notifications (system announcements, health tips)
   - Prescription reminders
   - Hospitalization updates
   - Lab result notifications

3. **Preference History**
   - Track when preferences changed
   - Audit log for compliance

4. **Re-subscribe Option**
   - Allow users to re-enable notifications
   - Send confirmation email

5. **Preference Center**
   - Dedicated page for all email settings
   - Preview of email types
   - Frequency controls

## Troubleshooting

### User Not Receiving Emails

1. Check email_preferences in database
2. Verify email address is correct
3. Check email logs for sending attempts
4. Verify SMTP configuration

### Unsubscribe Link Not Working

1. Verify token is valid (not expired)
2. Check FRONTEND_URL environment variable
3. Verify unsubscribe route is registered
4. Check browser console for errors

### Preferences Not Saving

1. Check API response for errors
2. Verify user is authenticated
3. Check database column exists
4. Verify migration ran successfully

## Files Modified

### Backend
- `backend/models.py` - Added email_preferences column
- `backend/schemas.py` - Added EmailPreferences schema
- `backend/routers/users.py` - Added unsubscribe endpoints, preference handling
- `backend/auth.py` - Added unsubscribe token functions
- `backend/routers/blood_pressure.py` - Added preference check, unsubscribe link
- `backend/routers/appointments.py` - Added preference check, unsubscribe link
- `backend/core/email.py` - Added unsubscribe link to confirmation email
- `backend/alembic/versions/98435330ef3e_*.py` - Migration file

### Frontend
- `frontend/src/pages/Profile.tsx` - Added email preferences section
- `frontend/src/pages/Unsubscribe.tsx` - New unsubscribe page
- `frontend/src/App.tsx` - Added unsubscribe route

## Summary

The email preferences and unsubscribe feature provides:
- ✅ User control over email notifications
- ✅ Legal compliance (CAN-SPAM, GDPR)
- ✅ Professional unsubscribe experience
- ✅ Granular preference management
- ✅ Easy integration with existing emails
- ✅ No authentication required for unsubscribe
- ✅ Security emails always sent

This feature improves user experience, reduces spam complaints, and ensures legal compliance for email communications.
