"""
CampusPandit FastAPI Backend
Main application entry point with AI-ready architecture
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
from loguru import logger

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router

# Import models to create tables
from app.models import scheduling, tutors, user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting CampusPandit Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DATABASE_URL[:30]}...")

    # Create database tables (commented out for quick start without DB)
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)

    logger.info("✅ Database tables skipped (development mode)")
    logger.info("✅ Application startup complete")

    yield

    # Shutdown
    logger.info("🛑 Shutting down CampusPandit Backend...")
    await engine.dispose()
    logger.info("✅ Cleanup complete")


# Create FastAPI app
app = FastAPI(
    title="CampusPandit API",
    description="""
    AI-Powered Online Tutoring Platform Backend

    Features:
    - Smart Scheduling with automated reminders
    - AI-powered tutor matching
    - Real-time session management
    - Intelligent notifications
    - Analytics & insights
    """,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = time.time() - start_time

    # Log request
    logger.info(
        f"{request.method} {request.url.path} "
        f"- Status: {response.status_code} "
        f"- Duration: {duration:.3f}s"
    )

    # Add custom headers
    response.headers["X-Process-Time"] = str(duration)

    return response


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred",
            "path": str(request.url.path),
        },
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "message": "Welcome to CampusPandit API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/health",
    }


# Include API routes
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
