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
