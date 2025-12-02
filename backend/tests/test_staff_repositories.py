"""
Property-based tests for staff management repositories.

These tests use Hypothesis to generate random inputs and verify that
the repository layer correctly handles CRUD operations according to the
correctness properties defined in the design document.
"""

import pytest
from hypothesis import given, strategies as st, assume, settings, HealthCheck
from schemas import StaffCreate, StaffUpdate
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from repositories import ReceptionistRepository, WorkerRepository


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


# Property 1: Staff registration round-trip consistency
# Feature: staff-management, Property 1: Staff registration round-trip consistency
# Validates: Requirements 2.4, 7.4, 11.1

@given(staff_data=staff_create_strategy())
@settings(max_examples=100)
def test_receptionist_registration_round_trip(staff_data):
    """
    For any valid receptionist with first name, last name, and phone number,
    creating the receptionist and then retrieving it from the database should
    return a record with all the same field values plus an automatically
    generated ID and timestamp.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    receptionist_repo = ReceptionistRepository(db)
    
    try:
        # Create receptionist
        created = receptionist_repo.create(staff_data)
        
        # Verify creation
        assert created.id is not None
        assert created.first_name == staff_data.first_name
        assert created.last_name == staff_data.last_name
        assert created.phone == staff_data.phone
        assert created.created_at is not None
        assert created.updated_at is not None
        
        # Retrieve receptionist
        retrieved = receptionist_repo.get_by_id(created.id)
        
        # Verify round-trip consistency
        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.first_name == staff_data.first_name
        assert retrieved.last_name == staff_data.last_name
        assert retrieved.phone == staff_data.phone
        assert retrieved.created_at == created.created_at
        assert retrieved.updated_at == created.updated_at
    finally:
        db.close()


@given(staff_data=staff_create_strategy())
@settings(max_examples=100)
def test_worker_registration_round_trip(staff_data):
    """
    For any valid worker with first name, last name, and phone number,
    creating the worker and then retrieving it from the database should
    return a record with all the same field values plus an automatically
    generated ID and timestamp.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    worker_repo = WorkerRepository(db)
    
    try:
        # Create worker
        created = worker_repo.create(staff_data)
        
        # Verify creation
        assert created.id is not None
        assert created.first_name == staff_data.first_name
        assert created.last_name == staff_data.last_name
        assert created.phone == staff_data.phone
        assert created.created_at is not None
        assert created.updated_at is not None
        
        # Retrieve worker
        retrieved = worker_repo.get_by_id(created.id)
        
        # Verify round-trip consistency
        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.first_name == staff_data.first_name
        assert retrieved.last_name == staff_data.last_name
        assert retrieved.phone == staff_data.phone
        assert retrieved.created_at == created.created_at
        assert retrieved.updated_at == created.updated_at
    finally:
        db.close()


# Property 2: Staff update preserves unmodified fields
# Feature: staff-management, Property 2: Staff update preserves unmodified fields
# Validates: Requirements 11.2

@given(
    initial_data=staff_create_strategy(),
    update_first_name=st.one_of(st.none(), valid_name_strategy()),
    update_last_name=st.one_of(st.none(), valid_name_strategy()),
    update_phone=st.one_of(st.none(), valid_phone_strategy())
)
@settings(max_examples=100)
def test_receptionist_update_preserves_unmodified_fields(
    initial_data, update_first_name, update_last_name, update_phone
):
    """
    For any existing receptionist and any partial update containing a subset of fields,
    updating the receptionist should modify only the specified fields while all other
    fields remain unchanged.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    receptionist_repo = ReceptionistRepository(db)
    
    try:
        # Create initial receptionist
        created = receptionist_repo.create(initial_data)
        original_id = created.id
        original_created_at = created.created_at
        
        # Create update with only some fields
        update_data = StaffUpdate(
            first_name=update_first_name,
            last_name=update_last_name,
            phone=update_phone
        )
        
        # Update receptionist
        updated = receptionist_repo.update(created.id, update_data)
        
        # Verify update
        assert updated is not None
        assert updated.id == original_id
        assert updated.created_at == original_created_at
        
        # Verify only specified fields were updated
        # Note: Pydantic strips whitespace, so we need to compare with the stripped values
        expected_first_name = update_data.first_name if update_data.first_name is not None else initial_data.first_name
        expected_last_name = update_data.last_name if update_data.last_name is not None else initial_data.last_name
        expected_phone = update_data.phone if update_data.phone is not None else initial_data.phone
        
        assert updated.first_name == expected_first_name
        assert updated.last_name == expected_last_name
        assert updated.phone == expected_phone
    finally:
        db.close()


@given(
    initial_data=staff_create_strategy(),
    update_first_name=st.one_of(st.none(), valid_name_strategy()),
    update_last_name=st.one_of(st.none(), valid_name_strategy()),
    update_phone=st.one_of(st.none(), valid_phone_strategy())
)
@settings(max_examples=100)
def test_worker_update_preserves_unmodified_fields(
    initial_data, update_first_name, update_last_name, update_phone
):
    """
    For any existing worker and any partial update containing a subset of fields,
    updating the worker should modify only the specified fields while all other
    fields remain unchanged.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    worker_repo = WorkerRepository(db)
    
    try:
        # Create initial worker
        created = worker_repo.create(initial_data)
        original_id = created.id
        original_created_at = created.created_at
        
        # Create update with only some fields
        update_data = StaffUpdate(
            first_name=update_first_name,
            last_name=update_last_name,
            phone=update_phone
        )
        
        # Update worker
        updated = worker_repo.update(created.id, update_data)
        
        # Verify update
        assert updated is not None
        assert updated.id == original_id
        assert updated.created_at == original_created_at
        
        # Verify only specified fields were updated
        # Note: Pydantic strips whitespace, so we need to compare with the stripped values
        expected_first_name = update_data.first_name if update_data.first_name is not None else initial_data.first_name
        expected_last_name = update_data.last_name if update_data.last_name is not None else initial_data.last_name
        expected_phone = update_data.phone if update_data.phone is not None else initial_data.phone
        
        assert updated.first_name == expected_first_name
        assert updated.last_name == expected_last_name
        assert updated.phone == expected_phone
    finally:
        db.close()


