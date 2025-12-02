from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Patient, User
from schemas import PatientCreate, PatientUpdate, PatientResponse, PaginatedPatientsResponse
from core.dependencies import require_patient_access, require_receptionist_or_admin, require_admin

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist_or_admin)
):
    """
    Create a new patient record.
    
    Requires: Receptionist or Admin role
    """
    try:
        # Check if email already exists (excluding soft-deleted records)
        existing_patient = db.query(Patient).filter(
            and_(Patient.email == patient.email, Patient.deleted_at.is_(None))
        ).first()
        
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A patient with this email already exists"
            )
        
        # Create new patient
        db_patient = Patient(**patient.dict())
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        
        return db_patient
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create patient record"
        )


@router.get("/", response_model=PaginatedPatientsResponse)
async def get_patients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    search: Optional[str] = Query(None, description="Search by first name, last name, email, or phone"),
    include_deleted: bool = Query(False, description="Include soft-deleted records (Admin only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient_access)
):
    """
    Get list of patients with optional search and pagination.
    
    Requires: Doctor, Receptionist, or Admin role
    """
    try:
        query = db.query(Patient)
        
        # Filter out soft-deleted records unless specifically requested by admin
        if not include_deleted or current_user.role != "admin":
            query = query.filter(Patient.deleted_at.is_(None))
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Patient.first_name.ilike(search_term),
                    Patient.last_name.ilike(search_term),
                    Patient.email.ilike(search_term),
                    Patient.phone.ilike(search_term)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated patients
        patients = query.order_by(Patient.created_at.desc()).offset(offset).limit(page_size).all()
        
        return {
            "patients": patients,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient records"
        )


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient_access)
):
    """
    Get a specific patient by ID.
    
    Requires: Doctor, Receptionist, or Admin role
    """
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Check if patient is soft-deleted (only admin can see deleted records)
        if patient.deleted_at and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        return patient
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient record"
        )


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist_or_admin)
):
    """
    Update a patient record.
    
    Requires: Receptionist or Admin role
    """
    try:
        # Get existing patient
        db_patient = db.query(Patient).filter(
            and_(Patient.id == patient_id, Patient.deleted_at.is_(None))
        ).first()
        
        if not db_patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Check for email conflicts if email is being updated
        if patient_update.email and patient_update.email != db_patient.email:
            existing_patient = db.query(Patient).filter(
                and_(
                    Patient.email == patient_update.email,
                    Patient.id != patient_id,
                    Patient.deleted_at.is_(None)
                )
            ).first()
            
            if existing_patient:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A patient with this email already exists"
                )
        
        # Update fields that are provided
        update_data = patient_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_patient, field, value)
        
        # Update the updated_at timestamp
        db_patient.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_patient)
        
        return db_patient
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update patient record"
        )


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Soft delete a patient record.
    
    Requires: Admin role only
    """
    try:
        # Get existing patient
        db_patient = db.query(Patient).filter(
            and_(Patient.id == patient_id, Patient.deleted_at.is_(None))
        ).first()
        
        if not db_patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Perform soft delete
        db_patient.deleted_at = datetime.utcnow()
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete patient record"
        )