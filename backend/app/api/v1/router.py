"""
API v1 Router
Includes all API endpoints for CampusPandit backend
"""

from fastapi import APIRouter
from app.api.v1.endpoints import matching, chat, auth

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(matching.router, tags=["AI Matching"])
api_router.include_router(chat.router, tags=["Chat & Messaging"])

# Add other routers here as they're created
# api_router.include_router(scheduling.router, tags=["Scheduling"])
# api_router.include_router(payments.router, tags=["Payments"])
# api_router.include_router(sessions.router, tags=["Sessions"])
