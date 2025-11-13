"""
Database Configuration
Async SQLAlchemy with PostgreSQL
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
import ssl

from app.core.config import settings

# Prepare database URL for asyncpg (remove sslmode parameter if present)
database_url = settings.DATABASE_URL.replace('?sslmode=require', '').replace('&sslmode=require', '')

# Configure SSL context for Azure PostgreSQL
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Create async engine with SSL configuration
engine = create_async_engine(
    database_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=20,  # Increased from 10
    max_overflow=40,  # Increased from 20
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_timeout=60,  # Wait up to 60 seconds for a connection
    connect_args={
        "ssl": ssl_context,
        "server_settings": {"application_name": "campuspandit-backend"}
    }
)

# Create session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database sessions

    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
