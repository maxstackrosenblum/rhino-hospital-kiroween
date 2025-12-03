# Design Document

## Overview

This design implements MailerSend integration as an alternative email provider for the Hospital Management System. The solution maintains backward compatibility with the existing SMTP-based email system while providing enhanced deliverability and analytics through MailerSend's API.

The design follows a provider pattern where the email sending logic automatically detects the available configuration and uses the appropriate provider (MailerSend or SMTP) transparently.

## Architecture

### Provider Selection Logic

```
Email Send Request
       ↓
Check MAILERSEND_API_KEY
       ↓
   [Present?]
    ↙      ↘
  Yes       No
   ↓         ↓
MailerSend  SMTP
Provider   Provider
   ↓         ↓
   └─────────┘
       ↓
   Email Sent
```

### Configuration Priority

1. **MailerSend Provider** (Primary): Used when `MAILERSEND_API_KEY` is configured
2. **SMTP Provider** (Fallback): Used when MailerSend is not configured

### Integration Points

- **Configuration Layer**: `backend/core/config.py` - Add MailerSend settings
- **Email Service Layer**: `backend/core/email.py` - Implement provider selection and MailerSend integration
- **Dependencies**: `backend/requirements.txt` - Add mailersend package

## Components and Interfaces

### 1. Configuration Component

**File**: `backend/core/config.py`

**New Settings**:

```python
# MailerSend Settings
MAILERSEND_API_KEY: str = os.getenv("MAILERSEND_API_KEY", "")
MAILERSEND_FROM_EMAIL: str = os.getenv("MAILERSEND_FROM_EMAIL", "")
MAILERSEND_FROM_NAME: str = os.getenv("MAILERSEND_FROM_NAME", "")
```

**Fallback Logic**:

- If `MAILERSEND_FROM_EMAIL` is empty, use `SMTP_FROM_EMAIL`
- If `MAILERSEND_FROM_NAME` is empty, use `SMTP_FROM_NAME`

### 2. Email Provider Interface

**Abstract Interface**:

```python
from abc import ABC, abstractmethod

class EmailProvider(ABC):
    @abstractmethod
    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        pass
```

### 3. MailerSend Provider Implementation

**Class**: `MailerSendProvider`

**Dependencies**:

```python
from mailersend import NewEmail
```

**Key Methods**:

- `__init__(api_key: str, from_email: str, from_name: str)`
- `send_email(to_email: str, subject: str, html_content: str) -> bool`
- `_handle_mailersend_error(error: Exception) -> None`

**MailerSend API Integration**:

```python
# Create email object
email = NewEmail(api_key)

# Set email properties
email.set_mail_from({"email": from_email, "name": from_name})
email.set_mail_to([{"email": to_email}])
email.set_subject(subject)
email.set_html_content(html_content)

# Send email
response = email.send()
```

### 4. SMTP Provider Implementation

**Class**: `SMTPProvider`

**Encapsulation**: Wrap existing SMTP logic in provider class for consistency

### 5. Email Service Factory

**Function**: `get_email_provider() -> EmailProvider`

**Logic**:

```python
def get_email_provider() -> EmailProvider:
    if settings.MAILERSEND_API_KEY:
        from_email = settings.MAILERSEND_FROM_EMAIL or settings.SMTP_FROM_EMAIL
        from_name = settings.MAILERSEND_FROM_NAME or settings.SMTP_FROM_NAME
        return MailerSendProvider(
            api_key=settings.MAILERSEND_API_KEY,
            from_email=from_email,
            from_name=from_name
        )
    else:
        return SMTPProvider()
```

## Data Models

### Email Message Structure

Both providers will handle the same email message structure:

```python
@dataclass
class EmailMessage:
    to_email: str
    subject: str
    html_content: str
    from_email: str
    from_name: str
```

### MailerSend Response Handling

```python
@dataclass
class EmailResult:
    success: bool
    message_id: Optional[str] = None
    error_message: Optional[str] = None
```

