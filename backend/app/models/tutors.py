"""
Tutor Profile Models
Extended models for AI-powered tutor matching
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, ARRAY, JSON, CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class TutorProfile(Base):
    """Extended tutor profile for AI matching"""
    __tablename__ = "tutor_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Basic Info
    bio = Column(Text)
    headline = Column(String(200))  # e.g., "Expert Math Tutor specializing in Calculus"
    years_experience = Column(Integer, default=0)
    education_level = Column(String(50))  # bachelor, master, phd, professional

    # Subjects & Expertise (array of subjects)
    subjects = Column(ARRAY(String), default=[])
    specializations = Column(ARRAY(String), default=[])  # e.g., ["AP Calculus", "SAT Math"]
    grade_levels = Column(ARRAY(String), default=[])  # e.g., ["9-10", "11-12", "college"]

    # Teaching Style & Approach
    teaching_style = Column(String(50))  # patient, energetic, structured, flexible
    teaching_methods = Column(ARRAY(String), default=[])  # visual, hands-on, lecture, interactive
    languages = Column(ARRAY(String), default=["English"])

    # Certifications & Credentials
    certifications = Column(JSONB, default=[])  # [{name, issuer, year}]
    degrees = Column(JSONB, default=[])  # [{degree, field, institution, year}]

    # Pricing
    hourly_rate_min = Column(Float, nullable=False)
    hourly_rate_max = Column(Float, nullable=False)
    pricing_type = Column(String(20), default="hourly")  # hourly, package, subscription

    # Availability Summary
    weekly_availability_hours = Column(Integer, default=0)  # Total hours available per week
    timezone = Column(String(50), default="UTC")

    # Performance Metrics
    total_sessions = Column(Integer, default=0)
    completed_sessions = Column(Integer, default=0)
    avg_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    response_time_minutes = Column(Integer, default=0)  # Average response time
    completion_rate = Column(Float, default=0.0)  # Percentage of completed sessions
    no_show_rate = Column(Float, default=0.0)

    # Student Success Metrics (AI uses these)
    student_success_rate = Column(Float, default=0.0)  # % of students who improved
    avg_grade_improvement = Column(Float, default=0.0)  # Average grade improvement
    student_satisfaction = Column(Float, default=0.0)  # 0-100 score

    # AI-Generated Profile Insights
    ai_profile_summary = Column(Text)  # AI-generated summary
    ai_strengths = Column(ARRAY(String), default=[])  # AI-identified strengths
    ai_ideal_student_profile = Column(Text)  # AI description of ideal student

    # Matching Preferences
    preferred_student_types = Column(ARRAY(String), default=[])  # beginner, intermediate, advanced
    preferred_session_types = Column(ARRAY(String), default=[])  # one-time, ongoing, exam-prep
    max_students_per_week = Column(Integer)

    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Background check, credential verification
    accepts_new_students = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    # user = relationship("User", back_populates="tutor_profile")
    # reviews = relationship("TutorReview", back_populates="tutor")
    # matches = relationship("MatchingHistory", back_populates="tutor")

    # Constraints
    __table_args__ = (
        CheckConstraint('hourly_rate_min > 0', name='positive_min_rate'),
        CheckConstraint('hourly_rate_max >= hourly_rate_min', name='valid_rate_range'),
        CheckConstraint('avg_rating >= 0 AND avg_rating <= 5', name='valid_rating'),
        CheckConstraint('completion_rate >= 0 AND completion_rate <= 1', name='valid_completion_rate'),
        Index('idx_tutor_profiles_user_id', 'user_id'),
        Index('idx_tutor_profiles_active', 'is_active'),
        Index('idx_tutor_profiles_subjects', 'subjects', postgresql_using='gin'),
        Index('idx_tutor_profiles_rating', 'avg_rating'),
    )


class StudentProfile(Base):
    """Student profile for AI matching"""
    __tablename__ = "student_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Basic Info
    grade_level = Column(String(20))  # K-12, college, adult
    current_gpa = Column(Float)

    # Learning Profile
    learning_style = Column(String(50))  # visual, auditory, kinesthetic, reading-writing
    learning_pace = Column(String(20))  # slow, moderate, fast
    personality_type = Column(String(50))  # introverted, extroverted, balanced

    # Goals & Needs
    primary_goals = Column(ARRAY(String), default=[])  # improve-grades, exam-prep, homework-help, enrichment
    specific_challenges = Column(ARRAY(String), default=[])  # time-management, test-anxiety, focus
    target_subjects = Column(ARRAY(String), default=[])

    # Preferences
    preferred_tutor_gender = Column(String(20))  # male, female, no-preference
    preferred_tutor_age_range = Column(String(20))  # 20-30, 30-40, 40+, no-preference
    preferred_teaching_style = Column(String(50))  # patient, energetic, structured, flexible
    preferred_session_length = Column(Integer, default=60)  # minutes

    # Budget & Schedule
    budget_per_hour = Column(Float)
    budget_per_month = Column(Float)
    preferred_days = Column(ARRAY(String), default=[])  # monday, tuesday, etc.
    preferred_times = Column(ARRAY(String), default=[])  # morning, afternoon, evening
    timezone = Column(String(50), default="UTC")

    # Parent/Guardian Info (for K-12)
    parent_involvement_level = Column(String(20))  # high, medium, low
    parent_preferences = Column(JSONB, default={})

    # AI-Generated Insights
    ai_learning_profile_summary = Column(Text)
    ai_recommended_approach = Column(Text)
    ai_success_predictors = Column(JSONB, default={})

    # Matching History Stats
    total_tutors_tried = Column(Integer, default=0)
    successful_matches = Column(Integer, default=0)
    avg_session_rating = Column(Float, default=0.0)

    # Status
    is_active = Column(Boolean, default=True)
    is_looking_for_tutor = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        Index('idx_student_profiles_user_id', 'user_id'),
        Index('idx_student_profiles_active', 'is_active'),
        Index('idx_student_profiles_subjects', 'target_subjects', postgresql_using='gin'),
    )


class MatchingHistory(Base):
    """Track tutor-student matching history"""
    __tablename__ = "matching_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tutor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Matching Details
    match_score = Column(Float, nullable=False)  # 0-100 AI confidence score
    match_algorithm = Column(String(50), default="gpt-4")  # gpt-4, claude-3, hybrid
    match_version = Column(String(20), default="1.0")

    # AI Reasoning
    ai_reasoning = Column(Text)  # Why this match was recommended
    ai_confidence = Column(Float)  # 0-1 confidence level
    match_factors = Column(JSONB, default={})  # {subject: 0.9, schedule: 0.8, style: 0.95}

    # Student Actions
    viewed_at = Column(DateTime(timezone=True))
    contacted_at = Column(DateTime(timezone=True))
    booked_at = Column(DateTime(timezone=True))
    accepted = Column(Boolean)  # Did student accept this match?

    # Outcome Tracking
    first_session_completed = Column(Boolean, default=False)
    total_sessions_together = Column(Integer, default=0)
    avg_session_rating = Column(Float)
    relationship_duration_days = Column(Integer, default=0)
    match_success = Column(Boolean)  # Overall success of this match

    # Feedback
    student_feedback = Column(Text)
    tutor_feedback = Column(Text)
    what_worked = Column(ARRAY(String), default=[])
    what_didnt_work = Column(ARRAY(String), default=[])

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint('match_score >= 0 AND match_score <= 100', name='valid_match_score'),
        Index('idx_matching_history_student_id', 'student_id'),
        Index('idx_matching_history_tutor_id', 'tutor_id'),
        Index('idx_matching_history_score', 'match_score'),
        Index('idx_matching_history_created', 'created_at'),
    )


class TutorReview(Base):
    """Student reviews of tutors"""
    __tablename__ = "tutor_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tutor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("tutoring_sessions.id"))

    # Ratings (1-5 scale)
    overall_rating = Column(Float, nullable=False)
    subject_expertise = Column(Float)
    communication = Column(Float)
    patience = Column(Float)
    punctuality = Column(Float)
    helpfulness = Column(Float)

    # Review Content
    title = Column(String(200))
    review_text = Column(Text)
    pros = Column(ARRAY(String), default=[])
    cons = Column(ARRAY(String), default=[])

    # Outcome
    would_recommend = Column(Boolean)
    grade_improvement = Column(Float)  # GPA improvement or test score increase
    learning_goals_met = Column(Boolean)

    # AI Analysis
    ai_sentiment_score = Column(Float)  # -1 to 1 (negative to positive)
    ai_key_themes = Column(ARRAY(String), default=[])  # extracted themes
    ai_summary = Column(Text)

    # Visibility
    is_verified = Column(Boolean, default=False)  # Verified purchase
    is_published = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint('overall_rating >= 1 AND overall_rating <= 5', name='valid_overall_rating'),
        Index('idx_tutor_reviews_tutor_id', 'tutor_id'),
        Index('idx_tutor_reviews_rating', 'overall_rating'),
        Index('idx_tutor_reviews_published', 'is_published'),
    )
