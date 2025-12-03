from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import sqlalchemy as sa
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models import Prescription, Patient, User, UserRole, Hospitalization
from schemas import PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse, PrescriptionBulkCreateResponse, PaginatedPrescriptionsResponse
import auth as auth_utils

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])


def require_prescription_write_access(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """
    Require admin or doctor role for prescription write access.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only admins and doctors can create/modify prescriptions."
        )
    return current_user


def require_prescription_read_access(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """
    Require admin, doctor, or medical_staff role for prescription read access.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MEDICAL_STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Requires admin, doctor, or medical staff role."
        )
    return current_user


@router.post("", response_model=PrescriptionBulkCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prescription_write_access)
):
    """
    Create prescriptions for a date range (one prescription per day).
    
    Requires: Admin or Doctor role
    """
    try:
        # Verify patient exists
        patient = db.query(Patient).filter(
            and_(
                Patient.id == prescription_data.patient_id,
                Patient.deleted_at.is_(None)
            )
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Parse dates
        start_date = datetime.fromisoformat(prescription_data.start_date.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(prescription_data.end_date.replace('Z', '+00:00'))
        
        # Validate date range
        if end_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after or equal to start date"
            )
        
        # Validate prescription dates against hospitalization periods
        hospitalizations = db.query(Hospitalization).filter(
            and_(
                Hospitalization.patient_id == prescription_data.patient_id,
                Hospitalization.deleted_at.is_(None)
            )
        ).all()
        
        if not hospitalizations:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient has no hospitalization records. Prescriptions can only be created during hospitalization."
            )
        
        # Check if prescription dates fall within any hospitalization period
        # Normalize dates to start/end of day for comparison (ignore time component)
        # Remove timezone info for comparison
        is_within_hospitalization = False
        for hosp in hospitalizations:
            admission = hosp.admission_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
            # If still admitted (no discharge date), use far future date
            discharge = hosp.discharge_date.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=None) if hosp.discharge_date else datetime(2099, 12, 31, 23, 59, 59)
            
            # Normalize prescription dates and remove timezone
            prescription_start = start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
            prescription_end = end_date.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=None)
            
            print(f"Checking hospitalization: admission={admission}, discharge={discharge}")
            print(f"Prescription: start={prescription_start}, end={prescription_end}")
            print(f"Start check: {prescription_start} >= {admission} = {prescription_start >= admission}")
            print(f"End check: {prescription_end} <= {discharge} = {prescription_end <= discharge}")
            
            if prescription_start >= admission and prescription_end <= discharge:
                is_within_hospitalization = True
                break
        
        if not is_within_hospitalization:
            active_hosp = next((h for h in hospitalizations if h.discharge_date is None), None)
            if active_hosp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Prescription dates must fall within hospitalization period. Patient admitted on {active_hosp.admission_date.strftime('%Y-%m-%d')} (currently active)."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Prescription dates must fall within a hospitalization period. Patient is not currently hospitalized."
                )
        
        # Convert medicines to dict format for JSON storage
        medicines_data = [medicine.dict() for medicine in prescription_data.medicines]
        
        # Create one prescription per day in the date range
        created_prescriptions = []
        current_date = start_date
        
        while current_date <= end_date:
            db_prescription = Prescription(
                patient_id=prescription_data.patient_id,
                date=current_date,
                medicines=medicines_data
            )
            db.add(db_prescription)
            created_prescriptions.append(db_prescription)
            current_date += timedelta(days=1)
        
        db.commit()
        
        # Refresh all created prescriptions
        for prescription in created_prescriptions:
            db.refresh(prescription)
        
        return {
            "created_count": len(created_prescriptions),
            "prescriptions": created_prescriptions
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
        print(f"Error creating prescriptions: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create prescriptions: {str(e)}"
        )


@router.get("", response_model=PaginatedPrescriptionsResponse)
async def get_prescriptions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search by patient name or medicine name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prescription_read_access)
):
    """
    Get paginated list of prescriptions with filtering options.
    
    Filters:
    - patient_id: Filter by specific patient
    - start_date: Filter prescriptions from this date onwards
    - end_date: Filter prescriptions up to this date
    - search: Search by patient name or medicine name
    
    Requires: Admin, Doctor, or Medical Staff role (read-only for medical staff)
    """
    try:
        # Join with Patient and User to get patient details
        query = db.query(
            Prescription,
            User.first_name,
            User.last_name,
            User.age
        ).join(
            Patient, Prescription.patient_id == Patient.id
        ).join(
            User, Patient.user_id == User.id
        ).filter(
            Prescription.deleted_at.is_(None)
        )
        
        # Apply filters
        if patient_id:
            query = query.filter(Prescription.patient_id == patient_id)
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Prescription.date >= start_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use YYYY-MM-DD"
                )
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Prescription.date <= end_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use YYYY-MM-DD"
                )
        
        if search:
            search_term = f"%{search.strip()}%"
            # Search in patient name or medicine names (JSON field)
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    Prescription.medicines.cast(sa.String).ilike(search_term)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated results
        results = query.order_by(Prescription.date.desc()).offset(offset).limit(page_size).all()
        
        # Build response with patient info
        prescriptions = []
        for prescription, first_name, last_name, age in results:
            prescription_dict = {
                "id": prescription.id,
                "patient_id": prescription.patient_id,
                "date": prescription.date,
                "medicines": prescription.medicines,
                "created_at": prescription.created_at,
                "updated_at": prescription.updated_at,
                "deleted_at": prescription.deleted_at,
                "patient_first_name": first_name,
                "patient_last_name": last_name,
                "patient_age": age,
            }
            prescriptions.append(prescription_dict)
        
        return {
            "prescriptions": prescriptions,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prescriptions"
        )


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prescription_read_access)
):
    """
    Get a specific prescription by ID.
    
    Requires: Admin, Doctor, or Medical Staff role (read-only for medical staff)
    """
    try:
        prescription = db.query(Prescription).filter(
            and_(
                Prescription.id == prescription_id,
                Prescription.deleted_at.is_(None)
            )
        ).first()
        
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        return prescription
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prescription"
        )


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: int,
    prescription_update: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prescription_write_access)
):
    """
    Update a prescription.
    
    Requires: Admin or Doctor role
    """
    try:
        prescription = db.query(Prescription).filter(
            and_(
                Prescription.id == prescription_id,
                Prescription.deleted_at.is_(None)
            )
        ).first()
        
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        # Update fields
        update_data = prescription_update.dict(exclude_unset=True)
        
        if update_data:
            for field, value in update_data.items():
                if field == 'date' and value:
                    value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                elif field == 'medicines' and value:
                    # Medicines are already dicts from Pydantic, or MedicineItem objects
                    if isinstance(value, list) and len(value) > 0:
                        if hasattr(value[0], 'dict'):
                            value = [medicine.dict() for medicine in value]
                        # else: already dicts, use as-is
                setattr(prescription, field, value)
            
            prescription.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(prescription)
        
        return prescription
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid data format: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"Error updating prescription: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update prescription: {str(e)}"
        )


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prescription_write_access)
):
    """
    Soft delete a prescription.
    
    Requires: Admin or Doctor role
    """
    try:
        prescription = db.query(Prescription).filter(
            and_(
                Prescription.id == prescription_id,
                Prescription.deleted_at.is_(None)
            )
        ).first()
        
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        # Soft delete
        prescription.deleted_at = datetime.utcnow()
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete prescription"
        )
