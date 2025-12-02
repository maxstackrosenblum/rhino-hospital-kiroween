"""Base repository interface for staff management"""
from abc import ABC, abstractmethod
from typing import List, Optional, TypeVar, Generic
from sqlalchemy.orm import Session

# Generic types for staff models and schemas
StaffModel = TypeVar('StaffModel')
StaffCreateSchema = TypeVar('StaffCreateSchema')
StaffUpdateSchema = TypeVar('StaffUpdateSchema')


class BaseStaffRepository(ABC, Generic[StaffModel, StaffCreateSchema, StaffUpdateSchema]):
    """
    Abstract base class for staff repository operations.
    Defines the interface for CRUD operations on staff entities.
    
    Requirements: 12.1 - Architecture and Code Organization
    """
    
    def __init__(self, db: Session):
        """
        Initialize repository with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    @abstractmethod
    def create(self, staff_data: StaffCreateSchema) -> StaffModel:
        """
        Create a new staff member.
        
        Args:
            staff_data: Staff creation data
            
        Returns:
            Created staff model instance
        """
        pass
    
    @abstractmethod
    def get_by_id(self, staff_id: int) -> Optional[StaffModel]:
        """
        Retrieve a staff member by ID.
        
        Args:
            staff_id: Staff member ID
            
        Returns:
            Staff model instance if found, None otherwise
        """
        pass
    
    @abstractmethod
    def get_all(self, skip: int = 0, limit: int = 100) -> List[StaffModel]:
        """
        Retrieve all staff members with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of staff model instances
        """
        pass
    
    @abstractmethod
    def search(self, query: str) -> List[StaffModel]:
        """
        Search for staff members by name.
        
        Args:
            query: Search query string
            
        Returns:
            List of staff model instances matching the query
        """
        pass
    
    @abstractmethod
    def update(self, staff_id: int, staff_data: StaffUpdateSchema) -> Optional[StaffModel]:
        """
        Update an existing staff member.
        
        Args:
            staff_id: Staff member ID
            staff_data: Staff update data
            
        Returns:
            Updated staff model instance if found, None otherwise
        """
        pass
    
    @abstractmethod
    def delete(self, staff_id: int) -> bool:
        """
        Delete a staff member.
        
        Args:
            staff_id: Staff member ID
            
        Returns:
            True if deleted successfully, False if not found
        """
        pass
