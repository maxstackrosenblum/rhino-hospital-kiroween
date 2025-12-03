# Email Setup Guide

## Overview
The Hospital Management System can send emails for password reset requests. Email functionality is optional - if not configured, the system will log the reset tokens instead.

## Email Features

### Password Reset Emails
- Professional HTML email template
- Secure reset link with token
- 1-hour expiration notice
- Security warnings
- Mobile-responsive design

### Welcome Emails (Optional)
- Sent when new users register
- Contains username and login link
- Can be enabled in the registration endpoint

## Configuration

### 1. Using Gmail (Recommended for Testing)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Hospital Management System"
4. Copy the generated 16-character password

#### Step 3: Update .env File
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Hospital Management System
FRONTEND_URL=http://localhost:3000
```

### 2. Using Other Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Hospital Management System
FRONTEND_URL=https://yourdomain.com
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Hospital Management System
FRONTEND_URL=https://yourdomain.com
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Hospital Management System
FRONTEND_URL=https://yourdomain.com
```

#### Microsoft 365 / Outlook
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
SMTP_FROM_NAME=Hospital Management System
FRONTEND_URL=http://localhost:3000
```

### 3. Development Mode (No Email)

If you don't configure SMTP credentials, the system will:
- Log the reset token to console
- Return success message to user
- Allow testing without email setup

Simply leave the SMTP fields empty or remove them:
```env
SMTP_USER=
SMTP_PASSWORD=
```

## Testing Email Functionality

### 1. Test Password Reset Email

#### Using the API:
```bash
curl -X POST http://localhost:8000/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

#### Using the Frontend:
1. Go to http://localhost:3000/login
2. Click "Forgot Password?"
3. Enter your email
4. Check your inbox for the reset email

### 2. Check Logs
If email is not configured, check Docker logs:
```bash
docker compose logs backend | grep "Password reset"
```

You should see the reset token in the logs.

### 3. Verify Email Delivery
- Check spam/junk folder
- Verify email address is correct
- Check SMTP credentials
- Review backend logs for errors

## Email Templates

### Password Reset Email Preview
```
┌─────────────────────────────────────┐
│   Password Reset Request            │
│   (Purple gradient header)          │
└─────────────────────────────────────┘
│                                     │
│ Hello username,                     │
│                                     │
│ We received a request to reset     │
│ your password...                    │
│                                     │
│     [Reset Password Button]         │
│                                     │
│ ⚠️ Security Notice:                 │
│ • Link expires in 1 hour            │
│ • Don't share this link             │
│                                     │
└─────────────────────────────────────┘
```

## Customization

### Modify Email Templates
Edit `backend/core/email.py`:

```python
def send_password_reset_email(to_email: str, reset_token: str, username: str):
    # Customize HTML content here
    html_content = f"""
    <!-- Your custom HTML -->
    """
```

### Add New Email Types
```python
def send_account_locked_email(to_email: str, username: str):
    html_content = """
    <!-- Account locked notification -->
    """
    return send_email(to_email, "Account Locked", html_content)
```

### Change Email Styling
Modify the CSS in the HTML templates:
- Colors: Update gradient values
- Fonts: Change font-family
- Layout: Adjust padding and margins

## Troubleshooting

### Issue: Emails not being sent

**Check 1: SMTP Credentials**
```bash
# View current configuration (in container)
docker compose exec backend python -c "from core.config import settings; print(f'SMTP User: {settings.SMTP_USER}')"
```

**Check 2: Backend Logs**
```bash
docker compose logs backend -f
```

**Check 3: Test SMTP Connection**
```python
# Test script
import smtplib
from core.config import settings

try:
    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
    server.starttls()
    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    print("✓ SMTP connection successful")
    server.quit()
except Exception as e:
    print(f"✗ SMTP connection failed: {e}")
```

### Issue: Emails going to spam

**Solutions:**
1. Use a verified domain email address
2. Set up SPF, DKIM, and DMARC records
3. Use a reputable email service (SendGrid, Mailgun)
4. Avoid spam trigger words in subject/content
5. Include unsubscribe link (for production)

### Issue: Gmail blocking login

**Solutions:**
1. Use App Password (not regular password)
2. Enable "Less secure app access" (not recommended)
3. Use OAuth2 authentication (advanced)

### Issue: Rate limiting

**Solutions:**
1. Implement email queue
2. Use dedicated email service
3. Add rate limiting to password reset endpoint
4. Cache recent requests

## Production Recommendations

### 1. Use Professional Email Service
- SendGrid (12,000 free emails/month)
- Mailgun (5,000 free emails/month)
- AWS SES (62,000 free emails/month)
- Postmark (100 free emails/month)

### 2. Security Best Practices
- Store SMTP credentials in secrets manager
- Use environment-specific configurations
- Enable email logging and monitoring
- Implement rate limiting
- Add email verification for new accounts

### 3. Monitoring
```python
# Add to email.py
import logging
logger = logging.getLogger(__name__)

def send_email(...):
    try:
        # Send email
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Email failed: {e}")
        # Alert admin
```

### 4. Email Queue (Advanced)
For high-volume applications, use a queue:
```python
# Using Celery + Redis
from celery import Celery

celery = Celery('tasks', broker='redis://localhost:6379')

@celery.task
def send_email_async(to_email, subject, content):
    send_email(to_email, subject, content)
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No | smtp.gmail.com | SMTP server hostname |
| `SMTP_PORT` | No | 587 | SMTP server port (usually 587 or 465) |
| `SMTP_USER` | No | - | SMTP username/email |
| `SMTP_PASSWORD` | No | - | SMTP password/app password |
| `SMTP_FROM_EMAIL` | No | noreply@hospital.com | Sender email address |
| `SMTP_FROM_NAME` | No | Hospital Management System | Sender display name |
| `FRONTEND_URL` | No | http://localhost:3000 | Frontend URL for reset links |

## Testing Checklist

- [ ] SMTP credentials configured
- [ ] Environment variables loaded
- [ ] Backend restarted after config changes
- [ ] Password reset request successful
- [ ] Email received in inbox
- [ ] Reset link works correctly
- [ ] Token expires after 1 hour
- [ ] Email styling looks good on mobile
- [ ] Spam folder checked
- [ ] Logs show no errors

## Next Steps

1. Configure SMTP credentials in `.env`
2. Restart backend: `docker compose restart backend`
3. Test password reset flow
4. Customize email templates if needed
5. Set up monitoring for production
6. Consider adding welcome emails
7. Implement email verification for new users

