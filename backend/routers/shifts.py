from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models import Shift, User, UserRole
from schemas import ShiftCreate, ShiftUpdate, ShiftResponse, PaginatedShiftsResponse
import auth as auth_utils

router = APIRouter(prefix="/api/shifts", tags=["shifts"])


def require_shift_write_access(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """
    Require doctor, medical_staff, or receptionist role for shift write access.
    """
    if current_user.role not in [UserRole.DOCTOR, UserRole.MEDICAL_STAFF, UserRole.RECEPTIONIST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only doctors, medical staff, and receptionists can log shifts."
        )
    return current_user


def require_shift_report_access(current_user: User = Depends(auth_utils.get_current_user)) -> User:
    """
    Require admin or accountant role for shift report access.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only admins and accountants can view shift reports."
        )
    return current_user


@router.post("", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(
    shift_data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shift_write_access)
):
    """
    Create a new shift record for the current user.
    
    Requires: Doctor, Medical Staff, or Receptionist role
    """
    try:
        # Parse date and times
        shift_date = datetime.fromisoformat(shift_data.date.replace('Z', '+00:00'))
        
        # Parse start and end times
        if 'T' in shift_data.start_time:
            start_time = datetime.fromisoformat(shift_data.start_time.replace('Z', '+00:00'))
        else:
            # If just time provided (HH:MM), combine with date
            time_parts = shift_data.start_time.split(':')
            start_time = shift_date.replace(hour=int(time_parts[0]), minute=int(time_parts[1]), second=0)
        
        if 'T' in shift_data.end_time:
            end_time = datetime.fromisoformat(shift_data.end_time.replace('Z', '+00:00'))
        else:
            time_parts = shift_data.end_time.split(':')
            end_time = shift_date.replace(hour=int(time_parts[0]), minute=int(time_parts[1]), second=0)
        
        # Calculate total hours in minutes
        time_diff = end_time - start_time
        total_minutes = int(time_diff.total_seconds() / 60)
        
        if total_minutes <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be after start time"
            )
        
        # Create shift
        db_shift = Shift(
            user_id=current_user.id,
            date=shift_date,
            start_time=start_time,
            end_time=end_time,
            total_hours=total_minutes,
            notes=shift_data.notes
        )
        
        db.add(db_shift)
        db.commit()
        db.refresh(db_shift)
        
        # Build response with user info
        return {
            "id": db_shift.id,
            "user_id": db_shift.user_id,
            "date": db_shift.date,
            "start_time": db_shift.start_time,
            "end_time": db_shift.end_time,
            "total_hours": db_shift.total_hours,
            "notes": db_shift.notes,
            "created_at": db_shift.created_at,
            "updated_at": db_shift.updated_at,
            "deleted_at": db_shift.deleted_at,
            "user_first_name": current_user.first_name,
            "user_last_name": current_user.last_name,
            "user_role": current_user.role,
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date/time format: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create shift record"
        )


@router.get("", response_model=PaginatedShiftsResponse)
async def get_shifts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of records per page"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    start_date: Optional[str] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    search: Optional[str] = Query(None, description="Search by user name, email, or username"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user)
):
    """
    Get paginated list of shifts with filtering options.
    
    - Staff can only see their own shifts
    - Admins and Accountants can see all shifts
    
    Filters:
    - user_id: Filter by specific user (admin/accountant only)
    - start_date: Filter from this date onwards
    - end_date: Filter up to this date
    - role: Filter by user role (admin/accountant only)
    - search: Search by user name, email, or username (admin/accountant only)
    """
    try:
        # Join with User to get user details
        query = db.query(
            Shift,
            User.first_name,
            User.last_name,
            User.role
        ).join(
            User, Shift.user_id == User.id
        ).filter(
            Shift.deleted_at.is_(None)
        )
        
        # Access control: staff can only see their own shifts
        if current_user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT]:
            query = query.filter(Shift.user_id == current_user.id)
        else:
            # Admin/Accountant can filter by user_id
            if user_id:
                query = query.filter(Shift.user_id == user_id)
            
            # Admin/Accountant can filter by role
            if role:
                query = query.filter(User.role == role)
            
            # Admin/Accountant can search by name, email, or username
            if search:
                search_term = f"%{search.strip()}%"
                query = query.filter(
                    or_(
                        User.first_name.ilike(search_term),
                        User.last_name.ilike(search_term),
                        User.email.ilike(search_term),
                        User.username.ilike(search_term)
                    )
                )
        
        # Apply date filters
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Shift.date >= start_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use YYYY-MM-DD"
                )
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Shift.date <= end_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use YYYY-MM-DD"
                )
        
        # Get total count
        total = query.count()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated results
        results = query.order_by(Shift.date.desc()).offset(offset).limit(page_size).all()
        
        # Build response with user info
        shifts = []
        for shift, first_name, last_name, user_role in results:
            shift_dict = {
                "id": shift.id,
                "user_id": shift.user_id,
                "date": shift.date,
                "start_time": shift.start_time,
                "end_time": shift.end_time,
                "total_hours": shift.total_hours,
                "notes": shift.notes,
                "created_at": shift.created_at,
                "updated_at": shift.updated_at,
                "deleted_at": shift.deleted_at,
                "user_first_name": first_name,
                "user_last_name": last_name,
                "user_role": user_role,
            }
            shifts.append(shift_dict)
        
        return {
            "shifts": shifts,
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
            detail="Failed to retrieve shift records"
        )


@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user)
):
    """
    Get a specific shift by ID.
    
    - Staff can only see their own shifts
    - Admins and Accountants can see all shifts
    """
    try:
        shift = db.query(Shift).filter(
            and_(
                Shift.id == shift_id,
                Shift.deleted_at.is_(None)
            )
        ).first()
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift record not found"
            )
        
        # Access control
        if current_user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT] and shift.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own shifts."
            )
        
        return shift
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve shift record"
        )


@router.put("/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: int,
    shift_update: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shift_write_access)
):
    """
    Update a shift record.
    
    Staff can only update their own shifts.
    
    Requires: Doctor, Medical Staff, or Receptionist role
    """
    try:
        shift = db.query(Shift).filter(
            and_(
                Shift.id == shift_id,
                Shift.deleted_at.is_(None)
            )
        ).first()
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift record not found"
            )
        
        # Access control: can only update own shifts
        if shift.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only update your own shifts."
            )
        
        # Update fields
        update_data = shift_update.dict(exclude_unset=True)
        
        if update_data:
            # Handle date/time updates
            if 'date' in update_data and update_data['date']:
                shift.date = datetime.fromisoformat(update_data['date'].replace('Z', '+00:00'))
            
            if 'start_time' in update_data and update_data['start_time']:
                if 'T' in update_data['start_time']:
                    shift.start_time = datetime.fromisoformat(update_data['start_time'].replace('Z', '+00:00'))
                else:
                    time_parts = update_data['start_time'].split(':')
                    shift.start_time = shift.date.replace(hour=int(time_parts[0]), minute=int(time_parts[1]), second=0)
            
            if 'end_time' in update_data and update_data['end_time']:
                if 'T' in update_data['end_time']:
                    shift.end_time = datetime.fromisoformat(update_data['end_time'].replace('Z', '+00:00'))
                else:
                    time_parts = update_data['end_time'].split(':')
                    shift.end_time = shift.date.replace(hour=int(time_parts[0]), minute=int(time_parts[1]), second=0)
            
            # Recalculate total hours
            time_diff = shift.end_time - shift.start_time
            shift.total_hours = int(time_diff.total_seconds() / 60)
            
            if shift.total_hours <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="End time must be after start time"
                )
            
            if 'notes' in update_data:
                shift.notes = update_data['notes']
            
            shift.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(shift)
        
        # Build response with user info
        user = db.query(User).filter(User.id == shift.user_id).first()
        
        return {
            "id": shift.id,
            "user_id": shift.user_id,
            "date": shift.date,
            "start_time": shift.start_time,
            "end_time": shift.end_time,
            "total_hours": shift.total_hours,
            "notes": shift.notes,
            "created_at": shift.created_at,
            "updated_at": shift.updated_at,
            "deleted_at": shift.deleted_at,
            "user_first_name": user.first_name if user else None,
            "user_last_name": user.last_name if user else None,
            "user_role": user.role if user else None,
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date/time format: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update shift record"
        )


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shift_write_access)
):
    """
    Soft delete a shift record.
    
    Staff can only delete their own shifts.
    
    Requires: Doctor, Medical Staff, or Receptionist role
    """
    try:
        shift = db.query(Shift).filter(
            and_(
                Shift.id == shift_id,
                Shift.deleted_at.is_(None)
            )
        ).first()
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift record not found"
            )
        
        # Access control: can only delete own shifts
        if shift.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only delete your own shifts."
            )
        
        # Soft delete
        shift.deleted_at = datetime.utcnow()
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete shift record"
        )
