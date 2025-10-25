"""
Pydantic schemas for AI matching system
Request/Response models for API
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID


# =====================================================
# Request Schemas
# =====================================================

class MatchingRequest(BaseModel):
    """Request to find matching tutors for a student"""

    student_id: UUID
    subject: str = Field(..., description="Subject the student needs help with")
    grade_level: Optional[str] = Field(None, description="Student's grade level")
    learning_style: Optional[str] = Field(None, description="visual, auditory, kinesthetic, reading-writing")
    learning_pace: Optional[str] = Field(None, description="slow, moderate, fast")
    goals: Optional[List[str]] = Field(default=[], description="Learning goals")
    budget_max: Optional[float] = Field(None, description="Maximum budget per hour")
    preferred_days: Optional[List[str]] = Field(default=[], description="Preferred days of week")
    preferred_times: Optional[List[str]] = Field(default=[], description="morning, afternoon, evening")
    session_type: Optional[str] = Field(None, description="one-time, ongoing, exam-prep")
    max_results: int = Field(5, ge=1, le=20, description="Maximum number of matches to return")
    include_ai_reasoning: bool = Field(True, description="Include AI explanation for each match")

    class Config:
        schema_extra = {
            "example": {
                "student_id": "550e8400-e29b-41d4-a716-446655440000",
                "subject": "Mathematics",
                "grade_level": "10",
                "learning_style": "visual",
                "goals": ["improve grades", "prepare for exams"],
                "budget_max": 60,
                "preferred_times": ["afternoon", "evening"],
                "max_results": 5
            }
        }


class QuickMatchRequest(BaseModel):
    """Quick match with minimal info"""

    subject: str
    budget_max: Optional[float] = None
    max_results: int = Field(3, ge=1, le=10)


# =====================================================
# Response Schemas
# =====================================================

class TutorMatchScore(BaseModel):
    """Individual match score breakdown"""

    subject_expertise: float = Field(..., ge=0, le=1, description="Match on subject expertise")
    teaching_style: float = Field(..., ge=0, le=1, description="Match on teaching style")
    schedule_fit: float = Field(..., ge=0, le=1, description="Schedule compatibility")
    budget_fit: float = Field(..., ge=0, le=1, description="Budget alignment")
    experience_level: float = Field(..., ge=0, le=1, description="Experience appropriateness")
    student_success: float = Field(..., ge=0, le=1, description="Historical success rate")
    overall: float = Field(..., ge=0, le=100, description="Overall match score (0-100)")


class TutorMatch(BaseModel):
    """A matched tutor with AI reasoning"""

    tutor_id: UUID
    name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    # Expertise
    subjects: List[str]
    specializations: List[str]
    years_experience: int
    education_level: Optional[str] = None

    # Ratings
    avg_rating: float
    total_reviews: int
    student_success_rate: float
    completion_rate: float

    # Pricing & Availability
    hourly_rate: float
    weekly_availability_hours: int
    response_time_minutes: int

    # Match Score
    match_score: TutorMatchScore
    overall_match_percentage: float = Field(..., description="0-100 percentage")

    # AI Reasoning
    ai_reasoning: Optional[str] = Field(None, description="Why this tutor was matched")
    ai_confidence: Optional[float] = Field(None, ge=0, le=1, description="AI confidence in this match")
    match_strengths: List[str] = Field(default=[], description="Key strengths of this match")
    match_considerations: List[str] = Field(default=[], description="Things to consider")

    # Quick Actions
    can_book_now: bool = Field(default=True)
    estimated_wait_time_hours: Optional[int] = None


class MatchingResponse(BaseModel):
    """Response containing matched tutors"""

    matches: List[TutorMatch]
    total_matches: int
    ai_summary: Optional[str] = Field(None, description="AI summary of recommendations")
    search_metadata: Dict[str, Any] = Field(default={})
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class PersonalizedLearningPath(BaseModel):
    """AI-generated personalized learning path"""

    path_id: UUID
    student_id: UUID
    subject: str
    current_level: str
    target_level: str
    timeline_weeks: int

    milestones: List[Dict[str, Any]] = Field(
        ...,
        description="Weekly milestones with topics and hours"
    )

    recommended_tutors: List[UUID] = Field(
        default=[],
        description="Tutors recommended for this path"
    )

    estimated_total_cost: float
    estimated_total_hours: int
    success_probability: float = Field(..., ge=0, le=1)

    ai_insights: str = Field(..., description="AI insights about this learning path")
    key_challenges: List[str] = Field(default=[])
    success_factors: List[str] = Field(default=[])

    created_at: datetime = Field(default_factory=datetime.utcnow)


# =====================================================
# Tutor Profile Schemas
# =====================================================

class TutorProfileCreate(BaseModel):
    """Create tutor profile"""

    bio: str = Field(..., min_length=100, max_length=2000)
    headline: str = Field(..., max_length=200)
    years_experience: int = Field(..., ge=0, le=50)
    education_level: str

    subjects: List[str] = Field(..., min_items=1)
    specializations: List[str] = Field(default=[])
    grade_levels: List[str] = Field(..., min_items=1)

    teaching_style: str
    teaching_methods: List[str] = Field(default=[])
    languages: List[str] = Field(default=["English"])

    hourly_rate_min: float = Field(..., gt=0)
    hourly_rate_max: float = Field(..., gt=0)

    certifications: List[Dict[str, Any]] = Field(default=[])
    degrees: List[Dict[str, Any]] = Field(default=[])

    @validator('hourly_rate_max')
    def validate_rate_range(cls, v, values):
        if 'hourly_rate_min' in values and v < values['hourly_rate_min']:
            raise ValueError('hourly_rate_max must be >= hourly_rate_min')
        return v


class TutorProfileResponse(BaseModel):
    """Tutor profile response"""

    id: UUID
    user_id: UUID
    bio: str
    headline: str
    years_experience: int
    education_level: str

    subjects: List[str]
    specializations: List[str]
    grade_levels: List[str]

    teaching_style: str
    teaching_methods: List[str]
    languages: List[str]

    hourly_rate_min: float
    hourly_rate_max: float

    avg_rating: float
    total_reviews: int
    total_sessions: int
    student_success_rate: float

    is_active: bool
    is_verified: bool
    accepts_new_students: bool

    ai_profile_summary: Optional[str] = None
    ai_strengths: List[str] = Field(default=[])

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# Student Profile Schemas
# =====================================================

class StudentProfileCreate(BaseModel):
    """Create student profile"""

    grade_level: str
    learning_style: str
    learning_pace: str

    primary_goals: List[str] = Field(..., min_items=1)
    target_subjects: List[str] = Field(..., min_items=1)

    budget_per_hour: Optional[float] = Field(None, gt=0)
    preferred_session_length: int = Field(60, ge=30, le=180)
    preferred_teaching_style: Optional[str] = None

    timezone: str = Field(default="UTC")


class StudentProfileResponse(BaseModel):
    """Student profile response"""

    id: UUID
    user_id: UUID
    grade_level: str
    learning_style: str
    learning_pace: str

    primary_goals: List[str]
    target_subjects: List[str]

    budget_per_hour: Optional[float]
    preferred_session_length: int

    total_tutors_tried: int
    successful_matches: int
    avg_session_rating: float

    ai_learning_profile_summary: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# Matching Analytics Schemas
# =====================================================

class MatchingAnalytics(BaseModel):
    """Analytics for matching performance"""

    total_matches_generated: int
    total_successful_matches: int
    success_rate: float
    avg_match_score: float
    avg_student_satisfaction: float

    top_match_factors: Dict[str, float] = Field(
        default={},
        description="What factors contribute most to successful matches"
    )

    common_student_goals: List[Dict[str, int]] = Field(default=[])
    popular_subjects: List[Dict[str, int]] = Field(default=[])

    ai_model_performance: Dict[str, Any] = Field(
        default={},
        description="AI model performance metrics"
    )


class MatchFeedback(BaseModel):
    """Feedback on a match"""

    match_id: UUID
    rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None
    what_worked: List[str] = Field(default=[])
    what_didnt_work: List[str] = Field(default=[])
    would_recommend: bool
