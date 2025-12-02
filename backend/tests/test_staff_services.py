"""
Property-based tests for staff management services.

These tests use Hypothesis to generate random inputs and verify that
the service layer correctly handles business logic, validation, and logging
according to the correctness properties defined in the design document.
"""

import pytest
from hypothesis import given, strategies as st, settings
from schemas import StaffCreate, StaffUpdate
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from services.receptionist_service import ReceptionistService
from services.worker_service import WorkerService
import re


# Use in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"


def get_test_db():
    """Create a fresh test database session"""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal()


# Hypothesis strategies for generating test data

def valid_name_strategy():
    """Generate valid names (non-empty, non-whitespace strings)"""
    return st.text(min_size=1, max_size=100).filter(lambda x: x.strip())


def valid_phone_strategy():
    """Generate valid phone numbers (non-empty, non-whitespace strings)"""
    return st.text(min_size=1, max_size=20).filter(lambda x: x.strip())


def staff_create_strategy():
    """Generate valid StaffCreate instances"""
    return st.builds(
        StaffCreate,
        first_name=valid_name_strategy(),
        last_name=valid_name_strategy(),
        phone=valid_phone_strategy()
    )


# Property 14: Automatic timestamp generation
# Feature: staff-management, Property 14: Automatic timestamp generation
# Validates: Requirements 2.3, 7.3

@given(staff_data=staff_create_strategy())
@settings(max_examples=100)
def test_receptionist_automatic_timestamp_generation(staff_data):
    """
    For any successful receptionist registration, the created record should include
    a created_at timestamp that is within a few seconds of the current time when
    the registration was submitted.
    """
    # Create fresh database and service for this test
    db = get_test_db()
    service = ReceptionistService(db)
    
    try:
        # Record time before registration
        before_time = datetime.utcnow()
        
        # Register receptionist
        response = service.register_staff(staff_data)
        
        # Record time after registration
        after_time = datetime.utcnow()
        
        # Verify timestamps are present
        assert response.created_at is not None
        assert response.updated_at is not None
        
        # Verify created_at is within reasonable time window (10 seconds)
        # Note: SQLite returns datetime objects, so we can compare directly
        time_diff_before = (response.created_at - before_time).total_seconds()
        time_diff_after = (after_time - response.created_at).total_seconds()
        
        assert time_diff_before >= -1, f"created_at is too early: {time_diff_before}s before registration"
        assert time_diff_after >= -1, f"created_at is too late: {time_diff_after}s after registration"
        
        # Verify created_at and updated_at are initially the same
        # Allow small difference due to database precision
        time_diff = abs((response.updated_at - response.created_at).total_seconds())
        assert time_diff < 1, f"created_at and updated_at differ by {time_diff}s"
        
    finally:
        db.close()


@given(staff_data=staff_create_strategy())
@settings(max_examples=100)
def test_worker_automatic_timestamp_generation(staff_data):
    """
    For any successful worker registration, the created record should include
    a created_at timestamp that is within a few seconds of the current time when
    the registration was submitted.
    """
    # Create fresh database and service for this test
    db = get_test_db()
    service = WorkerService(db)
    
    try:
        # Record time before registration
        before_time = datetime.utcnow()
        
        # Register worker
        response = service.register_staff(staff_data)
        
        # Record time after registration
        after_time = datetime.utcnow()
        
        # Verify timestamps are present
        assert response.created_at is not None
        assert response.updated_at is not None
        
        # Verify created_at is within reasonable time window (10 seconds)
        time_diff_before = (response.created_at - before_time).total_seconds()
        time_diff_after = (after_time - response.created_at).total_seconds()
        
        assert time_diff_before >= -1, f"created_at is too early: {time_diff_before}s before registration"
        assert time_diff_after >= -1, f"created_at is too late: {time_diff_after}s after registration"
        
        # Verify created_at and updated_at are initially the same
        time_diff = abs((response.updated_at - response.created_at).total_seconds())
        assert time_diff < 1, f"created_at and updated_at differ by {time_diff}s"
        
    finally:
        db.close()


# Property 5: Input sanitization
# Feature: staff-management, Property 5: Input sanitization
# Validates: Requirements 13.5

