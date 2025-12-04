# Password Policy Documentation

## Overview
The Hospital Management System implements a HIPAA-compliant password policy to ensure strong authentication security.

## Password Requirements

### Minimum Requirements
All passwords must meet the following criteria:

1. **Length**: At least 12 characters
2. **Uppercase**: At least one uppercase letter (A-Z)
3. **Lowercase**: At least one lowercase letter (a-z)
4. **Numbers**: At least one digit (0-9)
5. **Special Characters**: At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
6. **Username**: Cannot contain the username
7. **Common Passwords**: Cannot be a commonly used password
8. **Sequential Characters**: Cannot contain sequential characters (e.g., 'abc', '123')
9. **Repeated Characters**: Cannot have more than 3 repeated characters (e.g., 'aaaa')

### Examples

✅ **Good Passwords:**
- `MyH0sp!tal2024Pass`
- `Secur3#Hospital$`
- `C0mpl3x&P@ssw0rd!`
- `Str0ng!Med1cal#2024`

❌ **Bad Passwords:**
- `password123` (too common, too short)
- `Hospital123` (too short, no special chars)
- `admin123456` (common password)
- `Passw0rd!!!!` (repeated characters)
- `Abc12345678!` (sequential characters)

## Password Strength Levels

The system calculates password strength on a scale of 0-100:

| Score | Label | Description |
|-------|-------|-------------|
| 0-39 | Weak | Does not meet minimum requirements |
| 40-59 | Fair | Meets minimum requirements |
| 60-74 | Good | Above minimum requirements |
| 75-89 | Strong | Well above requirements |
| 90-100 | Very Strong | Excellent password |

### Strength Calculation

Points are awarded for:
- **Length** (up to 30 points)
  - 12+ characters: 15 points
  - 16+ characters: +10 points
  - 20+ characters: +5 points

- **Character Variety** (up to 40 points)
  - Lowercase letters: 10 points
  - Uppercase letters: 10 points
  - Numbers: 10 points
  - Special characters: 10 points

- **Complexity** (up to 30 points)
  - 8+ unique characters: 10 points
  - 12+ unique characters: +10 points
  - 16+ unique characters: +10 points

## Implementation

### Backend Validation

**Endpoint**: `POST /api/validate-password`

```bash
curl -X POST http://localhost:8000/api/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "MyP@ssw0rd123", "username": "john"}'
```

**Response**:
```json
{
  "valid": true,
  "errors": [],
  "strength": {
    "label": "strong",
    "score": 85
  }
}
```

### Frontend Component

The `PasswordStrengthIndicator` component provides real-time feedback:

```jsx
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

<PasswordStrengthIndicator 
  password={password} 
  username={username}
/>
```

**Features:**
- Real-time strength calculation
- Visual progress bar
- Color-coded feedback (red → yellow → green)
- Checklist of requirements
- Shows which requirements are met/unmet

### Where It's Used

1. **Registration** (`/login` - Register tab)
   - Shows strength indicator
   - Validates before submission
   - Displays all requirements

2. **Profile Update** (`/profile`)
   - Shows when changing password
   - Validates against username
   - Optional (can keep current password)

3. **Password Reset** (`/reset-password`)
   - Shows during password reset
   - Ensures strong new password
   - Validates before submission

## API Endpoints

### Get Password Policy
```bash
GET /api/password-policy
```

**Response:**
```json
{
  "requirements": [
    "At least 12 characters long",
    "At least one uppercase letter (A-Z)",
    "At least one lowercase letter (a-z)",
    "At least one number (0-9)",
    "At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)",
    "Cannot contain your username",
    "Cannot be a common password",
    "Cannot contain sequential characters",
    "Cannot contain more than 3 repeated characters"
  ],
  "min_length": 12,
  "require_uppercase": true,
  "require_lowercase": true,
  "require_digit": true,
  "require_special": true,
  "special_characters": "!@#$%^&*()_+-=[]{}|;:,.<>?"
}
```

### Validate Password
```bash
POST /api/validate-password
Content-Type: application/json

{
  "password": "MyP@ssw0rd123",
  "username": "john"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "errors": [],
  "strength": {
    "label": "strong",
    "score": 85
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "errors": [
    "Password must be at least 12 characters long",
    "Password must contain at least one special character"
  ],
  "strength": {
    "label": "weak",
    "score": 35
  }
}
```

