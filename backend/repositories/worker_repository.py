"""Repository for worker data access operations"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import Worker
from schemas import StaffCreate, StaffUpdate
from .base import BaseStaffRepository


class WorkerRepository(BaseStaffRepository[Worker]):
    """
    Repository for worker CRUD operations.
    
    Requirements:
    - 10.2: Search functionality with LIKE queries
    - 11.1: Data persistence
    - 11.2: Update operations
    - 11.3: Delete operations
    """
    
    def create(self, staff_data: StaffCreate) -> Worker:
        """
        Create a new worker.
        
        Args:
            staff_data: Worker creation data
            
        Returns:
            Created worker instance
        """
        worker = Worker(
            first_name=staff_data.first_name,
            last_name=staff_data.last_name,
            phone=staff_data.phone
        )
        self.db.add(worker)
        self.db.commit()
        self.db.refresh(worker)
        return worker
    
    def get_by_id(self, staff_id: int) -> Optional[Worker]:
        """
        Retrieve a worker by ID.
        
        Args:
            staff_id: Worker ID
            
        Returns:
            Worker instance if found, None otherwise
        """
        return self.db.query(Worker).filter(Worker.id == staff_id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Worker]:
        """
        Retrieve all workers with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of worker instances
        """
        return self.db.query(Worker).offset(skip).limit(limit).all()
    
    def search(self, query: str) -> List[Worker]:
        """
        Search for workers by first name or last name.
        Uses case-insensitive LIKE queries.
        
        Args:
            query: Search query string
            
        Returns:
            List of worker instances matching the query
        """
        search_pattern = f"%{query}%"
        return self.db.query(Worker).filter(
            or_(
                Worker.first_name.ilike(search_pattern),
                Worker.last_name.ilike(search_pattern)
            )
        ).all()
    
    def update(self, staff_id: int, staff_data: StaffUpdate) -> Optional[Worker]:
        """
        Update an existing worker.
        Only updates fields that are provided (not None).
        
        Args:
            staff_id: Worker ID
            staff_data: Worker update data
            
        Returns:
            Updated worker instance if found, None otherwise
        """
        worker = self.get_by_id(staff_id)
        if not worker:
            return None
        
        # Update only provided fields (exclude None values)
        update_data = staff_data.model_dump(exclude_unset=True, exclude_none=True)
        
        # Only commit if there are fields to update
        if update_data:
            for field, value in update_data.items():
                setattr(worker, field, value)
            
            self.db.commit()
            self.db.refresh(worker)
        
        return worker
    
    def delete(self, staff_id: int) -> bool:
        """
        Delete a worker.
        
        Args:
            staff_id: Worker ID
            
        Returns:
            True if deleted successfully, False if not found
        """
        worker = self.get_by_id(staff_id)
        if not worker:
            return False
        
        self.db.delete(worker)
        self.db.commit()
        return True
