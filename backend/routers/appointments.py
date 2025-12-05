from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional
from datetime import datetime, timedelta, time
import secrets

from database import get_db
from models import Appointment, Patient, Doctor, User, UserRole, AppointmentStatus, Shift
from schemas import (
    AppointmentCreate, AppointmentUpdate, AppointmentStatusUpdate,
    AppointmentResponse, PaginatedAppointmentsResponse,
    AvailableDoctorsResponse, AvailableDoctorResponse,
    DoctorAvailableSlotsResponse
)
import auth as auth_utils
from core.email import send_appointment_confirmation_email, send_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


def require_appointment_access(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """Require authenticated user for appointment access."""
    return current_user


def require_appointment_management(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """Require doctor or admin role for appointment management."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Requires admin or doctor role."
        )
    return current_user


def generate_medical_record_number(user_id: int) -> str:
    """Generate unique medical record number."""
    timestamp = int(datetime.utcnow().timestamp())
    random_suffix = secrets.token_hex(2)
    return f"MRN-{timestamp}-{user_id}-{random_suffix}"


def send_appointment_status_update_email(
    to_email: str,
    patient_name: str,
    doctor_name: str,
    appointment_date: str,
    old_status: str,
    new_status: str,
    disease: str
) -> bool:
    """Send email notification when appointment status changes."""
    
    status_colors = {
        "pending": "#f57c00",
        "confirmed": "#2196f3",
        "completed": "#4caf50",
        "cancelled": "#f44336"
    }
    
    status_messages = {
        "pending": "Your appointment is pending confirmation.",
        "confirmed": "Your appointment has been confirmed by the doctor.",
        "completed": "Your appointment has been completed. Thank you for visiting!",
        "cancelled": "Your appointment has been cancelled."
    }
    
    new_status_color = status_colors.get(new_status, "#757575")
    status_message = status_messages.get(new_status, "Your appointment status has been updated.")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #1a1d23;
                margin: 0;
                padding: 0;
                background-color: #f2f4f8;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #16a249 0%, #14903f 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 40px 30px;
                background: white;
            }}
            .content p {{
                margin: 0 0 16px 0;
                color: #495057;
            }}
            .status-change {{
                background: #f2f4f8;
                padding: 20px;
                border-radius: 8px;
                margin: 24px 0;
                text-align: center;
            }}
            .status-badge {{
                display: inline-block;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
                margin: 0 8px;
            }}
            .status-old {{
                background: #e0e0e0;
                color: #757575;
                text-decoration: line-through;
            }}
            .status-new {{
                background: {new_status_color};
                color: white;
            }}
            .arrow {{
                font-size: 24px;
                color: #757575;
                margin: 0 8px;
            }}
            .appointment-details {{
                background: #f2f4f8;
                padding: 24px;
                border-radius: 8px;
                margin: 24px 0;
                border-left: 4px solid #16a249;
            }}
            .detail-row {{
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #e0e0e0;
            }}
            .detail-row:last-child {{
                border-bottom: none;
            }}
            .detail-label {{
                font-weight: 600;
                color: #1a1d23;
                min-width: 140px;
            }}
            .detail-value {{
                color: #495057;
                flex: 1;
            }}
            .info-box {{
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 16px;
                margin: 24px 0;
                border-radius: 4px;
            }}
            .footer {{
                text-align: center;
                padding: 24px 30px;
                background: #f2f4f8;
                color: #6c757d;
                font-size: 13px;
            }}
            .footer p {{
                margin: 4px 0;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
            }}
            @media only screen and (max-width: 600px) {{
                .container {{
                    margin: 20px;
                    border-radius: 8px;
                }}
                .header {{
                    padding: 30px 20px;
                }}
                .header h1 {{
                    font-size: 24px;
                }}
                .content {{
                    padding: 30px 20px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏥 Hospital Management System</div>
                <h1>Appointment Status Updated</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{patient_name}</strong>,</p>
                
                <p>The status of your appointment has been updated.</p>
                
                <div class="status-change">
                    <span class="status-badge status-old">{old_status.upper()}</span>
                    <span class="arrow">→</span>
                    <span class="status-badge status-new">{new_status.upper()}</span>
                </div>
                
                <p style="text-align: center; font-size: 16px; color: #1a1d23; font-weight: 600;">
                    {status_message}
                </p>
                
                <div class="appointment-details">
                    <div class="detail-row">
                        <div class="detail-label">📅 Date & Time:</div>
                        <div class="detail-value"><strong>{appointment_date}</strong></div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">👨‍⚕️ Doctor:</div>
                        <div class="detail-value">{doctor_name}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">📋 Reason:</div>
                        <div class="detail-value">{disease}</div>
                    </div>
                </div>
                
                {f'''<div class="info-box">
                    <strong>📌 What's Next?</strong>
                    <p style="margin: 8px 0 0 0;">Please arrive 15 minutes before your appointment time. If you have any questions, contact our reception desk.</p>
                </div>''' if new_status == "confirmed" else ""}
                
                <p style="margin-top: 32px;">If you have any questions, please contact our reception desk.</p>
                
                <p style="margin-top: 32px;">
                    Best regards,<br>
                    <strong>Hospital Management System Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; 2024 Hospital Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        to_email=to_email,
        subject=f"Appointment Status Updated - {new_status.title()}",
        html_content=html_content
    )


def get_or_create_patient(db: Session, user: User) -> Patient:
    """Get existing patient or create new patient profile for user."""
    # Check if patient profile exists
    patient = db.query(Patient).filter(
        and_(
            Patient.user_id == user.id,
            Patient.deleted_at.is_(None)
        )
    ).first()
    
    if patient:
        return patient
    
    # Auto-create patient profile
    patient = Patient(
        user_id=user.id,
        medical_record_number=generate_medical_record_number(user.id)
    )
    db.add(patient)
    
    # Update user role to patient if undefined
    if user.role == UserRole.UNDEFINED:
        user.role = UserRole.PATIENT
    
    db.flush()
    return patient


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_appointment_access)
):
    """
    Create a new appointment.
    
    - Automatically creates patient profile if user doesn't have one
    - Updates user role to 'patient' if currently 'undefined'
    - Validates doctor has shift on requested date/time
    - Checks for appointment conflicts
    - Sends confirmation email
    """
    try:
        # Get or create patient profile for current user
        patient = get_or_create_patient(db, current_user)
        
        # Verify doctor exists
        doctor = db.query(Doctor).filter(
            and_(
                Doctor.id == appointment_data.doctor_id,
                Doctor.deleted_at.is_(None)
            )
        ).first()
        
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Parse appointment date
        appointment_date = datetime.fromisoformat(appointment_data.appointment_date.replace('Z', '+00:00'))
        
        # Check if doctor has shift on requested date
        doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
        shift = db.query(Shift).filter(
            and_(
                Shift.user_id == doctor_user.id,
                func.date(Shift.date) == appointment_date.date(),
                Shift.deleted_at.is_(None)
            )
        ).first()
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Doctor is not available on this date"
            )
        
        # Check if appointment time is within shift hours
        if not (shift.start_time <= appointment_date <= shift.end_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Appointment time must be between {shift.start_time.strftime('%H:%M')} and {shift.end_time.strftime('%H:%M')}"
            )
        
        # Check for conflicting appointments
        existing_appointment = db.query(Appointment).filter(
            and_(
                Appointment.doctor_id == appointment_data.doctor_id,
                Appointment.appointment_date == appointment_date,
                Appointment.deleted_at.is_(None),
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
            )
        ).first()
        
        if existing_appointment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Appointment slot already taken"
            )
        
        # Create appointment
        db_appointment = Appointment(
            patient_id=patient.id,
            doctor_id=appointment_data.doctor_id,
            appointment_date=appointment_date,
            disease=appointment_data.disease,
            status=AppointmentStatus.PENDING
        )
        
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        
        # Send confirmation email
        patient_user = db.query(User).filter(User.id == patient.user_id).first()
        try:
            if patient_user and patient_user.email:
                formatted_date = appointment_date.strftime("%B %d, %Y at %I:%M %p")
                send_appointment_confirmation_email(
                    to_email=patient_user.email,
                    patient_name=f"{patient_user.first_name} {patient_user.last_name}",
                    doctor_name=f"Dr. {doctor_user.first_name} {doctor_user.last_name}",
                    appointment_date=formatted_date,
                    department=doctor.department or "General",
                    disease=appointment_data.disease
                )
                logger.info(f"Appointment confirmation email sent to {patient_user.email}")
        except Exception as e:
            # Log error but don't fail the appointment creation
            logger.error(f"Failed to send appointment confirmation email: {str(e)}")
        
        # Build response with patient and doctor info
        
        return {
            "id": db_appointment.id,
            "patient_id": db_appointment.patient_id,
            "doctor_id": db_appointment.doctor_id,
            "appointment_date": db_appointment.appointment_date,
            "disease": db_appointment.disease,
            "status": db_appointment.status,
            "created_at": db_appointment.created_at,
            "updated_at": db_appointment.updated_at,
            "deleted_at": db_appointment.deleted_at,
            "patient_first_name": patient_user.first_name if patient_user else None,
            "patient_last_name": patient_user.last_name if patient_user else None,
            "patient_age": patient_user.age if patient_user else None,
            "patient_phone": patient_user.phone if patient_user else None,
            "doctor_first_name": doctor_user.first_name if doctor_user else None,
            "doctor_last_name": doctor_user.last_name if doctor_user else None,
            "doctor_specialization": doctor.specialization,
            "doctor_department": doctor.department,
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
            detail=f"Failed to create appointment: {str(e)}"
        )



@router.get("", response_model=PaginatedAppointmentsResponse)
async def get_appointments(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    doctor_id: Optional[int] = Query(None, description="Filter by doctor ID"),
    status: Optional[AppointmentStatus] = Query(None, description="Filter by status"),
    date_from: Optional[str] = Query(None, description="Filter appointments from this date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter appointments until this date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_appointment_access)
):
    """
    Get paginated list of appointments with role-based filtering.
    
    - Patients: See only their own appointments
    - Doctors: See only appointments assigned to them
    - Admins: See all appointments
    """
    try:
        # Base query
        query = db.query(
            Appointment,
            User.first_name.label('patient_first_name'),
            User.last_name.label('patient_last_name'),
            User.age.label('patient_age'),
            User.phone.label('patient_phone')
        ).join(
            Patient, Appointment.patient_id == Patient.id
        ).join(
            User, Patient.user_id == User.id
        ).filter(
            and_(
                Appointment.deleted_at.is_(None),
                Patient.deleted_at.is_(None),
                User.deleted_at.is_(None)
            )
        )
        
        # Role-based filtering
        if current_user.role == UserRole.PATIENT or current_user.role == UserRole.UNDEFINED:
            # Patients and undefined users see only their own appointments
            patient = db.query(Patient).filter(
                and_(
                    Patient.user_id == current_user.id,
                    Patient.deleted_at.is_(None)
                )
            ).first()
            if patient:
                query = query.filter(Appointment.patient_id == patient.id)
            else:
                # No patient profile, return empty list
                return {
                    "appointments": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": 0
                }
        
        elif current_user.role == UserRole.DOCTOR:
            # Doctors see only their appointments
            doctor = db.query(Doctor).filter(
                and_(
                    Doctor.user_id == current_user.id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            if doctor:
                query = query.filter(Appointment.doctor_id == doctor.id)
            else:
                return {
                    "appointments": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": 0
                }
        
        # Apply additional filters
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
        
        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        
        if status:
            query = query.filter(Appointment.status == status.value)
        
        if date_from:
            date_from_dt = datetime.fromisoformat(date_from)
            query = query.filter(Appointment.appointment_date >= date_from_dt)
        
        if date_to:
            # Add 1 day and use < instead of <= to include entire day
            date_to_dt = datetime.fromisoformat(date_to)
            date_to_end = date_to_dt + timedelta(days=1)
            query = query.filter(Appointment.appointment_date < date_to_end)
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated results
        results = query.order_by(Appointment.appointment_date.desc()).offset(offset).limit(page_size).all()
        
        # Build response
        appointments = []
        for appointment, patient_first_name, patient_last_name, patient_age, patient_phone in results:
            # Get doctor info (filter deleted doctors)
            doctor = db.query(Doctor).filter(
                and_(
                    Doctor.id == appointment.doctor_id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            doctor_user = db.query(User).filter(
                and_(
                    User.id == doctor.user_id,
                    User.deleted_at.is_(None)
                )
            ).first() if doctor else None
            
            appointments.append({
                "id": appointment.id,
                "patient_id": appointment.patient_id,
                "doctor_id": appointment.doctor_id,
                "appointment_date": appointment.appointment_date,
                "disease": appointment.disease,
                "status": appointment.status,
                "created_at": appointment.created_at,
                "updated_at": appointment.updated_at,
                "deleted_at": appointment.deleted_at,
                "patient_first_name": patient_first_name,
                "patient_last_name": patient_last_name,
                "patient_age": patient_age,
                "patient_phone": patient_phone,
                "doctor_first_name": doctor_user.first_name if doctor_user else None,
                "doctor_last_name": doctor_user.last_name if doctor_user else None,
                "doctor_specialization": doctor.specialization if doctor else None,
                "doctor_department": doctor.department if doctor else None,
            })
        
        return {
            "appointments": appointments,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve appointments: {str(e)}"
        )



@router.get("/available-doctors", response_model=AvailableDoctorsResponse)
async def get_available_doctors(
    date: str = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_appointment_access)
):
    """
    Get list of doctors available on a specific date.
    Shows doctors who have shifts scheduled for that date.
    """
    try:
        requested_date = datetime.fromisoformat(date).date()
        
        # Get all shifts for the requested date
        shifts = db.query(Shift, User, Doctor).join(
            User, Shift.user_id == User.id
        ).join(
            Doctor, Doctor.user_id == User.id
        ).filter(
            and_(
                func.date(Shift.date) == requested_date,
                Shift.deleted_at.is_(None),
                User.role == UserRole.DOCTOR,
                Doctor.deleted_at.is_(None)
            )
        ).all()
        
        available_doctors = []
        for shift, user, doctor in shifts:
            # Count appointments for this doctor on this date
            appointment_count = db.query(Appointment).filter(
                and_(
                    Appointment.doctor_id == doctor.id,
                    func.date(Appointment.appointment_date) == requested_date,
                    Appointment.deleted_at.is_(None),
                    Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
                )
            ).count()
            
            available_doctors.append({
                "doctor_id": doctor.id,
                "doctor_user_id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "specialization": doctor.specialization,
                "department": doctor.department,
                "shift_start": shift.start_time,
                "shift_end": shift.end_time,
                "total_appointments": appointment_count
            })
        
        return {
            "date": date,
            "available_doctors": available_doctors
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve available doctors: {str(e)}"
        )



@router.get("/doctors/{doctor_id}/available-slots", response_model=DoctorAvailableSlotsResponse)
async def get_doctor_available_slots(
    doctor_id: int,
    date: str = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    slot_duration: int = Query(30, description="Slot duration in minutes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_appointment_access)
):
    """
    Get available time slots for a specific doctor on a specific date.
    Returns list of available and booked slots based on doctor's shift.
    """
    try:
        # Verify doctor exists
        doctor = db.query(Doctor).filter(
            and_(
                Doctor.id == doctor_id,
                Doctor.deleted_at.is_(None)
            )
        ).first()
        
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        requested_date = datetime.fromisoformat(date).date()
        
        # Get doctor's shift for this date
        doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
        shift = db.query(Shift).filter(
            and_(
                Shift.user_id == doctor_user.id,
                func.date(Shift.date) == requested_date,
                Shift.deleted_at.is_(None)
            )
        ).first()
        
        if not shift:
            return {
                "doctor_id": doctor_id,
                "date": date,
                "shift_start": None,
                "shift_end": None,
                "has_shift": False,
                "available_slots": [],
                "booked_slots": []
            }
        
        # Generate all possible slots
        slots = []
        current_time = shift.start_time
        
        while current_time < shift.end_time:
            slots.append(current_time)
            current_time = current_time + timedelta(minutes=slot_duration)
        
        # Get existing appointments for this doctor on this date
        existing_appointments = db.query(Appointment).filter(
            and_(
                Appointment.doctor_id == doctor_id,
                func.date(Appointment.appointment_date) == requested_date,
                Appointment.deleted_at.is_(None),
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
            )
        ).all()
        
        booked_times = {apt.appointment_date for apt in existing_appointments}
        available_slots = [slot for slot in slots if slot not in booked_times]
        
        return {
            "doctor_id": doctor_id,
            "date": date,
            "shift_start": shift.start_time.isoformat(),
            "shift_end": shift.end_time.isoformat(),
            "has_shift": True,
            "available_slots": [slot.isoformat() for slot in available_slots],
            "booked_slots": [slot.isoformat() for slot in booked_times]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve available slots: {str(e)}"
        )



@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_appointment_access)
):
    """
    Get a specific appointment by ID.
    
    - Patients can only view their own appointments
    - Doctors can only view their appointments
    - Admins can view any appointment
    """
    try:
        appointment = db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.deleted_at.is_(None)
            )
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Check access permissions
        if current_user.role == UserRole.PATIENT or current_user.role == UserRole.UNDEFINED:
            patient = db.query(Patient).filter(
                and_(
                    Patient.user_id == current_user.id,
                    Patient.deleted_at.is_(None)
                )
            ).first()
            if not patient or appointment.patient_id != patient.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        elif current_user.role == UserRole.DOCTOR:
            doctor = db.query(Doctor).filter(
                and_(
                    Doctor.user_id == current_user.id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            if not doctor or appointment.doctor_id != doctor.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        # Get patient and doctor info (filter deleted records)
        patient = db.query(Patient).filter(
            and_(
                Patient.id == appointment.patient_id,
                Patient.deleted_at.is_(None)
            )
        ).first()
        patient_user = db.query(User).filter(
            and_(
                User.id == patient.user_id,
                User.deleted_at.is_(None)
            )
        ).first() if patient else None
        
        doctor = db.query(Doctor).filter(
            and_(
                Doctor.id == appointment.doctor_id,
                Doctor.deleted_at.is_(None)
            )
        ).first()
        doctor_user = db.query(User).filter(
            and_(
                User.id == doctor.user_id,
                User.deleted_at.is_(None)
            )
        ).first() if doctor else None
        
        return {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "appointment_date": appointment.appointment_date,
            "disease": appointment.disease,
            "status": appointment.status,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at,
            "deleted_at": appointment.deleted_at,
            "patient_first_name": patient_user.first_name if patient_user else None,
            "patient_last_name": patient_user.last_name if patient_user else None,
            "patient_age": patient_user.age if patient_user else None,
            "patient_phone": patient_user.phone if patient_user else None,
            "doctor_first_name": doctor_user.first_name if doctor_user else None,
            "doctor_last_name": doctor_user.last_name if doctor_user else None,
            "doctor_specialization": doctor.specialization if doctor else None,
            "doctor_department": doctor.department if doctor else None,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve appointment: {str(e)}"
        )



@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_appointment_management)
):
    """
    Update an appointment.
    
    Requires: Doctor or Admin role
    """
    try:
        appointment = db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.deleted_at.is_(None)
            )
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Check if doctor can only update their own appointments
        if current_user.role == UserRole.DOCTOR:
            doctor = db.query(Doctor).filter(
                and_(
                    Doctor.user_id == current_user.id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            if not doctor or appointment.doctor_id != doctor.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only update your own appointments"
                )
        
        # Update fields
        update_data = appointment_update.dict(exclude_unset=True)
        
        if update_data:
            for field, value in update_data.items():
                if field == 'appointment_date' and value:
                    new_date = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    
                    # Check doctor has shift on new date
                    doctor = db.query(Doctor).filter(
                        and_(
                            Doctor.id == appointment.doctor_id,
                            Doctor.deleted_at.is_(None)
                        )
                    ).first()
                    doctor_user = db.query(User).filter(
                        and_(
                            User.id == doctor.user_id,
                            User.deleted_at.is_(None)
                        )
                    ).first() if doctor else None
                    shift = db.query(Shift).filter(
                        and_(
                            Shift.user_id == doctor_user.id,
                            func.date(Shift.date) == new_date.date(),
                            Shift.deleted_at.is_(None)
                        )
                    ).first()
                    
                    if not shift:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Doctor is not available on the new date"
                        )
                    
                    if not (shift.start_time <= new_date <= shift.end_time):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Appointment time must be between {shift.start_time.strftime('%H:%M')} and {shift.end_time.strftime('%H:%M')}"
                        )
                    
                    # Check for conflicts
                    conflict = db.query(Appointment).filter(
                        and_(
                            Appointment.id != appointment_id,
                            Appointment.doctor_id == appointment.doctor_id,
                            Appointment.appointment_date == new_date,
                            Appointment.deleted_at.is_(None),
                            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
                        )
                    ).first()
                    
                    if conflict:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="Appointment slot already taken"
                        )
                    
                    setattr(appointment, field, new_date)
                elif field == 'status' and value:
                    setattr(appointment, field, value.value)
                elif field not in ['appointment_date', 'status']:
                    setattr(appointment, field, value)
            
            appointment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(appointment)
        
        # Build response
        patient = db.query(Patient).filter(
            and_(
                Patient.id == appointment.patient_id,
                Patient.deleted_at.is_(None)
            )
        ).first()
        patient_user = db.query(User).filter(
            and_(
                User.id == patient.user_id,
                User.deleted_at.is_(None)
            )
        ).first() if patient else None
        
        doctor = db.query(Doctor).filter(
            and_(
                Doctor.id == appointment.doctor_id,
                Doctor.deleted_at.is_(None)
            )
        ).first()
        doctor_user = db.query(User).filter(
            and_(
                User.id == doctor.user_id,
                User.deleted_at.is_(None)
            )
        ).first() if doctor else None
        
        return {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "appointment_date": appointment.appointment_date,
            "disease": appointment.disease,
            "status": appointment.status,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at,
            "deleted_at": appointment.deleted_at,
            "patient_first_name": patient_user.first_name if patient_user else None,
            "patient_last_name": patient_user.last_name if patient_user else None,
            "patient_age": patient_user.age if patient_user else None,
            "patient_phone": patient_user.phone if patient_user else None,
            "doctor_first_name": doctor_user.first_name if doctor_user else None,
            "doctor_last_name": doctor_user.last_name if doctor_user else None,
            "doctor_specialization": doctor.specialization if doctor else None,
            "doctor_department": doctor.department if doctor else None,
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
            detail=f"Failed to update appointment: {str(e)}"
        )



@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int,
    status_update: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_appointment_management)
):
    """
    Update only the status of an appointment.
    
    Requires: Doctor or Admin role
    """
    try:
        appointment = db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.deleted_at.is_(None)
            )
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Check if doctor can only update their own appointments
        if current_user.role == UserRole.DOCTOR:
            doctor = db.query(Doctor).filter(
                and_(
                    Doctor.user_id == current_user.id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            if not doctor or appointment.doctor_id != doctor.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only update your own appointments"
                )
        
        old_status = appointment.status
        appointment.status = status_update.status.value
        appointment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(appointment)
        
        # Send status update email
        patient = db.query(Patient).filter(
            and_(
                Patient.id == appointment.patient_id,
                Patient.deleted_at.is_(None)
            )
        ).first()
        patient_user = db.query(User).filter(
            and_(
                User.id == patient.user_id,
                User.deleted_at.is_(None)
            )
        ).first() if patient else None
        doctor = db.query(Doctor).filter(
            and_(
                Doctor.id == appointment.doctor_id,
                Doctor.deleted_at.is_(None)
            )
        ).first()
        doctor_user = db.query(User).filter(
            and_(
                User.id == doctor.user_id,
                User.deleted_at.is_(None)
            )
        ).first() if doctor else None
        
        try:
            if patient_user and patient_user.email and old_status != status_update.status.value:
                formatted_date = appointment.appointment_date.strftime("%B %d, %Y at %I:%M %p")
                send_appointment_status_update_email(
                    to_email=patient_user.email,
                    patient_name=f"{patient_user.first_name} {patient_user.last_name}",
                    doctor_name=f"Dr. {doctor_user.first_name} {doctor_user.last_name}" if doctor_user else "Doctor",
                    appointment_date=formatted_date,
                    old_status=old_status,
                    new_status=status_update.status.value,
                    disease=appointment.disease
                )
                logger.info(f"Status update email sent to {patient_user.email} for appointment {appointment_id}")
        except Exception as e:
            # Log error but don't fail the status update
            logger.error(f"Failed to send status update email: {str(e)}")
        
        # Build response (reuse already fetched doctor and patient data)
        
        return {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "appointment_date": appointment.appointment_date,
            "disease": appointment.disease,
            "status": appointment.status,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at,
            "deleted_at": appointment.deleted_at,
            "patient_first_name": patient_user.first_name if patient_user else None,
            "patient_last_name": patient_user.last_name if patient_user else None,
            "patient_age": patient_user.age if patient_user else None,
            "patient_phone": patient_user.phone if patient_user else None,
            "doctor_first_name": doctor_user.first_name if doctor_user else None,
            "doctor_last_name": doctor_user.last_name if doctor_user else None,
            "doctor_specialization": doctor.specialization if doctor else None,
            "doctor_department": doctor.department if doctor else None,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update appointment status: {str(e)}"
        )


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_appointment_access)
):
    """
    Cancel/soft delete an appointment.
    
    - Patients can cancel their own appointments
    - Doctors can cancel their appointments
    - Admins can cancel any appointment
    """
    try:
        appointment = db.query(Appointment).filter(
            and_(
                Appointment.id == appointment_id,
                Appointment.deleted_at.is_(None)
            )
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Check access permissions
        if current_user.role == UserRole.PATIENT or current_user.role == UserRole.UNDEFINED:
            patient = db.query(Patient).filter(
                and_(
                    Patient.user_id == current_user.id,
                    Patient.deleted_at.is_(None)
                )
            ).first()
            if not patient or appointment.patient_id != patient.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only cancel your own appointments"
                )
        
        elif current_user.role == UserRole.DOCTOR:
            doctor = db.query(Doctor).filter(
                and_(
                    Doctor.user_id == current_user.id,
                    Doctor.deleted_at.is_(None)
                )
            ).first()
            if not doctor or appointment.doctor_id != doctor.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only cancel your own appointments"
                )
        
        # Soft delete
        appointment.deleted_at = datetime.utcnow()
        appointment.status = AppointmentStatus.CANCELLED.value
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel appointment: {str(e)}"
        )
