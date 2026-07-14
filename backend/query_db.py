import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env file.")
    sys.exit(1)

# Ensure correct protocol prefix for sqlalchemy compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    print("="*60)
    print(" Connected to Supabase PostgreSQL database successfully!")
    print(" You can now type any SQL query below (e.g., SELECT * FROM users;).")
    print(" Type 'exit' or 'quit' to close the session.")
    print("="*60)
except Exception as e:
    print(f"Failed to connect to database: {e}")
    sys.exit(1)

while True:
    try:
        query_str = input("\nSQL> ").strip()
        if not query_str:
            continue
        if query_str.lower() in ("exit", "quit"):
            print("Goodbye!")
            break
        
        # Ensure query ends with semicolon conceptually
        if not query_str.endswith(";"):
            query_str += ";"
            
        result = connection.execute(text(query_str))
        
        # Check if the query returns rows (like SELECT)
        if result.returns_rows:
            keys = list(result.keys())
            rows = result.fetchall()
            
            if not rows:
                print("No rows returned.")
                continue
                
            # Compute column widths
            col_widths = [len(str(k)) for k in keys]
            for row in rows:
                for idx, val in enumerate(row):
                    col_widths[idx] = max(col_widths[idx], len(str(val if val is not None else "NULL")))
            
            # Print header
            header_str = " | ".join(f"{str(keys[idx]).ljust(col_widths[idx])}" for idx in range(len(keys)))
            print("-" * len(header_str))
            print(header_str)
            print("-" * len(header_str))
            
            # Print rows
            for row in rows:
                row_str = " | ".join(f"{str(val if val is not None else 'NULL').ljust(col_widths[idx])}" for idx, val in enumerate(row))
                print(row_str)
            print("-" * len(header_str))
            print(f"({len(rows)} row(s) returned)")
        else:
            # For UPDATE, INSERT, ALTER queries
            connection.commit()
            print("Query executed successfully. Transaction committed.")
            
    except KeyboardInterrupt:
        print("\nUse 'exit' to quit.")
    except Exception as e:
        print(f"Error executing query: {e}")

connection.close()
