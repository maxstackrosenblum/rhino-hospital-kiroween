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

def require_receptionist_or_admin(current_user: User = Depends(auth.get_current_user)) -> User:
    """Require receptionist or admin role"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionist or Admin access required"
        )
    return current_user

def require_patient_access(current_user: User = Depends(auth.get_current_user)) -> User:
    """Require doctor, receptionist, or admin role for patient access"""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor, Receptionist, or Admin access required"
        )
    return current_user

def require_patient_role(current_user: User = Depends(auth.get_current_user)) -> User:
    """Require patient role"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access required"
        )
    return current_user


def require_doctor_role(current_user: User = Depends(auth.get_current_user)) -> User:
    """Require doctor role"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor access required"
        )
    return current_user


def require_profile_completion(current_user: User = Depends(auth.get_current_user)) -> User:
    """
    Require profile completion for patient and doctor roles.
    
    This dependency should be used on endpoints that require users to have
    completed their role-specific profiles.
    """
    from database import get_db
    from sqlalchemy.orm import Session
    from models import Patient, Doctor
    from sqlalchemy import and_
    
    # Only patient and doctor roles require profile completion
    if current_user.role not in [UserRole.PATIENT, UserRole.DOCTOR]:
        return current_user
    
    # Get database session (this is a bit of a hack, but necessary for this dependency)
    db = next(get_db())
    
    try:
        if current_user.role == UserRole.PATIENT:
            patient = db.query(Patient).filter(
                and_(
                    Patient.user_id == current_user.id,
                    Patient.deleted_at.is_(None)
                )
            ).first()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Patient profile completion required. Please complete your profile before accessing this resource."
                )
                
        elif current_user.role == UserRole.DOCTOR:
            doctor = db.query(Doctor).filter(
                and_(
                    Doctor.user_id == current_user.id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Doctor profile completion required. Please complete your profile before accessing this resource."
                )
        
        return current_user
        
    finally:
        db.close()
