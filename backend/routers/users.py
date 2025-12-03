from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
import auth as auth_utils
import models
import schemas
from database import get_db
from core.dependencies import require_admin

router = APIRouter(prefix="/api", tags=["users"])

@router.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Create a new basic user account (admin only).
    
    This creates only the user record. Users with patient/doctor roles
    will need to complete their profiles separately.
    
    Requires: Admin role only
    """
    try:
        # Check if email or username already exists (excluding soft-deleted records)
        existing_user = db.query(models.User).filter(
            and_(
                or_(models.User.email == user.email, models.User.username == user.username),
                models.User.deleted_at.is_(None)
            )
        ).first()
        
        if existing_user:
            if existing_user.email == user.email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this email already exists"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this username already exists"
                )
        
        # Create user record
        hashed_password = auth_utils.get_password_hash(user.password)
        db_user = models.User(
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            city=user.city,
            age=user.age,
            address=user.address,
            gender=user.gender.value if user.gender and hasattr(user.gender, 'value') else user.gender,
            hashed_password=hashed_password,
            role=user.role.value if hasattr(user.role, 'value') else user.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )


@router.get("/users", response_model=schemas.PaginatedUsersResponse)
async def get_all_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    search: Optional[str] = Query(None, description="Search by username, email, first name, or last name"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users with pagination and search (admin only)"""
    try:
        query = db.query(models.User)
        
        if not include_deleted:
            query = query.filter(models.User.deleted_at.is_(None))
        
        # Apply search filter
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    models.User.username.ilike(search_term),
                    models.User.email.ilike(search_term),
                    models.User.first_name.ilike(search_term),
                    models.User.last_name.ilike(search_term)
                )
            )
        
        # Apply role filter
        if role:
            query = query.filter(models.User.role == role)
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated users
        users = query.order_by(models.User.created_at.desc()).offset(offset).limit(page_size).all()
        
        return {
            "users": users,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )


@router.get("/users/{user_id}", response_model=schemas.UserResponse)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Get a specific user by ID (admin only)"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user"
        )

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user_by_admin(
    user_id: int,
    user_update: schemas.AdminUserUpdate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update any user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != user.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if role is being changed and if user has a profile
    if user_update.role and user_update.role.value != user.role:
        # Check if user has a patient profile
        if user.role == models.UserRole.PATIENT:
            patient = db.query(models.Patient).filter(
                and_(
                    models.Patient.user_id == user.id,
                    models.Patient.deleted_at.is_(None)
                )
            ).first()
            if patient:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot change role: User has an active patient profile. Delete the profile first."
                )
        
        # Check if user has a doctor profile
        if user.role == models.UserRole.DOCTOR:
            doctor = db.query(models.Doctor).filter(
                and_(
                    models.Doctor.user_id == user.id,
                    models.Doctor.deleted_at.is_(None)
                )
            ).first()
            if doctor:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot change role: User has an active doctor profile. Delete the profile first."
                )
        
        # Check if user has a medical staff profile
        if user.role in [models.UserRole.MEDICAL_STAFF, models.UserRole.RECEPTIONIST]:
            medical_staff = db.query(models.MedicalStaff).filter(
                and_(
                    models.MedicalStaff.user_id == user.id,
                    models.MedicalStaff.deleted_at.is_(None)
                )
            ).first()
            if medical_staff:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot change role: User has an active medical staff profile. Delete the profile first."
                )
    
    # Update fields if provided
    if user_update.email:
        user.email = user_update.email
    if user_update.first_name:
        user.first_name = user_update.first_name
    if user_update.last_name:
        user.last_name = user_update.last_name
    if user_update.phone:
        user.phone = user_update.phone
    if user_update.city:
        user.city = user_update.city
    if user_update.age is not None:
        user.age = user_update.age
    if user_update.address:
        user.address = user_update.address
    if user_update.gender:
        user.gender = user_update.gender.value
    if user_update.role:
        user.role = user_update.role.value
    
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_current_user(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    # Only admins can change roles
    if user_update.role is not None:
        if current_user.role != models.UserRole.ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Only admins can change user roles"
            )
    
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="Email already registered"
            )
    
    # Update fields if provided
    if user_update.email:
        current_user.email = user_update.email
    if user_update.first_name:
        current_user.first_name = user_update.first_name
    if user_update.last_name:
        current_user.last_name = user_update.last_name
    if user_update.password:
        current_user.hashed_password = auth_utils.get_password_hash(user_update.password)
        # Revoke all sessions on password change for security
        db.query(models.Session).filter(
            models.Session.user_id == current_user.id,
            models.Session.revoked_at.is_(None)
        ).update({"revoked_at": datetime.utcnow()})
    if user_update.role and current_user.role == models.UserRole.ADMIN:
        current_user.role = user_update.role
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me")
async def delete_current_user(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete current user account"""
    if current_user.deleted_at:
        raise HTTPException(status_code=400, detail="User already deleted")
    
    current_user.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "User account deleted successfully"}

@router.delete("/users/{user_id}")
async def delete_user_by_admin(
    user_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Soft delete any user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.deleted_at:
        raise HTTPException(status_code=400, detail="User already deleted")
    
    user.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": f"User {user.username} deleted successfully"}

@router.post("/users/{user_id}/restore")
async def restore_user(
    user_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Restore a soft-deleted user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.deleted_at:
        raise HTTPException(status_code=400, detail="User is not deleted")
    
    user.deleted_at = None
    db.commit()
    return {"message": f"User {user.username} restored successfully"}


@router.get("/profile/status", response_model=schemas.ProfileCompletionStatus)
async def get_profile_completion_status(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile completion status"""
    try:
        has_role_specific_profile = False
        profile_completed_at = None
        requires_profile_completion = current_user.role in [models.UserRole.PATIENT, models.UserRole.DOCTOR]
        
        if current_user.role == models.UserRole.PATIENT:
            patient = db.query(models.Patient).filter(
                and_(
                    models.Patient.user_id == current_user.id,
                    models.Patient.deleted_at.is_(None)
                )
            ).first()
            if patient:
                has_role_specific_profile = True
                profile_completed_at = patient.created_at
                
        elif current_user.role == models.UserRole.DOCTOR:
            doctor = db.query(models.Doctor).filter(
                and_(
                    models.Doctor.user_id == current_user.id,
                    models.Doctor.deleted_at.is_(None)
                )
            ).first()
            if doctor:
                has_role_specific_profile = True
                profile_completed_at = doctor.created_at
        
        return schemas.ProfileCompletionStatus(
            user_id=current_user.id,
            role=current_user.role,
            has_role_specific_profile=has_role_specific_profile,
            profile_completed_at=profile_completed_at,
            requires_profile_completion=requires_profile_completion
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile status"
        )
