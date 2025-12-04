from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional
from datetime import datetime, timedelta
import math
import logging

from database import get_db
from models import BloodPressureReading, User, UserRole
from schemas import (
    BloodPressureCreate,
    BloodPressureResponse,
    PaginatedBloodPressureResponse,
    BloodPressureStatistics
)
import auth as auth_utils
from core.email import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/blood-pressure", tags=["blood-pressure"])


def send_blood_pressure_recommendation(user: User, systolic: int, reading_date: datetime) -> bool:
    """Send personalized blood pressure recommendation email."""
    try:
        if not user.email:
            return False
        
        # Determine if high or low
        is_high = systolic > 120
        is_low = systolic < 90
        
        if not (is_high or is_low):
            return False  # Normal reading, no email needed
        
        # Check if we already sent an email today for this condition
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Prepare email content
        patient_name = f"{user.first_name} {user.last_name}"
        
        if is_high:
            subject = "Important: High Blood Pressure Reading Detected"
            status_text = "HIGH"
            status_color = "#f44336"
            recommendation = """
            <p><strong>Medical Recommendation:</strong></p>
            <ul>
                <li>Consult with your doctor before making any changes</li>
                <li>Reduce salt intake in your diet</li>
                <li>Engage in regular physical activity (30 minutes daily)</li>
                <li>Maintain a healthy weight</li>
                <li>Limit alcohol consumption</li>
                <li>Manage stress through relaxation techniques</li>
                <li>Avoid smoking and caffeine</li>
            </ul>
            """
            advice = "High blood pressure can lead to serious health complications including heart disease and stroke. We strongly recommend scheduling an appointment with your doctor as soon as possible for a comprehensive evaluation."
        else:  # is_low
            subject = "Important: Low Blood Pressure Reading Detected"
            status_text = "LOW"
            status_color = "#ff9800"
            recommendation = """
            <p><strong>Medical Recommendation:</strong></p>
            <ul>
                <li>Increase salt intake moderately (consult your doctor first)</li>
                <li>Drink more water to increase blood volume</li>
                <li>Eat small, frequent meals</li>
                <li>Avoid standing up quickly</li>
                <li>Wear compression stockings</li>
                <li>Avoid prolonged standing</li>
            </ul>
            """
            advice = "Low blood pressure can cause dizziness, fainting, and in severe cases, shock. We recommend consulting with your doctor to determine the underlying cause and appropriate treatment."
        
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
                    background: {status_color};
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
                .alert-box {{
                    background: #fff3e0;
                    border-left: 4px solid {status_color};
                    padding: 20px;
                    margin: 24px 0;
                    border-radius: 4px;
                }}
                .reading-box {{
                    background: #f2f4f8;
                    padding: 24px;
                    border-radius: 8px;
                    margin: 24px 0;
                    text-align: center;
                }}
                .reading-value {{
                    font-size: 48px;
                    font-weight: 700;
                    color: {status_color};
                    margin: 10px 0;
                }}
                .recommendation {{
                    background: #e3f2fd;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 24px 0;
                }}
                .recommendation ul {{
                    margin: 10px 0;
                    padding-left: 20px;
                }}
                .recommendation li {{
                    margin: 8px 0;
                }}
                .cta-button {{
                    display: inline-block;
                    background: #16a249;
                    color: white;
                    padding: 14px 32px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    padding: 24px 30px;
                    background: #f2f4f8;
                    color: #6c757d;
                    font-size: 13px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">🏥 Hospital Management System</div>
                    <h1>{status_text} Blood Pressure Alert</h1>
                </div>
                <div class="content">
                    <p>Dear <strong>{patient_name}</strong>,</p>
                    
                    <p>We have detected a blood pressure reading outside the normal range in your recent measurement.</p>
                    
                    <div class="reading-box">
                        <div style="font-size: 14px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px;">Your Reading</div>
                        <div class="reading-value">{systolic} mmHg</div>
                        <div style="font-size: 14px; color: #6c757d;">Systolic Pressure</div>
                        <div style="margin-top: 10px; font-size: 12px; color: #6c757d;">
                            Recorded on {reading_date.strftime("%B %d, %Y at %I:%M %p")}
                        </div>
                    </div>
                    
                    <div class="alert-box">
                        <strong>⚠️ Important Notice:</strong> Your blood pressure reading is {status_text.lower()} and requires attention.
                    </div>
                    
                    <div class="recommendation">
                        {recommendation}
                    </div>
                    
                    <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <strong>⚕️ Medical Advice:</strong>
                        <p style="margin: 8px 0 0 0;">{advice}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <p style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">
                            Please schedule an appointment with your doctor
                        </p>
                    </div>
                    
                    <p style="margin-top: 32px; font-size: 14px; color: #6c757d;">
                        This is an automated health alert based on your blood pressure reading. If you have any immediate concerns or symptoms, please seek medical attention right away.
                    </p>
                    
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
            to_email=user.email,
            subject=subject,
            html_content=html_content
        )
        
    except Exception as e:
        logger.error(f"Failed to send blood pressure recommendation email: {str(e)}")
        return False


def require_blood_pressure_access(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """Require authenticated user for blood pressure access."""
    return current_user


def require_medical_staff(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """Require medical staff, doctor, receptionist, or admin role."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Requires medical staff privileges."
        )
    return current_user


@router.post("", response_model=BloodPressureResponse, status_code=status.HTTP_201_CREATED)
async def create_blood_pressure_reading(
    reading_data: BloodPressureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_blood_pressure_access)
):
    """
    Create a new blood pressure reading for the current user.
    
    - Any authenticated user can add their own blood pressure readings
    - Reading date defaults to current time if not provided
    - Automatically calculates high-risk status (systolic > 120)
    """
    try:
        # Use provided reading_date or default to now
        reading_date = reading_data.reading_date or datetime.utcnow()
        
        # Create blood pressure reading
        db_reading = BloodPressureReading(
            user_id=current_user.id,
            systolic=reading_data.systolic,
            diastolic=reading_data.diastolic,
            reading_date=reading_date
        )
        
        db.add(db_reading)
        db.commit()
        db.refresh(db_reading)
        
        # Send recommendation email if reading is abnormal (once per day)
        try:
            logger.info(f"Checking if email should be sent for systolic={reading_data.systolic}, user={current_user.email}")
            
            # Check if reading is abnormal
            is_abnormal = reading_data.systolic > 120 or reading_data.systolic < 90
            
            if is_abnormal:
                # Check if we already sent an email today for this user
                today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                today_readings = db.query(BloodPressureReading).filter(
                    and_(
                        BloodPressureReading.user_id == current_user.id,
                        BloodPressureReading.created_at >= today_start
                    )
                ).count()
                
                logger.info(f"Today's readings count: {today_readings}, is_abnormal: {is_abnormal}")
                
                # Only send email for the first abnormal reading of the day
                if today_readings == 1:  # This is the first reading today
                    logger.info(f"Attempting to send email to {current_user.email}")
                    email_sent = send_blood_pressure_recommendation(current_user, reading_data.systolic, reading_date)
                    if email_sent:
                        logger.info(f"✅ Blood pressure recommendation email sent successfully to {current_user.email}")
                    else:
                        logger.warning(f"⚠️ Email sending returned False for {current_user.email}")
                else:
                    logger.info(f"Skipping email - already sent {today_readings} reading(s) today")
            else:
                logger.info(f"Reading is normal ({reading_data.systolic}), no email needed")
        except Exception as e:
            # Don't fail the request if email fails
            logger.error(f"❌ Failed to send recommendation email: {str(e)}", exc_info=True)
        
        # Build response with user info
        return {
            "id": db_reading.id,
            "user_id": db_reading.user_id,
            "systolic": db_reading.systolic,
            "diastolic": db_reading.diastolic,
            "reading_date": db_reading.reading_date,
            "is_high_risk": db_reading.systolic > 120,
            "created_at": db_reading.created_at,
            "user_first_name": current_user.first_name,
            "user_last_name": current_user.last_name,
            "user_email": current_user.email,
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create blood pressure reading: {str(e)}"
        )


@router.get("", response_model=PaginatedBloodPressureResponse)
async def get_blood_pressure_readings(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    search: Optional[str] = Query(None, description="Search by user name or email"),
    date_from: Optional[str] = Query(None, description="Filter readings from this date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter readings until this date (YYYY-MM-DD)"),
    high_risk_only: bool = Query(False, description="Show only high-risk readings (systolic > 120)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_blood_pressure_access)
):
    """
    Get paginated list of blood pressure readings with role-based filtering.
    
    - Regular users: See only their own readings
    - Medical staff/doctors/receptionists/admins: See all readings with filters
    """
    try:
        # Base query with user join
        query = db.query(
            BloodPressureReading,
            User.first_name,
            User.last_name,
            User.email
        ).join(
            User, BloodPressureReading.user_id == User.id
        )
        
        # Role-based filtering
        if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
            # Regular users see only their own readings
            query = query.filter(BloodPressureReading.user_id == current_user.id)
        
        # Apply search filter (medical staff only)
        if search and current_user.role in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        # Apply date filters
        if date_from:
            date_from_dt = datetime.fromisoformat(date_from)
            query = query.filter(BloodPressureReading.reading_date >= date_from_dt)
        
        if date_to:
            date_to_dt = datetime.fromisoformat(date_to)
            date_to_end = date_to_dt + timedelta(days=1)
            query = query.filter(BloodPressureReading.reading_date < date_to_end)
        
        # Apply high-risk filter
        if high_risk_only:
            query = query.filter(BloodPressureReading.systolic > 120)
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = math.ceil(total / page_size)
        offset = (page - 1) * page_size
        
        # Get paginated results
        results = query.order_by(BloodPressureReading.reading_date.desc()).offset(offset).limit(page_size).all()
        
        # Build response
        readings = []
        for reading, first_name, last_name, email in results:
            readings.append({
                "id": reading.id,
                "user_id": reading.user_id,
                "systolic": reading.systolic,
                "diastolic": reading.diastolic,
                "reading_date": reading.reading_date,
                "is_high_risk": reading.systolic > 120,
                "created_at": reading.created_at,
                "user_first_name": first_name,
                "user_last_name": last_name,
                "user_email": email,
            })
        
        return {
            "readings": readings,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve blood pressure readings: {str(e)}"
        )


@router.get("/statistics", response_model=BloodPressureStatistics)
async def get_blood_pressure_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_blood_pressure_access)
):
    """
    Get blood pressure statistics for the current user or all users (medical staff).
    
    - Regular users: See their own statistics
    - Medical staff: See statistics for all users
    """
    try:
        # Base query
        query = db.query(BloodPressureReading)
        
        # Role-based filtering
        if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
            query = query.filter(BloodPressureReading.user_id == current_user.id)
        
        # Get statistics
        total_readings = query.count()
        high_risk_count = query.filter(BloodPressureReading.systolic > 120).count()
        normal_count = total_readings - high_risk_count
        
        # Calculate averages
        avg_systolic_query = db.query(func.avg(BloodPressureReading.systolic))
        avg_diastolic_query = db.query(func.avg(BloodPressureReading.diastolic)).filter(
            BloodPressureReading.diastolic.isnot(None)
        )
        
        # Apply user filter if not medical staff
        if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
            avg_systolic_query = avg_systolic_query.filter(BloodPressureReading.user_id == current_user.id)
            avg_diastolic_query = avg_diastolic_query.filter(BloodPressureReading.user_id == current_user.id)
        
        avg_systolic = avg_systolic_query.scalar()
        avg_diastolic = avg_diastolic_query.scalar()
        
        # Get latest reading date
        latest_reading = query.order_by(BloodPressureReading.reading_date.desc()).first()
        latest_reading_date = latest_reading.reading_date if latest_reading else None
        
        return {
            "total_readings": total_readings,
            "high_risk_count": high_risk_count,
            "normal_count": normal_count,
            "average_systolic": round(avg_systolic, 1) if avg_systolic else None,
            "average_diastolic": round(avg_diastolic, 1) if avg_diastolic else None,
            "latest_reading_date": latest_reading_date
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )


@router.delete("/{reading_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blood_pressure_reading(
    reading_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_blood_pressure_access)
):
    """
    Soft delete a blood pressure reading.
    
    - Users can delete their own readings
    - Medical staff can delete any reading
    """
    try:
        reading = db.query(BloodPressureReading).filter(
            BloodPressureReading.id == reading_id
        ).first()
        
        if not reading:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blood pressure reading not found"
            )
        
        # Check access permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
            if reading.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only delete your own readings"
                )
        
        # Hard delete
        db.delete(reading)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete reading: {str(e)}"
        )
