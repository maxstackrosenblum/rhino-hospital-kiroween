# Docker Compose Stack

Full-stack application with PostgreSQL, FastAPI, and React.

## Services

- **PostgreSQL**: Database on port 5432
- **FastAPI**: Backend API on port 8000
- **React**: Frontend on port 3000

## Quick Start

```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

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
