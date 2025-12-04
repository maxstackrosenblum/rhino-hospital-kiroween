from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import Optional
from datetime import datetime

from database import get_db
from models import MedicalStaff, User, UserRole
from schemas import MedicalStaffCreate, MedicalStaffUpdate, MedicalStaffResponse
from core.dependencies import require_admin
import auth as auth_utils

router = APIRouter(prefix="/api/medical-staff", tags=["medical-staff"])


def create_medical_staff_response(user: User, medical_staff: MedicalStaff) -> MedicalStaffResponse:
    """Helper function to create consistent MedicalStaffResponse objects"""
    return MedicalStaffResponse(
        id=medical_staff.id,
        user_id=user.id,
        job_title=medical_staff.job_title,
        department=medical_staff.department,
        shift_schedule=medical_staff.shift_schedule,
        created_at=medical_staff.created_at,
        updated_at=medical_staff.updated_at,
        deleted_at=medical_staff.deleted_at,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone
    )


@router.post("", response_model=MedicalStaffResponse, status_code=status.HTTP_201_CREATED)
async def create_medical_staff(
    medical_staff_data: MedicalStaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new medical staff record for an existing user.
    
    Requires: Admin role
    """
    try:
        # Check if user exists and has medical_staff role
        target_user = db.query(User).filter(
            and_(User.id == medical_staff_data.user_id, User.deleted_at.is_(None))
        ).first()
        
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if target_user.role not in [UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must have medical_staff or receptionist role"
            )
        
        # Check if user already has a medical staff record (including soft-deleted)
        existing_staff = db.query(MedicalStaff).filter(
            MedicalStaff.user_id == medical_staff_data.user_id
        ).first()
        
        if existing_staff:
            if existing_staff.deleted_at is None:
                # Active record exists
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Medical staff record already exists for this user"
                )
            else:
                # Soft-deleted record exists - restore it with new data
                existing_staff.job_title = medical_staff_data.job_title
                existing_staff.department = medical_staff_data.department
                existing_staff.shift_schedule = medical_staff_data.shift_schedule
                existing_staff.deleted_at = None
                existing_staff.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing_staff)
                db_medical_staff = existing_staff
        else:
            # Create new medical staff record
            db_medical_staff = MedicalStaff(
                user_id=medical_staff_data.user_id,
                job_title=medical_staff_data.job_title,
                department=medical_staff_data.department,
                shift_schedule=medical_staff_data.shift_schedule
            )
            db.add(db_medical_staff)
            db.commit()
            db.refresh(db_medical_staff)
        
        return create_medical_staff_response(target_user, db_medical_staff)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create medical staff record"
        )


@router.get("")
async def get_medical_staff_list(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by first name, last name, or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get paginated list of all users with medical_staff or receptionist role, regardless of profile completion status.
    
    Requires: Admin role
    """
    try:
        # Query User table with LEFT JOIN to MedicalStaff table to show all medical_staff and receptionist users
        query = db.query(User).outerjoin(MedicalStaff, User.id == MedicalStaff.user_id).filter(
            or_(
                User.role == UserRole.MEDICAL_STAFF,
                User.role == UserRole.RECEPTIONIST
            )
        )
        
        # Filter out soft-deleted users
        query = query.filter(User.deleted_at.is_(None))
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        users_data = query.options(joinedload(User.medical_staff)).order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        
        # Convert to response format
        items = []
        for user in users_data:
            medical_staff = user.medical_staff
            has_profile = medical_staff is not None and medical_staff.deleted_at is None
            
            items.append({
                "id": medical_staff.id if has_profile else None,
                "user_id": user.id,
                "job_title": medical_staff.job_title if has_profile else None,
                "department": medical_staff.department if has_profile else None,
                "shift_schedule": medical_staff.shift_schedule if has_profile else None,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "created_at": medical_staff.created_at if has_profile else user.created_at,
                "updated_at": medical_staff.updated_at if has_profile else user.updated_at,
                "deleted_at": medical_staff.deleted_at if has_profile else None,
            })
        
        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size
        
        return {
            "items": items,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medical staff records"
        )


@router.get("/{medical_staff_id}", response_model=MedicalStaffResponse)
async def get_medical_staff(
    medical_staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get a specific medical staff member by ID.
    
    Requires: Admin role
    """
    try:
        db_medical_staff = db.query(MedicalStaff).join(User, MedicalStaff.user_id == User.id).options(joinedload(MedicalStaff.user)).filter(
            and_(
                MedicalStaff.id == medical_staff_id,
                MedicalStaff.deleted_at.is_(None),
                User.deleted_at.is_(None)
            )
        ).first()
        
        if not db_medical_staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff not found"
            )
        
        return create_medical_staff_response(db_medical_staff.user, db_medical_staff)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medical staff record"
        )


@router.put("/{medical_staff_id}", response_model=MedicalStaffResponse)
async def update_medical_staff(
    medical_staff_id: int,
    medical_staff_update: MedicalStaffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update a medical staff record.
    
    Requires: Admin role
    """
    try:
        db_medical_staff = db.query(MedicalStaff).join(User, MedicalStaff.user_id == User.id).options(joinedload(MedicalStaff.user)).filter(
            and_(
                MedicalStaff.id == medical_staff_id,
                MedicalStaff.deleted_at.is_(None),
                User.deleted_at.is_(None)
            )
        ).first()
        
        if not db_medical_staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff not found"
            )
        
        # Update medical staff fields
        update_data = medical_staff_update.dict(exclude_unset=True)
        
        if update_data:
            for field, value in update_data.items():
                setattr(db_medical_staff, field, value)
            db_medical_staff.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_medical_staff)
        
        return create_medical_staff_response(db_medical_staff.user, db_medical_staff)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update medical staff record"
        )


@router.delete("/{medical_staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medical_staff(
    medical_staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Soft delete a medical staff record.
    
    Requires: Admin role
    """
    try:
        db_medical_staff = db.query(MedicalStaff).join(User, MedicalStaff.user_id == User.id).options(joinedload(MedicalStaff.user)).filter(
            and_(
                MedicalStaff.id == medical_staff_id,
                MedicalStaff.deleted_at.is_(None),
                User.deleted_at.is_(None)
            )
        ).first()
        
        if not db_medical_staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical staff not found"
            )
        
        # Perform soft delete
        delete_time = datetime.utcnow()
        db_medical_staff.deleted_at = delete_time
        
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete medical staff record"
        )
