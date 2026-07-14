import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "Resora AI API"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration (SQLite default, postgres compatible)
    DATABASE_URL: str = (
        os.getenv("DATABASE_URL", "sqlite:///./resumeiq.db")
        .replace("postgres://", "postgresql://", 1)
        if os.getenv("DATABASE_URL", "sqlite:///./resumeiq.db").startswith("postgres://")
        else os.getenv("DATABASE_URL", "sqlite:///./resumeiq.db")
    )
    
    # Gemini API configurations
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # JWT & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretjwtkeyforresumeiqaiplatform")
    JWT_ALGORITHM: str = "HS256"
    
    # Storage configuration (local folder fallback for Supabase Storage)
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./uploads")
    
    # OAuth Configurations
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    
    # URL configs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    @property
    def CORS_ORIGINS(self) -> list:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001"
        ]
        extra = os.getenv("ALLOWED_ORIGINS", "")
        if extra:
            origins.extend([o.strip() for o in extra.split(",") if o.strip()])
        # Ensure configured FRONTEND_URL and API_BASE_URL are in origins
        if self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        if self.API_BASE_URL not in origins:
            origins.append(self.API_BASE_URL)
        # De-duplicate
        return list(dict.fromkeys(origins))

    class Config:
        arbitrary_types_allowed = True

settings = Settings()

# Ensure uploads folder exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
