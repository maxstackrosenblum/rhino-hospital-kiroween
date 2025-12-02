from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Doctor, User
from schemas import DoctorCreate, DoctorUpdate, DoctorResponse
from core.dependencies import require_admin

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    doctor: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new doctor record.
    
    Requires: Admin role only
    """
    try:
        # Check if doctor_id already exists (excluding soft-deleted records)
        existing_doctor_id = db.query(Doctor).filter(
            and_(Doctor.doctor_id == doctor.doctor_id, Doctor.deleted_at.is_(None))
        ).first()
        
        if existing_doctor_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A doctor with this doctor ID already exists"
            )
        
        # Check if email already exists (excluding soft-deleted records)
        existing_email = db.query(Doctor).filter(
            and_(Doctor.email == doctor.email, Doctor.deleted_at.is_(None))
        ).first()
        
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A doctor with this email already exists"
            )
        
        # Create new doctor
        db_doctor = Doctor(**doctor.dict())
        db.add(db_doctor)
        db.commit()
        db.refresh(db_doctor)
        
        return db_doctor
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create doctor record"
        )


@router.get("/", response_model=List[DoctorResponse])
async def get_doctors(
    search: Optional[str] = Query(None, description="Search by first name, last name, email, or doctor ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    include_deleted: bool = Query(False, description="Include soft-deleted records"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get list of doctors with optional search and pagination.
    
    Requires: Admin role only
    """
    try:
        query = db.query(Doctor)
        
        # Filter out soft-deleted records unless specifically requested
        if not include_deleted:
            query = query.filter(Doctor.deleted_at.is_(None))
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Doctor.first_name.ilike(search_term),
                    Doctor.last_name.ilike(search_term),
                    Doctor.email.ilike(search_term),
                    Doctor.doctor_id.ilike(search_term)
                )
            )
        
        # Apply pagination
        doctors = query.offset(skip).limit(limit).all()
        
        return doctors
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve doctor records"
        )


@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get a specific doctor by ID.
    
    Requires: Admin role only
    """
    try:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Check if doctor is soft-deleted
        if doctor.deleted_at:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        return doctor
        
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
    Update a doctor record.
    
    Requires: Admin role only
    """
    try:
        # Get existing doctor
        db_doctor = db.query(Doctor).filter(
            and_(Doctor.id == doctor_id, Doctor.deleted_at.is_(None))
        ).first()
        
        if not db_doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Check for doctor_id conflicts if doctor_id is being updated
        if doctor_update.doctor_id and doctor_update.doctor_id != db_doctor.doctor_id:
            existing_doctor_id = db.query(Doctor).filter(
                and_(
                    Doctor.doctor_id == doctor_update.doctor_id,
                    Doctor.id != doctor_id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            
            if existing_doctor_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A doctor with this doctor ID already exists"
                )
        
        # Check for email conflicts if email is being updated
        if doctor_update.email and doctor_update.email != db_doctor.email:
            existing_email = db.query(Doctor).filter(
                and_(
                    Doctor.email == doctor_update.email,
                    Doctor.id != doctor_id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A doctor with this email already exists"
                )
        
        # Update fields that are provided
        update_data = doctor_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_doctor, field, value)
        
        # Update the updated_at timestamp
        db_doctor.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_doctor)
        
        return db_doctor
        
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
    Soft delete a doctor record.
    
    Requires: Admin role only
    """
    try:
        # Get existing doctor
        db_doctor = db.query(Doctor).filter(
            and_(Doctor.id == doctor_id, Doctor.deleted_at.is_(None))
        ).first()
        
        if not db_doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Perform soft delete
        db_doctor.deleted_at = datetime.utcnow()
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