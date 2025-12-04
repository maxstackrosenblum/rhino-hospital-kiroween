from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Patient, User, UserRole
from schemas import PatientProfileCreate, PatientUpdate, PatientResponse, PaginatedPatientsResponse, PatientProfileStatus, UserResponse, PaginatedUsersResponse
from core.dependencies import require_patient_access, require_receptionist_or_admin, require_admin, require_patient_role
import auth as auth_utils

router = APIRouter(prefix="/api/patients", tags=["patients"])


def create_patient_response(user: User, patient: Patient = None) -> PatientResponse:
    """Helper function to create consistent PatientResponse objects"""
    profile_completed = patient is not None and patient.deleted_at is None
    
    return PatientResponse(
        # Profile fields (null if profile incomplete)
        id=patient.id if profile_completed else None,
        medical_record_number=patient.medical_record_number if profile_completed else None,
        emergency_contact=patient.emergency_contact if profile_completed else None,
        insurance_info=patient.insurance_info if profile_completed else None,
        
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
        profile_completed_at=patient.created_at if profile_completed else None,
        created_at=user.created_at,
        updated_at=user.updated_at,
        deleted_at=user.deleted_at
    )


@router.post("/profile", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def complete_patient_profile(
    patient_profile: PatientProfileCreate,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user)
):
    """
    Complete patient profile for current user or specified user.
    
    This creates the patient-specific record linked to the existing user account.
    - Patients can complete their own profile
    - Admin and receptionist can complete profiles for any patient user
    
    Requires: Patient role (for own profile) or Admin/Receptionist role (for any user)
    """
    try:
        # Determine target user
        if user_id is not None:
            # Admin/Receptionist completing profile for another user
            if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only admin or receptionist can complete profiles for other users"
                )
            
            target_user = db.query(User).filter(
                and_(User.id == user_id, User.deleted_at.is_(None))
            ).first()
            
            if not target_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Target user not found"
                )
            
            if target_user.role != UserRole.PATIENT:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Target user must have patient role"
                )
        else:
            # User completing their own profile
            if current_user.role != UserRole.PATIENT:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only users with patient role can complete their own patient profile"
                )
            target_user = current_user
        
        # Check if user already has a patient profile
        existing_patient = db.query(Patient).filter(
            and_(
                Patient.user_id == target_user.id,
                Patient.deleted_at.is_(None)
            )
        ).first()
        
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Patient profile already exists for this user"
            )
        
        # Create patient record
        db_patient = Patient(
            user_id=target_user.id,
            medical_record_number=patient_profile.medical_record_number,
            emergency_contact=patient_profile.emergency_contact,
            insurance_info=patient_profile.insurance_info
        )
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        
        # Return combined response
        return create_patient_response(target_user, db_patient)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete patient profile"
        )


