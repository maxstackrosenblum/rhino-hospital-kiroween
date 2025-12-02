"""
Property-based tests for staff management schemas.

These tests use Hypothesis to generate random inputs and verify that
the Pydantic schemas correctly validate staff data according to the
correctness properties defined in the design document.
"""

import pytest
from hypothesis import given, strategies as st
from pydantic import ValidationError
from schemas import StaffCreate, StaffUpdate, StaffResponse, StaffListResponse
from datetime import datetime


# Hypothesis strategies for generating test data

def valid_name_strategy():
    """Generate valid names (non-empty, non-whitespace strings)"""
    return st.text(min_size=1, max_size=100).filter(lambda x: x.strip())


def valid_phone_strategy():
    """Generate valid phone numbers (non-empty, non-whitespace strings)"""
    return st.text(min_size=1, max_size=20).filter(lambda x: x.strip())


def whitespace_string_strategy():
    """Generate strings that are empty or contain only whitespace"""
    return st.one_of(
        st.just(""),
        st.just(" "),
        st.just("  "),
        st.just("\t"),
        st.just("\n"),
        st.just("   \t\n  ")
    )


# Property 4: Empty field rejection
# Feature: staff-management, Property 4: Empty field rejection
# Validates: Requirements 2.2, 2.5, 7.2, 7.5

@given(
    first_name=whitespace_string_strategy(),
    last_name=valid_name_strategy(),
    phone=valid_phone_strategy()
)
def test_staff_create_rejects_empty_first_name(first_name, last_name, phone):
    """
    For any staff registration request where first_name is empty or whitespace-only,
    the system should reject the request.
    """
    with pytest.raises(ValidationError) as exc_info:
        StaffCreate(first_name=first_name, last_name=last_name, phone=phone)
    
    # Verify the error is about the first_name field
    errors = exc_info.value.errors()
    assert any(error['loc'] == ('first_name',) for error in errors)


@given(
    first_name=valid_name_strategy(),
    last_name=whitespace_string_strategy(),
    phone=valid_phone_strategy()
)
def test_staff_create_rejects_empty_last_name(first_name, last_name, phone):
    """
    For any staff registration request where last_name is empty or whitespace-only,
    the system should reject the request.
    """
    with pytest.raises(ValidationError) as exc_info:
        StaffCreate(first_name=first_name, last_name=last_name, phone=phone)
    
    # Verify the error is about the last_name field
    errors = exc_info.value.errors()
    assert any(error['loc'] == ('last_name',) for error in errors)


@given(
    first_name=valid_name_strategy(),
    last_name=valid_name_strategy(),
    phone=whitespace_string_strategy()
)
def test_staff_create_rejects_empty_phone(first_name, last_name, phone):
    """
    For any staff registration request where phone is empty or whitespace-only,
    the system should reject the request.
    """
    with pytest.raises(ValidationError) as exc_info:
        StaffCreate(first_name=first_name, last_name=last_name, phone=phone)
    
    # Verify the error is about the phone field
    errors = exc_info.value.errors()
    assert any(error['loc'] == ('phone',) for error in errors)


@given(
    first_name=st.one_of(whitespace_string_strategy(), st.none()),
    last_name=valid_name_strategy(),
    phone=valid_phone_strategy()
)
def test_staff_update_rejects_empty_first_name_if_provided(first_name, last_name, phone):
    """
    For any staff update request where first_name is provided but empty or whitespace-only,
    the system should reject the request.
    """
    if first_name is None:
        # None is allowed for optional updates
        staff_update = StaffUpdate(first_name=first_name, last_name=last_name, phone=phone)
        assert staff_update.first_name is None
    else:
        # Empty/whitespace should be rejected
        with pytest.raises(ValidationError) as exc_info:
            StaffUpdate(first_name=first_name, last_name=last_name, phone=phone)
        
        errors = exc_info.value.errors()
        assert any(error['loc'] == ('first_name',) for error in errors)


@given(
    first_name=valid_name_strategy(),
    last_name=st.one_of(whitespace_string_strategy(), st.none()),
    phone=valid_phone_strategy()
)
def test_staff_update_rejects_empty_last_name_if_provided(first_name, last_name, phone):
    """
    For any staff update request where last_name is provided but empty or whitespace-only,
    the system should reject the request.
    """
    if last_name is None:
        # None is allowed for optional updates
        staff_update = StaffUpdate(first_name=first_name, last_name=last_name, phone=phone)
        assert staff_update.last_name is None
    else:
        # Empty/whitespace should be rejected
        with pytest.raises(ValidationError) as exc_info:
            StaffUpdate(first_name=first_name, last_name=last_name, phone=phone)
        
        errors = exc_info.value.errors()
        assert any(error['loc'] == ('last_name',) for error in errors)


