from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import auth as auth_utils
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api", tags=["users"])

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_current_user(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="Email already registered"
            )
    
    # Update fields if provided
    if user_update.email:
        current_user.email = user_update.email
    if user_update.first_name:
        current_user.first_name = user_update.first_name
    if user_update.last_name:
        current_user.last_name = user_update.last_name
    if user_update.password:
        current_user.hashed_password = auth_utils.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user
