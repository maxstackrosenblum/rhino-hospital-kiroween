"""
Test configuration and fixtures for medical staff management tests.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import MedicalStaff, User


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
def medical_staff_repo(test_db):
    """
    Create a MedicalStaffRepository instance with test database.
    """
    from repositories.medical_staff_repository import MedicalStaffRepository
    return MedicalStaffRepository(test_db)


@pytest.fixture(scope="function")
def test_user(test_db):
    """
    Create a test user for medical staff tests.
    """
    user = User(
        email="test@example.com",
        username="testuser",
        first_name="Test",
        last_name="User",
        phone="1234567890",
        hashed_password="hashed_password",
        role="medical_staff"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user
