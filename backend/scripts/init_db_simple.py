"""
Database Initialization Script (No emoji output for Azure compatibility)
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine, Base
from app.models import user, coaching, scheduling, tutors, messaging


async def init_database():
    """Initialize database by creating all tables"""
    print("Initializing database...")

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("SUCCESS: Created all database tables")

        print("Database initialization complete!")

    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")
        raise

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_database())