@router.get("/profile/status", response_model=PatientProfileStatus)
async def get_patient_profile_status(
    user_id: Optional[int] = None,
    current_user: User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient profile completion status for current user or specified user"""
    try:
        # Determine target user
        if user_id is not None:
            # Admin/Receptionist checking status for another user
            if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only admin or receptionist can check profile status for other users"
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
            if current_user.role != UserRole.PATIENT:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only users with patient role can check their own patient profile status"
                )
            target_user_id = current_user.id
        
        patient = db.query(Patient).filter(
            and_(
                Patient.user_id == target_user_id,
                Patient.deleted_at.is_(None)
            )
        ).first()
        
        return PatientProfileStatus(
            user_id=target_user_id,
            has_patient_profile=patient is not None,
            profile_completed_at=patient.created_at if patient else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient profile status"
        )


@router.get("", response_model=PaginatedPatientsResponse)
async def get_patients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    search: Optional[str] = Query(None, description="Search by first name, last name, email, or phone"),
    include_deleted: bool = Query(False, description="Include soft-deleted records (Admin only)"),
    hospitalization_status: Optional[str] = Query(None, description="Filter by hospitalization status: 'hospitalized', 'my-patients'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient_access)
):
    """
    Get list of all users with patient role, regardless of profile completion status.
    
    Requires: Doctor, Receptionist, or Admin role
    
    Filters:
    - hospitalization_status='hospitalized': Only currently hospitalized patients
    - hospitalization_status='my-patients': Only current doctor's hospitalized patients
    """
    try:
        from models import Hospitalization, Doctor
        from sqlalchemy import func
        
        # Build base query differently based on hospitalization filter
        if hospitalization_status in ["hospitalized", "my-patients"]:
            # For hospitalization filters, use inner join (only patients with profiles)
            query = db.query(User).join(
                Patient,
                and_(
                    User.id == Patient.user_id,
                    Patient.deleted_at.is_(None)
                )
            ).filter(User.role == UserRole.PATIENT)
            
            current_date = datetime.utcnow().date()
            
            if hospitalization_status == "hospitalized":
                # Join with Hospitalization to filter only currently hospitalized patients
                # Compare dates only (not time) to handle timezone issues
                query = query.join(
                    Hospitalization,
                    and_(
                        Patient.id == Hospitalization.patient_id,
                        func.date(Hospitalization.admission_date) <= current_date,
                        or_(
                            Hospitalization.discharge_date.is_(None),
                            func.date(Hospitalization.discharge_date) >= current_date
                        ),
                        Hospitalization.deleted_at.is_(None)
                    )
                ).distinct()
            
            elif hospitalization_status == "my-patients" and current_user.role == UserRole.DOCTOR:
                # Get current doctor's ID
                doctor = db.query(Doctor).filter(
                    and_(
                        Doctor.user_id == current_user.id,
                        Doctor.deleted_at.is_(None)
                    )
                ).first()
                
                if doctor:
                    # Join with Hospitalization and filter by doctor assignment
                    from models import hospitalization_doctors
                    query = query.join(
                        Hospitalization,
                        and_(
                            Patient.id == Hospitalization.patient_id,
                            func.date(Hospitalization.admission_date) <= current_date,
                            or_(
                                Hospitalization.discharge_date.is_(None),
                                func.date(Hospitalization.discharge_date) >= current_date
                            ),
                            Hospitalization.deleted_at.is_(None)
                        )
                    ).join(
                        hospitalization_doctors,
                        Hospitalization.id == hospitalization_doctors.c.hospitalization_id
                    ).filter(
                        hospitalization_doctors.c.doctor_id == doctor.id
                    ).distinct()
        else:
            # For no filter or "all", use left outer join to show all patients
            query = db.query(User).outerjoin(
                Patient,
                User.id == Patient.user_id
            ).filter(User.role == UserRole.PATIENT)
        
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
                    User.phone.ilike(search_term)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated users with optional patient data
        users_data = query.options(joinedload(User.patient)).order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        
        # Convert to response format
        patients = []
        for user in users_data:
            patient = user.patient
            profile_completed = patient is not None and patient.deleted_at is None
            
            patients.append(create_patient_response(user, patient))
        
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


@router.get("/{user_id}", response_model=PatientResponse)
async def get_patient(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient_access)
):
    """
    Get a specific patient by user ID, showing profile completion status.
    
    Requires: Doctor, Receptionist, or Admin role
    """
    try:
        # Query User with LEFT JOIN to Patient to handle users without completed profiles
        user = db.query(User).outerjoin(Patient, User.id == Patient.user_id).options(joinedload(User.patient)).filter(
            and_(User.id == user_id, User.role == UserRole.PATIENT)
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient user not found"
            )
        
        # Check if user is soft-deleted (only admin can see deleted records)
        if user.deleted_at and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient user not found"
            )
        
        patient = user.patient
        profile_completed = patient is not None and patient.deleted_at is None
        
        return create_patient_response(user, patient)
        
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
    Update a patient record (updates both user and patient tables).
    
    Requires: Receptionist or Admin role
    """
    try:
        # Get existing patient with user data
        db_patient = db.query(Patient).join(User, Patient.user_id == User.id).options(joinedload(Patient.user)).filter(
            and_(Patient.id == patient_id, Patient.deleted_at.is_(None), User.deleted_at.is_(None))
        ).first()
        
        if not db_patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Check for email conflicts if email is being updated
        if patient_update.email and patient_update.email != db_patient.user.email:
            existing_user = db.query(User).filter(
                and_(
                    User.email == patient_update.email,
                    User.id != db_patient.user_id,
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
        user_update_data = {k: v for k, v in patient_update.dict(exclude_unset=True).items() if k in user_fields}
        
        if user_update_data:
            for field, value in user_update_data.items():
                setattr(db_patient.user, field, value)
            db_patient.user.updated_at = datetime.utcnow()
        
        # Update patient-specific fields
        patient_fields = ['medical_record_number', 'emergency_contact', 'insurance_info']
        patient_update_data = {k: v for k, v in patient_update.dict(exclude_unset=True).items() if k in patient_fields}
        
        if patient_update_data:
            for field, value in patient_update_data.items():
                setattr(db_patient, field, value)
            db_patient.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_patient)
        
        return create_patient_response(db_patient.user, db_patient)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating patient: {str(e)}")  # Debug logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update patient record: {str(e)}"
        )


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Soft delete a patient record (deletes both user and patient records).
    
    Requires: Admin role only
    """
    try:
        # Get existing patient with user data
        db_patient = db.query(Patient).join(User, Patient.user_id == User.id).options(joinedload(Patient.user)).filter(
            and_(Patient.id == patient_id, Patient.deleted_at.is_(None), User.deleted_at.is_(None))
        ).first()
        
        if not db_patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Perform soft delete on both records
        delete_time = datetime.utcnow()
        db_patient.deleted_at = delete_time
        db_patient.user.deleted_at = delete_time
        
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


@router.get("/non-patients/list", response_model=PaginatedUsersResponse)
async def get_non_patient_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    search: Optional[str] = Query(None, description="Search by first name, last name, email, or phone"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist_or_admin)
):
    """
    Get list of users who are not patients (undefined role or no patient profile).
    
    Requires: Receptionist or Admin role
    """
    try:
        # Query users who either have undefined role OR are patients without a profile
        query = db.query(User).outerjoin(
            Patient, and_(
                User.id == Patient.user_id,
                Patient.deleted_at.is_(None)
            )
        ).filter(
            and_(
                User.deleted_at.is_(None),
                or_(
                    User.role == UserRole.UNDEFINED,
                    and_(
                        User.role == UserRole.PATIENT,
                        Patient.id.is_(None)  # No patient profile
                    )
                )
            )
        )
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.phone.ilike(search_term)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated results
        users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        
        # Convert to response format
        users_list = [
            UserResponse(
                id=user.id,
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
                created_at=user.created_at,
                updated_at=user.updated_at,
                deleted_at=user.deleted_at
            )
            for user in users
        ]
        
        return {
            "users": users_list,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve non-patient users: {str(e)}"
        )


@router.post("/{user_id}/convert-to-patient", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def convert_user_to_patient(
    user_id: int,
    patient_profile: PatientProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_receptionist_or_admin)
):
    """
    Convert a non-patient user to a patient by creating their patient profile.
    
    Requires: Receptionist or Admin role
    """
    try:
        # Get the user
        user = db.query(User).filter(
            and_(
                User.id == user_id,
                User.deleted_at.is_(None)
            )
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if patient profile already exists
        existing_patient = db.query(Patient).filter(
            and_(
                Patient.user_id == user_id,
                Patient.deleted_at.is_(None)
            )
        ).first()
        
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Patient profile already exists for this user"
            )
        
        # Generate medical record number
        from routers.appointments import generate_medical_record_number
        mrn = generate_medical_record_number(user_id)
        
        # Create patient profile
        db_patient = Patient(
            user_id=user_id,
            medical_record_number=mrn,
            emergency_contact=patient_profile.emergency_contact,
            insurance_info=patient_profile.insurance_info
        )
        
        db.add(db_patient)
        
        # Update user role to patient if undefined
        if user.role == UserRole.UNDEFINED:
            user.role = UserRole.PATIENT
        
        db.commit()
        db.refresh(db_patient)
        db.refresh(user)
        
        return create_patient_response(user, db_patient)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to convert user to patient: {str(e)}"
        )
