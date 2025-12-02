"""
Tests for receptionist repository.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Receptionist, User, UserRole
from repositories.receptionist_repository import ReceptionistRepository
from schemas import ReceptionistCreate, ReceptionistUpdate


@pytest.fixture
def db_session():
    """Create a test database session"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    user = User(
        email="test@example.com",
        username="testuser",
        first_name="Test",
        last_name="User",
        hashed_password="hashed",
        role=UserRole.RECEPTIONIST
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def receptionist_repo(db_session):
    """Create a receptionist repository"""
    return ReceptionistRepository(db_session)


def test_create_receptionist(receptionist_repo, test_user):
    """Test creating a receptionist"""
    data = ReceptionistCreate(
        user_id=test_user.id,
        shift_schedule="Monday-Friday 9AM-5PM",
        desk_number="Desk 5"
    )
    receptionist = receptionist_repo.create(data)
    
    assert receptionist.id is not None
    assert receptionist.user_id == test_user.id
    assert receptionist.shift_schedule == "Monday-Friday 9AM-5PM"
    assert receptionist.desk_number == "Desk 5"


def test_get_receptionist_by_id(receptionist_repo, test_user):
    """Test retrieving a receptionist by ID"""
    data = ReceptionistCreate(user_id=test_user.id, desk_number="Desk 1")
    created = receptionist_repo.create(data)
    
    retrieved = receptionist_repo.get_by_id(created.id)
    assert retrieved is not None
    assert retrieved.id == created.id
    assert retrieved.user_id == test_user.id


def test_get_receptionist_by_id_not_found(receptionist_repo):
    """Test retrieving a non-existent receptionist"""
    result = receptionist_repo.get_by_id(99999)
    assert result is None


def test_get_all_receptionists(receptionist_repo, test_user, db_session):
    """Test retrieving all receptionists"""
    # Create multiple users and receptionists
    for i in range(3):
        user = User(
            email=f"user{i}@example.com",
            username=f"user{i}",
            first_name=f"First{i}",
            last_name=f"Last{i}",
            hashed_password="hashed",
            role=UserRole.RECEPTIONIST
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        data = ReceptionistCreate(user_id=user.id, desk_number=f"Desk {i}")
        receptionist_repo.create(data)
    
    receptionists = receptionist_repo.get_all()
    assert len(receptionists) == 3


def test_search_receptionists(receptionist_repo, db_session):
    """Test searching receptionists by user name"""
    # Create users with different names
    user1 = User(
        email="alice@example.com",
        username="alice",
        first_name="Alice",
        last_name="Johnson",
        hashed_password="hashed",
        role=UserRole.RECEPTIONIST
    )
    user2 = User(
        email="bob@example.com",
        username="bob",
        first_name="Bob",
        last_name="Williams",
        hashed_password="hashed",
        role=UserRole.RECEPTIONIST
    )
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)
    
    receptionist_repo.create(ReceptionistCreate(user_id=user1.id))
    receptionist_repo.create(ReceptionistCreate(user_id=user2.id))
    
    # Search for "Alice"
    results = receptionist_repo.search("Alice")
    assert len(results) == 1
    assert results[0].user_id == user1.id


def test_update_receptionist(receptionist_repo, test_user):
    """Test updating a receptionist"""
    data = ReceptionistCreate(user_id=test_user.id, desk_number="Desk 1")
    receptionist = receptionist_repo.create(data)
    
    update_data = ReceptionistUpdate(desk_number="Desk 10", shift_schedule="Tuesday-Saturday 10AM-6PM")
    updated = receptionist_repo.update(receptionist.id, update_data)
    
    assert updated is not None
    assert updated.desk_number == "Desk 10"
    assert updated.shift_schedule == "Tuesday-Saturday 10AM-6PM"


def test_update_receptionist_not_found(receptionist_repo):
    """Test updating a non-existent receptionist"""
    update_data = ReceptionistUpdate(desk_number="Test")
    result = receptionist_repo.update(99999, update_data)
    assert result is None


def test_delete_receptionist(receptionist_repo, test_user):
    """Test deleting a receptionist"""
    data = ReceptionistCreate(user_id=test_user.id)
    receptionist = receptionist_repo.create(data)
    
    deleted = receptionist_repo.delete(receptionist.id)
    assert deleted is True
    
    # Verify it's deleted
    result = receptionist_repo.get_by_id(receptionist.id)
    assert result is None


def test_delete_receptionist_not_found(receptionist_repo):
    """Test deleting a non-existent receptionist"""
    result = receptionist_repo.delete(99999)
    assert result is False
