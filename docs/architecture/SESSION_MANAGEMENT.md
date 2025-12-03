# Session Management Implementation

## Overview
This implementation adds comprehensive session management to the Hospital Management System, allowing users to track and control their active login sessions across multiple devices.

## Database Changes

### New Sessions Table
```sql
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    jti VARCHAR UNIQUE NOT NULL,  -- JWT ID
    device_info VARCHAR,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP
);

CREATE INDEX ix_sessions_jti ON sessions(jti);
CREATE INDEX ix_sessions_user_id ON sessions(user_id);
```

## How It Works

### 1. Login Flow
```
User logs in → JWT created with unique JTI → Session record created in database
```

### 2. Request Validation
```
API request → Extract JWT → Validate token signature → Check session in database
→ Verify not revoked → Verify not expired → Update last_activity → Allow request
```

### 3. Session Revocation
```
User revokes session → Set revoked_at timestamp → Future requests with that token fail
```

## API Endpoints

### Get Active Sessions
```bash
GET /api/sessions
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "device_info": "Chrome on Windows",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2024-12-02T10:00:00",
    "last_activity": "2024-12-02T11:30:00",
    "expires_at": "2024-12-02T12:00:00"
  }
]
```

### Revoke Specific Session
```bash
DELETE /api/sessions/{session_id}
Authorization: Bearer <token>

Response:
{
  "message": "Session revoked successfully"
}
```

### Revoke All Sessions
```bash
DELETE /api/sessions
Authorization: Bearer <token>

Response:
{
  "message": "Revoked 3 session(s)"
}
```

### Cleanup Expired Sessions
```bash
POST /api/sessions/cleanup
Authorization: Bearer <token>

Response:
{
  "message": "Cleaned up 5 expired session(s)"
}
```

## Security Features

### 1. Token Validation
- Every request validates the JWT signature
- Checks if session exists in database
- Verifies session is not revoked
- Confirms session hasn't expired

### 2. Activity Tracking
- `last_activity` updated on every authenticated request
- Helps identify inactive sessions
- Useful for security monitoring

### 3. Auto-Revocation
- All sessions revoked when password changes
- Prevents unauthorized access with old tokens
- Forces re-authentication

### 4. Device Tracking
- IP address logged on login
- User agent stored for device identification
- Helps detect suspicious activity

## Frontend Features

### Sessions Page (`/sessions`)
- View all active sessions
- See device info, IP, and last activity
- Revoke individual sessions
- Revoke all sessions (logout everywhere)
- Current session highlighted
- Responsive design for mobile

### Navigation
- Added "Sessions" link to user menu
- Available in both desktop and mobile navigation

## Migration Steps

### 1. Apply Database Migrations
```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Or restart containers
docker-compose down
docker-compose up --build
```

### 2. Existing Users
- Existing users will need to login again
- Old tokens without JTI will be rejected
- Sessions will be created on next login

## Configuration

### Token Expiration
Set in `.env`:
```env
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Session Cleanup
Consider adding a cron job or scheduled task to cleanup expired sessions:
```python
# Cleanup script
from database import SessionLocal
from models import Session
from datetime import datetime

db = SessionLocal()
deleted = db.query(Session).filter(
    Session.expires_at < datetime.utcnow()
).delete()
db.commit()
print(f"Cleaned up {deleted} expired sessions")
```

## Testing

### 1. Test Login Creates Session
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

### 2. Test Session Validation
```bash
curl http://localhost:8000/api/me \
  -H "Authorization: Bearer <token>"
```

### 3. Test Session Revocation
```bash
curl -X DELETE http://localhost:8000/api/sessions/1 \
  -H "Authorization: Bearer <token>"
```

### 4. Test Revoked Token Rejection
```bash
# After revoking, the same token should fail
curl http://localhost:8000/api/me \
  -H "Authorization: Bearer <revoked_token>"
# Should return 401 Unauthorized
```

## Performance Considerations

### Database Queries
- Session validation adds one database query per request
- Mitigated by indexes on `jti` and `user_id`
- Consider caching active sessions in Redis for high traffic

### Cleanup Strategy
- Expired sessions accumulate over time
- Implement periodic cleanup (daily cron job)
- Or cleanup on user login

### Optimization Ideas
1. **Redis Cache**: Cache active sessions for faster validation
2. **Batch Cleanup**: Delete expired sessions in batches
3. **Connection Pooling**: Use database connection pooling
4. **Read Replicas**: Use read replicas for session validation

## Monitoring

### Metrics to Track
- Active sessions per user
- Session creation rate
- Session revocation rate
- Average session duration
- Failed authentication attempts

### Security Alerts
- Multiple sessions from different locations
- Unusual login times
- High number of failed validations
- Rapid session creation

## Future Enhancements

1. **Device Fingerprinting**: More accurate device identification
2. **Geolocation**: Track login locations on a map
3. **Session Limits**: Max concurrent sessions per user
4. **Suspicious Activity Detection**: Alert on unusual patterns
5. **Session History**: Keep audit log of all sessions
6. **Push Notifications**: Alert user of new logins
7. **Trusted Devices**: Remember trusted devices
8. **2FA Integration**: Require 2FA for new devices

## Troubleshooting

### Issue: "Session not found" error
- User needs to login again
- Old tokens don't have JTI
- Session may have been cleaned up

### Issue: Performance degradation
- Check database indexes
- Monitor session table size
- Implement cleanup strategy
- Consider Redis caching

### Issue: Users logged out unexpectedly
- Check token expiration settings
- Verify session cleanup isn't too aggressive
- Check for database connection issues

## Best Practices

1. **Regular Cleanup**: Schedule daily cleanup of expired sessions
2. **Monitor Growth**: Track session table size
3. **Set Reasonable Expiration**: Balance security and UX
4. **Log Security Events**: Track revocations and failed validations
5. **User Education**: Inform users about session management features

