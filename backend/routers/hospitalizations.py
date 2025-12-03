from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import Optional
from datetime import datetime

from database import get_db
from models import Hospitalization, Patient, User, UserRole, Doctor
from schemas import HospitalizationCreate, HospitalizationUpdate, HospitalizationResponse, DoctorInfo
import auth as auth_utils

router = APIRouter(prefix="/api/hospitalizations", tags=["hospitalizations"])


def require_hospitalization_access(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """
    Require admin, doctor, medical_staff, or receptionist role for hospitalization access.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Requires admin, doctor, medical staff, or receptionist role."
        )
    return current_user


@router.post("", response_model=HospitalizationResponse, status_code=status.HTTP_201_CREATED)
async def create_hospitalization(
    hospitalization_data: HospitalizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospitalization_access)
):
    """
    Create a new hospitalization record.
    
    Requires: Admin, Doctor, Medical Staff, or Receptionist role
    """
    try:
        # Verify patient exists
        patient = db.query(Patient).filter(
            and_(
                Patient.id == hospitalization_data.patient_id,
                Patient.deleted_at.is_(None)
            )
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Parse dates
        admission_date = datetime.fromisoformat(hospitalization_data.admission_date.replace('Z', '+00:00'))
        discharge_date = None
        if hospitalization_data.discharge_date:
            discharge_date = datetime.fromisoformat(hospitalization_data.discharge_date.replace('Z', '+00:00'))
        
        # Create hospitalization
        db_hospitalization = Hospitalization(
            patient_id=hospitalization_data.patient_id,
            admission_date=admission_date,
            discharge_date=discharge_date,
            diagnosis=hospitalization_data.diagnosis,
            summary=hospitalization_data.summary
        )
        
        db.add(db_hospitalization)
        db.flush()  # Get the ID without committing
        
        # Assign doctors if provided
        if hospitalization_data.doctor_ids:
            doctors = db.query(Doctor).filter(
                and_(
                    Doctor.id.in_(hospitalization_data.doctor_ids),
                    Doctor.deleted_at.is_(None)
                )
            ).all()
            db_hospitalization.doctors = doctors
        
        db.commit()
        db.refresh(db_hospitalization)
        
        # Build response with patient and doctor info
        patient_user = db.query(User).filter(User.id == patient.user_id).first()
        doctor_infos = []
        for doctor in db_hospitalization.doctors:
            doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
            doctor_infos.append({
                "id": doctor.id,
                "doctor_id": doctor.doctor_id,
                "first_name": doctor_user.first_name,
                "last_name": doctor_user.last_name,
                "specialization": doctor.specialization,
            })
        
        return {
            "id": db_hospitalization.id,
            "patient_id": db_hospitalization.patient_id,
            "admission_date": db_hospitalization.admission_date,
            "discharge_date": db_hospitalization.discharge_date,
            "diagnosis": db_hospitalization.diagnosis,
            "summary": db_hospitalization.summary,
            "created_at": db_hospitalization.created_at,
            "updated_at": db_hospitalization.updated_at,
            "deleted_at": db_hospitalization.deleted_at,
            "patient_first_name": patient_user.first_name if patient_user else None,
            "patient_last_name": patient_user.last_name if patient_user else None,
            "patient_age": patient_user.age if patient_user else None,
            "doctors": doctor_infos,
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create hospitalization record"
        )


@router.get("", response_model=list[HospitalizationResponse])
async def get_hospitalizations(
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospitalization_access)
):
    """
    Get list of hospitalizations with optional patient filter.
    
    Requires: Admin, Doctor, Medical Staff, or Receptionist role
    """
    try:
        # Join with Patient and User to get patient details
        query = db.query(
            Hospitalization,
            User.first_name,
            User.last_name,
            User.age
        ).join(
            Patient, Hospitalization.patient_id == Patient.id
        ).join(
            User, Patient.user_id == User.id
        ).filter(
            Hospitalization.deleted_at.is_(None)
        )
        
        if patient_id:
            query = query.filter(Hospitalization.patient_id == patient_id)
        
        results = query.order_by(Hospitalization.admission_date.desc()).all()
        
        # Build response with patient and doctor info
        hospitalizations = []
        for hospitalization, first_name, last_name, age in results:
            # Get doctors for this hospitalization
            doctor_infos = []
            for doctor in hospitalization.doctors:
                doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
                if doctor_user:
                    doctor_infos.append({
                        "id": doctor.id,
                        "doctor_id": doctor.doctor_id,
                        "first_name": doctor_user.first_name,
                        "last_name": doctor_user.last_name,
                        "specialization": doctor.specialization,
                    })
            
            hosp_dict = {
                "id": hospitalization.id,
                "patient_id": hospitalization.patient_id,
                "admission_date": hospitalization.admission_date,
                "discharge_date": hospitalization.discharge_date,
                "diagnosis": hospitalization.diagnosis,
                "summary": hospitalization.summary,
                "created_at": hospitalization.created_at,
                "updated_at": hospitalization.updated_at,
                "deleted_at": hospitalization.deleted_at,
                "patient_first_name": first_name,
                "patient_last_name": last_name,
                "patient_age": age,
                "doctors": doctor_infos,
            }
            hospitalizations.append(hosp_dict)
        
        return hospitalizations
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve hospitalization records"
        )


@router.get("/{hospitalization_id}", response_model=HospitalizationResponse)
async def get_hospitalization(
    hospitalization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospitalization_access)
):
    """
    Get a specific hospitalization by ID.
    
    Requires: Admin, Doctor, Medical Staff, or Receptionist role
    """
    try:
        hospitalization = db.query(Hospitalization).filter(
            and_(
                Hospitalization.id == hospitalization_id,
                Hospitalization.deleted_at.is_(None)
            )
        ).first()
        
        if not hospitalization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hospitalization record not found"
            )
        
        return hospitalization
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve hospitalization record"
        )


@router.put("/{hospitalization_id}", response_model=HospitalizationResponse)
async def update_hospitalization(
    hospitalization_id: int,
    hospitalization_update: HospitalizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospitalization_access)
):
    """
    Update a hospitalization record.
    
    Requires: Admin, Doctor, Medical Staff, or Receptionist role
    """
    try:
        hospitalization = db.query(Hospitalization).filter(
            and_(
                Hospitalization.id == hospitalization_id,
                Hospitalization.deleted_at.is_(None)
            )
        ).first()
        
        if not hospitalization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hospitalization record not found"
            )
        
        # Update fields
        update_data = hospitalization_update.dict(exclude_unset=True)
        
        if update_data:
            for field, value in update_data.items():
                if field == 'doctor_ids':
                    # Update doctor assignments
                    if value is not None:
                        doctors = db.query(Doctor).filter(
                            and_(
                                Doctor.id.in_(value),
                                Doctor.deleted_at.is_(None)
                            )
                        ).all()
                        hospitalization.doctors = doctors
                elif field in ['admission_date', 'discharge_date'] and value:
                    value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    setattr(hospitalization, field, value)
                else:
                    setattr(hospitalization, field, value)
            
            hospitalization.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(hospitalization)
        
        # Build response with patient and doctor info
        patient = db.query(Patient).filter(Patient.id == hospitalization.patient_id).first()
        patient_user = db.query(User).filter(User.id == patient.user_id).first() if patient else None
        
        doctor_infos = []
        for doctor in hospitalization.doctors:
            doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
            if doctor_user:
                doctor_infos.append({
                    "id": doctor.id,
                    "doctor_id": doctor.doctor_id,
                    "first_name": doctor_user.first_name,
                    "last_name": doctor_user.last_name,
                    "specialization": doctor.specialization,
                })
        
        return {
            "id": hospitalization.id,
            "patient_id": hospitalization.patient_id,
            "admission_date": hospitalization.admission_date,
            "discharge_date": hospitalization.discharge_date,
            "diagnosis": hospitalization.diagnosis,
            "summary": hospitalization.summary,
            "created_at": hospitalization.created_at,
            "updated_at": hospitalization.updated_at,
            "deleted_at": hospitalization.deleted_at,
            "patient_first_name": patient_user.first_name if patient_user else None,
            "patient_last_name": patient_user.last_name if patient_user else None,
            "patient_age": patient_user.age if patient_user else None,
            "doctors": doctor_infos,
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update hospitalization record"
        )


@router.delete("/{hospitalization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospitalization(
    hospitalization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospitalization_access)
):
    """
    Soft delete a hospitalization record.
    
    Requires: Admin, Doctor, Medical Staff, or Receptionist role
    """
    try:
        hospitalization = db.query(Hospitalization).filter(
            and_(
                Hospitalization.id == hospitalization_id,
                Hospitalization.deleted_at.is_(None)
            )
        ).first()
        
        if not hospitalization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hospitalization record not found"
            )
        
        # Soft delete
        hospitalization.deleted_at = datetime.utcnow()
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete hospitalization record"
        )
