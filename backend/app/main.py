import os
import certifi

# Self-healing SSL_CERT_FILE path repair for Windows environments
if "SSL_CERT_FILE" in os.environ and not os.path.exists(os.environ["SSL_CERT_FILE"]):
    os.environ["SSL_CERT_FILE"] = certifi.where()

import shutil
import base64
import json
import hmac
import hashlib
import uuid
import secrets
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import requests

# Import local backend dependencies
from app.core.config import settings
from app.db.database import engine, Base, get_db
from app.db import models
from app.services import parser, formatting, scoring, semantic, gemini_service, benchmarking, knowledge_graph, skill_engine, analysis, recommendation, company_engine, rdom_service, reconstruction_service

# Auto-create SQLite/PostgreSQL database tables on startup
Base.metadata.create_all(bind=engine)

# Startup schema migrations (dialect-agnostic column inspections)
from sqlalchemy import inspect, text
try:
    inspector = inspect(engine)
    
    # 1. Migrate users table
    columns_users = [c["name"] for c in inspector.get_columns("users")]
    for col, col_type in [("password_hash", "VARCHAR"), ("career_level", "VARCHAR DEFAULT 'entry'"), ("target_industry", "VARCHAR DEFAULT 'tech'"), ("priorities", "JSON")]:
        if col not in columns_users:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
            print(f"Successfully added {col} column to users table.")
            
    # 2. Migrate scan_reports table
    columns_reports = [c["name"] for c in inspector.get_columns("scan_reports")]
    for col, col_type in [
        ("experience_level", "VARCHAR DEFAULT 'Entry Level'"), 
        ("analysis_results", "JSON"), 
        ("recommendations", "JSON"), 
        ("company_intelligence", "JSON"), 
        ("benchmarking", "JSON"),
        ("suggestions", "JSON")
    ]:
        if col not in columns_reports:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE scan_reports ADD COLUMN {col} {col_type}"))
            print(f"Successfully added {col} column to scan_reports table.")
            
    # 3. Migrate resumes table
    columns_resumes = [c["name"] for c in inspector.get_columns("resumes")]
    if "rdom" not in columns_resumes:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE resumes ADD COLUMN rdom JSON"))
        print("Successfully added rdom column to resumes table.")
        
except Exception as e:
    print(f"Schema migration log: {e}")

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

SECRET_KEY = settings.JWT_SECRET

def hash_password(password: str) -> str:
    """Generates a secure PBKDF2 hash of a password using a random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a password against its PBKDF2 hash."""
    try:
        salt, expected_key_hex = hashed_password.split("$")
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return secrets.compare_digest(key.hex(), expected_key_hex)
    except Exception:
        return False

def create_jwt_token(data: dict) -> str:
    """Creates a signed JWT-like token containing the user dictionary."""
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().replace("=", "")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(data).encode()).decode().replace("=", "")
    
    signature = hmac.new(
        SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().replace("=", "")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def verify_jwt_token(token: str) -> dict:
    """Decodes and validates a signed JWT token signature."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        # Verify signature
        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            f"{header_b64}.{payload_b64}".encode(),
            hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_signature).decode().replace("=", "")
        
        # Padding correction for base64 decoding
        def pad_b64(s):
            return s + "=" * ((4 - len(s) % 4) % 4)
            
        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            return None
            
        payload_json = base64.urlsafe_b64decode(pad_b64(payload_b64)).decode()
        return json.loads(payload_json)
    except Exception:
        return None

def get_current_user(db: Session = Depends(get_db), credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> models.User:
    """Authentication dependency. Resolves JWT token or returns 401."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials missing."
        )
        
    token = credentials.credentials
    if token == "mock-token" or token == "undefined":
        # Support mock access for developer safety/compatibility
        user_id = "mock-user-123"
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            user = models.User(id=user_id, email="candidate@resumeiq.ai", priorities={"ats": True, "keywords": True, "star": True, "readability": False})
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    # Decode and verify token
    payload = verify_jwt_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token signature."
        )
        
    # Check if session exists and is active
    session_record = db.query(models.UserSession).filter(
        models.UserSession.token == token,
        models.UserSession.is_active == 1
    ).first()
    
    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or has been revoked."
        )
        
    try:
        session_record.last_activity = datetime.datetime.utcnow()
        db.commit()
    except Exception:
        pass
        
    user = db.query(models.User).filter(models.User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in system."
        )
        
    return user

def create_session(db: Session, user_id: str, token: str, request: Request) -> models.UserSession:
    user_agent = request.headers.get("user-agent", "Unknown Browser")
    ip_address = request.client.host if request.client else "Unknown IP"
    session_id = str(uuid.uuid4())
    
    session_record = models.UserSession(
        id=session_id,
        user_id=user_id,
        token=token,
        user_agent=user_agent,
        ip_address=ip_address,
        is_active=1
    )
    db.add(session_record)
    db.commit()
    db.refresh(session_record)
    return session_record

# Pydantic schemas for request/response serialization
class AuthRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str