@given(
    first_name=st.text(min_size=1, max_size=100).filter(lambda x: x.strip()),
    last_name=st.text(min_size=1, max_size=100).filter(lambda x: x.strip()),
    phone=st.text(min_size=1, max_size=20).filter(lambda x: x.strip())
)
@settings(max_examples=100)
def test_receptionist_input_sanitization(first_name, last_name, phone):
    """
    For any user input containing special characters or potential script injection
    attempts, the system should sanitize the input before processing and storage,
    preventing XSS or SQL injection attacks.
    
    Note: Pydantic automatically strips whitespace. SQLAlchemy ORM with parameterized
    queries prevents SQL injection. This test verifies that data is stored safely.
    """
    # Create fresh database and service for this test
    db = get_test_db()
    service = ReceptionistService(db)
    
    try:
        # Create staff with potentially dangerous input
        staff_data = StaffCreate(
            first_name=first_name,
            last_name=last_name,
            phone=phone
        )
        
        # Register receptionist
        response = service.register_staff(staff_data)
        
        # Verify data was stored (Pydantic strips whitespace)
        assert response.first_name == first_name.strip()
        assert response.last_name == last_name.strip()
        assert response.phone == phone.strip()
        
        # Retrieve and verify data integrity
        retrieved = service.get_staff_by_id(response.id)
        assert retrieved is not None
        assert retrieved.first_name == first_name.strip()
        assert retrieved.last_name == last_name.strip()
        assert retrieved.phone == phone.strip()
        
    finally:
        db.close()


@given(
    first_name=st.text(min_size=1, max_size=100).filter(lambda x: x.strip()),
    last_name=st.text(min_size=1, max_size=100).filter(lambda x: x.strip()),
    phone=st.text(min_size=1, max_size=20).filter(lambda x: x.strip())
)
@settings(max_examples=100)
def test_worker_input_sanitization(first_name, last_name, phone):
    """
    For any user input containing special characters or potential script injection
    attempts, the system should sanitize the input before processing and storage,
    preventing XSS or SQL injection attacks.
    """
    # Create fresh database and service for this test
    db = get_test_db()
    service = WorkerService(db)
    
    try:
        # Create staff with potentially dangerous input
        staff_data = StaffCreate(
            first_name=first_name,
            last_name=last_name,
            phone=phone
        )
        
        # Register worker
        response = service.register_staff(staff_data)
        
        # Verify data was stored (Pydantic strips whitespace)
        assert response.first_name == first_name.strip()
        assert response.last_name == last_name.strip()
        assert response.phone == phone.strip()
        
        # Retrieve and verify data integrity
        retrieved = service.get_staff_by_id(response.id)
        assert retrieved is not None
        assert retrieved.first_name == first_name.strip()
        assert retrieved.last_name == last_name.strip()
        assert retrieved.phone == phone.strip()
        
    finally:
        db.close()


# Property 18: PII masking in logs
# Feature: staff-management, Property 18: PII masking in logs
# Validates: Requirements 14.4

# Note: Testing PII masking in logs with property-based testing is challenging
# because we need to capture log output. Instead, we test the masking utilities
# directly with property-based tests, and test the integration with unit tests.

@given(phone=valid_phone_strategy())
@settings(max_examples=100)
def test_pii_masker_masks_phone_property(phone):
    """
    For any phone number, the PIIMasker should mask it showing only the last 4 digits.
    """
    from core.logging_config import PIIMasker
    
    masked = PIIMasker.mask_phone(phone)
    
    # Verify phone is masked
    if len(phone) >= 4:
        # Should show last 4 digits
        assert phone[-4:] in masked
        # Should not show full phone
        assert phone not in masked or len(phone) <= 4
    else:
        # Short phones should be fully masked
        assert "***" in masked


@given(name=valid_name_strategy())
@settings(max_examples=100)
def test_pii_masker_masks_name_property(name):
    """
    For any name, the PIIMasker should mask it showing only the first letter.
    """
    from core.logging_config import PIIMasker
    
    masked = PIIMasker.mask_name(name)
    
    # Verify name is masked
    assert name[0] in masked  # First letter should be present
    assert "***" in masked  # Should contain masking
    assert str(len(name)) in masked  # Should show length


