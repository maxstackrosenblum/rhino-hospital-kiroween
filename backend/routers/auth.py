from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
import auth as auth_utils
import models
import schemas
from database import get_db
from core.security import create_access_token, create_refresh_token, decode_token

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

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(
    refresh_request: schemas.RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    # Decode refresh token
    payload = decode_token(refresh_request.refresh_token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username = payload.get("sub")
    refresh_jti = payload.get("jti")
    
    if not username or not refresh_jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Find user
    db_user = db.query(models.User).filter(
        models.User.username == username,
        models.User.deleted_at.is_(None)
    ).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Find session with this refresh token
    session = db.query(models.Session).filter(
        models.Session.refresh_jti == refresh_jti,
        models.Session.user_id == db_user.id,
        models.Session.revoked_at.is_(None)
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found or revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if refresh token expired
    if session.refresh_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new access token (keep same refresh token)
    new_access_token, new_access_jti, new_access_expires = create_access_token(
        data={"sub": db_user.username}
    )
    
    # Update session with new access token JTI
    session.jti = new_access_jti
    session.expires_at = new_access_expires
    session.last_activity = datetime.utcnow()
    
    db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": refresh_request.refresh_token,  # Return same refresh token
        "token_type": "bearer"
    }

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
    
    # Create access token and refresh token
    access_token, access_jti, access_expires = create_access_token(data={"sub": db_user.username})
    refresh_token, refresh_jti, refresh_expires = create_refresh_token(data={"sub": db_user.username})
    
    # Create session record with both tokens
    session = models.Session(
        user_id=db_user.id,
        jti=access_jti,
        refresh_jti=refresh_jti,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=access_expires,
        refresh_expires_at=refresh_expires
    )
    db.add(session)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


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

