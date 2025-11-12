"""
AI Coaching Endpoints
Full implementation with database integration and AI service
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Body
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.core.database import get_db
from app.services.coaching_service import CoachingService
from app.schemas.coaching import (
    WeakAreaResponse, CoachingSessionResponse, RecommendationResponse,
    AnalyticsResponse, RepetitionResponse, SuccessResponse,
    UpdateRecommendationRequest, CompleteRepetitionRequest
)
from app.models.coaching import (
    WeakAreaStatus, RecommendationStatus, SessionType, PeriodType
)

router = APIRouter()


# ==============================================
# WEAK AREAS
# ==============================================

@router.get("/weak-areas", response_model=List[WeakAreaResponse])
async def get_weak_areas(
    current_user_id: UUID = Depends(get_current_user),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get student's weak areas with optional status filter
    """
    service = CoachingService(db)

    # Parse status if provided
    status_filter = None
    if status:
        try:
            status_filter = WeakAreaStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    weak_areas = await service.get_weak_areas(current_user_id, status_filter)
    return weak_areas


@router.post("/weak-areas/analyze", response_model=List[WeakAreaResponse])
async def analyze_weak_areas(
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform comprehensive weak area analysis from multiple data sources
    """
    service = CoachingService(db)
    new_areas = await service.analyze_weak_areas(current_user_id)
    return new_areas


# ==============================================
# COACHING SESSIONS
# ==============================================

@router.get("/sessions", response_model=List[CoachingSessionResponse])
async def get_coaching_sessions(
    current_user_id: UUID = Depends(get_current_user),
    limit: Optional[int] = Query(10),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent coaching sessions for student
    """
    service = CoachingService(db)
    sessions = await service.get_coaching_sessions(current_user_id, limit)
    return sessions


@router.post("/sessions/generate", response_model=CoachingSessionResponse)
async def generate_coaching_session(
    current_user_id: UUID = Depends(get_current_user),
    session_type: Optional[str] = Query("daily"),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate AI coaching session with insights and recommendations
    """
    service = CoachingService(db)

    # Parse session type
    try:
        session_type_enum = SessionType(session_type)
    except ValueError:
        session_type_enum = SessionType.DAILY

    session = await service.generate_coaching_session(current_user_id, session_type_enum)
    return session


@router.put("/sessions/{session_id}/viewed", response_model=SuccessResponse)
async def mark_session_viewed(
    session_id: UUID,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark coaching session as viewed by student
    """
    service = CoachingService(db)
    await service.mark_session_viewed(session_id)
    return SuccessResponse(message="Session marked as viewed")


# ==============================================
# RECOMMENDATIONS
# ==============================================

@router.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(
    current_user_id: UUID = Depends(get_current_user),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get coaching recommendations with optional status filter
    """
    service = CoachingService(db)

    # Parse status if provided
    status_filter = None
    if status:
        try:
            status_filter = RecommendationStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    recommendations = await service.get_recommendations(current_user_id, status_filter)
    return recommendations


@router.put("/recommendations/{recommendation_id}", response_model=RecommendationResponse)
async def update_recommendation(
    recommendation_id: UUID,
    request: UpdateRecommendationRequest,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update recommendation status and progress
    """
    service = CoachingService(db)
    recommendation = await service.update_recommendation_status(
        recommendation_id,
        request.status,
        request.completion_percentage
    )
    return recommendation


# ==============================================
# ANALYTICS
# ==============================================

@router.get("/analytics/latest", response_model=Optional[AnalyticsResponse])
async def get_latest_analytics(
    current_user_id: UUID = Depends(get_current_user),
    period_type: Optional[str] = Query("weekly"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get latest performance analytics for student
    """
    service = CoachingService(db)

    # Parse period type
    try:
        period_type_enum = PeriodType(period_type)
    except ValueError:
        period_type_enum = PeriodType.WEEKLY

    # Try to get existing analytics, or generate new one
    analytics = await service.get_latest_analytics(current_user_id, period_type_enum)

    if not analytics:
        analytics = await service.generate_analytics(current_user_id, period_type_enum)

    return analytics


# ==============================================
# REPETITION SCHEDULE
# ==============================================

@router.get("/repetitions/upcoming", response_model=List[RepetitionResponse])
async def get_upcoming_repetitions(
    current_user_id: UUID = Depends(get_current_user),
    days: Optional[int] = Query(7),
    db: AsyncSession = Depends(get_db)
):
    """
    Get upcoming repetitions for next N days
    """
    service = CoachingService(db)
    repetitions = await service.get_upcoming_repetitions(current_user_id, days)
    return repetitions


@router.post("/repetitions/{weak_area_id}/schedule", response_model=List[RepetitionResponse])
async def schedule_repetitions(
    weak_area_id: UUID,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Schedule spaced repetitions for a weak area
    """
    service = CoachingService(db)
    repetitions = await service.schedule_repetitions(weak_area_id, current_user_id)
    return repetitions


@router.put("/repetitions/{repetition_id}/complete", response_model=RepetitionResponse)
async def complete_repetition(
    repetition_id: UUID,
    request: CompleteRepetitionRequest,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a repetition as completed with results
    """
    service = CoachingService(db)
    repetition = await service.complete_repetition(
        repetition_id,
        request.accuracy,
        request.problems_attempted,
        request.problems_solved,
        request.notes
    )
    return repetition
