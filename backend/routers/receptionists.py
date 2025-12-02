"""
Receptionist API router.

This module provides REST API endpoints for receptionist management,
including CRUD operations with authentication and authorization.

Requirements:
- 2.1: POST endpoint for receptionist registration
- 5.1: GET endpoint for listing receptionists
- 5.3: GET endpoint for retrieving by ID
- 5.4: PUT endpoint for updates
- 5.5: DELETE endpoint for deletion
- 17.1, 17.2, 17.3: Authentication and authorization
- 19.1, 19.2, 19.3: Not found error handling
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

import auth as auth_utils
import models
import schemas
from database import get_db
from services.receptionist_service import ReceptionistService
from core.logging_config import get_logger

router = APIRouter(prefix="/api/receptionists", tags=["receptionists"])
logger = get_logger(__name__)


def get_receptionist_service(db: Session = Depends(get_db)) -> ReceptionistService:
    """Dependency to get receptionist service instance"""
    return ReceptionistService(db)


def require_admin(current_user: models.User = Depends(auth_utils.get_current_user)) -> models.User:
    """
    Dependency to require admin role for staff management operations.
    
    Requirements:
    - 17.1: Verify JWT token
    - 17.2: Verify admin role
    
    Note: Currently all authenticated users are treated as admins.
    This should be enhanced with proper role-based access control.
    """
    # TODO: Implement proper role checking when User model has role field
    # For now, any authenticated user can access staff management
    # if not current_user.is_admin:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Admin access required"
    #     )
    return current_user


@router.post("", response_model=schemas.StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_receptionist(
    receptionist_data: schemas.StaffCreate,
    service: ReceptionistService = Depends(get_receptionist_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Create a new receptionist.
    
    Requirements:
    - 2.1: Receptionist registration submission
    - 2.2: Validation of required fields
    - 17.1, 17.2: Authentication and authorization
    
    Args:
        receptionist_data: Receptionist creation data
        service: Receptionist service instance
        current_user: Authenticated admin user
        
    Returns:
        Created receptionist with all fields including timestamps
        
    Raises:
        HTTPException: 400 if validation fails, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Creating receptionist: {receptionist_data.first_name} {receptionist_data.last_name}")
    try:
        receptionist = await service.register_staff(receptionist_data)
        logger.info(f"Successfully created receptionist with ID: {receptionist.id}")
        return receptionist
    except ValueError as e:
        logger.error(f"Validation error creating receptionist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating receptionist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create receptionist"
        )


@router.get("", response_model=schemas.StaffListResponse)
async def list_receptionists(
    search: Optional[str] = None,
    service: ReceptionistService = Depends(get_receptionist_service),
    current_user: models.User = Depends(require_admin)
):
    """
    List all receptionists with optional search.
    
    Requirements:
    - 5.1: List all receptionists
    - 5.2: Search functionality
    - 17.1, 17.2: Authentication and authorization
    
    Args:
        search: Optional search query for first name or last name
        service: Receptionist service instance
        current_user: Authenticated admin user
        
    Returns:
        List of receptionists matching search criteria
        
    Raises:
        HTTPException: 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Listing receptionists with search: {search}")
    try:
        result = await service.get_staff_list(search=search)
        logger.info(f"Retrieved {result.total} receptionists")
        return result
    except Exception as e:
        logger.error(f"Error listing receptionists: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve receptionists"
        )


@router.get("/{receptionist_id}", response_model=schemas.StaffResponse)
async def get_receptionist(
    receptionist_id: int,
    service: ReceptionistService = Depends(get_receptionist_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Get a receptionist by ID.
    
    Requirements:
    - 5.3: Retrieve receptionist by ID
    - 17.1, 17.2: Authentication and authorization
    - 19.1: Not found error handling
    
    Args:
        receptionist_id: ID of the receptionist to retrieve
        service: Receptionist service instance
        current_user: Authenticated admin user
        
    Returns:
        Receptionist with the specified ID
        
    Raises:
        HTTPException: 404 if not found, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Retrieving receptionist with ID: {receptionist_id}")
    try:
        receptionist = await service.get_staff_by_id(receptionist_id)
        if receptionist is None:
            logger.warning(f"Receptionist not found with ID: {receptionist_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receptionist with ID {receptionist_id} not found"
            )
        logger.info(f"Retrieved receptionist: {receptionist.first_name} {receptionist.last_name}")
        return receptionist
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving receptionist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve receptionist"
        )


@router.put("/{receptionist_id}", response_model=schemas.StaffResponse)
async def update_receptionist(
    receptionist_id: int,
    receptionist_data: schemas.StaffUpdate,
    service: ReceptionistService = Depends(get_receptionist_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Update a receptionist.
    
    Requirements:
    - 5.4: Update receptionist
    - 17.1, 17.2: Authentication and authorization
    - 19.2: Not found error handling
    
    Args:
        receptionist_id: ID of the receptionist to update
        receptionist_data: Updated receptionist data
        service: Receptionist service instance
        current_user: Authenticated admin user
        
    Returns:
        Updated receptionist
        
    Raises:
        HTTPException: 404 if not found, 400 if validation fails, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Updating receptionist with ID: {receptionist_id}")
    try:
        receptionist = await service.update_staff(receptionist_id, receptionist_data)
        if receptionist is None:
            logger.warning(f"Receptionist not found with ID: {receptionist_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receptionist with ID {receptionist_id} not found"
            )
        logger.info(f"Successfully updated receptionist with ID: {receptionist_id}")
        return receptionist
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating receptionist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating receptionist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update receptionist"
        )


@router.delete("/{receptionist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receptionist(
    receptionist_id: int,
    service: ReceptionistService = Depends(get_receptionist_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Delete a receptionist.
    
    Requirements:
    - 5.5: Delete receptionist
    - 17.1, 17.2: Authentication and authorization
    - 19.3: Not found error handling
    
    Args:
        receptionist_id: ID of the receptionist to delete
        service: Receptionist service instance
        current_user: Authenticated admin user
        
    Returns:
        No content on success
        
    Raises:
        HTTPException: 404 if not found, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Deleting receptionist with ID: {receptionist_id}")
    try:
        success = await service.delete_staff(receptionist_id)
        if not success:
            logger.warning(f"Receptionist not found with ID: {receptionist_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receptionist with ID {receptionist_id} not found"
            )
        logger.info(f"Successfully deleted receptionist with ID: {receptionist_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting receptionist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete receptionist"
        )
