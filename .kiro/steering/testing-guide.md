---
inclusion: manual
---

# Testing Guide

## Backend Testing with Swagger UI

### Access Swagger UI
Navigate to `http://localhost:8000/docs` when the backend is running.

### Testing Authentication Flow

1. **Register a new user**
   - Click on `POST /api/register`
   - Click "Try it out"
   - Fill in the request body
   - Click "Execute"
   - Should return 200 with user data

2. **Login**
   - Click on `POST /api/login`
   - Enter username and password
   - Copy the `access_token` from response

3. **Authorize**
   - Click the "Authorize" button at the top
   - Paste the token (without "Bearer " prefix)
   - Click "Authorize"

4. **Test Protected Endpoints**
   - Try `GET /api/me` - should return your user info
   - Try `PUT /api/me` - should update your profile

## Frontend Testing

### Manual Testing Checklist
- [ ] Registration flow works
- [ ] Login flow works
- [ ] Token persists after page refresh
- [ ] Protected routes redirect to login
- [ ] Logout clears token and redirects
- [ ] Profile editing saves changes
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Dropdown closes on outside click
- [ ] Form validation works

### Testing API Integration
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform actions in the app
4. Check API requests and responses
5. Verify Authorization headers are sent
6. Check for errors in Console tab

## Common Issues

### 401 Unauthorized
- Token expired or invalid
- Token not included in request
- User doesn't exist

### 403 Forbidden
- Usually means HTTPBearer auto_error is True
- Check auth.py configuration

### CORS Errors
- Backend CORS middleware not configured
- Frontend using wrong API URL

### Connection Refused
- Backend not running
- Wrong port or URL
- Docker container not started
