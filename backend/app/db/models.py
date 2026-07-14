import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True) # Matches Supabase UUID or local mock ID
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True) # Supported for local auth
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Career Profile Preferences
    career_level = Column(String, default="entry", server_default="entry")
    target_industry = Column(String, default="tech", server_default="tech")
    priorities = Column(JSON, nullable=True)
    
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=False)
    rdom = Column(JSON, nullable=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="resumes")
    reports = relationship("ScanReport", back_populates="resume", cascade="all, delete-orphan")

class ScanReport(Base):
    __tablename__ = "scan_reports"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    target_role = Column(String, nullable=False) # e.g. "SDE", "Product Manager", etc.
    score_overall = Column(Float, nullable=False)
    
    # Store JSON breakdowns
    score_breakdown = Column(JSON, nullable=False) 
    # e.g., {"parsing": 90, "formatting": 85, "keywords": 70, "readability": 80, "completeness": 95, "achievements": 75, "alignment": 80}
    
    extracted_data = Column(JSON, nullable=False)
    # e.g., {"name": "John Doe", "email": "john@example.com", "phone": "123-456-7890", "skills": [...], "experience": [...], "education": [...], "projects": [...], "certifications": [...]}
    
    formatting_issues = Column(JSON, nullable=False)
    # e.g., {"multiple_columns": true, "has_images": false, "has_tables": true, "unsupported_fonts": [...], "warnings": [...], "suggestions": [...]}
    
    keyword_analysis = Column(JSON, nullable=False)
    # e.g., {"resume_keywords": [...], "jd_keywords": [...], "matching_keywords": [...], "missing_keywords": [...], "semantic_matches": [...], "jd_similarity_score": 0.72}
    
    recruiter_feedback = Column(JSON, nullable=False)
    # e.g., {"google": {"strengths": [], "weaknesses": [], "likelihood": "Medium", "feedback": "..."}, "amazon": ..., "startup": ...}
    
    faang_readiness = Column(JSON, nullable=False)
    # e.g., {"google": 78, "amazon": 82, "meta": 74, "microsoft": 80, "breakdown": {...}}
    
    benchmarking_percentile = Column(Float, nullable=False) # Percentile score against benchmark dataset
    
    # V2 Upgrade Fields
    experience_level = Column(String, default="Entry Level", server_default="Entry Level")
    analysis_results = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    company_intelligence = Column(JSON, nullable=True)
    benchmarking = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    resume = relationship("Resume", back_populates="reports")

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, index=True, nullable=False)
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    login_time = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Integer, default=1, server_default="1") # 1 for active, 0 for revoked
    last_activity = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User")
