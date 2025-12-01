# Coding Standards

## Python (Backend)

### Style Guide
- Follow PEP 8 style guide
- Use type hints for function parameters and return values
- Maximum line length: 100 characters
- Use descriptive variable names

### FastAPI Best Practices
- Use dependency injection with `Depends()`
- Define response models with Pydantic schemas
- Use appropriate HTTP status codes
- Add docstrings to all endpoints
- Group related endpoints together

### Database
- Use SQLAlchemy ORM for database operations
- Always use database sessions properly (with dependency injection)
- Create indexes for frequently queried fields
- Use transactions for multi-step operations

### Error Handling
- Use HTTPException for API errors
- Provide clear error messages
- Return appropriate status codes (400, 401, 404, 500)
- Log errors for debugging

## JavaScript/React (Frontend)

### Style Guide
- Use functional components with hooks
- Use const/let instead of var
- Use arrow functions for callbacks
- Keep components small and focused

### React Best Practices
- Use useState for local state
- Use useEffect for side effects
- Clean up event listeners in useEffect
- Use meaningful component and variable names
- Extract reusable logic into custom hooks

### API Calls
- Always handle loading and error states
- Use try/catch for error handling
- Store JWT tokens in localStorage
- Include Authorization header for protected routes

### CSS
- Use CSS variables for theming
- Follow BEM naming convention when appropriate
- Keep styles modular and component-specific
- Use flexbox/grid for layouts

## Security

### Authentication
- Never store passwords in plain text
- Use bcrypt for password hashing
- Validate JWT tokens on every protected endpoint
- Set appropriate token expiration times

### Input Validation
- Validate all user inputs on both frontend and backend
- Sanitize data before database operations
- Use Pydantic models for automatic validation
- Check for SQL injection vulnerabilities

### API Security
- Use HTTPS in production
- Implement rate limiting
- Validate content types
- Use CORS appropriately
