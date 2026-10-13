import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        sys.exit(1)
        
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    # Print the database host for logging safety
    print(f"Connecting to database host: {db_url.split('@')[-1]}")
    
    engine = create_engine(db_url)
    
    sql_commands = [
        # 1. Enable Row Level Security (RLS) on all core tables
        "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.scan_reports ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;",
        
        # 2. Revoke direct API access privileges from anon and authenticated roles
        "REVOKE ALL ON TABLE public.users FROM anon, authenticated;",
        "REVOKE ALL ON TABLE public.resumes FROM anon, authenticated;",
        "REVOKE ALL ON TABLE public.scan_reports FROM anon, authenticated;",
        "REVOKE ALL ON TABLE public.user_sessions FROM anon, authenticated;"
    ]
    
    try:
        with engine.begin() as conn:
            print("Applying security fixes to Supabase database...")
            for cmd in sql_commands:
                print(f"Executing: {cmd}")
                conn.execute(text(cmd))
            print("All security fixes successfully applied to the database!")
    except Exception as e:
        print(f"Error applying security fixes: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
