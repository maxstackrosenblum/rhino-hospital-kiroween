# Hospital Management System

Full-stack application with PostgreSQL, FastAPI, and React for managing hospital operations including patients, doctors, and medical staff.

## Services

- **PostgreSQL**: Database on port 5433 (mapped from 5432)
- **FastAPI**: Backend API on port 8000
- **React**: Frontend on port 3000

## Quick Start

```bash
# Start all services (first time - will run migrations automatically)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

## First Time Setup

1. **Start the services**:
   ```bash
   docker-compose up -d
   ```

2. **Create an admin user**:
   ```bash
   # Register via the frontend at http://localhost:3000
   # Or use the API:
   curl -X POST http://localhost:8000/api/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@hospital.com",
       "username": "admin",
       "password": "admin123",
       "first_name": "Admin",
       "last_name": "User"
     }'
   
   # Set admin role
   docker-compose exec db psql -U postgres -d appdb -c \
     "UPDATE users SET role = 'admin' WHERE username = 'admin';"
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Login with your admin credentials

## Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

## Database Credentials

- User: postgres
- Password: postgres
- Database: appdb

## Email Configuration (Optional)

Password reset emails are optional. To enable:

1. Copy `.env.example` to `.env`
2. Add your SMTP credentials:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```
3. Restart backend: `docker compose restart backend`

See `EMAIL_SETUP.md` for detailed instructions.

**Without email configured**: Reset tokens will be logged to console instead.
