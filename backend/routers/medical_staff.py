"""
Medical Staff API router.

This module provides REST API endpoints for medical staff management,
including CRUD operations with authentication and authorization.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

import auth as auth_utils
import models
import schemas
from database import get_db
from services.medical_staff_service import MedicalStaffService
from core.logging_config import get_logger

router = APIRouter(prefix="/api/medical-staff", tags=["medical-staff"])
logger = get_logger(__name__)


def get_medical_staff_service(db: Session = Depends(get_db)) -> MedicalStaffService:
    """Dependency to get medical staff service instance"""
    return MedicalStaffService(db)


def require_admin(current_user: models.User = Depends(auth_utils.get_current_user)) -> models.User:
    """
    Dependency to require admin role for staff management operations.
    
    Requirements:
    - Verify JWT token
    - Verify admin role
    """
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for staff management"
        )
    return current_user


@router.post("", response_model=schemas.MedicalStaffResponse, status_code=status.HTTP_201_CREATED)
def create_medical_staff(
    medical_staff_data: schemas.MedicalStaffCreate,
    service: MedicalStaffService = Depends(get_medical_staff_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Create a new medical staff member.
    
    Args:
        medical_staff_data: Medical staff creation data
        service: Medical staff service instance
        current_user: Authenticated admin user
        
    Returns:
        Created medical staff member with all fields including timestamps
        
    Raises:
        HTTPException: 400 if validation fails, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Creating medical staff for user_id: {medical_staff_data.user_id}")
    try:
        medical_staff = service.register_staff(medical_staff_data)
        logger.info(f"Successfully created medical staff with ID: {medical_staff.id}")
        return medical_staff
    except ValueError as e:
        logger.error(f"Validation error creating medical staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating medical staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create medical staff"
        )


@router.get("")
def list_medical_staff(
    search: Optional[str] = None,
    service: MedicalStaffService = Depends(get_medical_staff_service),
    current_user: models.User = Depends(require_admin)
):
    """
    List all medical staff with optional search.
    
    Args:
        search: Optional search query for first name or last name
        service: Medical staff service instance
        current_user: Authenticated admin user
        
    Returns:
        List of medical staff matching search criteria
        
    Raises:
        HTTPException: 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Listing medical staff with search: {search}")
    try:
        result = service.get_staff_list(search=search)
        logger.info(f"Retrieved {result['total']} medical staff")
        return result
    except Exception as e:
        logger.error(f"Error listing medical staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medical staff"
        )


@router.get("/{medical_staff_id}", response_model=schemas.MedicalStaffResponse)
def get_medical_staff(
    medical_staff_id: int,
    service: MedicalStaffService = Depends(get_medical_staff_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Get a medical staff member by ID.
    
    Args:
        medical_staff_id: ID of the medical staff member to retrieve
        service: Medical staff service instance
        current_user: Authenticated admin user
        
    Returns:
        Medical staff member with the specified ID
        
    Raises:
        HTTPException: 404 if not found, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Retrieving medical staff with ID: {medical_staff_id}")
    try:
        medical_staff = service.get_staff_by_id(medical_staff_id)
        if medical_staff is None:
            logger.warning(f"Medical staff not found with ID: {medical_staff_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medical staff with ID {medical_staff_id} not found"
            )
        logger.info(f"Retrieved medical staff with ID: {medical_staff.id}")
        return medical_staff
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving medical staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medical staff"
        )


@router.put("/{medical_staff_id}", response_model=schemas.MedicalStaffResponse)
def update_medical_staff(
    medical_staff_id: int,
    medical_staff_data: schemas.MedicalStaffUpdate,
    service: MedicalStaffService = Depends(get_medical_staff_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Update a medical staff member.
    
    Args:
        medical_staff_id: ID of the medical staff member to update
        medical_staff_data: Updated medical staff data
        service: Medical staff service instance
        current_user: Authenticated admin user
        
    Returns:
        Updated medical staff member
        
    Raises:
        HTTPException: 404 if not found, 400 if validation fails, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Updating medical staff with ID: {medical_staff_id}")
    try:
        medical_staff = service.update_staff(medical_staff_id, medical_staff_data)
        if medical_staff is None:
            logger.warning(f"Medical staff not found with ID: {medical_staff_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medical staff with ID {medical_staff_id} not found"
            )
        logger.info(f"Successfully updated medical staff with ID: {medical_staff_id}")
        return medical_staff
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating medical staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating medical staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update medical staff"
        )


@router.delete("/{medical_staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medical_staff(
    medical_staff_id: int,
    service: MedicalStaffService = Depends(get_medical_staff_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Delete a medical staff member.
    
    Args:
        medical_staff_id: ID of the medical staff member to delete
        service: Medical staff service instance
        current_user: Authenticated admin user
        
    Returns:
        No content on success
        
    Raises:
        HTTPException: 404 if not found, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Deleting medical staff with ID: {medical_staff_id}")
    try:
        success = service.delete_staff(medical_staff_id)
        if not success:
            logger.warning(f"Medical staff not found with ID: {medical_staff_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medical staff with ID {medical_staff_id} not found"
            )
        logger.info(f"Successfully deleted medical staff with ID: {medical_staff_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting medical staff: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete medical staff"
        )
