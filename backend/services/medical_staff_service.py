"""
Medical staff service for business logic operations.

This module provides the service layer for medical staff management,
extending the base staff service with medical staff-specific logic.
"""
from sqlalchemy.orm import Session
from models import MedicalStaff
from schemas import MedicalStaffCreate, MedicalStaffUpdate, MedicalStaffResponse
from repositories.medical_staff_repository import MedicalStaffRepository
from .base_staff_service import BaseStaffService


class MedicalStaffService(BaseStaffService[MedicalStaff, MedicalStaffCreate, MedicalStaffUpdate, MedicalStaffResponse]):
    """
    Service class for medical staff management operations.
    
    Extends BaseStaffService with medical staff-specific business logic.
    Uses dependency injection for the repository.
    """
    
    def __init__(self, db: Session):
        """
        Initialize medical staff service with repository dependency.
        
        Args:
            db: SQLAlchemy database session
        """
        repository = MedicalStaffRepository(db)
        super().__init__(repository, staff_type="medical_staff", response_schema_class=MedicalStaffResponse)
    
    # All CRUD operations are inherited from BaseStaffService
    # Additional medical staff-specific business logic can be added here if needed
