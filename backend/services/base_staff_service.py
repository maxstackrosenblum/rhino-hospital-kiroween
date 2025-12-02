"""
Base service class for staff management operations.

This module provides the base service layer that handles business logic,
validation, and logging for staff management operations.

Requirements:
- 12.1: Separation of business logic (Service Layer) from data access (Repository Layer)
- 14.3: Log successful operations with staff type and timestamp
"""
from abc import ABC
from typing import List, Optional, TypeVar, Generic
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from schemas import StaffCreate, StaffUpdate, StaffResponse, StaffListResponse
from repositories.base import BaseStaffRepository
from core.logging_config import get_logger

# Generic type for staff models
StaffModel = TypeVar('StaffModel')


class BaseStaffService(ABC, Generic[StaffModel]):
    """
    Base service class for staff management operations.
    
    Provides common business logic for receptionist and worker services,
    including validation, error handling, and structured logging.
    
    Requirements:
    - 12.1: Service layer with business logic separation
    - 14.3: Operation logging
    """
    
    def __init__(
        self,
        repository: BaseStaffRepository[StaffModel],
        staff_type: str
    ):
        """
        Initialize base staff service.
        
        Args:
            repository: Repository instance for data access
            staff_type: Type of staff ("receptionist" or "worker")
        """
        self.repository = repository
        self.staff_type = staff_type
        self.logger = get_logger(f"{__name__}.{staff_type}")
    
    def register_staff(self, staff_data: StaffCreate) -> StaffResponse:
        """
        Register a new staff member.
        
        Validates input, creates the staff record, and logs the operation.
        
        Requirements:
        - 2.1, 7.1: Staff registration submission
        - 2.2, 7.2: Validation of required fields
        - 14.3: Log successful operations
        
        Args:
            staff_data: Staff creation data
            
        Returns:
            StaffResponse with created staff details
            
        Raises:
            ValueError: If validation fails
            SQLAlchemyError: If database operation fails
        """
        try:
            # Log the registration attempt
            self.logger.info(
                f"Attempting to register {self.staff_type}",
                operation="register",
                staff_type=self.staff_type
            )
            
            # Additional business validation can be added here
            # (Pydantic already validates non-empty fields)
            
            # Create staff record via repository
            staff = self.repository.create(staff_data)
            
            # Log successful registration
            self.logger.log_operation_success(
                operation="register",
                staff_type=self.staff_type,
                staff_id=staff.id
            )
            
            # Convert to response schema
            return StaffResponse.model_validate(staff)
            
        except ValueError as e:
            # Log validation error
            self.logger.log_operation_error(
                operation="register",
                staff_type=self.staff_type,
                error=e
            )
            raise
        except SQLAlchemyError as e:
            # Log database error
            self.logger.log_operation_error(
                operation="register",
                staff_type=self.staff_type,
                error=e
            )
            raise
    
    def get_staff_by_id(self, staff_id: int) -> Optional[StaffResponse]:
        """
        Retrieve a staff member by ID.
        
        Args:
            staff_id: Staff member ID
            
        Returns:
            StaffResponse if found, None otherwise
        """
        try:
            self.logger.info(
                f"Retrieving {self.staff_type} by ID",
                operation="get_by_id",
                staff_type=self.staff_type,
                staff_id=staff_id
            )
            
            staff = self.repository.get_by_id(staff_id)
            
            if staff:
                self.logger.log_operation_success(
                    operation="get_by_id",
                    staff_type=self.staff_type,
                    staff_id=staff_id
                )
                return StaffResponse.model_validate(staff)
            else:
                self.logger.warning(
                    f"{self.staff_type.capitalize()} not found",
                    operation="get_by_id",
                    staff_type=self.staff_type,
                    staff_id=staff_id
                )
                return None
                
        except SQLAlchemyError as e:
            self.logger.log_operation_error(
                operation="get_by_id",
                staff_type=self.staff_type,
                error=e,
                staff_id=staff_id
            )
            raise
    
    def get_staff_list(self, search: Optional[str] = None) -> StaffListResponse:
        """
        Retrieve list of staff members with optional search.
        
        Requirements:
        - 5.2, 10.2: Search functionality
        - 14.3: Log operations
        
        Args:
            search: Optional search query for filtering by name
            
        Returns:
            StaffListResponse with list of staff members
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            self.logger.info(
                f"Retrieving {self.staff_type} list",
                operation="get_list",
                staff_type=self.staff_type,
                search_query=search if search else "none"
            )
            
            # Use search if provided, otherwise get all
            if search and search.strip():
                staff_list = self.repository.search(search.strip())
            else:
                staff_list = self.repository.get_all()
            
            # Log successful retrieval
            self.logger.log_operation_success(
                operation="get_list",
                staff_type=self.staff_type,
                count=len(staff_list),
                search_query=search if search else "none"
            )
            
            # Convert to response schema
            staff_responses = [
                StaffResponse.model_validate(staff)
                for staff in staff_list
            ]
            
            return StaffListResponse(
                items=staff_responses,
                total=len(staff_responses)
            )
            
        except SQLAlchemyError as e:
            self.logger.log_operation_error(
                operation="get_list",
                staff_type=self.staff_type,
                error=e,
                search_query=search if search else "none"
            )
            raise
    
    def update_staff(
        self,
        staff_id: int,
        staff_data: StaffUpdate
    ) -> Optional[StaffResponse]:
        """
        Update an existing staff member.
        
        Requirements:
        - 5.4, 10.7: Update operations
        - 11.2: Update preserves unmodified fields
        - 14.3: Log operations
        
        Args:
            staff_id: Staff member ID
            staff_data: Staff update data
            
        Returns:
            StaffResponse with updated staff details if found, None otherwise
            
        Raises:
            ValueError: If validation fails
            SQLAlchemyError: If database operation fails
        """
        try:
            self.logger.info(
                f"Attempting to update {self.staff_type}",
                operation="update",
                staff_type=self.staff_type,
                staff_id=staff_id
            )
            
            # Update via repository
            staff = self.repository.update(staff_id, staff_data)
            
            if staff:
                # Log successful update
                self.logger.log_operation_success(
                    operation="update",
                    staff_type=self.staff_type,
                    staff_id=staff_id
                )
                return StaffResponse.model_validate(staff)
            else:
                # Log not found
                self.logger.warning(
                    f"{self.staff_type.capitalize()} not found for update",
                    operation="update",
                    staff_type=self.staff_type,
                    staff_id=staff_id
                )
                return None
                
        except ValueError as e:
            self.logger.log_operation_error(
                operation="update",
                staff_type=self.staff_type,
                error=e,
                staff_id=staff_id
            )
            raise
        except SQLAlchemyError as e:
            self.logger.log_operation_error(
                operation="update",
                staff_type=self.staff_type,
                error=e,
                staff_id=staff_id
            )
            raise
    
    def delete_staff(self, staff_id: int) -> bool:
        """
        Delete a staff member.
        
        Requirements:
        - 5.5, 10.8: Delete operations
        - 11.3: Complete deletion
        - 14.3: Log operations
        
        Args:
            staff_id: Staff member ID
            
        Returns:
            True if deleted successfully, False if not found
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            self.logger.info(
                f"Attempting to delete {self.staff_type}",
                operation="delete",
                staff_type=self.staff_type,
                staff_id=staff_id
            )
            
            # Delete via repository
            deleted = self.repository.delete(staff_id)
            
            if deleted:
                # Log successful deletion
                self.logger.log_operation_success(
                    operation="delete",
                    staff_type=self.staff_type,
                    staff_id=staff_id
                )
            else:
                # Log not found
                self.logger.warning(
                    f"{self.staff_type.capitalize()} not found for deletion",
                    operation="delete",
                    staff_type=self.staff_type,
                    staff_id=staff_id
                )
            
            return deleted
            
        except SQLAlchemyError as e:
            self.logger.log_operation_error(
                operation="delete",
                staff_type=self.staff_type,
                error=e,
                staff_id=staff_id
            )
            raise