## Error Handling

### MailerSend Specific Errors

1. **Invalid API Key**: Log clear error message and return False
2. **Rate Limiting**: Log rate limit error with retry suggestion
3. **Invalid Email Format**: Log validation error details
4. **Service Unavailable**: Log service error and suggest SMTP fallback
5. **Network Errors**: Log network connectivity issues

### Error Logging Strategy

```python
# Success logging
logger.info(f"Email sent successfully via MailerSend to {to_email}, Message ID: {message_id}")

# Error logging
logger.error(f"MailerSend API error for {to_email}: {error_details}")
logger.warning(f"MailerSend not configured, using SMTP fallback")
```

### Graceful Degradation

- If MailerSend fails due to configuration issues, log error and return False
- Maintain same return value contract as SMTP implementation
- No automatic fallback to SMTP to avoid confusion in configuration

## Testing Strategy

### Unit Tests

1. **Provider Selection Tests**:

   - Test MailerSend provider selection when API key is present
   - Test SMTP provider selection when API key is absent
   - Test configuration fallback logic

2. **MailerSend Provider Tests**:

   - Mock MailerSend API calls
   - Test successful email sending
   - Test various error scenarios
   - Test HTML content preservation

3. **Integration Tests**:
   - Test email functions with MailerSend provider
   - Test email functions with SMTP provider
   - Test provider switching behavior

### Test Configuration

```python
# Test environment variables
MAILERSEND_API_KEY_TEST = "test_key_12345"
MAILERSEND_FROM_EMAIL_TEST = "test@example.com"
MAILERSEND_FROM_NAME_TEST = "Test System"
```

### Mock Strategy

```python
@patch('mailersend.NewEmail')
def test_mailersend_send_email_success(mock_new_email):
    # Mock successful MailerSend response
    mock_email = Mock()
    mock_email.send.return_value = {"message_id": "test_123"}
    mock_new_email.return_value = mock_email

    # Test email sending
    result = send_email("test@example.com", "Test", "<h1>Test</h1>")
    assert result is True
```

## Implementation Phases

### Phase 1: Core Integration

- Add MailerSend configuration to settings
- Implement MailerSendProvider class
- Add provider selection logic
- Update requirements.txt

### Phase 2: Provider Refactoring

- Extract SMTP logic into SMTPProvider class
- Implement EmailProvider interface
- Update main email functions to use providers

### Phase 3: Testing & Validation

- Add comprehensive unit tests
- Add integration tests
- Test with real MailerSend API (development)
- Validate HTML email rendering

### Phase 4: Documentation & Deployment

- Update environment variable documentation
- Add configuration examples
- Test deployment scenarios

## Security Considerations

### API Key Management

- Store MailerSend API key in environment variables only
- Never log API key values
- Validate API key format before use

### Email Content Security

- Maintain existing HTML sanitization if any
- Preserve existing email validation logic
- Ensure no sensitive data in email logs

### Configuration Validation

- Validate email addresses before sending
- Check API key format (starts with "mlsn.")
- Provide clear error messages for misconfigurations

## Performance Considerations

### API Rate Limits

- MailerSend has rate limits based on plan
- Log rate limit errors clearly
- Consider implementing retry logic for rate limits

### Response Handling

- MailerSend API is typically faster than SMTP
- Handle async responses appropriately
- Maintain same timeout behavior as SMTP

### Memory Usage

- MailerSend SDK is lightweight
- No significant memory impact expected
- Reuse provider instances where possible

## Monitoring and Observability

### Success Metrics

- Log successful sends with MailerSend message IDs
- Track provider usage (MailerSend vs SMTP)
- Monitor email delivery success rates

### Error Tracking

- Log all MailerSend API errors with context
- Track configuration errors
- Monitor provider selection decisions

### Health Checks

- Validate MailerSend configuration on startup
- Test API connectivity during health checks
- Report provider status in system health
