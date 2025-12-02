from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models
import schemas
from database import get_db
from core.security import create_reset_token, create_reset_token_expiry, get_password_hash
from core.email import send_password_reset_email
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/password-reset", tags=["password-reset"])

@router.post("/request")
async def request_password_reset(
    request: schemas.PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request a password reset token"""
    user = db.query(models.User).filter(
        models.User.email == request.email,
        models.User.deleted_at.is_(None)
    ).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If the email exists, a reset link will be sent"}
    
    # Generate reset token
    reset_token = create_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = create_reset_token_expiry()
    
    logger.info(f"Generated reset token for {user.username}: {reset_token[:10]}... expires at {user.reset_token_expires}")
    
    db.commit()
    db.refresh(user)
    
    logger.info(f"Token saved to database for {user.username}")
    
    # Send email with reset link
    email_sent = send_password_reset_email(
        to_email=user.email,
        reset_token=reset_token,
        username=user.username
    )
    
    if email_sent:
        logger.info(f"Password reset email sent to {user.email}")
    else:
        logger.warning(f"Failed to send password reset email to {user.email}")
    
    # Always return success to prevent email enumeration
    return {
        "message": "If the email exists, a reset link will be sent"
    }

@router.post("/reset")
async def reset_password(
    reset_data: schemas.PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset password using token"""
    logger.info(f"Attempting password reset with token: {reset_data.token[:10]}...")
    
    user = db.query(models.User).filter(
        models.User.reset_token == reset_data.token,
        models.User.deleted_at.is_(None)
    ).first()
    
    if not user:
        logger.warning(f"No user found with reset token: {reset_data.token[:10]}...")
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    logger.info(f"Found user: {user.username}, checking expiration...")
    
    # Check if token is expired
    if user.reset_token_expires < datetime.utcnow():
        logger.warning(f"Token expired for user: {user.username}")
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/verify-token")
async def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify if a reset token is valid"""
    logger.info(f"Verifying token: {token[:10]}...")
    
    user = db.query(models.User).filter(
        models.User.reset_token == token,
        models.User.deleted_at.is_(None)
    ).first()
    
    if not user:
        logger.warning(f"No user found with token: {token[:10]}...")
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    logger.info(f"Token found for user: {user.username}, expires: {user.reset_token_expires}")
    
    # Check if token is expired
    if user.reset_token_expires < datetime.utcnow():
        logger.warning(f"Token expired for user: {user.username}")
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    return {"valid": True, "email": user.email}
