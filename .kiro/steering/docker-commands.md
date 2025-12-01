---
inclusion: manual
---

# Docker Commands Reference

## Starting the Application

### Start all services
```bash
docker-compose up
```

### Start in detached mode (background)
```bash
docker-compose up -d
```

### Rebuild containers
```bash
docker-compose up --build
```

## Stopping the Application

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (clears database)
```bash
docker-compose down -v
```

## Viewing Logs

### All services
```bash
docker-compose logs
```

### Specific service
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Follow logs (live)
```bash
docker-compose logs -f backend
```

## Accessing Containers

### Execute command in backend container
```bash
docker-compose exec backend bash
```

### Execute command in database container
```bash
docker-compose exec db psql -U postgres -d appdb
```

## Database Operations

### Run migrations
```bash
docker-compose exec backend alembic upgrade head
```

### Create new migration
```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
```

### Access PostgreSQL
```bash
docker-compose exec db psql -U postgres -d appdb
```

## Troubleshooting

### Restart a specific service
```bash
docker-compose restart backend
```

### View container status
```bash
docker-compose ps
```

### Remove all containers and start fresh
```bash
docker-compose down -v
docker-compose up --build
```

### Check container resource usage
```bash
docker stats
```

## Development Workflow

1. Make code changes
2. For backend: Container auto-reloads (volume mounted)
3. For frontend: Container auto-reloads (volume mounted)
4. For database changes: Run migrations
5. View logs to debug issues
