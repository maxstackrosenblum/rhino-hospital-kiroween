"""
Tests for receptionist schemas.

Tests the Pydantic schemas for receptionist management.
"""

import pytest
from pydantic import ValidationError
from schemas import ReceptionistCreate, ReceptionistUpdate, ReceptionistResponse


def test_receptionist_create_valid():
    """Test creating a valid receptionist schema"""
    data = ReceptionistCreate(
        user_id=1,
        shift_schedule="Monday-Friday 9AM-5PM",
        desk_number="Desk 5"
    )
    assert data.user_id == 1
    assert data.shift_schedule == "Monday-Friday 9AM-5PM"
    assert data.desk_number == "Desk 5"


def test_receptionist_create_minimal():
    """Test creating a receptionist with only required fields"""
    data = ReceptionistCreate(user_id=1)
    assert data.user_id == 1
    assert data.shift_schedule is None
    assert data.desk_number is None


def test_receptionist_create_missing_user_id():
    """Test that user_id is required"""
    with pytest.raises(ValidationError):
        ReceptionistCreate()


def test_receptionist_update_all_fields():
    """Test updating all fields"""
    data = ReceptionistUpdate(
        shift_schedule="Tuesday-Saturday 10AM-6PM",
        desk_number="Desk 10"
    )
    assert data.shift_schedule == "Tuesday-Saturday 10AM-6PM"
    assert data.desk_number == "Desk 10"


def test_receptionist_update_partial():
    """Test partial update"""
    data = ReceptionistUpdate(shift_schedule="Monday-Friday 8AM-4PM")
    assert data.shift_schedule == "Monday-Friday 8AM-4PM"
    assert data.desk_number is None


def test_receptionist_update_empty():
    """Test update with no fields"""
    data = ReceptionistUpdate()
    assert data.shift_schedule is None
    assert data.desk_number is None


def test_receptionist_response_from_dict():
    """Test creating response from dict"""
    data = {
        "id": 1,
        "user_id": 5,
        "shift_schedule": "Monday-Friday 9AM-5PM",
        "desk_number": "Desk 3",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "deleted_at": None
    }
    response = ReceptionistResponse(**data)
    assert response.id == 1
    assert response.user_id == 5
    assert response.shift_schedule == "Monday-Friday 9AM-5PM"
    assert response.desk_number == "Desk 3"
