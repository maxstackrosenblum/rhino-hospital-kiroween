from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Doctor, User, UserRole
from schemas import DoctorProfileCreate, DoctorUpdate, DoctorResponse, PaginatedDoctorsResponse, DoctorProfileStatus
from core.dependencies import require_admin, require_doctor_or_admin, require_doctor_role
import auth as auth_utils

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


def create_doctor_response(user: User, doctor: Doctor = None) -> DoctorResponse:
    """Helper function to create consistent DoctorResponse objects"""
    profile_completed = doctor is not None and doctor.deleted_at is None
    
    return DoctorResponse(
        # Profile fields (null if profile incomplete)
        id=doctor.id if profile_completed else None,
        doctor_id=doctor.doctor_id if profile_completed else None,
        qualifications=doctor.qualifications if profile_completed else None,
        department=doctor.department if profile_completed else None,
        specialization=doctor.specialization if profile_completed else None,
        license_number=doctor.license_number if profile_completed else None,
        
        # User fields (always present)
        user_id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        city=user.city,
        age=user.age,
        address=user.address,
        gender=user.gender,
        role=user.role,
        
        # Status fields (computed)
        profile_completed=profile_completed,
        profile_completed_at=doctor.created_at if profile_completed else None,
        created_at=user.created_at,
        updated_at=user.updated_at,
        deleted_at=user.deleted_at
    )


@router.post("/profile", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def complete_doctor_profile(
    doctor_profile: DoctorProfileCreate,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user)
):
    """
    Complete doctor profile for current user or specified user.
    
    This creates the doctor-specific record linked to the existing user account.
    - Doctors can complete their own profile
    - Admin can complete profiles for any doctor user
    
    Requires: Doctor role (for own profile) or Admin role (for any user)
    """
    try:
        # Determine target user
        if user_id is not None:
            # Admin completing profile for another user
            if current_user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only admin can complete profiles for other users"
                )
            
            target_user = db.query(User).filter(
                and_(User.id == user_id, User.deleted_at.is_(None))
            ).first()
            
            if not target_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Target user not found"
                )
            
            if target_user.role != UserRole.DOCTOR:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Target user must have doctor role"
                )
        else:
            # User completing their own profile
            if current_user.role != UserRole.DOCTOR:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only users with doctor role can complete their own doctor profile"
                )
            target_user = current_user
        
        # Check if user already has a doctor profile
        existing_doctor = db.query(Doctor).filter(
            and_(
                Doctor.user_id == target_user.id,
                Doctor.deleted_at.is_(None)
            )
        ).first()
        
        if existing_doctor:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Doctor profile already exists for this user"
            )
        
        # Check if doctor_id already exists (excluding soft-deleted records)
        existing_doctor_id = db.query(Doctor).join(User, Doctor.user_id == User.id).filter(
            and_(
                Doctor.doctor_id == doctor_profile.doctor_id,
                Doctor.deleted_at.is_(None),
                User.deleted_at.is_(None)
            )
        ).first()
        
        if existing_doctor_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A doctor with this doctor ID already exists"
            )
        
        # Create doctor record
        db_doctor = Doctor(
            user_id=target_user.id,
            doctor_id=doctor_profile.doctor_id,
            qualifications=doctor_profile.qualifications,
            department=doctor_profile.department,
            specialization=doctor_profile.specialization,
            license_number=doctor_profile.license_number
        )
        db.add(db_doctor)
        db.commit()
        db.refresh(db_doctor)
        
        # Return combined response
        return create_doctor_response(target_user, db_doctor)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete doctor profile"
        )


