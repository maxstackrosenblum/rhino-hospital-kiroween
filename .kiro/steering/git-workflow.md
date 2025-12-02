# Git Workflow Guidelines

## Commit After Each Task

When implementing features, especially when following a spec or task list, you MUST commit your work after completing each task or logical unit of work.

### Why Commit Frequently?

1. **Traceability**: Each commit represents a complete, working unit of functionality
2. **Rollback Safety**: Easy to revert to a known good state if something breaks
3. **Code Review**: Smaller commits are easier to review and understand
4. **Collaboration**: Team members can see incremental progress
5. **Documentation**: Commit messages serve as a development log

### Commit Workflow

After completing each task:

1. **Review your changes**:
   ```bash
   git status
   git diff
   ```

2. **Stage your changes**:
   ```bash
   git add .
   # Or stage specific files:
   git add backend/models.py backend/schemas.py
   ```

3. **Commit with a meaningful message**:
   ```bash
   git commit -m "feat: add Receptionist and Worker database models

   - Created Receptionist model with id, first_name, last_name, phone, timestamps
   - Created Worker model with id, first_name, last_name, phone, timestamps
   - Added indexes on first_name and last_name for search performance
   - Configured automatic timestamp updates
   
   Implements: Task 1.1
   Requirements: 11.1, 2.3, 7.3, 18.1, 18.2, 18.3"
   ```

4. **Push to remote**:
   ```bash
   git push origin main
   # Or your feature branch:
   git push origin feature/staff-management
   ```

### Commit Message Format

Use conventional commits format for consistency:

```
<type>: <short summary>

<detailed description>

Implements: Task X.Y
Requirements: X.Y, Z.A
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `chore`: Maintenance tasks (dependencies, config, etc.)

**Examples:**

```bash
# After implementing database models
git commit -m "feat: add staff database models and migration

- Created Receptionist and Worker SQLAlchemy models
- Generated Alembic migration for staff tables
- Added indexes for search performance

Implements: Tasks 1.1, 1.2
Requirements: 11.1, 2.3, 7.3, 18.1-18.3"

# After implementing Pydantic schemas
git commit -m "feat: add Pydantic schemas for staff management

- Created StaffCreate schema with field validation
- Created StaffUpdate schema with optional fields
- Created StaffResponse and StaffListResponse schemas
- Added validators for empty/whitespace fields

Implements: Task 2.1
Requirements: 2.2, 7.2, 12.3, 13.1"

# After implementing repository layer
git commit -m "feat: implement repository layer for staff management

- Created BaseStaffRepository interface
- Implemented ReceptionistRepository with CRUD operations
- Implemented WorkerRepository with CRUD operations
- Added search functionality with LIKE queries

Implements: Tasks 3.1, 3.2, 3.3
Requirements: 5.2, 10.2, 11.1-11.3, 12.1"

# After writing tests
git commit -m "test: add property tests for staff registration

- Added property test for empty field rejection
- Added property test for Pydantic validation enforcement
- Added property test for round-trip consistency
- Configured Hypothesis with 100 iterations

Implements: Tasks 2.2, 2.3, 3.4
Properties: 1, 4, 6"

# After implementing API routes
git commit -m "feat: add API routes for staff management

- Created receptionist router with CRUD endpoints
- Created worker router with CRUD endpoints
- Added authentication/authorization checks
- Implemented global error handler
- Registered routers in main application

Implements: Tasks 5.1-5.4
Requirements: 2.1, 7.1, 15.1-15.4, 17.1-17.3, 19.1-19.3"

# After checkpoint - all tests passing
git commit -m "test: backend checkpoint - all tests passing

- Verified all unit tests pass
- Verified all property tests pass
- Verified all integration tests pass
- Backend implementation complete

Implements: Task 6"

# After implementing frontend components
git commit -m "feat: add receptionist management UI

- Created AddReceptionist page with form
- Created ReceptionistList page with table
- Implemented useStaffForm and useStaffList hooks
- Added loading states and error handling

Implements: Tasks 9.1, 9.2
Requirements: 1.1-1.3, 2.1, 3.1-3.2, 4.1-4.2, 5.1-5.6"
```

### When to Commit

**DO commit after:**
- Completing a task or sub-task from your task list
- Implementing a complete feature (model, service, route, component)
- Writing a set of related tests
- Fixing a bug
- Completing a checkpoint (all tests passing)
- Refactoring that maintains functionality

**DON'T commit:**
- Broken code that doesn't compile/run
- Code with failing tests (unless explicitly working on fixing them)
- Incomplete features that break existing functionality
- Sensitive data (passwords, API keys, secrets)
- Large binary files or build artifacts

### Branch Strategy

For feature development:

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/staff-management
   ```

2. **Commit frequently to your feature branch**:
   ```bash
   git add .
   git commit -m "feat: implement receptionist repository"
   git push origin feature/staff-management
   ```

3. **Merge to main when feature is complete**:
   ```bash
   git checkout main
   git merge feature/staff-management
   git push origin main
   ```

### Checkpoint Commits

After completing major milestones (like "Task 6: Checkpoint - Ensure all backend tests pass"):

```bash
git add .
git commit -m "chore: backend implementation checkpoint

All backend tests passing:
- ✓ Repository layer tests
- ✓ Service layer tests
- ✓ API route tests
- ✓ Property-based tests (27 properties)
- ✓ Integration tests

Ready to proceed with frontend implementation.

Implements: Task 6"
git push origin main
```

### Quick Reference

```bash
# Standard workflow after completing a task
git status                    # Review changes
git add .                     # Stage all changes
git commit -m "type: message" # Commit with message
git push origin main          # Push to remote

# Or in one line (for small changes)
git add . && git commit -m "feat: add feature" && git push
```

## Best Practices

1. **Commit early, commit often** - Small, focused commits are better than large ones
2. **Write clear commit messages** - Future you will thank present you
3. **Reference tasks and requirements** - Makes it easy to trace implementation
4. **Keep commits atomic** - Each commit should represent one logical change
5. **Test before committing** - Ensure your code works before committing
6. **Push regularly** - Don't let commits pile up locally
7. **Use branches for features** - Keep main branch stable

## Integration with Task Execution

When executing tasks from a spec:

1. Read the task details
2. Implement the task
3. Run tests to verify
4. **Commit with reference to task number**
5. Move to next task

This creates a clear audit trail from requirements → design → tasks → commits → implementation.