## Error Handling

### Registration Errors
When registering with a weak password:

```json
{
  "detail": {
    "message": "Password does not meet requirements",
    "errors": [
      "Password must be at least 12 characters long",
      "Password must contain at least one uppercase letter"
    ]
  }
}
```

### Profile Update Errors
When updating profile with weak password:

```json
{
  "detail": {
    "message": "Password does not meet requirements",
    "errors": [
      "Password cannot contain your username"
    ]
  }
}
```

## Security Features

### 1. Server-Side Validation
- All passwords validated on backend
- Cannot bypass frontend validation
- Consistent enforcement

### 2. Common Password Detection
Rejects commonly used passwords:
- password123
- admin123456
- welcome12345
- hospital123
- qwerty123456
- And more...

### 3. Pattern Detection
Detects and rejects:
- Sequential characters (abc, 123, xyz)
- Repeated characters (aaaa, 1111)
- Username inclusion
- Dictionary words (future enhancement)

### 4. Real-Time Feedback
- Immediate validation
- Visual strength indicator
- Clear error messages
- Helpful suggestions

## Best Practices

### For Users
1. Use a password manager
2. Create unique passwords for each account
3. Use passphrases (e.g., "Coffee!Morning@2024#Sunshine")
4. Avoid personal information
5. Don't reuse passwords

### For Administrators
1. Enforce password policy consistently
2. Educate users on password security
3. Monitor failed login attempts
4. Implement account lockout
5. Regular security audits

## Customization

### Modify Requirements

Edit `backend/core/password_policy.py`:

```python
class PasswordPolicy:
    MIN_LENGTH = 12  # Change minimum length
    REQUIRE_UPPERCASE = True  # Toggle uppercase requirement
    REQUIRE_LOWERCASE = True  # Toggle lowercase requirement
    REQUIRE_DIGIT = True  # Toggle digit requirement
    REQUIRE_SPECIAL = True  # Toggle special char requirement
```

### Add Custom Rules

```python
@classmethod
def validate(cls, password: str, username: str = None):
    # Add custom validation
    if "hospital" in password.lower():
        errors.append("Password cannot contain 'hospital'")
    
    return len(errors) == 0, errors
```

### Modify Strength Calculation

```python
@classmethod
def get_strength(cls, password: str):
    score = 0
    
    # Add custom scoring
    if len(password) >= 24:
        score += 10  # Bonus for very long passwords
    
    return label, score
```

## Testing

### Test Valid Password
```bash
curl -X POST http://localhost:8000/api/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "MyStr0ng!P@ssw0rd", "username": "testuser"}'
```

### Test Invalid Password
```bash
curl -X POST http://localhost:8000/api/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "weak", "username": "testuser"}'
```

### Test Registration
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "MyStr0ng!P@ssw0rd"
  }'
```

## Compliance

### HIPAA Requirements
✅ Implements strong password requirements
✅ Prevents common passwords
✅ Enforces complexity rules
✅ Validates on server-side
✅ Provides user feedback

### Future Enhancements
- [ ] Password expiration (90 days)
- [ ] Password history (prevent reuse of last 5)
- [ ] Account lockout after failed attempts
- [ ] Password complexity scoring
- [ ] Dictionary word detection
- [ ] Breach database checking (Have I Been Pwned)

## Troubleshooting

### Issue: Password rejected but seems strong
**Solution**: Check all requirements, especially:
- Sequential characters (abc, 123)
- Repeated characters (aaaa)
- Username inclusion
- Common password list

### Issue: Strength indicator not showing
**Solution**: 
- Check browser console for errors
- Verify API endpoint is accessible
- Ensure password field has value

### Issue: Backend validation passes but frontend fails
**Solution**:
- Frontend validation is stricter
- Check for sequential/repeated characters
- Verify username not in password

## Support

For questions or issues:
1. Check this documentation
2. Review error messages carefully
3. Test with API endpoints directly
4. Check backend logs for details

## Changelog

### Version 1.0 (Current)
- Initial implementation
- HIPAA-compliant requirements
- Real-time strength indicator
- Server-side validation
- Common password detection
- Pattern detection (sequential, repeated)
