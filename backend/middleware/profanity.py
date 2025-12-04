"""
Profanity filtering middleware for FastAPI.

This middleware checks request bodies for profanity and returns a 400 error
if profanity is detected.
"""

import json
from typing import Callable
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from better_profanity import profanity


class ProfanityFilterMiddleware(BaseHTTPMiddleware):
    """
    Middleware to filter profanity from request bodies.
    
    Checks JSON request bodies for profanity and returns a 400 error
    if any profanity is detected.
    """
    
    def __init__(self, app, custom_words: list = None):
        """
        Initialize the profanity filter middleware.
        
        Args:
            app: The FastAPI application
            custom_words: Optional list of additional words to filter
        """
        super().__init__(app)
        
        # Load the default profanity filter
        profanity.load_censor_words()
        
        # Add custom words if provided
        if custom_words:
            profanity.add_censor_words(custom_words)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process the request and check for profanity.
        
        Args:
            request: The incoming request
            call_next: The next middleware/endpoint to call
            
        Returns:
            Response: Either an error response or the result of call_next
        """
        # Only check POST, PUT, PATCH requests with JSON bodies
        if request.method in ["POST", "PUT", "PATCH"]:
            # Check if the request has a JSON content type
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                try:
                    # Read the request body
                    body = await request.body()
                    if body:
                        # Parse JSON body
                        try:
                            json_body = json.loads(body)
                            
                            # Check for profanity in the JSON data
                            if self._contains_profanity(json_body):
                                return JSONResponse(
                                    status_code=400,
                                    content={
                                        "detail": "Request contains inappropriate language. Please review your input and try again.",
                                        "error_code": "PROFANITY_DETECTED",
                                        "status_code": 400
                                    }
                                )
                        except json.JSONDecodeError:
                            # If JSON is invalid, let it pass through
                            # The endpoint will handle the JSON validation error
                            pass
                        
                        # Recreate the request with the body for the next middleware/endpoint
                        async def receive():
                            return {"type": "http.request", "body": body}
                        
                        request._receive = receive
                
                except Exception:
                    # If there's any error reading the body, continue normally
                    # Don't break the request flow due to middleware issues
                    pass
        
        # Continue to the next middleware/endpoint
        response = await call_next(request)
        return response
    
    def _contains_profanity(self, data) -> bool:
        """
        Recursively check if any string values in the data contain profanity.
        
        Args:
            data: The data to check (can be dict, list, string, etc.)
            
        Returns:
            bool: True if profanity is found, False otherwise
        """
        if isinstance(data, dict):
            # Check all values in the dictionary
            for value in data.values():
                if self._contains_profanity(value):
                    return True
        elif isinstance(data, list):
            # Check all items in the list
            for item in data:
                if self._contains_profanity(item):
                    return True
        elif isinstance(data, str):
            # Check if the string contains profanity
            if profanity.contains_profanity(data):
                return True
        
        return False