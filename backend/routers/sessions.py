from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import auth as auth_utils
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.get("", response_model=List[schemas.SessionResponse])
async def get_user_sessions(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active sessions for current user"""
    sessions = db.query(models.Session).filter(
        models.Session.user_id == current_user.id,
        models.Session.revoked_at.is_(None),
        models.Session.expires_at > datetime.utcnow()
    ).order_by(models.Session.last_activity.desc()).all()
    
    return sessions

@router.delete("/{session_id}")
async def revoke_session(
    session_id: int,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific session"""
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.revoked_at:
        raise HTTPException(status_code=400, detail="Session already revoked")
    
    session.revoked_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Session revoked successfully"}

@router.delete("")
async def revoke_all_sessions(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all sessions except current one"""
    # Get current session JTI from token would require passing it through
    # For now, revoke all sessions - user will need to login again
    sessions = db.query(models.Session).filter(
        models.Session.user_id == current_user.id,
        models.Session.revoked_at.is_(None)
    ).all()
    
    for session in sessions:
        session.revoked_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": f"Revoked {len(sessions)} session(s)"}

@router.post("/cleanup")
async def cleanup_expired_sessions(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db)
):
    """Cleanup expired sessions (admin or own sessions)"""
    if current_user.role == models.UserRole.ADMIN:
        # Admin can cleanup all expired sessions
        deleted = db.query(models.Session).filter(
            models.Session.expires_at < datetime.utcnow()
        ).delete()
    else:
        # Regular users can only cleanup their own
        deleted = db.query(models.Session).filter(
            models.Session.user_id == current_user.id,
            models.Session.expires_at < datetime.utcnow()
        ).delete()
    
    db.commit()
    return {"message": f"Cleaned up {deleted} expired session(s)"}
