from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import auth as auth_utils
import models
import schemas
from database import get_db
from core.dependencies import require_admin

router = APIRouter(prefix="/api", tags=["users"])

@router.get("/users", response_model=schemas.PaginatedUsersResponse)
async def get_all_users(
    page: int = 1,
    page_size: int = 10,
    search: str = None,
    role: str = None,
    include_deleted: bool = False,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users with pagination and search (admin only)"""
    query = db.query(models.User)
    
    if not include_deleted:
        query = query.filter(models.User.deleted_at.is_(None))
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.User.username.ilike(search_term)) |
            (models.User.email.ilike(search_term)) |
            (models.User.first_name.ilike(search_term)) |
            (models.User.last_name.ilike(search_term))
        )
    
    # Apply role filter
    if role:
        query = query.filter(models.User.role == role)
    
    # Get total count
    total = query.count()
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Get paginated users
    users = query.order_by(models.User.created_at.desc()).offset(offset).limit(page_size).all()
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user_by_admin(
    user_id: int,
    user_update: schemas.AdminUserUpdate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update any user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != user.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update fields if provided
    if user_update.email:
        user.email = user_update.email
    if user_update.first_name:
        user.first_name = user_update.first_name
    if user_update.last_name:
        user.last_name = user_update.last_name
    if user_update.role:
        user.role = user_update.role
    
    db.commit()
    db.refresh(user)
    return user

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
    # Only admins can change roles
    if user_update.role is not None:
        if current_user.role != models.UserRole.ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Only admins can change user roles"
            )
    
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
    if user_update.role and current_user.role == models.UserRole.ADMIN:
        current_user.role = user_update.role
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me")
async def delete_current_user(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete current user account"""
    if current_user.deleted_at:
        raise HTTPException(status_code=400, detail="User already deleted")
    
    current_user.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "User account deleted successfully"}

@router.delete("/users/{user_id}")
async def delete_user_by_admin(
    user_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Soft delete any user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.deleted_at:
        raise HTTPException(status_code=400, detail="User already deleted")
    
    user.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": f"User {user.username} deleted successfully"}

@router.post("/users/{user_id}/restore")
async def restore_user(
    user_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Restore a soft-deleted user (admin only)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.deleted_at:
        raise HTTPException(status_code=400, detail="User is not deleted")
    
    user.deleted_at = None
    db.commit()
    return {"message": f"User {user.username} restored successfully"}
