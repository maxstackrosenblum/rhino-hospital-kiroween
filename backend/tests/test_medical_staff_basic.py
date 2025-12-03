"""
Basic tests for medical staff management.
Tests use direct database operations matching the router pattern.
"""

import pytest
from sqlalchemy import and_
from models import MedicalStaff
from datetime import datetime


def test_medical_staff_create(test_db, test_user):
    """Test creating a medical staff member"""
    medical_staff = MedicalStaff(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    test_db.add(medical_staff)
    test_db.commit()
    test_db.refresh(medical_staff)
    
    assert medical_staff.id is not None
    assert medical_staff.user_id == test_user.id
    assert medical_staff.job_title == "Nurse"
    assert medical_staff.department == "Emergency"
    assert medical_staff.shift_schedule == "9-5"
    assert medical_staff.created_at is not None
    assert medical_staff.deleted_at is None


def test_medical_staff_get_by_id(test_db, test_user):
    """Test retrieving a medical staff member by ID"""
    medical_staff = MedicalStaff(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    test_db.add(medical_staff)
    test_db.commit()
    test_db.refresh(medical_staff)
    
    retrieved = test_db.query(MedicalStaff).filter(
        MedicalStaff.id == medical_staff.id
    ).first()
    
    assert retrieved is not None
    assert retrieved.id == medical_staff.id
    assert retrieved.user_id == test_user.id
    assert retrieved.job_title == "Nurse"


def test_medical_staff_update(test_db, test_user):
    """Test updating a medical staff member"""
    medical_staff = MedicalStaff(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    test_db.add(medical_staff)
    test_db.commit()
    test_db.refresh(medical_staff)
    
    # Update the record
    medical_staff.job_title = "Senior Nurse"
    medical_staff.updated_at = datetime.utcnow()
    test_db.commit()
    test_db.refresh(medical_staff)
    
    assert medical_staff.job_title == "Senior Nurse"
    assert medical_staff.department == "Emergency"  # Unchanged


def test_medical_staff_soft_delete(test_db, test_user):
    """Test soft deleting a medical staff member"""
    medical_staff = MedicalStaff(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    test_db.add(medical_staff)
    test_db.commit()
    test_db.refresh(medical_staff)
    
    # Soft delete
    delete_time = datetime.utcnow()
    medical_staff.deleted_at = delete_time
    test_db.commit()
    
    # Verify soft delete
    retrieved = test_db.query(MedicalStaff).filter(
        and_(
            MedicalStaff.id == medical_staff.id,
            MedicalStaff.deleted_at.is_(None)
        )
    ).first()
    
    assert retrieved is None  # Should not be found when filtering out deleted
    
    # Verify record still exists in DB
    all_records = test_db.query(MedicalStaff).filter(
        MedicalStaff.id == medical_staff.id
    ).first()
    
    assert all_records is not None
    assert all_records.deleted_at == delete_time


def test_medical_staff_unique_user_constraint(test_db, test_user):
    """Test that one user can only have one medical staff record"""
    medical_staff1 = MedicalStaff(
        user_id=test_user.id,
        job_title="Nurse",
        department="Emergency",
        shift_schedule="9-5"
    )
    
    test_db.add(medical_staff1)
    test_db.commit()
    
    # Try to create another record for the same user
    medical_staff2 = MedicalStaff(
        user_id=test_user.id,
        job_title="Doctor",
        department="Surgery",
        shift_schedule="10-6"
    )
    
    test_db.add(medical_staff2)
    
    with pytest.raises(Exception):  # Should raise integrity error
        test_db.commit()
