---
inclusion: manual
---

# Database Migration Guide

## Creating a New Migration

### Step 1: Update the Model
Edit `backend/models.py` to add or modify your database model:

```python
class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    phone = Column(String)
    email = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Step 2: Generate Migration
```bash
cd backend
alembic revision --autogenerate -m "add patients table"
```

### Step 3: Review Migration
Check the generated file in `backend/alembic/versions/` and verify the changes.

### Step 4: Apply Migration
```bash
alembic upgrade head
```

### Step 5: Rollback if Needed
```bash
alembic downgrade -1
```

## Common Migration Patterns

### Adding a Column
```python
op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
```

### Adding an Index
```python
op.create_index('ix_patients_email', 'patients', ['email'])
```

### Adding a Foreign Key
```python
op.add_column('appointments', sa.Column('patient_id', sa.Integer(), nullable=False))
op.create_foreign_key('fk_appointments_patient', 'appointments', 'patients', ['patient_id'], ['id'])
```

## Best Practices
- Always review auto-generated migrations
- Test migrations on development database first
- Keep migrations small and focused
- Add meaningful migration messages
- Never edit applied migrations
- Backup database before running migrations in production
