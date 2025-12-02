"""
Worker service for business logic operations.

This module provides the service layer for worker management,
extending the base staff service with worker-specific logic.

Requirements:
- 7.1: Worker registration submission
- 7.2: Validation of required fields
- 8.1: Success notification handling
- 9.1: Error alert handling
- 10.2: Search functionality
"""
from sqlalchemy.orm import Session
from models import Worker
from repositories.worker_repository import WorkerRepository
from .base_staff_service import BaseStaffService


class WorkerService(BaseStaffService[Worker]):
    """
    Service class for worker management operations.
    
    Extends BaseStaffService with worker-specific business logic.
    Uses dependency injection for the repository.
    
    Requirements:
    - 7.1, 7.2: Worker registration with validation
    - 8.1: Success handling
    - 9.1: Error handling
    - 10.2: Search functionality
    """
    
    def __init__(self, db: Session):
        """
        Initialize worker service with repository dependency.
        
        Args:
            db: SQLAlchemy database session
        """
        repository = WorkerRepository(db)
        super().__init__(repository, staff_type="worker")
    
    # All CRUD operations are inherited from BaseStaffService
    # Additional worker-specific business logic can be added here if needed
