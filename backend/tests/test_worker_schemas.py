"""
Tests for worker schemas.

Tests the Pydantic schemas for worker management.
"""

import pytest
from pydantic import ValidationError
from schemas import WorkerCreate, WorkerUpdate, WorkerResponse


def test_worker_create_valid():
    """Test creating a valid worker schema"""
    data = WorkerCreate(
        user_id=1,
        job_title="Janitor",
        department="Maintenance",
        shift_schedule="Monday-Friday 6AM-2PM"
    )
    assert data.user_id == 1
    assert data.job_title == "Janitor"
    assert data.department == "Maintenance"
    assert data.shift_schedule == "Monday-Friday 6AM-2PM"


def test_worker_create_minimal():
    """Test creating a worker with only required fields"""
    data = WorkerCreate(user_id=1)
    assert data.user_id == 1
    assert data.job_title is None
    assert data.department is None
    assert data.shift_schedule is None


def test_worker_create_missing_user_id():
    """Test that user_id is required"""
    with pytest.raises(ValidationError):
        WorkerCreate()


def test_worker_update_all_fields():
    """Test updating all fields"""
    data = WorkerUpdate(
        job_title="Senior Janitor",
        department="Facilities",
        shift_schedule="Tuesday-Saturday 7AM-3PM"
    )
    assert data.job_title == "Senior Janitor"
    assert data.department == "Facilities"
    assert data.shift_schedule == "Tuesday-Saturday 7AM-3PM"


def test_worker_update_partial():
    """Test partial update"""
    data = WorkerUpdate(job_title="Lead Janitor")
    assert data.job_title == "Lead Janitor"
    assert data.department is None
    assert data.shift_schedule is None


def test_worker_update_empty():
    """Test update with no fields"""
    data = WorkerUpdate()
    assert data.job_title is None
    assert data.department is None
    assert data.shift_schedule is None


def test_worker_response_from_dict():
    """Test creating response from dict"""
    data = {
        "id": 1,
        "user_id": 5,
        "job_title": "Janitor",
        "department": "Maintenance",
        "shift_schedule": "Monday-Friday 6AM-2PM",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "deleted_at": None
    }
    response = WorkerResponse(**data)
    assert response.id == 1
    assert response.user_id == 5
    assert response.job_title == "Janitor"
    assert response.department == "Maintenance"
    assert response.shift_schedule == "Monday-Friday 6AM-2PM"
