"""
Basic tests for medical staff management.
These are placeholder tests to ensure the test suite runs.
"""

import pytest
from schemas import MedicalStaffCreate, MedicalStaffUpdate


def test_medical_staff_repository_create(medical_staff_repo, test_user):
    """Test creating a medical staff member"""
    staff_data = MedicalStaffCreate(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    created = medical_staff_repo.create(staff_data)
    
    assert created.id is not None
    assert created.user_id == test_user.id
    assert created.job_title == "Nurse"
    assert created.department == "Emergency"
    assert created.shift_schedule == "9-5"


def test_medical_staff_repository_get_by_id(medical_staff_repo, test_user):
    """Test retrieving a medical staff member by ID"""
    staff_data = MedicalStaffCreate(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    created = medical_staff_repo.create(staff_data)
    retrieved = medical_staff_repo.get_by_id(created.id)
    
    assert retrieved is not None
    assert retrieved.id == created.id
    assert retrieved.user_id == test_user.id


def test_medical_staff_repository_update(medical_staff_repo, test_user):
    """Test updating a medical staff member"""
    staff_data = MedicalStaffCreate(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    created = medical_staff_repo.create(staff_data)
    
    update_data = MedicalStaffUpdate(job_title="Senior Nurse")
    updated = medical_staff_repo.update(created.id, update_data)
    
    assert updated is not None
    assert updated.job_title == "Senior Nurse"
    assert updated.department == "Emergency"  # Unchanged


def test_medical_staff_repository_delete(medical_staff_repo, test_user):
    """Test deleting a medical staff member"""
    staff_data = MedicalStaffCreate(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    created = medical_staff_repo.create(staff_data)
    result = medical_staff_repo.delete(created.id)
    
    assert result is True
    
    retrieved = medical_staff_repo.get_by_id(created.id)
    assert retrieved is None
