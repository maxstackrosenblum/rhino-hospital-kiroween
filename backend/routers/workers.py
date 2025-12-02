"""
Worker API router.

This module provides REST API endpoints for worker management,
including CRUD operations with authentication and authorization.

Requirements:
- 7.1: POST endpoint for worker registration
- 10.1: GET endpoint for listing workers
- 10.6: GET endpoint for retrieving by ID
- 10.7: PUT endpoint for updates
- 10.8: DELETE endpoint for deletion
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
from services.worker_service import WorkerService
from core.logging_config import get_logger

router = APIRouter(prefix="/api/workers", tags=["workers"])
logger = get_logger(__name__)


def get_worker_service(db: Session = Depends(get_db)) -> WorkerService:
    """Dependency to get worker service instance"""
    return WorkerService(db)


def require_admin(current_user: models.User = Depends(auth_utils.get_current_user)) -> models.User:
    """
    Dependency to require admin role for staff management operations.
    
    Requirements:
    - 17.1: Verify JWT token
    - 17.2: Verify admin role
    """
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for staff management"
        )
    return current_user


@router.post("", response_model=schemas.StaffResponse, status_code=status.HTTP_201_CREATED)
def create_worker(
    worker_data: schemas.StaffCreate,
    service: WorkerService = Depends(get_worker_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Create a new worker.
    
    Requirements:
    - 7.1: Worker registration submission
    - 7.2: Validation of required fields
    - 17.1, 17.2: Authentication and authorization
    
    Args:
        worker_data: Worker creation data
        service: Worker service instance
        current_user: Authenticated admin user
        
    Returns:
        Created worker with all fields including timestamps
        
    Raises:
        HTTPException: 400 if validation fails, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Creating worker: {worker_data.first_name} {worker_data.last_name}")
    try:
        worker = service.register_staff(worker_data)
        logger.info(f"Successfully created worker with ID: {worker.id}")
        return worker
    except ValueError as e:
        logger.error(f"Validation error creating worker: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating worker: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create worker"
        )


@router.get("", response_model=schemas.StaffListResponse)
def list_workers(
    search: Optional[str] = None,
    service: WorkerService = Depends(get_worker_service),
    current_user: models.User = Depends(require_admin)
):
    """
    List all workers with optional search.
    
    Requirements:
    - 10.1: List all workers
    - 10.2: Search functionality
    - 17.1, 17.2: Authentication and authorization
    
    Args:
        search: Optional search query for first name or last name
        service: Worker service instance
        current_user: Authenticated admin user
        
    Returns:
        List of workers matching search criteria
        
    Raises:
        HTTPException: 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Listing workers with search: {search}")
    try:
        result = service.get_staff_list(search=search)
        logger.info(f"Retrieved {result.total} workers")
        return result
    except Exception as e:
        logger.error(f"Error listing workers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve workers"
        )


@router.get("/{worker_id}", response_model=schemas.StaffResponse)
def get_worker(
    worker_id: int,
    service: WorkerService = Depends(get_worker_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Get a worker by ID.
    
    Requirements:
    - 10.6: Retrieve worker by ID
    - 17.1, 17.2: Authentication and authorization
    - 19.1: Not found error handling
    
    Args:
        worker_id: ID of the worker to retrieve
        service: Worker service instance
        current_user: Authenticated admin user
        
    Returns:
        Worker with the specified ID
        
    Raises:
        HTTPException: 404 if not found, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Retrieving worker with ID: {worker_id}")
    try:
        worker = service.get_staff_by_id(worker_id)
        if worker is None:
            logger.warning(f"Worker not found with ID: {worker_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker with ID {worker_id} not found"
            )
        logger.info(f"Retrieved worker: {worker.first_name} {worker.last_name}")
        return worker
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving worker: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve worker"
        )


@router.put("/{worker_id}", response_model=schemas.StaffResponse)
def update_worker(
    worker_id: int,
    worker_data: schemas.StaffUpdate,
    service: WorkerService = Depends(get_worker_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Update a worker.
    
    Requirements:
    - 10.7: Update worker
    - 17.1, 17.2: Authentication and authorization
    - 19.2: Not found error handling
    
    Args:
        worker_id: ID of the worker to update
        worker_data: Updated worker data
        service: Worker service instance
        current_user: Authenticated admin user
        
    Returns:
        Updated worker
        
    Raises:
        HTTPException: 404 if not found, 400 if validation fails, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Updating worker with ID: {worker_id}")
    try:
        worker = service.update_staff(worker_id, worker_data)
        if worker is None:
            logger.warning(f"Worker not found with ID: {worker_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker with ID {worker_id} not found"
            )
        logger.info(f"Successfully updated worker with ID: {worker_id}")
        return worker
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating worker: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating worker: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update worker"
        )


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(
    worker_id: int,
    service: WorkerService = Depends(get_worker_service),
    current_user: models.User = Depends(require_admin)
):
    """
    Delete a worker.
    
    Requirements:
    - 10.8: Delete worker
    - 17.1, 17.2: Authentication and authorization
    - 19.3: Not found error handling
    
    Args:
        worker_id: ID of the worker to delete
        service: Worker service instance
        current_user: Authenticated admin user
        
    Returns:
        No content on success
        
    Raises:
        HTTPException: 404 if not found, 401 if unauthorized, 403 if not admin
    """
    logger.info(f"Deleting worker with ID: {worker_id}")
    try:
        success = service.delete_staff(worker_id)
        if not success:
            logger.warning(f"Worker not found with ID: {worker_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker with ID {worker_id} not found"
            )
        logger.info(f"Successfully deleted worker with ID: {worker_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting worker: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete worker"
        )