# Property 3: Staff deletion completeness
# Feature: staff-management, Property 3: Staff deletion completeness
# Validates: Requirements 5.5, 10.8, 11.3

@given(staff_data=staff_create_strategy())
@settings(max_examples=100)
def test_receptionist_deletion_completeness(staff_data):
    """
    For any existing receptionist, deleting the receptionist should result in
    that receptionist no longer being retrievable from the database by ID or
    appearing in any list queries.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    receptionist_repo = ReceptionistRepository(db)
    
    try:
        # Create receptionist
        created = receptionist_repo.create(staff_data)
        staff_id = created.id
        
        # Verify it exists
        assert receptionist_repo.get_by_id(staff_id) is not None
        
        # Delete receptionist
        result = receptionist_repo.delete(staff_id)
        assert result is True
        
        # Verify it no longer exists
        assert receptionist_repo.get_by_id(staff_id) is None
        
        # Verify it doesn't appear in list
        all_receptionists = receptionist_repo.get_all()
        assert not any(r.id == staff_id for r in all_receptionists)
    finally:
        db.close()


@given(staff_data=staff_create_strategy())
@settings(max_examples=100)
def test_worker_deletion_completeness(staff_data):
    """
    For any existing worker, deleting the worker should result in that worker
    no longer being retrievable from the database by ID or appearing in any
    list queries.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    worker_repo = WorkerRepository(db)
    
    try:
        # Create worker
        created = worker_repo.create(staff_data)
        staff_id = created.id
        
        # Verify it exists
        assert worker_repo.get_by_id(staff_id) is not None
        
        # Delete worker
        result = worker_repo.delete(staff_id)
        assert result is True
        
        # Verify it no longer exists
        assert worker_repo.get_by_id(staff_id) is None
        
        # Verify it doesn't appear in list
        all_workers = worker_repo.get_all()
        assert not any(w.id == staff_id for w in all_workers)
    finally:
        db.close()


@given(staff_data=staff_create_strategy())
@settings(max_examples=100)
def test_receptionist_delete_nonexistent_returns_false(staff_data):
    """
    Attempting to delete a non-existent receptionist should return False.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    receptionist_repo = ReceptionistRepository(db)
    
    try:
        # Create and delete a receptionist to get a valid ID
        created = receptionist_repo.create(staff_data)
        staff_id = created.id
        receptionist_repo.delete(staff_id)
        
        # Try to delete again
        result = receptionist_repo.delete(staff_id)
        assert result is False
    finally:
        db.close()


@given(staff_data=staff_create_strategy())
@settings(max_examples=100)
def test_worker_delete_nonexistent_returns_false(staff_data):
    """
    Attempting to delete a non-existent worker should return False.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    worker_repo = WorkerRepository(db)
    
    try:
        # Create and delete a worker to get a valid ID
        created = worker_repo.create(staff_data)
        staff_id = created.id
        worker_repo.delete(staff_id)
        
        # Try to delete again
        result = worker_repo.delete(staff_id)
        assert result is False
    finally:
        db.close()


# Property 8: Search filter correctness
# Feature: staff-management, Property 8: Search filter correctness
# Validates: Requirements 5.2, 10.2

