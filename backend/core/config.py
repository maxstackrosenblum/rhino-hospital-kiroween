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
    
settings = Settings()