class RewriteRequest(BaseModel):
    bullet: str
    style: Optional[str] = "xyz"

class MatchJdRequest(BaseModel):
    job_description: str

class RecruiterAuditRequest(BaseModel):
    company_name: str
    category: str
    target_role: str

class ProfileUpdateRequest(BaseModel):
    career_level: str
    target_industry: str
    priorities: Optional[dict] = None

class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str

class SandboxAuthRequest(BaseModel):
    provider: str

@app.post("/api/v1/auth/sandbox", response_model=AuthResponse)
def sandbox_auth(payload: SandboxAuthRequest, request: Request, db: Session = Depends(get_db)):
    provider = payload.provider.strip().lower()
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Invalid provider. Must be google or github.")
        
    email = f"{provider}.demo@resumeiq.ai"
    
    # Check if sandbox user already exists
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            id=f"sandbox-{provider}-user-id",
            email=email,
            password_hash=None, # OAuth users don't have password hashes
            career_level="Entry Level",
            target_industry="Tech",
            priorities={"ats": True, "keywords": True, "star": True, "readability": False}
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    token = create_jwt_token({"user_id": user.id, "email": user.email})
    create_session(db, user.id, token, request)
    return {"access_token": token, "token_type": "bearer", "email": user.email}

@app.get("/api/v1/auth/google/login")
def google_login():
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        # Fallback redirect to sandbox mode on the frontend
        return RedirectResponse(f"{settings.FRONTEND_URL}/?sandbox=true&provider=google")
        
    # Redirect to real Google Auth
    redirect_uri = f"{settings.API_BASE_URL}/api/v1/auth/google/callback"
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"response_type=code&"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=openid%20email%20profile"
    )
    return RedirectResponse(google_auth_url)

@app.get("/api/v1/auth/google/callback")
def google_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not code:
        raise HTTPException(status_code=400, detail="No code provided from Google.")
        
    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    redirect_uri = f"{settings.API_BASE_URL}/api/v1/auth/google/callback"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    token_response = requests.post(token_url, data=data)
    if not token_response.ok:
        raise HTTPException(status_code=400, detail=f"Google token exchange failed: {token_response.text}")
        
    tokens = token_response.json()
    access_token = tokens.get("access_token")
    
    # Get user info
    userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    userinfo_response = requests.get(userinfo_url, headers={"Authorization": f"Bearer {access_token}"})
    if not userinfo_response.ok:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google.")
        
    user_info = userinfo_response.json()
    email = user_info.get("email").strip().lower()
    
    # Create or update user
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=None,
            priorities={"ats": True, "keywords": True, "star": True, "readability": False}
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Create session and return JWT token by redirecting to frontend callback
    token = create_jwt_token({"user_id": user.id, "email": user.email})
    create_session(db, user.id, token, request)
    return RedirectResponse(f"{settings.FRONTEND_URL}/?token={token}&email={email}")

class GoogleVerifyRequest(BaseModel):
    credential: str

@app.get("/api/v1/auth/config")
def get_auth_config():
    return {
        "google_client_id": settings.GOOGLE_CLIENT_ID
    }

@app.post("/api/v1/auth/google/verify", response_model=AuthResponse)
def google_verify_token(payload: GoogleVerifyRequest, request: Request, db: Session = Depends(get_db)):
    tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}"
    response = requests.get(tokeninfo_url)
    if not response.ok:
        raise HTTPException(status_code=400, detail="Invalid Google ID token.")
        
    user_info = response.json()
    aud = user_info.get("aud")
    if settings.GOOGLE_CLIENT_ID and aud != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Audience mismatch. Token not generated by this client ID.")
        
    email = user_info.get("email").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email not present in Google ID token.")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=None,
            priorities={"ats": True, "keywords": True, "star": True, "readability": False}
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    token = create_jwt_token({"user_id": user.id, "email": user.email})
    create_session(db, user.id, token, request)
    return {"access_token": token, "token_type": "bearer", "email": user.email}

