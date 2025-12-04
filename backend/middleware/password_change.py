"""
Password Change Middleware
Checks if users need to change their password on protected routes
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import auth as auth_utils
from database import get_db
import models

class PasswordChangeMiddleware(BaseHTTPMiddleware):
    """Middleware to check if user needs to change password"""
    
    def __init__(self, app):
        super().__init__(app)
        # Paths that should skip password change check
        self.skip_paths = [
            "/api/login", 
            "/api/change-password", 
            "/api/logout", 
            "/api/refresh",
            "/docs", 
            "/redoc", 
            "/openapi.json",
            "/api/health"
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip middleware for certain paths
        if any(request.url.path.startswith(path) for path in self.skip_paths):
            return await call_next(request)
        
        # Skip for non-API paths (static files, etc.)
        if not request.url.path.startswith("/api/"):
            return await call_next(request)
        
        # Check if user needs to change password
        try:
            # Get authorization header
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                # No auth header, let the endpoint handle authentication
                return await call_next(request)
            
            # Extract token
            token = auth_header.split(" ")[1]
            
            # Get database session
            db = next(get_db())
            
            try:
                # Get current user using existing auth logic
                from fastapi.security import HTTPAuthorizationCredentials
                from core.security import decode_token
                
                payload = decode_token(token)
                if payload is None:
                    # Invalid token, let endpoint handle it
                    return await call_next(request)
                
                username = payload.get("sub")
                jti = payload.get("jti")
                
                if not username or not jti:
                    # Invalid token claims, let endpoint handle it
                    return await call_next(request)
                
                # Get user
                user = db.query(models.User).filter(models.User.username == username).first()
                if not user:
                    # User not found, let endpoint handle it
                    return await call_next(request)
                
                if user.deleted_at is not None:
                    # User deleted, let endpoint handle it
                    return await call_next(request)
                
                # Validate session
                session = db.query(models.Session).filter(
                    models.Session.jti == jti,
                    models.Session.user_id == user.id
                ).first()
                
                if not session or session.revoked_at is not None:
                    # Invalid session, let endpoint handle it
                    return await call_next(request)
                
                # Check if password change is required
                if user.password_change_required:
                    return JSONResponse(
                        status_code=403,
                        content={
                            "detail": "Password change required", 
                            "code": "PASSWORD_CHANGE_REQUIRED"
                        }
                    )
                
            finally:
                db.close()
                
        except Exception:
            # If any error occurs, let the endpoint handle authentication
            pass
        
        return await call_next(request)