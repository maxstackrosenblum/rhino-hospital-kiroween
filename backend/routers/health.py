from fastapi import APIRouter
import os

router = APIRouter(tags=["health"])

@router.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "Hospital Management System API"}

@router.get("/api/health")
def health_check():
    """Health check endpoint"""
    db_configured = "configured" if os.getenv("DATABASE_URL") else "not configured"
    return {"status": "healthy", "database": db_configured}
