"""Repository for medical staff data access operations"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from models import MedicalStaff, User
from schemas import MedicalStaffCreate, MedicalStaffUpdate
from .base import BaseStaffRepository


class MedicalStaffRepository(BaseStaffRepository[MedicalStaff, MedicalStaffCreate, MedicalStaffUpdate]):
    """
    Repository for medical staff CRUD operations.
    
    Requirements:
    - Search functionality with LIKE queries
    - Data persistence
    - Update operations
    - Delete operations
    """
    
    def create(self, staff_data: MedicalStaffCreate) -> MedicalStaff:
        """
        Create a new medical staff member.
        
        Args:
            staff_data: Medical staff creation data (user_id, job_title, department, shift_schedule)
            
        Returns:
            Created medical staff instance
        """
        medical_staff = MedicalStaff(
            user_id=staff_data.user_id,
            job_title=staff_data.job_title,
            department=staff_data.department,
            shift_schedule=staff_data.shift_schedule
        )
        self.db.add(medical_staff)
        self.db.commit()
        self.db.refresh(medical_staff)
        return medical_staff
    
    def get_by_id(self, staff_id: int) -> Optional[MedicalStaff]:
        """
        Retrieve a medical staff member by ID.
        
        Args:
            staff_id: Medical staff ID
            
        Returns:
            Medical staff instance if found, None otherwise
        """
        return self.db.query(MedicalStaff).options(joinedload(MedicalStaff.user)).filter(MedicalStaff.id == staff_id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[MedicalStaff]:
        """
        Retrieve all medical staff with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of medical staff instances
        """
        return self.db.query(MedicalStaff).options(joinedload(MedicalStaff.user)).offset(skip).limit(limit).all()
    
    def search(self, query: str) -> List[MedicalStaff]:
        """
        Search for medical staff by user's first name or last name.
        Uses case-insensitive LIKE queries.
        
        Args:
            query: Search query string
            
        Returns:
            List of medical staff instances matching the query
        """
        search_pattern = f"%{query}%"
        return self.db.query(MedicalStaff).options(joinedload(MedicalStaff.user)).join(User).filter(
            or_(
                User.first_name.ilike(search_pattern),
                User.last_name.ilike(search_pattern)
            )
        ).all()
    
    def update(self, staff_id: int, staff_data: MedicalStaffUpdate) -> Optional[MedicalStaff]:
        """
        Update an existing medical staff member.
        Only updates fields that are provided (not None).
        
        Args:
            staff_id: Medical staff ID
            staff_data: Medical staff update data (job_title, department, shift_schedule)
            
        Returns:
            Updated medical staff instance if found, None otherwise
        """
        medical_staff = self.get_by_id(staff_id)
        if not medical_staff:
            return None
        
        # Update only provided fields (exclude None values)
        update_data = staff_data.model_dump(exclude_unset=True, exclude_none=True)
        
        # Only commit if there are fields to update
        if update_data:
            for field, value in update_data.items():
                setattr(medical_staff, field, value)
            
            self.db.commit()
            self.db.refresh(medical_staff)
        
        return medical_staff
    
    def delete(self, staff_id: int) -> bool:
        """
        Delete a medical staff member.
        
        Args:
            staff_id: Medical staff ID
            
        Returns:
            True if deleted successfully, False if not found
        """
        medical_staff = self.get_by_id(staff_id)
        if not medical_staff:
            return False
        
        self.db.delete(medical_staff)
        self.db.commit()
        return True
