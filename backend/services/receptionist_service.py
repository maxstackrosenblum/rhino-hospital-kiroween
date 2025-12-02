"""
Receptionist service for business logic operations.

This module provides the service layer for receptionist management,
extending the base staff service with receptionist-specific logic.

Requirements:
- 2.1: Receptionist registration submission
- 2.2: Validation of required fields
- 3.1: Success notification handling
- 4.1: Error alert handling
- 5.2: Search functionality
"""
from sqlalchemy.orm import Session
from models import Receptionist
from schemas import ReceptionistCreate, ReceptionistUpdate, ReceptionistResponse
from repositories.receptionist_repository import ReceptionistRepository
from .base_staff_service import BaseStaffService


class ReceptionistService(BaseStaffService[Receptionist, ReceptionistCreate, ReceptionistUpdate, ReceptionistResponse]):
    """
    Service class for receptionist management operations.
    
    Extends BaseStaffService with receptionist-specific business logic.
    Uses dependency injection for the repository.
    
    Requirements:
    - 2.1, 2.2: Receptionist registration with validation
    - 3.1: Success handling
    - 4.1: Error handling
    - 5.2: Search functionality
    """
    
    def __init__(self, db: Session):
        """
        Initialize receptionist service with repository dependency.
        
        Args:
            db: SQLAlchemy database session
        """
        repository = ReceptionistRepository(db)
        super().__init__(repository, staff_type="receptionist", response_schema_class=ReceptionistResponse)
    
    # All CRUD operations are inherited from BaseStaffService
    # Additional receptionist-specific business logic can be added here if needed
