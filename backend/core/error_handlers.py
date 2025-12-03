"""
Global error handlers for the FastAPI application.

This module provides centralized error handling for all API endpoints,
ensuring consistent error responses and proper logging.

Requirements:
- 15.1: Structured JSON error responses
- 15.2: No stack trace exposure
- 15.4: Field-specific validation errors
- 20.1: Database connection failure handling
- 20.2: Transaction rollback on failure
- 20.3: Constraint violation handling
- 20.4: Database timeout handling
- 20.5: Error logging with sanitization
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import (
    SQLAlchemyError,
    IntegrityError,
    OperationalError,
    DatabaseError,
    TimeoutError as SQLTimeoutError
)
from typing import Dict, Any
import traceback

from core.logging_config import get_logger

logger = get_logger(__name__)


class ErrorResponse:
    """Structured error response format"""
    
    def __init__(
        self,
        detail: str,
        status_code: int,
        error_code: str = None,
        fields: Dict[str, str] = None
    ):
        self.detail = detail
        self.status_code = status_code
        self.error_code = error_code or self._get_error_code(status_code)
        self.fields = fields or {}
    
    @staticmethod
    def _get_error_code(status_code: int) -> str:
        """Get error code from status code"""
        codes = {
            400: "VALIDATION_ERROR",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            500: "INTERNAL_SERVER_ERROR",
            503: "SERVICE_UNAVAILABLE"
        }
        return codes.get(status_code, "UNKNOWN_ERROR")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON response"""
        response = {
            "detail": self.detail,
            "error_code": self.error_code,
            "status_code": self.status_code
        }
        if self.fields:
            response["fields"] = self.fields
        return response


def sanitize_error_message(error: Exception) -> str:
    """
    Sanitize error message to prevent information leakage.
    
    Requirements:
    - 15.2: No stack trace exposure
    - 20.5: Sanitize error messages
    
    Args:
        error: Exception to sanitize
        
    Returns:
        Sanitized error message safe for client consumption
    """
    error_str = str(error)
    
    # Remove file paths
    if "/" in error_str or "\\" in error_str:
        return "An internal error occurred"
    
    # Remove SQL-specific details
    sql_keywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "FROM", "WHERE", "TABLE"]
    if any(keyword in error_str.upper() for keyword in sql_keywords):
        return "A database error occurred"
    
    # Remove connection strings and credentials
    sensitive_keywords = ["password", "secret", "token", "key", "credential"]
    if any(keyword in error_str.lower() for keyword in sensitive_keywords):
        return "A configuration error occurred"
    
    return error_str


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle Pydantic validation errors.
    
    Requirements:
    - 15.1: Structured JSON error responses
    - 15.4: Field-specific validation errors
    
    Args:
        request: FastAPI request object
        exc: Validation error exception
        
    Returns:
        JSON response with field-specific error details
    """
    logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
    
    # Extract field-specific errors
    fields = {}
    for error in exc.errors():
        field_path = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        fields[field_path] = error["msg"]
    
    error_response = ErrorResponse(
        detail="Validation failed for one or more fields",
        status_code=status.HTTP_400_BAD_REQUEST,
        error_code="VALIDATION_ERROR",
        fields=fields
    )
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=error_response.to_dict()
    )


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    Handle database-related errors.
    
    Requirements:
    - 20.1: Database connection failure handling
    - 20.2: Transaction rollback (handled by session management)
    - 20.3: Constraint violation handling
    - 20.4: Database timeout handling
    - 20.5: Error logging with sanitization
    
    Args:
        request: FastAPI request object
        exc: SQLAlchemy exception
        
    Returns:
        JSON response with appropriate error message
    """
    # Log full error details for debugging
    logger.error(
        f"Database error on {request.method} {request.url.path}: {type(exc).__name__}",
        extra={
            "error_type": type(exc).__name__,
            "error_details": str(exc),
            "stack_trace": traceback.format_exc()
        }
    )
    
    # Determine specific error type and response
    if isinstance(exc, IntegrityError):
        # Constraint violation
        error_response = ErrorResponse(
            detail="The operation violates a database constraint. Please check your input.",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="CONSTRAINT_VIOLATION"
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response.to_dict()
        )
    
    elif isinstance(exc, (OperationalError, SQLTimeoutError)):
        # Connection or timeout error
        if "timeout" in str(exc).lower():
            error_response = ErrorResponse(
                detail="The database operation timed out. Please try again.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                error_code="DATABASE_TIMEOUT"
            )
        else:
            error_response = ErrorResponse(
                detail="Unable to connect to the database. Please try again later.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                error_code="DATABASE_CONNECTION_ERROR"
            )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=error_response.to_dict()
        )
    
    else:
        # Generic database error
        error_response = ErrorResponse(
            detail="A database error occurred. Please try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response.to_dict()
        )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle all other unhandled exceptions.
    
    Requirements:
    - 15.1: Structured JSON error responses
    - 15.2: No stack trace exposure
    - 20.5: Error logging
    
    Args:
        request: FastAPI request object
        exc: Unhandled exception
        
    Returns:
        JSON response with generic error message
    """
    # Log full error details for debugging
    logger.error(
        f"Unhandled error on {request.method} {request.url.path}: {type(exc).__name__}",
        extra={
            "error_type": type(exc).__name__,
            "error_details": str(exc),
            "stack_trace": traceback.format_exc()
        }
    )
    
    # Return sanitized error to client
    sanitized_message = sanitize_error_message(exc)
    
    error_response = ErrorResponse(
        detail=sanitized_message if sanitized_message != str(exc) else "An unexpected error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_SERVER_ERROR"
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.to_dict()
    )


def register_error_handlers(app):
    """
    Register all error handlers with the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
    
    logger.info("Error handlers registered successfully")
