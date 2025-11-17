"""
Database Configuration
Async SQLAlchemy with PostgreSQL
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
from typing import AsyncGenerator
import ssl
from loguru import logger

from app.core.config import settings

# Prepare database URL for asyncpg (remove sslmode parameter if present)
database_url = settings.DATABASE_URL.replace('?sslmode=require', '').replace('&sslmode=require', '')

# Ensure we're using the asyncpg driver
# Handle both postgresql:// and postgres:// formats
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql+asyncpg://', 1)
    logger.info(f"Converted postgres:// to postgresql+asyncpg://")
elif database_url.startswith('postgresql://') and '+asyncpg' not in database_url:
    database_url = database_url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    logger.info(f"Converted postgresql:// to postgresql+asyncpg://")

logger.info(f"Database URL driver: {database_url.split('://')[0] if '://' in database_url else 'unknown'}")

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
    pool_size=30,  # Increased for higher concurrency
    max_overflow=60,  # Increased overflow capacity
    pool_recycle=1800,  # Recycle connections after 30 minutes (was 1 hour)
    pool_timeout=30,  # Reduced to 30 seconds (fail faster)
    connect_args={
        "ssl": ssl_context,
        "server_settings": {"application_name": "campuspandit-backend"}
    }
)

# Add pool event listeners for monitoring
@event.listens_for(engine.sync_engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Log when a new database connection is created"""
    logger.debug("Database connection created")

@event.listens_for(engine.sync_engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log when a connection is checked out from the pool"""
    pool = connection_proxy._pool
    logger.debug(f"Connection checked out - Pool size: {pool.size()}, Checked out: {pool.checkedout()}")

    # Warn if pool is getting full
    if pool.checkedout() > (pool.size() + pool.overflow() * 0.8):
        logger.warning(f"Connection pool at 80% capacity: {pool.checkedout()}/{pool.size() + pool.overflow()}")

@event.listens_for(engine.sync_engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """Log when a connection is returned to the pool"""
    logger.debug("Connection returned to pool")

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
