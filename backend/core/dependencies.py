from fastapi import Depends, HTTPException, status
from models import User, UserRole
import auth

def require_admin(current_user: User = Depends(auth.get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_doctor_or_admin(current_user: User = Depends(auth.get_current_user)) -> User:
    """Require doctor or admin role"""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor or Admin access required"
        )
    return current_user
