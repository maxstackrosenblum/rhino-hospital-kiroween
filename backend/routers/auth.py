from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import auth as auth_utils
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api", tags=["authentication"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    db_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    if db_user:
        raise HTTPException(
            status_code=400, 
            detail="Email or username already registered"
        )
    
    # Create new user with specified role or default to 'undefined'
    hashed_password = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        city=user.city,
        age=user.age,
        address=user.address,
        gender=user.gender,
        hashed_password=hashed_password,
        role=user.role if user.role else models.UserRole.UNDEFINED
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    db_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()
    
    if not db_user or not auth_utils.verify_password(
        user.password, 
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if db_user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deleted",
        )
    
    access_token = auth_utils.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}
