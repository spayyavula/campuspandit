"""
API v1 Router
Includes all API endpoints for CampusPandit backend
"""

from fastapi import APIRouter
from app.api.v1.endpoints import matching, chat, auth, channels, coaching, websocket, sse

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(matching.router, tags=["AI Matching"])
api_router.include_router(chat.router, tags=["Chat & Messaging"])
api_router.include_router(channels.router, prefix="/channels", tags=["Channels & Messaging"])
api_router.include_router(coaching.router, prefix="/coaching", tags=["AI Coaching"])
api_router.include_router(websocket.router, tags=["WebSocket"])
api_router.include_router(sse.router, tags=["Real-time SSE"])

# Add other routers here as they're created
# api_router.include_router(scheduling.router, tags=["Scheduling"])
# api_router.include_router(payments.router, tags=["Payments"])
# api_router.include_router(sessions.router, tags=["Sessions"])
