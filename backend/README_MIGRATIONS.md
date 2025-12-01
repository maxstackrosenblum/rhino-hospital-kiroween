# Database Migrations with Alembic

## Initial Setup (Already Done)

Alembic is configured and ready to use.

## Create Your First Migration

After starting the containers, run:

```bash
# Enter the backend container
docker exec -it fastapi_backend bash

# Create initial migration
alembic revision --autogenerate -m "create users table"

# Apply migration
alembic upgrade head
```

## Common Commands

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current migration
alembic current

# Show migration history
alembic history
```

## How It Works

1. Alembic compares your SQLAlchemy models with the database
2. Generates migration files in `alembic/versions/`
3. Applies changes to keep database in sync with models

## Note

The `init_db.sh` script automatically runs `alembic upgrade head` on container startup, so your database will always be up to date.