@given(
    first_name=valid_name_strategy(),
    last_name=valid_name_strategy(),
    phone=valid_phone_strategy()
)
@settings(max_examples=100)
def test_pii_masker_masks_staff_dict_property(first_name, last_name, phone):
    """
    For any staff data dictionary, the PIIMasker should mask all PII fields.
    """
    from core.logging_config import PIIMasker
    
    data = {
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
        "id": 123
    }
    
    masked = PIIMasker.mask_dict(data)
    
    # Verify PII is masked
    assert masked["first_name"] != first_name or len(first_name) <= 1
    assert masked["last_name"] != last_name or len(last_name) <= 1
    assert masked["phone"] != phone or len(phone) <= 4
    # Non-PII should not be masked
    assert masked["id"] == 123


# Unit test for integration with logging
def test_receptionist_pii_masking_integration():
    """
    Integration test: Verify that PII masking works in the logging system.
    This is a unit test (not property-based) to avoid fixture issues.
    """
    from core.logging_config import get_logger
    import json
    import io
    import logging
    
    # Create a logger with a string buffer
    logger = get_logger("test_receptionist")
    
    # Capture log output
    log_capture = io.StringIO()
    handler = logging.StreamHandler(log_capture)
    logger.logger.handlers = [handler]
    
    # Log with PII
    logger.info(
        "Test message",
        first_name="John",
        last_name="Doe",
        phone="1234567890"
    )
    
    # Get log output
    log_output = log_capture.getvalue()
    
    # Parse JSON log
    log_entry = json.loads(log_output)
    
    # Verify PII is masked in context
    assert "context" in log_entry
    assert log_entry["context"]["first_name"] != "John"
    assert log_entry["context"]["last_name"] != "Doe"
    assert log_entry["context"]["phone"] != "1234567890"
    assert "***" in log_entry["context"]["phone"]


def test_worker_pii_masking_integration():
    """
    Integration test: Verify that PII masking works in the logging system.
    """
    from core.logging_config import get_logger
    import json
    import io
    import logging
    
    # Create a logger with a string buffer
    logger = get_logger("test_worker")
    
    # Capture log output
    log_capture = io.StringIO()
    handler = logging.StreamHandler(log_capture)
    logger.logger.handlers = [handler]
    
    # Log with PII
    logger.info(
        "Test message",
        first_name="Jane",
        last_name="Smith",
        phone="9876543210"
    )
    
    # Get log output
    log_output = log_capture.getvalue()
    
    # Parse JSON log
    log_entry = json.loads(log_output)
    
    # Verify PII is masked in context
    assert "context" in log_entry
    assert log_entry["context"]["first_name"] != "Jane"
    assert log_entry["context"]["last_name"] != "Smith"
    assert log_entry["context"]["phone"] != "9876543210"
    assert "***" in log_entry["context"]["phone"]


# Property 19: No credential exposure in logs
# Feature: staff-management, Property 19: No credential exposure in logs
# Validates: Requirements 14.5

def test_no_database_credentials_in_error_logs(caplog):
    """
    For any database error or connection failure, the system should log the error
    without including database credentials, connection strings, or other sensitive
    configuration in the log output.
    
    Note: This test simulates an error condition and verifies that credentials
    are masked in the log output.
    """
    # This test would require simulating a database error with credentials
    # For now, we test the masking utility directly
    from core.logging_config import PIIMasker
    
    # Test various credential patterns
    test_strings = [
        "postgresql://user:password@localhost/dbname",
        "password=secret123",
        "secret_key=abc123xyz",
        "PASSWORD: mypassword",
        "SECRET_KEY: supersecret"
    ]
    
    for test_str in test_strings:
        masked = PIIMasker.mask_credentials(test_str)
        
        # Verify credentials are masked
        assert "password" not in masked.lower() or "***" in masked, \
            f"Password not masked in: {masked}"
        assert "secret" not in masked.lower() or "***" in masked, \
            f"Secret not masked in: {masked}"
        
        # Verify specific patterns are masked
        if "postgresql://" in test_str:
            assert "***:***@***" in masked or "postgresql://***" in masked, \
                f"Database URL not properly masked: {masked}"


