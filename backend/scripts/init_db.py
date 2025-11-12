"""
Database Initialization Script
Creates all database tables using SQLAlchemy models
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from app.core.database import engine, Base
from app.models import user, coaching, scheduling, tutors, messaging


async def init_database():
    """Initialize database by creating all tables"""
    logger.info("🗄️  Initializing database...")

    try:
        async with engine.begin() as conn:
            # Drop all tables (use with caution!)
            # await conn.run_sync(Base.metadata.drop_all)
            # logger.info("✅ Dropped existing tables")

            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Created all database tables")

        logger.info("🎉 Database initialization complete!")

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_database())