@given(
    staff_list=st.lists(staff_create_strategy(), min_size=0, max_size=10),
    search_query=st.text(min_size=1, max_size=20)
)
@settings(max_examples=100)
def test_receptionist_search_filter_correctness(staff_list, search_query):
    """
    For any search query string and any list of receptionists, the filtered results
    should include only receptionists whose first name or last name contains the
    search query (case-insensitive), and should include all such matching receptionists.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    receptionist_repo = ReceptionistRepository(db)
    
    try:
        # Create all receptionists
        created_receptionists = [receptionist_repo.create(staff) for staff in staff_list]
        
        # Perform search
        search_results = receptionist_repo.search(search_query)
        
        # Verify all results match the query
        for receptionist in search_results:
            first_name_match = search_query.lower() in receptionist.first_name.lower()
            last_name_match = search_query.lower() in receptionist.last_name.lower()
            assert first_name_match or last_name_match, \
                f"Result {receptionist.first_name} {receptionist.last_name} doesn't match query '{search_query}'"
        
        # Verify all matching receptionists are included
        for receptionist in created_receptionists:
            first_name_match = search_query.lower() in receptionist.first_name.lower()
            last_name_match = search_query.lower() in receptionist.last_name.lower()
            
            if first_name_match or last_name_match:
                assert any(r.id == receptionist.id for r in search_results), \
                    f"Matching receptionist {receptionist.first_name} {receptionist.last_name} not in results"
    finally:
        db.close()


@given(
    staff_list=st.lists(staff_create_strategy(), min_size=0, max_size=10),
    search_query=st.text(min_size=1, max_size=20)
)
@settings(max_examples=100)
def test_worker_search_filter_correctness(staff_list, search_query):
    """
    For any search query string and any list of workers, the filtered results
    should include only workers whose first name or last name contains the
    search query (case-insensitive), and should include all such matching workers.
    """
    # Create fresh database and repository for this test
    db = get_test_db()
    worker_repo = WorkerRepository(db)
    
    try:
        # Create all workers
        created_workers = [worker_repo.create(staff) for staff in staff_list]
        
        # Perform search
        search_results = worker_repo.search(search_query)
        
        # Verify all results match the query
        for worker in search_results:
            first_name_match = search_query.lower() in worker.first_name.lower()
            last_name_match = search_query.lower() in worker.last_name.lower()
            assert first_name_match or last_name_match, \
                f"Result {worker.first_name} {worker.last_name} doesn't match query '{search_query}'"
        
        # Verify all matching workers are included
        for worker in created_workers:
            first_name_match = search_query.lower() in worker.first_name.lower()
            last_name_match = search_query.lower() in worker.last_name.lower()
            
            if first_name_match or last_name_match:
                assert any(w.id == worker.id for w in search_results), \
                    f"Matching worker {worker.first_name} {worker.last_name} not in results"
    finally:
        db.close()


# Additional unit tests for edge cases

def test_receptionist_get_by_id_nonexistent(receptionist_repo):
    """
    Getting a receptionist by non-existent ID should return None.
    """
    result = receptionist_repo.get_by_id(99999)
    assert result is None


def test_worker_get_by_id_nonexistent(worker_repo):
    """
    Getting a worker by non-existent ID should return None.
    """
    result = worker_repo.get_by_id(99999)
    assert result is None


def test_receptionist_update_nonexistent(receptionist_repo):
    """
    Updating a non-existent receptionist should return None.
    """
    update_data = StaffUpdate(first_name="John")
    result = receptionist_repo.update(99999, update_data)
    assert result is None


def test_worker_update_nonexistent(worker_repo):
    """
    Updating a non-existent worker should return None.
    """
    update_data = StaffUpdate(first_name="John")
    result = worker_repo.update(99999, update_data)
    assert result is None


def test_receptionist_get_all_pagination(receptionist_repo):
    """
    get_all should support pagination with skip and limit.
    """
    # Create multiple receptionists
    for i in range(5):
        receptionist_repo.create(StaffCreate(
            first_name=f"First{i}",
            last_name=f"Last{i}",
            phone=f"Phone{i}"
        ))
    
    # Test pagination
    page1 = receptionist_repo.get_all(skip=0, limit=2)
    assert len(page1) == 2
    
    page2 = receptionist_repo.get_all(skip=2, limit=2)
    assert len(page2) == 2
    
    # Verify no overlap
    page1_ids = {r.id for r in page1}
    page2_ids = {r.id for r in page2}
    assert len(page1_ids.intersection(page2_ids)) == 0


def test_worker_get_all_pagination(worker_repo):
    """
    get_all should support pagination with skip and limit.
    """
    # Create multiple workers
    for i in range(5):
        worker_repo.create(StaffCreate(
            first_name=f"First{i}",
            last_name=f"Last{i}",
            phone=f"Phone{i}"
        ))
    
    # Test pagination
    page1 = worker_repo.get_all(skip=0, limit=2)
    assert len(page1) == 2
    
    page2 = worker_repo.get_all(skip=2, limit=2)
    assert len(page2) == 2
    
    # Verify no overlap
    page1_ids = {w.id for w in page1}
    page2_ids = {w.id for w in page2}
    assert len(page1_ids.intersection(page2_ids)) == 0
