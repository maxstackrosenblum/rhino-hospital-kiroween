# Hospital Management System - Project Context

## Project Overview
This is a Hospital Management System built with:
- **Backend**: FastAPI (Python) with PostgreSQL database
- **Frontend**: React with modern CSS
- **Authentication**: JWT-based authentication with HTTPBearer
- **Containerization**: Docker and Docker Compose

## Architecture

### Backend Structure
- `backend/main.py` - FastAPI application with all API endpoints
- `backend/auth.py` - Authentication logic (JWT, password hashing)
- `backend/models.py` - SQLAlchemy database models
- `backend/schemas.py` - Pydantic schemas for request/response validation
- `backend/database.py` - Database connection and session management
- `backend/alembic/` - Database migrations

### Frontend Structure
- `frontend/src/App.js` - Main React component with routing and state management
- `frontend/src/App.css` - Styling with CSS variables for theming

### API Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login (returns JWT token)
- `GET /api/me` - Get current user info (requires authentication)
- `PUT /api/me` - Update user profile (requires authentication)
- `GET /api/health` - Health check endpoint

## Development Guidelines

### Code Style
- Use async/await for asynchronous operations
- Follow REST API conventions
- Use Pydantic models for data validation
- Keep components modular and reusable

### Database
- Use Alembic for all database schema changes
- Never modify the database schema directly
- Always create migrations for schema changes

### Security
- Never commit sensitive data (passwords, secret keys)
- Use environment variables for configuration
- Validate all user inputs
- Use HTTPBearer for API authentication

### Testing
- Test API endpoints using Swagger UI at `/docs`
- Verify authentication flows work correctly
- Check database migrations before deploying

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key (change in production!)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time
- `REACT_APP_API_URL` - Backend API URL for frontend
