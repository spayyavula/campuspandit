"""
API v1 Router
Includes all API endpoints for CampusPandit backend
"""

from fastapi import APIRouter
from app.api.v1.endpoints import matching, chat, auth, channels, coaching, sse, admin, crm, sessions, courses, video_library

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(matching.router, tags=["AI Matching"])
api_router.include_router(chat.router, tags=["Chat & Messaging"])
api_router.include_router(channels.router, prefix="/channels", tags=["Channels & Messaging"])
api_router.include_router(coaching.router, prefix="/coaching", tags=["AI Coaching"])
api_router.include_router(sse.router, tags=["Real-time SSE"])
api_router.include_router(admin.router, tags=["Admin"])
api_router.include_router(crm.router, prefix="/crm", tags=["CRM"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Video Sessions"])
api_router.include_router(courses.router, tags=["Courses"])
api_router.include_router(video_library.router, prefix="/library", tags=["Video Library"])

# Add other routers here as they're created
# api_router.include_router(payments.router, tags=["Payments"])