@app.post("/api/v1/auth/signup", response_model=AuthResponse)
def signup(payload: AuthRequest, request: Request, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Invalid email format.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already registered.")
        
    # Hash password and create user
    hashed = hash_password(payload.password)
    user_id = str(uuid.uuid4())
    
    new_user = models.User(
        id=user_id, 
        email=email_clean, 
        password_hash=hashed,
        priorities={"ats": True, "keywords": True, "star": True, "readability": False}
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    token = create_jwt_token({"user_id": new_user.id, "email": new_user.email})
    create_session(db, new_user.id, token, request)
    return {"access_token": token, "token_type": "bearer", "email": new_user.email}

@app.post("/api/v1/auth/login", response_model=AuthResponse)
def login(payload: AuthRequest, request: Request, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
        
    token = create_jwt_token({"user_id": user.id, "email": user.email})
    create_session(db, user.id, token, request)
    return {"access_token": token, "token_type": "bearer", "email": user.email}

@app.get("/api/v1/users/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "career_level": current_user.career_level or "entry",
        "target_industry": current_user.target_industry or "tech",
        "priorities": current_user.priorities or {"ats": True, "keywords": True, "star": True, "readability": False}
    }

@app.put("/api/v1/users/me/profile")
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.career_level = payload.career_level
    current_user.target_industry = payload.target_industry
    if payload.priorities is not None:
        current_user.priorities = payload.priorities
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "message": "Profile updated successfully."}

@app.put("/api/v1/users/me/password")
def update_password(
    payload: PasswordUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not current_user.password_hash or not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
    
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
        
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    
    # Revoke all other sessions except the current active one!
    token = credentials.credentials
    db.query(models.UserSession).filter(
        models.UserSession.user_id == current_user.id,
        models.UserSession.token != token
    ).update({"is_active": 0})
    db.commit()
    
    return {"status": "success", "message": "Password changed successfully. All other sessions have been revoked."}

@app.get("/api/v1/users/me/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_token = credentials.credentials
    sessions = db.query(models.UserSession).filter(
        models.UserSession.user_id == current_user.id,
        models.UserSession.is_active == 1
    ).order_by(models.UserSession.login_time.desc()).all()
    
    results = []
    for s in sessions:
        results.append({
            "session_id": s.id,
            "user_agent": s.user_agent,
            "ip_address": s.ip_address,
            "login_time": s.login_time,
            "last_activity": s.last_activity,
            "is_current": s.token == current_token
        })
    return results

@app.post("/api/v1/users/me/logout")
def logout(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    session_rec = db.query(models.UserSession).filter(
        models.UserSession.token == token,
        models.UserSession.user_id == current_user.id
    ).first()
    
    if session_rec:
        session_rec.is_active = 0
        db.commit()
        
    return {"status": "success", "message": "Logged out successfully."}

@app.delete("/api/v1/users/me/sessions/{session_id}")
def revoke_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    session_rec = db.query(models.UserSession).filter(
        models.UserSession.id == session_id,
        models.UserSession.user_id == current_user.id
    ).first()
    
    if not session_rec:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # User cannot revoke their own session from this endpoint
    current_token = credentials.credentials
    if session_rec.token == current_token:
        raise HTTPException(status_code=400, detail="Cannot revoke current session. Use logout instead.")
        
    session_rec.is_active = 0
    db.commit()
    return {"status": "success", "message": "Session revoked successfully."}

@app.post("/api/v1/users/me/sessions/logout-others")
def logout_others(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_token = credentials.credentials
    db.query(models.UserSession).filter(
        models.UserSession.user_id == current_user.id,
        models.UserSession.token != current_token
    ).update({"is_active": 0})
    db.commit()
    return {"status": "success", "message": "Logged out of all other sessions."}

@app.delete("/api/v1/users/me")
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.delete(current_user)
    db.commit()
    return {"status": "success", "message": "Account deleted successfully."}

@app.get("/")
def read_root():
    # Try container path first, fallback to local dev path
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
    if not os.path.exists(frontend_dist):
        frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        from fastapi.responses import FileResponse
        return FileResponse(index_path)
    return {"status": "healthy", "service": settings.PROJECT_NAME, "mock_mode": settings.GEMINI_API_KEY == ""}

# MODULE 1 & 2: Resume Upload & Parsing Engine
# MODULE 3: ATS Parsing Simulator
# MODULE 4: ATS Compatibility Score
# MODULE 5 & 6 & 7: Formatting, Keywords & JD Match
# MODULE 8 & 9: Recruiter Feedback & FAANG Readiness
# MODULE 11: Benchmarking & Version Evolution
@app.post("/api/v1/resumes/scan")
async def scan_resume(
    file: UploadFile = File(...),
    target_role: str = Form("SDE"),
    job_description: Optional[str] = Form(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Core pipeline endpoint:
    1. Upload PDF/DOCX
    2. Extract & Clean Text
    3. Segment sections and parse details (Simulator data)
    4. Analyze formatting layout risks
    5. Run JD match (if Job Description is provided)
    6. Compute weighted ATS score
    7. Fetch recruiter review and FAANG readiness from Gemini (or sandbox mock)
    8. Benchmark against role percentiles
    9. Store scan version in database
    """
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF or DOCX file."
        )

    # 1. Save uploaded file locally
    user_upload_dir = os.path.join(settings.STORAGE_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)
    
    # Check current versions count to increment version number
    existing_resumes_count = db.query(models.Resume).filter(
        models.Resume.user_id == current_user.id,
        models.Resume.filename == file.filename
    ).count()
    version_num = existing_resumes_count + 1
    
    file_path = os.path.join(user_upload_dir, f"v{version_num}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(e)}"
        )

    # Read file bytes for parsers
    try:
        with open(file_path, "rb") as f:
            file_bytes = f.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file back: {str(e)}"
        )

    # 2. Extract & clean text + segment sections (Simulator)
    parsed_data = parser.parse_resume(file_bytes, file.filename)
    raw_text = parsed_data["raw_text"]
    
    # 2a. Extract RDOM layout
    try:
        rdom = rdom_service.parse_to_rdom(file_bytes, file.filename)
    except Exception as e:
        print(f"Error generating RDOM layout parsing: {e}")
        rdom = None
    
    # 3. Save Resume record to SQL
    resume = models.Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=raw_text,
        rdom=rdom,
        version=version_num
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # 4. Analyze layout formatting
    formatting_report = formatting.analyze_formatting(file_bytes, file.filename)

    # 5. Job Description matching
    jd_analysis = {
        "resume_keywords": parsed_data["skills"],
        "jd_keywords": [],
        "matching_keywords": [],
        "missing_keywords": [],
        "semantic_matches": [],
        "jd_similarity_score": 0.0
    }
    jd_match_score = None
    
    if job_description and job_description.strip():
        jd_match = semantic.match_job_description(raw_text, parsed_data["skills"], job_description)
        jd_match_score = jd_match["match_score"]
        
        jd_analysis = {
            "resume_keywords": parsed_data["skills"],
            "jd_keywords": jd_match["matching_skills"] + jd_match["missing_skills"],
            "matching_keywords": jd_match["matching_skills"],
            "missing_keywords": jd_match["missing_skills"],
            "semantic_matches": jd_match["semantic_matches"],
            "jd_similarity_score": jd_match["match_score"]
        }

    # 6. Build Resume Knowledge Graph
    kg = knowledge_graph.build_knowledge_graph(parsed_data, raw_text)
    
    # 7. Normalize Skills and map families
    processed_skills = skill_engine.process_skills(parsed_data["skills"])
    kg["skills"].update(processed_skills)
    parsed_data["skills"] = processed_skills["normalized"]
    
    # 8. Run deterministic V2 Analysis
    analysis_report = analysis.analyze_resume(kg, raw_text, formatting_report)
    
    # 9. Generate rule-based Recommendations
    recs = recommendation.generate_recommendations(analysis_report)
    
    # 10. Run Company Intelligence mapping
    company_alignments = company_engine.evaluate_company_alignment(processed_skills["normalized"], analysis_report)
    
    # 11. Calculate Multi-dimensional Health score (8 weighted metrics)
    scoring_report = scoring.calculate_resume_health(
        analysis_results=analysis_report,
        keyword_alignment_score=jd_match_score,
        raw_text=raw_text
    )
    overall_score = scoring_report["score_overall"]
    score_breakdown = scoring_report["breakdown"]

    # 12. Run Optional AI Layer analyses concurrently to reduce latency
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_recruiter = executor.submit(
            gemini_service.analyze_recruiter_feedback,
            raw_text, target_role, job_description
        )
        future_faang = executor.submit(
            gemini_service.analyze_faang_readiness,
            raw_text, overall_score, target_role
        )
        recruiter_reviews = future_recruiter.result()
        faang_report = future_faang.result()

    # 13. Benchmarking Percentiles (Role and Seniority aligned)
    career_lvl = current_user.career_level or "Entry Level"
    benchmarks = benchmarking.calculate_benchmarks(overall_score, target_role, career_lvl)

    # 13a. Generate RDOM layout rewriter suggestions
    suggestions = []
    if rdom:
        try:
            suggestions = rdom_service.generate_reconstruction_suggestions(
                rdom, target_role, job_description or ""
            )
        except Exception as e:
            print(f"Error generating RDOM suggestions: {e}")

    # Compile Extracted Data structure for Simulator UI
    extracted_simulator_data = {
        "name": parsed_data["name"],
        "email": parsed_data["email"],
        "phone": parsed_data["phone"],
        "skills": parsed_data["skills"],
        "education": parsed_data["education"],
        "experience": parsed_data["experience"],
        "projects": parsed_data["projects"],
        "certifications": parsed_data["certifications"]
    }

    # 14. Create ScanReport record in SQL
    report = models.ScanReport(
        resume_id=resume.id,
        target_role=target_role,
        experience_level=career_lvl,
        score_overall=overall_score,
        score_breakdown=score_breakdown,
        extracted_data=extracted_simulator_data,
        formatting_issues=formatting_report,
        keyword_analysis=jd_analysis,
        recruiter_feedback=recruiter_reviews,
        faang_readiness=faang_report,
        benchmarking_percentile=benchmarks["global_percentile"],
        analysis_results=analysis_report,
        recommendations=recs,
        company_intelligence=company_alignments,
        benchmarking=benchmarks,
        suggestions=suggestions
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Return complete structured report
    return {
        "resume_id": resume.id,
        "report_id": report.id,
        "filename": resume.filename,
        "version": resume.version,
        "target_role": report.target_role,
        "score_overall": report.score_overall,
        "score_breakdown": report.score_breakdown,
        "extracted_data": report.extracted_data,
        "formatting_issues": report.formatting_issues,
        "keyword_analysis": report.keyword_analysis,
        "recruiter_feedback": report.recruiter_feedback,
        "faang_readiness": report.faang_readiness,
        "analysis_results": report.analysis_results,
        "recommendations": report.recommendations,
        "company_intelligence": report.company_intelligence,
        "benchmarking": benchmarks,
        "raw_text": raw_text,
        "suggestions": report.suggestions,
        "rdom": resume.rdom,
        "created_at": report.created_at
    }

@app.get("/api/v1/resumes", response_model=List[dict])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Lists metadata for all uploaded resumes and their score versions."""
    resumes = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.created_at.desc()).all()
    results = []
    
    for r in resumes:
        latest_report = db.query(models.ScanReport).filter(models.ScanReport.resume_id == r.id).first()
        results.append({
            "resume_id": r.id,
            "report_id": latest_report.id if latest_report else None,
            "filename": r.filename,
            "version": r.version,
            "created_at": r.created_at,
            "score_overall": latest_report.score_overall if latest_report else None,
            "target_role": latest_report.target_role if latest_report else None
        })
        
    return results

@app.delete("/api/v1/resumes/{resume_id}")
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Deletes a specific resume scan and its report, and deletes the local file."""
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume scan not found."
        )
        
    # Delete the local file if it exists
    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception:
            pass
            
    db.delete(resume)
    db.commit()
    return {"message": "Resume scan deleted successfully."}

@app.delete("/api/v1/resumes")
def clear_all_resumes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Clears all resume scans and reports for the user, and removes all stored files."""
    resumes = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).all()
    
    # Delete files
    user_upload_dir = os.path.join(settings.STORAGE_DIR, current_user.id)
    if os.path.exists(user_upload_dir):
        try:
            shutil.rmtree(user_upload_dir)
        except Exception:
            pass
            
    for r in resumes:
        db.delete(r)
        
    db.commit()
    return {"message": "All resume scans deleted successfully."}

@app.get("/api/v1/reports/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieves detailed scan report contents."""
    report = db.query(models.ScanReport).join(models.Resume).filter(
        models.ScanReport.id == report_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan report not found."
        )
        
    # Re-calculate benchmarks dynamically to return detailed structures
    benchmarks = benchmarking.calculate_benchmarks(report.score_overall, report.target_role, current_user.career_level or "Entry Level")
    
    return {
        "resume_id": report.resume_id,
        "report_id": report.id,
        "filename": report.resume.filename,
        "version": report.resume.version,
        "target_role": report.target_role,
        "experience_level": report.experience_level or "Entry Level",
        "score_overall": report.score_overall,
        "score_breakdown": report.score_breakdown,
        "extracted_data": report.extracted_data,
        "formatting_issues": report.formatting_issues,
        "keyword_analysis": report.keyword_analysis,
        "recruiter_feedback": report.recruiter_feedback,
        "faang_readiness": report.faang_readiness,
        "analysis_results": report.analysis_results,
        "recommendations": report.recommendations,
        "company_intelligence": report.company_intelligence,
        "benchmarking": benchmarks,
        "raw_text": report.resume.extracted_text,
        "suggestions": report.suggestions,
        "rdom": report.resume.rdom,
        "created_at": report.created_at
    }

# MODULE 10: AI Resume Rewriter
@app.post("/api/v1/resumes/rewrite")
def rewrite_bullet(
    payload: RewriteRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Invokes Gemini AI rewriter for a single bullet point statement."""
    if not payload.bullet.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bullet point text cannot be empty."
        )
        
    rewrite_result = gemini_service.rewrite_bullet_point(payload.bullet, payload.style)
    return rewrite_result

# Re-run Match Job Description
@app.post("/api/v1/resumes/{resume_id}/match-jd")
def match_job_description_endpoint(
    resume_id: int,
    payload: MatchJdRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Re-runs Job Description similarity and keyword comparison on an existing resume."""
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    latest_report = db.query(models.ScanReport).filter(models.ScanReport.resume_id == resume_id).first()
    if not latest_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan report not found for this resume. Perform an initial scan first."
        )

    # Scrape skills from extracted text
    skills = latest_report.extracted_data.get("skills", [])
    
    # Run JD match calculations
    jd_match = semantic.match_job_description(resume.extracted_text, skills, payload.job_description)
    
    # Update keyword analysis structure
    jd_analysis = {
        "resume_keywords": skills,
        "jd_keywords": jd_match["matching_skills"] + jd_match["missing_skills"],
        "matching_keywords": jd_match["matching_skills"],
        "missing_keywords": jd_match["missing_skills"],
        "semantic_matches": jd_match["semantic_matches"],
        "jd_similarity_score": jd_match["match_score"]
    }
    
    # Re-calculate overall score based on updated JD keyword score
    scoring_report = scoring.calculate_resume_health(
        analysis_results=latest_report.analysis_results,
        keyword_alignment_score=jd_match["match_score"],
        raw_text=resume.extracted_text
    )
    
    # Update report record
    latest_report.score_overall = scoring_report["score_overall"]
    latest_report.score_breakdown = scoring_report["breakdown"]
    latest_report.keyword_analysis = jd_analysis
    
    # Fetch updated benchmarks
    benchmarks = benchmarking.calculate_benchmarks(latest_report.score_overall, latest_report.target_role)
    latest_report.benchmarking_percentile = benchmarks["global_percentile"]
    
    db.commit()
    db.refresh(latest_report)
    
    return {
        "resume_id": resume.id,
        "report_id": latest_report.id,
        "score_overall": latest_report.score_overall,
        "score_breakdown": latest_report.score_breakdown,
        "keyword_analysis": latest_report.keyword_analysis,
        "benchmarking": benchmarks
    }

class UpdateBulletRequest(BaseModel):
    original_bullet: str
    new_bullet: str
    target_role: str

class RebuildRequest(BaseModel):
    approved_changes: dict

@app.post("/api/v1/resumes/{resume_id}/recruiter-audit")
def dynamic_recruiter_audit(
    resume_id: int,
    payload: RecruiterAuditRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Evaluates the candidate's resume fit for a custom company name and category."""
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    evaluation = gemini_service.evaluate_company_fit(
        resume_text=resume.extracted_text,
        company_name=payload.company_name,
        category=payload.category,
        target_role=payload.target_role
    )
    return evaluation

@app.post("/api/v1/resumes/{resume_id}/update-bullet")
def update_resume_bullet(
    resume_id: int,
    payload: UpdateBulletRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Auto-Fix Endpoint:
    1. Replaces the weak original_bullet with the optimized new_bullet in resume text
    2. Bumps version count and saves a new Resume draft record to SQL
    3. Runs parsing, scoring, recruiter feedback, and benchmarking
    4. Persists and returns the new ScanReport
    """
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    latest_report = db.query(models.ScanReport).filter(models.ScanReport.resume_id == resume_id).first()
    if not latest_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan report not found for this resume. Perform an initial scan first."
        )

    # Clean text replace
    orig_text = resume.extracted_text
    # Search and replace. Match leading and trailing spaces if any
    new_text = orig_text.replace(payload.original_bullet.strip(), payload.new_bullet.strip())
    
    # Check if a replace occurred; if not, do a soft substring check
    if new_text == orig_text:
        # Fallback substring replace
        bullet_words = payload.original_bullet.strip().split()
        if len(bullet_words) > 3:
            search_str = " ".join(bullet_words[:4])
            # Find the line containing the beginning words
            lines = orig_text.split('\n')
            for idx, line in enumerate(lines):
                if search_str.lower() in line.lower():
                    lines[idx] = payload.new_bullet.strip()
                    break
            new_text = "\n".join(lines)
            
    # Bump version
    existing_count = db.query(models.Resume).filter(
        models.Resume.user_id == current_user.id,
        models.Resume.filename == resume.filename
    ).count()
    new_version = existing_count + 1
    
    # Save new Resume draft version
    new_resume = models.Resume(
        user_id=current_user.id,
        filename=resume.filename,
        file_path=resume.file_path,
        extracted_text=new_text,
        version=new_version
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    
    # Rerun Parsing on modified text
    parsed_data = {
        "name": parser.parse_contact_info(new_text)["name"],
        "email": parser.parse_contact_info(new_text)["email"],
        "phone": parser.parse_contact_info(new_text)["phone"],
        "skills": parser.extract_skills_from_text(new_text),
        "education": parser.parse_sections(new_text)["education"],
        "experience": parser.parse_sections(new_text)["experience"],
        "projects": parser.parse_sections(new_text)["projects"],
        "certifications": parser.parse_sections(new_text)["certifications"]
    }
    
    # Reuse previous layout formatting analysis (visual bounds didn't change)
    formatting_report = latest_report.formatting_issues
    
    # Reuse previous JD match analysis if it existed
    jd_analysis = {
        "resume_keywords": parsed_data["skills"],
        "jd_keywords": [],
        "matching_keywords": [],
        "missing_keywords": [],
        "semantic_matches": [],
        "jd_similarity_score": 0.0
    }
    jd_match_score = None
    
    if latest_report.keyword_analysis and latest_report.keyword_analysis.get("jd_keywords"):
        # Re-calculate keyword match index based on new parsed skills
        matching_keywords = []
        missing_skills = []
        semantic_matches = []
        
        prev_analysis = latest_report.keyword_analysis
        jd_keywords = prev_analysis.get("jd_keywords", [])
        
        resume_skills_lower = [s.lower() for s in parsed_data["skills"]]
        for jdk in jd_keywords:
            jdk_lower = jdk.lower()
            if jdk_lower in resume_skills_lower:
                matching_keywords.append(jdk)
            else:
                equiv = semantic.check_semantic_match(jdk, parsed_data["skills"])
                if equiv:
                    semantic_matches.append({"jd_skill": jdk, "resume_skill": equiv})
                    matching_keywords.append(jdk)
                else:
                    missing_skills.append(jdk)
                    
        # Construct composite similarity
        sim_val = prev_analysis.get("jd_similarity_score", 60)
        keyword_match_rate = len(matching_keywords) / len(jd_keywords) if jd_keywords else 1.0
        jd_match_score = (keyword_match_rate * 60.0) + (sim_val * 0.40)
        
        jd_analysis = {
            "resume_keywords": parsed_data["skills"],
            "jd_keywords": jd_keywords,
            "matching_keywords": matching_keywords,
            "missing_keywords": missing_skills,
            "semantic_matches": semantic_matches,
            "jd_similarity_score": sim_val
        }
        
    # Build Resume Knowledge Graph
    kg = knowledge_graph.build_knowledge_graph(parsed_data, new_text)
    
    # Normalize Skills and map families
    processed_skills = skill_engine.process_skills(parsed_data["skills"])
    kg["skills"].update(processed_skills)
    parsed_data["skills"] = processed_skills["normalized"]
    
    # Run deterministic V2 Analysis
    analysis_report = analysis.analyze_resume(kg, new_text, formatting_report)
    
    # Generate rule-based Recommendations
    recs = recommendation.generate_recommendations(analysis_report)
    
    # Run Company Intelligence mapping
    company_alignments = company_engine.evaluate_company_alignment(processed_skills["normalized"], analysis_report)
    
    # Calculate Multi-dimensional Health score (8 weighted metrics)
    scoring_report = scoring.calculate_resume_health(
        analysis_results=analysis_report,
        keyword_alignment_score=jd_match_score,
        raw_text=new_text
    )
    overall_score = scoring_report["score_overall"]
    score_breakdown = scoring_report["breakdown"]
    
    # Rerun recruiter persona feedback on the new text concurrently to reduce latency
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_recruiter = executor.submit(
            gemini_service.analyze_recruiter_feedback,
            new_text, payload.target_role
        )
        future_faang = executor.submit(
            gemini_service.analyze_faang_readiness,
            new_text, overall_score, payload.target_role
        )
        recruiter_reviews = future_recruiter.result()
        faang_report = future_faang.result()
    
    # Recalculate benchmarking statistics
    career_lvl = current_user.career_level or "Entry Level"
    benchmarks = benchmarking.calculate_benchmarks(overall_score, payload.target_role, career_lvl)
    
    # Store new ScanReport
    new_report = models.ScanReport(
        resume_id=new_resume.id,
        target_role=payload.target_role,
        experience_level=career_lvl,
        score_overall=overall_score,
        score_breakdown=score_breakdown,
        extracted_data=parsed_data,
        formatting_issues=formatting_report,
        keyword_analysis=jd_analysis,
        recruiter_feedback=recruiter_reviews,
        faang_readiness=faang_report,
        benchmarking_percentile=benchmarks["global_percentile"],
        analysis_results=analysis_report,
        recommendations=recs,
        company_intelligence=company_alignments,
        benchmarking=benchmarks
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {
        "resume_id": new_resume.id,
        "report_id": new_report.id,
        "filename": new_resume.filename,
        "version": new_resume.version,
        "target_role": new_report.target_role,
        "score_overall": new_report.score_overall,
        "score_breakdown": new_report.score_breakdown,
        "extracted_data": new_report.extracted_data,
        "formatting_issues": new_report.formatting_issues,
        "keyword_analysis": new_report.keyword_analysis,
        "recruiter_feedback": new_report.recruiter_feedback,
        "faang_readiness": new_report.faang_readiness,
        "benchmarking": benchmarks,
        "raw_text": new_text,
        "created_at": new_report.created_at
    }


# TOOL ENDPOINTS - EXPANDED CAPABILITIES
class LinkedinAuditRequest(BaseModel):
    profile_text: str
    target_role: str
    target_industry: str

class CoverLetterRequest(BaseModel):
    resume_id: int
    job_description: str
    target_role: str
    tone: str

class OutreachRequest(BaseModel):
    resume_id: int
    company_name: str
    target_role: str
    recipient_type: str
    tone: str

class InterviewPrepRequest(BaseModel):
    resume_id: int
    target_role: str
    company_name: Optional[str] = "Google"

class ChatRequest(BaseModel):
    resume_id: Optional[int] = None
    message: str
    target_role: Optional[str] = "Software Developer"



@app.post("/api/v1/tools/linkedin-audit")
def linkedin_audit_endpoint(
    payload: LinkedinAuditRequest,
    current_user: models.User = Depends(get_current_user)
):
    if not payload.profile_text.strip():
        raise HTTPException(status_code=400, detail="LinkedIn profile text cannot be empty.")
    return gemini_service.audit_linkedin_profile(
        profile_text=payload.profile_text,
        target_role=payload.target_role,
        target_industry=payload.target_industry
    )


@app.post("/api/v1/tools/cover-letter")
def cover_letter_endpoint(
    payload: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == payload.resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return gemini_service.generate_cover_letter(
        resume_text=resume.extracted_text,
        job_description=payload.job_description,
        target_role=payload.target_role,
        tone=payload.tone
    )


@app.post("/api/v1/tools/networking-outreach")
def networking_outreach_endpoint(
    payload: OutreachRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == payload.resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return gemini_service.generate_networking_outreach(
        resume_text=resume.extracted_text,
        company_name=payload.company_name,
        target_role=payload.target_role,
        recipient_type=payload.recipient_type,
        tone=payload.tone
    )


@app.post("/api/v1/tools/interview-prep")
def interview_prep_endpoint(
    payload: InterviewPrepRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == payload.resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return gemini_service.generate_interview_prep(
        resume_text=resume.extracted_text,
        target_role=payload.target_role,
        company_name=payload.company_name
    )


@app.post("/api/v1/tools/chat")
def chat_copilot_endpoint(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume_text = ""
    if payload.resume_id:
        resume = db.query(models.Resume).filter(
            models.Resume.id == payload.resume_id,
            models.Resume.user_id == current_user.id
        ).first()
        if resume:
            resume_text = resume.extracted_text

    if not resume_text:
        first_resume = db.query(models.Resume).filter(
            models.Resume.user_id == current_user.id
        ).order_by(models.Resume.created_at.desc()).first()
        if first_resume:
            resume_text = first_resume.extracted_text

    return gemini_service.chat_with_copilot(
        resume_text=resume_text,
        message=payload.message,
        target_role=payload.target_role or "Software Developer"
    )


@app.get("/api/v1/resumes/compare/{v1_id}/{v2_id}")
def compare_versions(
    v1_id: int,
    v2_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Compares two resume versions side-by-side."""
    v1_report = db.query(models.ScanReport).filter(
        models.ScanReport.resume_id == v1_id,
        models.ScanReport.resume.has(user_id=current_user.id)
    ).first()
    v2_report = db.query(models.ScanReport).filter(
        models.ScanReport.resume_id == v2_id,
        models.ScanReport.resume.has(user_id=current_user.id)
    ).first()
    
    if not v1_report or not v2_report:
        raise HTTPException(
            status_code=404,
            detail="One or both resume versions not found."
        )
        
    return {
        "v1": {
            "resume_id": v1_report.resume_id,
            "filename": v1_report.resume.filename,
            "version": v1_report.resume.version,
            "score_overall": v1_report.score_overall,
            "score_breakdown": v1_report.score_breakdown,
            "created_at": v1_report.created_at
        },
        "v2": {
            "resume_id": v2_report.resume_id,
            "filename": v2_report.resume.filename,
            "version": v2_report.resume.version,
            "score_overall": v2_report.score_overall,
            "score_breakdown": v2_report.score_breakdown,
            "created_at": v2_report.created_at
        }
    }

@app.get("/api/v1/resumes/{resume_id}/reconstruction")
def get_resume_reconstruction(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieves the layout model (RDOM), active suggestions, and validation checks."""
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    report = db.query(models.ScanReport).filter(models.ScanReport.resume_id == resume_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan report not found for this resume."
        )
        
    # Ensure RDOM is generated (backward compatibility)
    if not resume.rdom:
        try:
            with open(resume.file_path, "rb") as f:
                file_bytes = f.read()
            resume.rdom = rdom_service.parse_to_rdom(file_bytes, resume.filename)
            db.commit()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate RDOM: {str(e)}"
            )
            
    # Ensure suggestions exist
    if not report.suggestions:
        try:
            report.suggestions = rdom_service.generate_reconstruction_suggestions(
                resume.rdom, report.target_role, report.keyword_analysis.get("jd_similarity_score", 0.0)
            )
            db.commit()
        except Exception:
            report.suggestions = []
            
    validation = reconstruction_service.validate_reconstructed_rdom(resume.rdom)
    
    return {
        "resume_id": resume.id,
        "rdom": resume.rdom,
        "suggestions": report.suggestions,
        "validation_report": validation
    }

@app.post("/api/v1/resumes/{resume_id}/rebuild")
def rebuild_resume_pdf(
    resume_id: int,
    payload: RebuildRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Reflows the RDOM with approved suggestions and generates a visually reconstructed PDF."""
    from fastapi.responses import StreamingResponse
    import io
    
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    if not resume.rdom:
        try:
            with open(resume.file_path, "rb") as f:
                file_bytes = f.read()
            resume.rdom = rdom_service.parse_to_rdom(file_bytes, resume.filename)
            db.commit()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate RDOM: {str(e)}"
            )
            
    try:
        # Rebuild RDOM with modifications
        rebuilt_rdom = reconstruction_service.rebuild_rdom(resume.rdom, payload.approved_changes)
        
        # Compile PDF bytes
        pdf_data = reconstruction_service.render_rdom_to_pdf_bytes(rebuilt_rdom, resume.file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error compiling reconstructed PDF: {str(e)}"
        )
        
    return StreamingResponse(
        io.BytesIO(pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reconstructed_{resume.filename}"}
    )

# Serve frontend SPA built files in production if dist folder is present
# Try container path first, fallback to local dev path
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{catchall:path}")
    async def serve_frontend(request: Request, catchall: str):
        # Prevent hijacking API endpoints or docs
        if catchall.startswith("api") or catchall.startswith("docs") or catchall.startswith("redoc") or catchall.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend built index.html not found")
