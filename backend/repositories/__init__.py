"""Repository layer for data access operations"""
from .base import BaseStaffRepository
from .medical_staff_repository import MedicalStaffRepository

__all__ = [
    'BaseStaffRepository',
    'MedicalStaffRepository',
]
