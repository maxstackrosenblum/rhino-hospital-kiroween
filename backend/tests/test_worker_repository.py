"""
Tests for worker repository.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Worker, User, UserRole
from repositories.worker_repository import WorkerRepository
from schemas import WorkerCreate, WorkerUpdate


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
        role=UserRole.WORKER
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def worker_repo(db_session):
    """Create a worker repository"""
    return WorkerRepository(db_session)


def test_create_worker(worker_repo, test_user):
    """Test creating a worker"""
    data = WorkerCreate(
        user_id=test_user.id,
        job_title="Janitor",
        department="Maintenance",
        shift_schedule="Monday-Friday 6AM-2PM"
    )
    worker = worker_repo.create(data)
    
    assert worker.id is not None
    assert worker.user_id == test_user.id
    assert worker.job_title == "Janitor"
    assert worker.department == "Maintenance"
    assert worker.shift_schedule == "Monday-Friday 6AM-2PM"


def test_get_worker_by_id(worker_repo, test_user):
    """Test retrieving a worker by ID"""
    data = WorkerCreate(user_id=test_user.id, job_title="Janitor")
    created = worker_repo.create(data)
    
    retrieved = worker_repo.get_by_id(created.id)
    assert retrieved is not None
    assert retrieved.id == created.id
    assert retrieved.user_id == test_user.id


def test_get_worker_by_id_not_found(worker_repo):
    """Test retrieving a non-existent worker"""
    result = worker_repo.get_by_id(99999)
    assert result is None


def test_get_all_workers(worker_repo, test_user, db_session):
    """Test retrieving all workers"""
    # Create multiple users and workers
    for i in range(3):
        user = User(
            email=f"user{i}@example.com",
            username=f"user{i}",
            first_name=f"First{i}",
            last_name=f"Last{i}",
            hashed_password="hashed",
            role=UserRole.WORKER
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        data = WorkerCreate(user_id=user.id, job_title=f"Job{i}")
        worker_repo.create(data)
    
    workers = worker_repo.get_all()
    assert len(workers) == 3


def test_search_workers(worker_repo, db_session):
    """Test searching workers by user name"""
    # Create users with different names
    user1 = User(
        email="john@example.com",
        username="john",
        first_name="John",
        last_name="Doe",
        hashed_password="hashed",
        role=UserRole.WORKER
    )
    user2 = User(
        email="jane@example.com",
        username="jane",
        first_name="Jane",
        last_name="Smith",
        hashed_password="hashed",
        role=UserRole.WORKER
    )
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)
    
    worker_repo.create(WorkerCreate(user_id=user1.id))
    worker_repo.create(WorkerCreate(user_id=user2.id))
    
    # Search for "John"
    results = worker_repo.search("John")
    assert len(results) == 1
    assert results[0].user_id == user1.id


def test_update_worker(worker_repo, test_user):
    """Test updating a worker"""
    data = WorkerCreate(user_id=test_user.id, job_title="Janitor")
    worker = worker_repo.create(data)
    
    update_data = WorkerUpdate(job_title="Senior Janitor", department="Facilities")
    updated = worker_repo.update(worker.id, update_data)
    
    assert updated is not None
    assert updated.job_title == "Senior Janitor"
    assert updated.department == "Facilities"


def test_update_worker_not_found(worker_repo):
    """Test updating a non-existent worker"""
    update_data = WorkerUpdate(job_title="Test")
    result = worker_repo.update(99999, update_data)
    assert result is None


def test_delete_worker(worker_repo, test_user):
    """Test deleting a worker"""
    data = WorkerCreate(user_id=test_user.id)
    worker = worker_repo.create(data)
    
    deleted = worker_repo.delete(worker.id)
    assert deleted is True
    
    # Verify it's deleted
    result = worker_repo.get_by_id(worker.id)
    assert result is None


def test_delete_worker_not_found(worker_repo):
    """Test deleting a non-existent worker"""
    result = worker_repo.delete(99999)
    assert result is False