@given(
    first_name=valid_name_strategy(),
    last_name=valid_name_strategy(),
    phone=st.one_of(whitespace_string_strategy(), st.none())
)
def test_staff_update_rejects_empty_phone_if_provided(first_name, last_name, phone):
    """
    For any staff update request where phone is provided but empty or whitespace-only,
    the system should reject the request.
    """
    if phone is None:
        # None is allowed for optional updates
        staff_update = StaffUpdate(first_name=first_name, last_name=last_name, phone=phone)
        assert staff_update.phone is None
    else:
        # Empty/whitespace should be rejected
        with pytest.raises(ValidationError) as exc_info:
            StaffUpdate(first_name=first_name, last_name=last_name, phone=phone)
        
        errors = exc_info.value.errors()
        assert any(error['loc'] == ('phone',) for error in errors)


# Property 6: Pydantic validation enforcement
# Feature: staff-management, Property 6: Pydantic validation enforcement
# Validates: Requirements 13.1

@given(
    first_name=valid_name_strategy(),
    last_name=valid_name_strategy(),
    phone=valid_phone_strategy()
)
def test_staff_create_validates_and_sanitizes_input(first_name, last_name, phone):
    """
    For any valid staff registration request, the Pydantic model should validate
    the data and strip whitespace and null characters from fields before processing.
    """
    # Add leading/trailing whitespace to test sanitization
    staff_data = StaffCreate(
        first_name=f"  {first_name}  ",
        last_name=f"  {last_name}  ",
        phone=f"  {phone}  "
    )
    
    # Verify that whitespace and null characters are stripped
    expected_first = first_name.strip().replace('\x00', '')
    expected_last = last_name.strip().replace('\x00', '')
    expected_phone = phone.strip().replace('\x00', '')
    assert staff_data.first_name == expected_first
    assert staff_data.last_name == expected_last
    assert staff_data.phone == expected_phone


@given(
    first_name=valid_name_strategy(),
    last_name=valid_name_strategy(),
    phone=valid_phone_strategy()
)
def test_staff_update_validates_and_sanitizes_input(first_name, last_name, phone):
    """
    For any valid staff update request, the Pydantic model should validate
    the data and strip whitespace and null characters from fields before processing.
    """
    # Add leading/trailing whitespace to test sanitization
    staff_data = StaffUpdate(
        first_name=f"  {first_name}  ",
        last_name=f"  {last_name}  ",
        phone=f"  {phone}  "
    )
    
    # Verify that whitespace and null characters are stripped
    expected_first = first_name.strip().replace('\x00', '')
    expected_last = last_name.strip().replace('\x00', '')
    expected_phone = phone.strip().replace('\x00', '')
    assert staff_data.first_name == expected_first
    assert staff_data.last_name == expected_last
    assert staff_data.phone == expected_phone


def test_staff_create_requires_all_fields():
    """
    StaffCreate should require all fields (first_name, last_name, phone).
    """
    # Missing first_name
    with pytest.raises(ValidationError):
        StaffCreate(last_name="Doe", phone="1234567890")
    
    # Missing last_name
    with pytest.raises(ValidationError):
        StaffCreate(first_name="John", phone="1234567890")
    
    # Missing phone
    with pytest.raises(ValidationError):
        StaffCreate(first_name="John", last_name="Doe")


def test_staff_update_allows_optional_fields():
    """
    StaffUpdate should allow all fields to be optional (None).
    """
    # All fields None is valid
    staff_update = StaffUpdate()
    assert staff_update.first_name is None
    assert staff_update.last_name is None
    assert staff_update.phone is None
    
    # Partial updates are valid
    staff_update = StaffUpdate(first_name="John")
    assert staff_update.first_name == "John"
    assert staff_update.last_name is None
    assert staff_update.phone is None


def test_staff_response_schema_structure():
    """
    StaffResponse should have all required fields with correct types.
    """
    staff_response = StaffResponse(
        id=1,
        first_name="John",
        last_name="Doe",
        phone="1234567890",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    assert staff_response.id == 1
    assert staff_response.first_name == "John"
    assert staff_response.last_name == "Doe"
    assert staff_response.phone == "1234567890"
    assert isinstance(staff_response.created_at, datetime)
    assert isinstance(staff_response.updated_at, datetime)


def test_staff_list_response_schema_structure():
    """
    StaffListResponse should contain a list of StaffResponse items and a total count.
    """
    staff_list = StaffListResponse(
        items=[
            StaffResponse(
                id=1,
                first_name="John",
                last_name="Doe",
                phone="1234567890",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ],
        total=1
    )
    
    assert len(staff_list.items) == 1
    assert staff_list.total == 1
    assert isinstance(staff_list.items[0], StaffResponse)