@router.get("/profile/status", response_model=DoctorProfileStatus)
async def get_doctor_profile_status(
    user_id: Optional[int] = None,
    current_user: User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Get doctor profile completion status for current user or specified user"""
    try:
        # Determine target user
        if user_id is not None:
            # Admin checking status for another user
            if current_user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only admin can check profile status for other users"
                )
            
            target_user = db.query(User).filter(
                and_(User.id == user_id, User.deleted_at.is_(None))
            ).first()
            
            if not target_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Target user not found"
                )
            
            target_user_id = target_user.id
        else:
            # User checking their own status
            if current_user.role != UserRole.DOCTOR:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only users with doctor role can check their own doctor profile status"
                )
            target_user_id = current_user.id
        
        doctor = db.query(Doctor).filter(
            and_(
                Doctor.user_id == target_user_id,
                Doctor.deleted_at.is_(None)
            )
        ).first()
        
        return DoctorProfileStatus(
            user_id=target_user_id,
            has_doctor_profile=doctor is not None,
            profile_completed_at=doctor.created_at if doctor else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve doctor profile status"
        )


@router.get("/", response_model=PaginatedDoctorsResponse)
async def get_doctors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    search: Optional[str] = Query(None, description="Search by first name, last name, email, or doctor ID"),
    include_deleted: bool = Query(False, description="Include soft-deleted records (Admin only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Get list of all users with doctor role, regardless of profile completion status.
    
    Requires: Doctor or Admin role
    """
    try:
        # Query User table with LEFT JOIN to Doctor table to show all doctor users
        query = db.query(User).outerjoin(Doctor, User.id == Doctor.user_id).filter(
            User.role == UserRole.DOCTOR
        )
        
        # Filter out soft-deleted records unless specifically requested by admin
        if not include_deleted or current_user.role != UserRole.ADMIN:
            query = query.filter(User.deleted_at.is_(None))
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    Doctor.doctor_id.ilike(search_term)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated users with optional doctor data
        users_data = query.options(joinedload(User.doctor)).order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        
        # Convert to response format
        doctors = []
        for user in users_data:
            doctor = user.doctor
            profile_completed = doctor is not None and doctor.deleted_at is None
            
            doctors.append(DoctorResponse(
                # Profile fields (null if profile incomplete)
                id=doctor.id if profile_completed else None,
                doctor_id=doctor.doctor_id if profile_completed else None,
                qualifications=doctor.qualifications if profile_completed else None,
                department=doctor.department if profile_completed else None,
                specialization=doctor.specialization if profile_completed else None,
                license_number=doctor.license_number if profile_completed else None,
                
                # User fields (always present)
                user_id=user.id,
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                city=user.city,
                age=user.age,
                address=user.address,
                gender=user.gender,
                role=user.role,
                
                # Status fields
                profile_completed=profile_completed,
                profile_completed_at=doctor.created_at if profile_completed else None,
                created_at=user.created_at,
                updated_at=user.updated_at,
                deleted_at=user.deleted_at
            ))
        
        return {
            "doctors": doctors,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve doctor records"
        )


@router.get("/{user_id}", response_model=DoctorResponse)
async def get_doctor(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Get a specific doctor by user ID, regardless of profile completion status.
    
    Requires: Doctor or Admin role
    """
    try:
        # Query User table with LEFT JOIN to Doctor table
        user = db.query(User).outerjoin(Doctor, User.id == Doctor.user_id).options(joinedload(User.doctor)).filter(
            and_(
                User.id == user_id,
                User.role == UserRole.DOCTOR
            )
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor user not found"
            )
        
        # Check if user is soft-deleted (only admin can see deleted records)
        if user.deleted_at and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor user not found"
            )
        
        doctor = user.doctor
        profile_completed = doctor is not None and doctor.deleted_at is None
        
        return DoctorResponse(
            # Profile fields (null if profile incomplete)
            id=doctor.id if profile_completed else None,
            doctor_id=doctor.doctor_id if profile_completed else None,
            qualifications=doctor.qualifications if profile_completed else None,
            department=doctor.department if profile_completed else None,
            specialization=doctor.specialization if profile_completed else None,
            license_number=doctor.license_number if profile_completed else None,
            
            # User fields (always present)
            user_id=user.id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            city=user.city,
            age=user.age,
            address=user.address,
            gender=user.gender,
            role=user.role,
            
            # Status fields
            profile_completed=profile_completed,
            profile_completed_at=doctor.created_at if profile_completed else None,
            created_at=user.created_at,
            updated_at=user.updated_at,
            deleted_at=user.deleted_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve doctor record"
        )


@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(
    doctor_id: int,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update a doctor record (updates both user and doctor tables).
    
    Requires: Admin role only
    """
    try:
        # Get existing doctor with user data
        db_doctor = db.query(Doctor).join(User, Doctor.user_id == User.id).options(joinedload(Doctor.user)).filter(
            and_(Doctor.id == doctor_id, Doctor.deleted_at.is_(None), User.deleted_at.is_(None))
        ).first()
        
        if not db_doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Check for doctor_id conflicts if doctor_id is being updated
        if doctor_update.doctor_id and doctor_update.doctor_id != db_doctor.doctor_id:
            existing_doctor_id = db.query(Doctor).join(User, Doctor.user_id == User.id).filter(
                and_(
                    Doctor.doctor_id == doctor_update.doctor_id,
                    Doctor.id != doctor_id,
                    Doctor.deleted_at.is_(None),
                    User.deleted_at.is_(None)
                )
            ).first()
            
            if existing_doctor_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A doctor with this doctor ID already exists"
                )
        
        # Check for email conflicts if email is being updated
        if doctor_update.email and doctor_update.email != db_doctor.user.email:
            existing_user = db.query(User).filter(
                and_(
                    User.email == doctor_update.email,
                    User.id != db_doctor.user_id,
                    User.deleted_at.is_(None)
                )
            ).first()
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this email already exists"
                )
        
        # Update user fields
        user_fields = ['email', 'first_name', 'last_name', 'phone', 'city', 'age', 'address', 'gender']
        user_update_data = {k: v for k, v in doctor_update.dict(exclude_unset=True).items() if k in user_fields}
        
        if user_update_data:
            for field, value in user_update_data.items():
                setattr(db_doctor.user, field, value)
            db_doctor.user.updated_at = datetime.utcnow()
        
        # Update doctor-specific fields
        doctor_fields = ['doctor_id', 'qualifications', 'department', 'specialization', 'license_number']
        doctor_update_data = {k: v for k, v in doctor_update.dict(exclude_unset=True).items() if k in doctor_fields}
        
        if doctor_update_data:
            for field, value in doctor_update_data.items():
                setattr(db_doctor, field, value)
            db_doctor.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_doctor)
        
        return create_doctor_response(db_doctor.user, db_doctor)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update doctor record"
        )


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Soft delete a doctor record (deletes both user and doctor records).
    
    Requires: Admin role only
    """
    try:
        # Get existing doctor with user data
        db_doctor = db.query(Doctor).join(User, Doctor.user_id == User.id).options(joinedload(Doctor.user)).filter(
            and_(Doctor.id == doctor_id, Doctor.deleted_at.is_(None), User.deleted_at.is_(None))
        ).first()
        
        if not db_doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Perform soft delete on both records
        delete_time = datetime.utcnow()
        db_doctor.deleted_at = delete_time
        db_doctor.user.deleted_at = delete_time
        
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete doctor record"
        )