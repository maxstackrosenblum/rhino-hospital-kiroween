"""Repository for receptionist data access operations"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import Receptionist
from schemas import StaffCreate, StaffUpdate
from .base import BaseStaffRepository


class ReceptionistRepository(BaseStaffRepository[Receptionist]):
    """
    Repository for receptionist CRUD operations.
    
    Requirements:
    - 5.2: Search functionality with LIKE queries
    - 11.1: Data persistence
    - 11.2: Update operations
    - 11.3: Delete operations
    """
    
    def create(self, staff_data: StaffCreate) -> Receptionist:
        """
        Create a new receptionist.
        
        Args:
            staff_data: Receptionist creation data
            
        Returns:
            Created receptionist instance
        """
        receptionist = Receptionist(
            first_name=staff_data.first_name,
            last_name=staff_data.last_name,
            phone=staff_data.phone
        )
        self.db.add(receptionist)
        self.db.commit()
        self.db.refresh(receptionist)
        return receptionist
    
    def get_by_id(self, staff_id: int) -> Optional[Receptionist]:
        """
        Retrieve a receptionist by ID.
        
        Args:
            staff_id: Receptionist ID
            
        Returns:
            Receptionist instance if found, None otherwise
        """
        return self.db.query(Receptionist).filter(Receptionist.id == staff_id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Receptionist]:
        """
        Retrieve all receptionists with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of receptionist instances
        """
        return self.db.query(Receptionist).offset(skip).limit(limit).all()
    
    def search(self, query: str) -> List[Receptionist]:
        """
        Search for receptionists by first name or last name.
        Uses case-insensitive LIKE queries.
        
        Args:
            query: Search query string
            
        Returns:
            List of receptionist instances matching the query
        """
        search_pattern = f"%{query}%"
        return self.db.query(Receptionist).filter(
            or_(
                Receptionist.first_name.ilike(search_pattern),
                Receptionist.last_name.ilike(search_pattern)
            )
        ).all()
    
    def update(self, staff_id: int, staff_data: StaffUpdate) -> Optional[Receptionist]:
        """
        Update an existing receptionist.
        Only updates fields that are provided (not None).
        
        Args:
            staff_id: Receptionist ID
            staff_data: Receptionist update data
            
        Returns:
            Updated receptionist instance if found, None otherwise
        """
        receptionist = self.get_by_id(staff_id)
        if not receptionist:
            return None
        
        # Update only provided fields (exclude None values)
        update_data = staff_data.model_dump(exclude_unset=True, exclude_none=True)
        
        # Only commit if there are fields to update
        if update_data:
            for field, value in update_data.items():
                setattr(receptionist, field, value)
            
            self.db.commit()
            self.db.refresh(receptionist)
        
        return receptionist
    
    def delete(self, staff_id: int) -> bool:
        """
        Delete a receptionist.
        
        Args:
            staff_id: Receptionist ID
            
        Returns:
            True if deleted successfully, False if not found
        """
        receptionist = self.get_by_id(staff_id)
        if not receptionist:
            return False
        
        self.db.delete(receptionist)
        self.db.commit()
        return True
