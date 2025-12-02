import os
from typing import List

class Settings:
    """Application settings"""
    
    # API Settings
    API_TITLE: str = "Hospital Management System API"
    API_DESCRIPTION: str = "API with JWT authentication, PostgreSQL, and user management"
    API_VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]  # Allow all origins for development
    
    # Email Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@hospital.com")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Hospital Management System")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
settings = Settings()
