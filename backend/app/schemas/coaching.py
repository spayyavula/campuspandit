"""
Coaching API Schemas
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.models.coaching import (
    Subject, WeaknessSeverity, WeakAreaStatus, IdentifiedFrom,
    SessionType, RepetitionStatus, ContentType,
    RecommendationStatus, RecommendationPriority, PeriodType
)


# =====================================================
# WEAK AREAS
# =====================================================

class WeakAreaResponse(BaseModel):
    """Weak area response schema"""
    id: UUID
    student_id: UUID
    subject: Subject
    topic: str
    subtopic: Optional[str] = None
    chapter_id: Optional[UUID] = None
    resource_id: Optional[UUID] = None
    weakness_severity: WeaknessSeverity
    priority: int
    identified_from: IdentifiedFrom
    identification_reason: Optional[str] = None
    current_accuracy_percentage: Optional[float] = None
    attempts_count: int
    failures_count: int
    status: WeakAreaStatus
    times_repeated: int
    target_repetitions: int
    initial_accuracy: Optional[float] = None
    current_improvement_percentage: Optional[float] = None
    target_accuracy_percentage: float
    next_review_date: Optional[datetime] = None
    ai_recommendations: Optional[List[str]] = None
    tutor_notes: Optional[str] = None
    student_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# COACHING SESSIONS
# =====================================================

class CoachingSessionResponse(BaseModel):
    """Coaching session response schema"""
    id: UUID
    student_id: UUID
    session_type: SessionType
    session_focus: Optional[List[str]] = None
    weak_areas_identified: int
    weak_areas_improving: int
    weak_areas_resolved: int
    new_weak_areas_found: int
    overall_accuracy: Optional[float] = None
    study_hours_this_week: Optional[float] = None
    topics_studied_count: Optional[int] = None
    flashcards_reviewed: Optional[int] = None
    problems_solved: Optional[int] = None
    recommendations: Optional[dict] = None
    priority_actions: Optional[List[str]] = None
    suggested_study_plan: Optional[str] = None
    motivational_message: Optional[str] = None
    student_viewed: bool
    viewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# REPETITIONS
# =====================================================

class RepetitionResponse(BaseModel):
    """Repetition schedule response schema"""
    id: UUID
    student_id: UUID
    weak_area_id: UUID
    repetition_number: int
    scheduled_date: datetime
    scheduled_time_slot: Optional[str] = None
    content_type: ContentType
    flashcard_set_id: Optional[UUID] = None
    problems_to_solve: Optional[List[str]] = None
    chapters_to_review: Optional[List[str]] = None
    estimated_duration_minutes: Optional[int] = None
    status: RepetitionStatus
    completed_at: Optional[datetime] = None
    accuracy_achieved: Optional[float] = None
    problems_attempted: Optional[int] = None
    problems_solved: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompleteRepetitionRequest(BaseModel):
    """Request to complete a repetition"""
    accuracy: float = Field(..., ge=0, le=100)
    problems_attempted: int = Field(..., ge=0)
    problems_solved: int = Field(..., ge=0)
    notes: Optional[str] = None


# =====================================================
# RECOMMENDATIONS
# =====================================================

class RecommendationResponse(BaseModel):
    """Coaching recommendation response schema"""
    id: UUID
    student_id: UUID
    weak_area_id: Optional[UUID] = None
    coaching_session_id: Optional[UUID] = None
    title: str
    description: str
    action_items: Optional[List[str]] = None
    priority: RecommendationPriority
    category: Optional[str] = None
    estimated_time_minutes: Optional[int] = None
    status: RecommendationStatus
    completion_percentage: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    student_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateRecommendationRequest(BaseModel):
    """Request to update recommendation status"""
    status: RecommendationStatus
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)


# =====================================================
# ANALYTICS
# =====================================================

class AnalyticsResponse(BaseModel):
    """Performance analytics response schema"""
    id: UUID
    student_id: UUID
    analysis_date: datetime
    period_type: PeriodType
    period_start: datetime
    period_end: datetime
    total_study_hours: Optional[float] = None
    total_flashcards_reviewed: Optional[int] = None
    total_problems_solved: Optional[int] = None
    total_tutor_sessions: Optional[int] = None
    average_session_rating: Optional[float] = None
    physics_accuracy: Optional[float] = None
    mathematics_accuracy: Optional[float] = None
    chemistry_accuracy: Optional[float] = None
    biology_accuracy: Optional[float] = None
    active_weak_areas: Optional[int] = None
    resolved_weak_areas_this_period: Optional[int] = None
    new_weak_areas_this_period: Optional[int] = None
    overall_improvement_percentage: Optional[float] = None
    study_consistency_score: Optional[float] = None
    target_achievement_percentage: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# GENERIC RESPONSES
# =====================================================

class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool = True
    message: Optional[str] = None
