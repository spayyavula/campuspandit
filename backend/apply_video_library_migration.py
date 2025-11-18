#!/usr/bin/env python3
"""
Apply video library migration to Azure PostgreSQL
"""
import asyncio
import asyncpg
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "postgresql://dbadmin:CampusPandit2025!SecureDB@campuspandit-db.postgres.database.azure.com:5432/campuspandit?sslmode=require"

# Convert SQLAlchemy-style URL to asyncpg format
DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def apply_migration():
    """Apply the video library migration"""
    print("Connecting to Azure PostgreSQL...")

    try:
        # Parse connection URL and add SSL context
        # Remove sslmode parameter and use ssl='require' for asyncpg
        db_url = DATABASE_URL.replace("?sslmode=require", "").replace("&sslmode=require", "")

        # Connect to database with SSL
        conn = await asyncpg.connect(db_url, ssl='require')
        print("[OK] Connected successfully!")

        # Read migration file
        migration_file = 'migrations/005_add_video_library.sql'
        with open(migration_file, 'r') as f:
            migration_sql = f.read()

        print(f"\nApplying migration: {migration_file}")

        # Execute migration
        await conn.execute(migration_sql)

        print("[OK] Migration applied successfully!")

        # Verify new tables created
        tables = await conn.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN (
                'recorded_sessions',
                'session_views',
                'session_likes',
                'video_library_collections'
            )
            ORDER BY table_name;
        """)

        print(f"\n[OK] Video Library tables created:")
        for table in tables:
            print(f"  - {table['table_name']}")

        await conn.close()
        return True

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(apply_migration())
    sys.exit(0 if success else 1)
