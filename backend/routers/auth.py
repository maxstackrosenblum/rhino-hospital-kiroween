from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
import auth as auth_utils
import models
import schemas
from database import get_db
from core.security import create_access_token

router = APIRouter(prefix="/api", tags=["authentication"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
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
    
    # Create new user with provided role or default 'undefined'
    hashed_password = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,        # Can be None
        city=user.city,          # Can be None
        age=user.age,            # Can be None
        address=user.address,    # Can be None
        gender=user.gender.value if user.gender else None,  # Can be None
        hashed_password=hashed_password,
        role=user.role.value if user.role else "undefined"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
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
    
    # Create access token with JTI
    access_token, jti, expires_at = create_access_token(data={"sub": db_user.username})
    
    # Create session record
    session = models.Session(
        user_id=db_user.id,
        jti=jti,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me/profile-status", response_model=schemas.ProfileCompletionStatus)
async def get_current_user_profile_status(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile completion status"""
    has_role_specific_profile = False
    profile_completed_at = None
    requires_profile_completion = current_user.role in [models.UserRole.PATIENT, models.UserRole.DOCTOR]
    
    if current_user.role == models.UserRole.PATIENT:
        patient = db.query(models.Patient).filter(
            and_(
                models.Patient.user_id == current_user.id,
                models.Patient.deleted_at.is_(None)
            )
        ).first()
        if patient:
            has_role_specific_profile = True
            profile_completed_at = patient.created_at
            
    elif current_user.role == models.UserRole.DOCTOR:
        doctor = db.query(models.Doctor).filter(
            and_(
                models.Doctor.user_id == current_user.id,
                models.Doctor.deleted_at.is_(None)
            )
        ).first()
        if doctor:
            has_role_specific_profile = True
            profile_completed_at = doctor.created_at
    
    return schemas.ProfileCompletionStatus(
        user_id=current_user.id,
        role=current_user.role,
        has_role_specific_profile=has_role_specific_profile,
        profile_completed_at=profile_completed_at,
        requires_profile_completion=requires_profile_completion
    )