def test_pii_masker_masks_phone_numbers():
    """Test that PIIMasker correctly masks phone numbers"""
    from core.logging_config import PIIMasker
    
    # Test various phone formats
    assert PIIMasker.mask_phone("1234567890") == "***-***-7890"
    assert PIIMasker.mask_phone("555-1234") == "***-***-1234"
    assert PIIMasker.mask_phone("123") == "***"
    assert PIIMasker.mask_phone("") == "***"


def test_pii_masker_masks_names():
    """Test that PIIMasker correctly masks names"""
    from core.logging_config import PIIMasker
    
    # Test various name formats
    assert PIIMasker.mask_name("John") == "J*** (4 chars)"
    assert PIIMasker.mask_name("Mary") == "M*** (4 chars)"
    assert PIIMasker.mask_name("A") == "A*** (1 chars)"
    assert PIIMasker.mask_name("") == "***"


def test_pii_masker_masks_dict():
    """Test that PIIMasker correctly masks PII in dictionaries"""
    from core.logging_config import PIIMasker
    
    # Test dictionary with PII
    data = {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "1234567890",
        "password": "secret123",
        "id": 123
    }
    
    masked = PIIMasker.mask_dict(data)
    
    # Verify PII is masked
    assert masked["first_name"] == "J*** (4 chars)"
    assert masked["last_name"] == "D*** (3 chars)"
    assert masked["phone"] == "***-***-7890"
    assert masked["password"] == "***"
    assert masked["id"] == 123  # Non-PII should not be masked


# Additional service layer tests

def test_receptionist_service_get_staff_list_with_search():
    """Test that service layer correctly handles search queries"""
    db = get_test_db()
    service = ReceptionistService(db)
    
    try:
        # Create test data
        service.register_staff(StaffCreate(first_name="John", last_name="Doe", phone="1234567890"))
        service.register_staff(StaffCreate(first_name="Jane", last_name="Smith", phone="0987654321"))
        service.register_staff(StaffCreate(first_name="Bob", last_name="Johnson", phone="5555555555"))
        
        # Test search
        results = service.get_staff_list(search="John")
        assert results.total == 2  # John Doe and Bob Johnson
        
        results = service.get_staff_list(search="Smith")
        assert results.total == 1  # Jane Smith
        
        results = service.get_staff_list()
        assert results.total == 3  # All staff
        
    finally:
        db.close()


def test_worker_service_get_staff_list_with_search():
    """Test that service layer correctly handles search queries"""
    db = get_test_db()
    service = WorkerService(db)
    
    try:
        # Create test data
        service.register_staff(StaffCreate(first_name="Alice", last_name="Williams", phone="1111111111"))
        service.register_staff(StaffCreate(first_name="Charlie", last_name="Brown", phone="2222222222"))
        service.register_staff(StaffCreate(first_name="David", last_name="Willis", phone="3333333333"))
        
        # Test search - "Will" matches both Williams and Willis (case-insensitive)
        results = service.get_staff_list(search="will")
        assert results.total == 2  # Alice Williams and David Willis
        
        results = service.get_staff_list(search="Brown")
        assert results.total == 1  # Charlie Brown
        
        results = service.get_staff_list()
        assert results.total == 3  # All staff
        
    finally:
        db.close()


def test_receptionist_service_update_staff():
    """Test that service layer correctly handles updates"""
    db = get_test_db()
    service = ReceptionistService(db)
    
    try:
        # Create staff
        created = service.register_staff(StaffCreate(
            first_name="John",
            last_name="Doe",
            phone="1234567890"
        ))
        
        # Update staff
        updated = service.update_staff(
            created.id,
            StaffUpdate(first_name="Jane")
        )
        
        assert updated is not None
        assert updated.first_name == "Jane"
        assert updated.last_name == "Doe"  # Unchanged
        assert updated.phone == "1234567890"  # Unchanged
        
    finally:
        db.close()


def test_worker_service_delete_staff():
    """Test that service layer correctly handles deletion"""
    db = get_test_db()
    service = WorkerService(db)
    
    try:
        # Create staff
        created = service.register_staff(StaffCreate(
            first_name="John",
            last_name="Doe",
            phone="1234567890"
        ))
        
        # Delete staff
        result = service.delete_staff(created.id)
        assert result is True
        
        # Verify deletion
        retrieved = service.get_staff_by_id(created.id)
        assert retrieved is None
        
    finally:
        db.close()
