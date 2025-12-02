"""
Structured logging configuration with PII masking.

This module provides structured JSON logging with automatic PII masking
for sensitive data like phone numbers and names.

Requirements:
- 14.1: Log all API requests with method, path, and timestamp
- 14.2: Log errors with type, message, and stack trace
- 14.3: Log successful operations with staff type and timestamp
- 14.4: Mask PII in logs (phone numbers, full names)
- 14.5: Never expose database credentials in logs
"""
import logging
import json
import re
from datetime import datetime
from typing import Any, Dict, Optional
from functools import wraps


class PIIMasker:
    """Utility class for masking personally identifiable information in logs"""
    
    @staticmethod
    def mask_phone(phone: str) -> str:
        """
        Mask phone number, showing only last 4 digits.
        
        Args:
            phone: Phone number to mask
            
        Returns:
            Masked phone number (e.g., "***-***-1234")
        """
        if not phone or len(phone) < 4:
            return "***"
        return f"***-***-{phone[-4:]}"
    
    @staticmethod
    def mask_name(name: str) -> str:
        """
        Mask name, showing only first letter and length.
        
        Args:
            name: Name to mask
            
        Returns:
            Masked name (e.g., "J*** (4 chars)")
        """
        if not name:
            return "***"
        return f"{name[0]}*** ({len(name)} chars)"
    
    @staticmethod
    def mask_credentials(text: str) -> str:
        """
        Remove database credentials and connection strings from text.
        
        Args:
            text: Text that may contain credentials
            
        Returns:
            Text with credentials removed
        """
        # Mask database URLs
        text = re.sub(
            r'postgresql://[^:]+:[^@]+@[^/]+/\w+',
            'postgresql://***:***@***/***',
            text
        )
        
        # Mask password patterns
        text = re.sub(
            r'password["\s:=]+[^\s"]+',
            'password=***',
            text,
            flags=re.IGNORECASE
        )
        
        # Mask secret key patterns
        text = re.sub(
            r'secret[_\s]?key["\s:=]+[^\s"]+',
            'secret_key=***',
            text,
            flags=re.IGNORECASE
        )
        
        return text
    
    @staticmethod
    def mask_dict(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively mask PII in dictionary.
        
        Args:
            data: Dictionary that may contain PII
            
        Returns:
            Dictionary with PII masked
        """
        masked = {}
        for key, value in data.items():
            key_lower = key.lower()
            
            # Mask phone numbers
            if 'phone' in key_lower and isinstance(value, str):
                masked[key] = PIIMasker.mask_phone(value)
            # Mask names
            elif any(name_field in key_lower for name_field in ['first_name', 'last_name', 'name']):
                if isinstance(value, str):
                    masked[key] = PIIMasker.mask_name(value)
                else:
                    masked[key] = value
            # Mask passwords and secrets
            elif any(secret in key_lower for secret in ['password', 'secret', 'token', 'key']):
                masked[key] = '***'
            # Recursively mask nested dicts
            elif isinstance(value, dict):
                masked[key] = PIIMasker.mask_dict(value)
            # Recursively mask lists
            elif isinstance(value, list):
                masked[key] = [
                    PIIMasker.mask_dict(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                masked[key] = value
        
        return masked


class StructuredLogger:
    """
    Structured JSON logger with PII masking.
    
    All log entries are formatted as JSON with consistent structure:
    {
        "timestamp": "ISO 8601 timestamp",
        "level": "INFO|ERROR|WARNING|DEBUG",
        "message": "Log message",
        "context": { ... additional context ... }
    }
    """
    
    def __init__(self, name: str):
        """
        Initialize structured logger.
        
        Args:
            name: Logger name (typically module name)
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Remove existing handlers to avoid duplicates
        self.logger.handlers = []
        
        # Create console handler with JSON formatter
        handler = logging.StreamHandler()
        handler.setLevel(logging.INFO)
        
        # Use custom formatter for structured JSON output
        formatter = logging.Formatter('%(message)s')
        handler.setFormatter(formatter)
        
        self.logger.addHandler(handler)
    
    def _format_log(
        self,
        level: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        mask_pii: bool = True
    ) -> str:
        """
        Format log entry as JSON.
        
        Args:
            level: Log level (INFO, ERROR, etc.)
            message: Log message
            context: Additional context data
            mask_pii: Whether to mask PII in context
            
        Returns:
            JSON-formatted log string
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "message": message
        }
        
        if context:
            # Mask PII in context if requested
            if mask_pii:
                context = PIIMasker.mask_dict(context)
            log_entry["context"] = context
        
        return json.dumps(log_entry)
    
    def info(self, message: str, **context):
        """
        Log info message with structured context.
        
        Args:
            message: Log message
            **context: Additional context as keyword arguments
        """
        log_str = self._format_log("INFO", message, context)
        self.logger.info(log_str)
    
    def error(self, message: str, exc_info: Optional[Exception] = None, **context):
        """
        Log error message with structured context.
        
        Args:
            message: Error message
            exc_info: Exception object (optional)
            **context: Additional context as keyword arguments
        """
        if exc_info:
            context["error_type"] = type(exc_info).__name__
            context["error_message"] = str(exc_info)
            # Mask credentials in error messages
            context["error_message"] = PIIMasker.mask_credentials(context["error_message"])
        
        log_str = self._format_log("ERROR", message, context)
        self.logger.error(log_str)
    
    def warning(self, message: str, **context):
        """
        Log warning message with structured context.
        
        Args:
            message: Warning message
            **context: Additional context as keyword arguments
        """
        log_str = self._format_log("WARNING", message, context)
        self.logger.warning(log_str)
    
    def debug(self, message: str, **context):
        """
        Log debug message with structured context.
        
        Args:
            message: Debug message
            **context: Additional context as keyword arguments
        """
        log_str = self._format_log("DEBUG", message, context)
        self.logger.debug(log_str)
    
    def log_request(self, method: str, path: str, **context):
        """
        Log API request.
        
        Requirement 14.1: Log request method, path, and timestamp
        
        Args:
            method: HTTP method (GET, POST, etc.)
            path: Request path
            **context: Additional context
        """
        self.info(
            f"API Request: {method} {path}",
            method=method,
            path=path,
            **context
        )
    
    def log_operation_success(
        self,
        operation: str,
        staff_type: str,
        **context
    ):
        """
        Log successful staff operation.
        
        Requirement 14.3: Log successful operations with staff type and timestamp
        
        Args:
            operation: Operation name (e.g., "register", "update", "delete")
            staff_type: Type of staff ("receptionist" or "worker")
            **context: Additional context
        """
        self.info(
            f"Operation successful: {operation}",
            operation=operation,
            staff_type=staff_type,
            status="success",
            **context
        )
    
    def log_operation_error(
        self,
        operation: str,
        staff_type: str,
        error: Exception,
        **context
    ):
        """
        Log failed staff operation.
        
        Requirement 14.2: Log errors with type, message, and stack trace
        
        Args:
            operation: Operation name
            staff_type: Type of staff
            error: Exception that occurred
            **context: Additional context
        """
        self.error(
            f"Operation failed: {operation}",
            exc_info=error,
            operation=operation,
            staff_type=staff_type,
            status="failed",
            **context
        )


def get_logger(name: str) -> StructuredLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        StructuredLogger instance
    """
    return StructuredLogger(name)
