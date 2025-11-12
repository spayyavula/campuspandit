"""
Schemas Package
Import all Pydantic schemas for API validation
"""

from app.schemas.coaching import (
    WeakAreaResponse, CoachingSessionResponse, RepetitionResponse,
    AnalyticsResponse, RecommendationResponse, SuccessResponse,
    UpdateRecommendationRequest, CompleteRepetitionRequest
)

__all__ = [
    "WeakAreaResponse",
    "CoachingSessionResponse",
    "RepetitionResponse",
    "AnalyticsResponse",
    "RecommendationResponse",
    "SuccessResponse",
    "UpdateRecommendationRequest",
    "CompleteRepetitionRequest",
]
