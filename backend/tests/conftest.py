"""
Test configuration and fixtures for staff management tests.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import Receptionist, Worker


# Use in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def test_db():
    """
    Create a fresh test database for each test function.
    """
    # Create engine and tables
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    
    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def receptionist_repo(test_db):
    """
    Create a ReceptionistRepository instance with test database.
    """
    from repositories import ReceptionistRepository
    return ReceptionistRepository(test_db)


@pytest.fixture(scope="function")
def worker_repo(test_db):
    """
    Create a WorkerRepository instance with test database.
    """
    from repositories import WorkerRepository
    return WorkerRepository(test_db)
