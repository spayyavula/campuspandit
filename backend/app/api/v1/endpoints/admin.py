"""
Admin endpoints for database management
"""

from fastapi import APIRouter, HTTPException, Header
from loguru import logger
import os

from app.core.database import engine, Base
from app.models import user, coaching, scheduling, tutors, messaging

router = APIRouter(prefix="/admin", tags=["Admin"])

# Simple admin secret for database initialization
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-me-in-production")


@router.post("/init-database")
async def initialize_database(x_admin_secret: str = Header(None)):
    """
    Initialize database tables

    Requires X-Admin-Secret header with valid admin secret
    """
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    try:
        logger.info("Initializing database tables...")

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully")

        return {
            "status": "success",
            "message": "Database tables initialized successfully"
        }

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database initialization failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy"}
