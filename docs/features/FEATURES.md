# Hospital Management System - Features

## Authentication & Security

### JWT-Based Authentication with Session Management
- Secure token-based authentication using HTTPBearer
- Access tokens with configurable expiration (default: 30 minutes)
- Password hashing using bcrypt
- Protected routes requiring authentication
- **Session tracking**: Each login creates a database session record
- **Unique JWT ID (JTI)**: Every token has a unique identifier
- **Session validation**: Tokens validated against active sessions on every request

### Session Management
- **Active Sessions View**: Users can see all their active login sessions
- **Device Information**: Track IP address, user agent, and device info
- **Last Activity Tracking**: Monitor when each session was last used
- **Session Revocation**: 
  - Revoke individual sessions (logout from specific device)
  - Revoke all sessions (logout from all devices)
  - Auto-revoke on password change for security
- **Session Expiration**: Automatic cleanup of expired sessions
- **Security Features**:
  - Detect suspicious activity across devices
  - Prevent token reuse after revocation
  - Session validation on every API request

### Password Reset Functionality
- **Request Password Reset**: Users can request a password reset via email
- **Email Delivery**: Professional HTML email with reset link
- **Secure Reset Tokens**: Time-limited tokens (1 hour expiration) for password reset
- **Token Verification**: Validates reset tokens before allowing password change
- **Database Fields**: Added `reset_token` and `reset_token_expires` with indexing for performance
- **Auto-logout**: All sessions revoked when password is changed
- **Development Mode**: Works without email configuration (logs tokens instead)
- **Multiple Providers**: Supports Gmail, SendGrid, Mailgun, AWS SES, and more

## User Management

### Role-Based Access Control
- **Roles**: Admin, Doctor, Receptionist, Undefined
- **Admin-Only Features**: User management, role assignment, user deletion
- **Role-specific UI**: Different navigation and features based on user role

### User CRUD Operations
- User registration with email validation
- Profile updates (name, email, password)
- Soft delete functionality (users marked as deleted, not removed)
- User restoration capability (admin only)

### Advanced Search & Filtering
- **Server-side search** across multiple fields:
  - Username (case-insensitive)
  - Email (case-insensitive)
  - First name (case-insensitive)
  - Last name (case-insensitive)
- **Role filtering**: Filter users by specific roles
- **Real-time search**: Instant results as you type
- **Database indexes** on searchable fields for optimal performance

### Pagination
- Server-side pagination with configurable page size
- Page navigation with total page count
- Efficient database queries using offset/limit
- Responsive pagination controls

## Responsive Design

### Mobile-First Approach
- **Navbar**: 
  - Hamburger menu with drawer navigation on mobile
  - Condensed logo ("HMS") on small screens
  - Responsive avatar sizing
  - Touch-friendly menu items
  
- **Users Table**:
  - Card layout for mobile devices (< 900px)
  - Table layout for desktop
  - Stacked form fields on mobile
  - Full-width buttons on small screens
  - Optimized touch targets

### Breakpoints
- Mobile: < 900px (md breakpoint)
- Tablet: 900px - 1200px
- Desktop: > 1200px

## Database Optimization

### Indexes
**Users Table:**
- `email`: Unique index for fast lookups and duplicate prevention
- `username`: Unique index for authentication queries
- `reset_token`: Index for password reset token verification
- Primary key index on `id`

**Sessions Table:**
- `jti`: Unique index for JWT token validation
- `user_id`: Index for querying user sessions
- Foreign key to users table with cascade delete
- Primary key index on `id`

### Soft Delete Pattern
- `deleted_at` timestamp field
- Queries filter out deleted users by default
- Ability to include deleted users (admin only)
- User restoration without data loss

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login (returns JWT)
- `GET /api/me` - Get current user info
- `PUT /api/me` - Update current user profile
- `DELETE /api/me` - Soft delete current user

### Password Reset
- `POST /api/password-reset/request` - Request password reset
- `POST /api/password-reset/reset` - Reset password with token
- `POST /api/password-reset/verify-token` - Verify reset token validity

### Session Management
- `GET /api/sessions` - List all active sessions for current user
- `DELETE /api/sessions/{id}` - Revoke specific session
- `DELETE /api/sessions` - Revoke all sessions (logout everywhere)
- `POST /api/sessions/cleanup` - Cleanup expired sessions

### User Management (Admin Only)
- `GET /api/users` - List users with search, filter, and pagination
- `PUT /api/users/{id}` - Update any user
- `DELETE /api/users/{id}` - Soft delete user
- `POST /api/users/{id}/restore` - Restore deleted user

### Health Check
- `GET /api/health` - API health status

## Frontend Features

### Pages
- **Login/Register**: Combined authentication page
- **Forgot Password**: Request password reset
- **Reset Password**: Set new password with token
- **Dashboard**: User home page
- **Profile**: View and edit user profile
- **Sessions**: View and manage active login sessions
- **Settings**: User preferences
- **Users**: Admin-only user management with search and pagination

### UI Components
- Material-UI (MUI) design system
- Custom theme with light/dark mode support
- Responsive navigation bar
- Protected routes
- Loading states
- Error handling with user-friendly messages
- Success notifications

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt
- **Validation**: Pydantic

### Frontend
- **Framework**: React 18
- **Language**: TypeScript/JavaScript
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Fetch API
- **Build Tool**: Vite

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL container
- **Hot Reload**: Enabled for both frontend and backend
- **Environment Variables**: .env configuration

## Performance Optimizations

1. **Database Indexes**: Fast queries on frequently searched fields
2. **Server-side Pagination**: Reduces data transfer and improves load times
3. **Query Optimization**: Efficient SQLAlchemy queries with proper filtering
4. **React Query Caching**: Reduces unnecessary API calls
5. **Lazy Loading**: Components loaded on demand
6. **Responsive Images**: Optimized for different screen sizes

## Security Best Practices

1. **Password Security**: Bcrypt hashing with salt
2. **JWT Tokens**: Secure token generation and validation with unique JTI
3. **Session Management**: Database-backed session validation and revocation
4. **CORS Configuration**: Controlled cross-origin requests
5. **Input Validation**: Pydantic schemas on backend, form validation on frontend
6. **SQL Injection Prevention**: SQLAlchemy ORM parameterized queries
7. **Soft Delete**: Data preservation for audit trails
8. **Token Expiration**: Time-limited access and reset tokens
9. **Email Enumeration Prevention**: Generic messages for password reset
10. **Auto-revocation**: Sessions revoked on password change
11. **Activity Tracking**: Last activity timestamp updated on each request
12. **Device Tracking**: IP address and user agent logged for security monitoring

## Email System

### Features
- **Password Reset Emails**: Secure, branded HTML emails with reset links
- **Welcome Emails**: Optional onboarding emails for new users
- **Professional Templates**: Mobile-responsive HTML email designs
- **Multiple Providers**: Support for Gmail, SendGrid, Mailgun, AWS SES, Outlook
- **Development Mode**: Works without SMTP configuration (logs instead)
- **Error Handling**: Graceful fallback if email fails
- **Security**: Prevents email enumeration attacks

### Configuration
Email is optional. Configure via environment variables:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
- `FRONTEND_URL` for reset links

See [Email Setup Guide](../setup/EMAIL_SETUP.md) for detailed configuration guide.

## Future Enhancements

- Two-factor authentication (2FA)
- Audit logging for admin actions
- Advanced role permissions
- Patient management module
- Appointment scheduling
- Medical records system
- Real-time notifications

