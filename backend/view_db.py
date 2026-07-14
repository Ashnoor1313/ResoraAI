import sys
from app.db.database import SessionLocal
from app.db.models import User, Resume, ScanReport

def view_database():
    db = SessionLocal()
    try:
        # 1. Fetch Users
        users = db.query(User).all()
        print("\n" + "="*50)
        print(f" USERS ({len(users)} registered)")
        print("="*50)
        for idx, user in enumerate(users, 1):
            print(f"{idx}. ID: {user.id}")
            print(f"   Email: {user.email}")
            print(f"   Career Level: {user.career_level} | Target Industry: {user.target_industry}")
            print(f"   Created At: {user.created_at}")
            print("-"*50)
            
        # 2. Fetch Resumes
        resumes = db.query(Resume).all()
        print("\n" + "="*50)
        print(f" RESUMES ({len(resumes)} uploaded)")
        print("="*50)
        for idx, res in enumerate(resumes, 1):
            print(f"{idx}. ID: {res.id}")
            print(f"   User ID: {res.user_id}")
            print(f"   Filename: {res.filename}")
            print(f"   Version: {res.version}")
            print(f"   Created At: {res.created_at}")
            print("-"*50)

        # 3. Fetch Scan Reports
        reports = db.query(ScanReport).all()
        print("\n" + "="*50)
        print(f" SCAN REPORTS ({len(reports)} generated)")
        print("="*50)
        for idx, rep in enumerate(reports, 1):
            print(f"{idx}. ID: {rep.id}")
            print(f"   Resume ID: {rep.resume_id}")
            print(f"   Target Role: {rep.target_role}")
            print(f"   Overall Score: {rep.score_overall}%")
            print(f"   Created At: {rep.created_at}")
            print("-"*50)

    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    view_database()
