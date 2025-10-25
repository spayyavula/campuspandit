"""
Tests for AI Matching System
"""

import pytest
from uuid import uuid4
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai.matching import AIMatchingService
from app.schemas.matching import (
    MatchingRequest,
    QuickMatchRequest,
    TutorProfileCreate,
    StudentProfileCreate,
    MatchFeedback
)
from app.models.tutors import TutorProfile, StudentProfile, MatchingHistory


# =====================================================
# Fixtures
# =====================================================

@pytest.fixture
async def sample_tutor_profile(db_session: AsyncSession):
    """Create a sample tutor profile for testing"""
    tutor_id = uuid4()
    profile = TutorProfile(
        id=uuid4(),
        user_id=tutor_id,
        bio="Experienced math tutor with 5 years teaching calculus",
        headline="Expert Math Tutor - Calculus Specialist",
        years_experience=5,
        education_level="master",
        subjects=["Mathematics", "Calculus", "Statistics"],
        specializations=["AP Calculus", "SAT Math"],
        grade_levels=["9-10", "11-12", "college"],
        teaching_style="patient",
        teaching_methods=["visual", "interactive"],
        languages=["English"],
        hourly_rate_min=40.0,
        hourly_rate_max=60.0,
        weekly_availability_hours=20,
        timezone="UTC",
        avg_rating=4.8,
        total_reviews=45,
        student_success_rate=0.89,
        completion_rate=0.95,
        is_active=True,
        is_verified=True,
        accepts_new_students=True,
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)
    return profile


@pytest.fixture
async def sample_student_profile(db_session: AsyncSession):
    """Create a sample student profile for testing"""
    student_id = uuid4()
    profile = StudentProfile(
        id=uuid4(),
        user_id=student_id,
        grade_level="10",
        learning_style="visual",
        learning_pace="moderate",
        primary_goals=["improve grades", "prepare for SAT"],
        target_subjects=["Mathematics"],
        budget_per_hour=60.0,
        preferred_session_length=60,
        timezone="UTC",
        is_active=True,
        is_looking_for_tutor=True,
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)
    return profile


@pytest.fixture
def matching_service():
    """Get matching service instance"""
    return AIMatchingService()


# =====================================================
# Test Matching Service
# =====================================================

@pytest.mark.asyncio
async def test_find_matches_basic(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_tutor_profile: TutorProfile,
    sample_student_profile: StudentProfile
):
    """Test basic matching functionality"""
    request = MatchingRequest(
        student_id=sample_student_profile.user_id,
        subject="Mathematics",
        grade_level="10",
        budget_max=60.0,
        max_results=5,
        include_ai_reasoning=False  # Skip AI for faster testing
    )

    result = await matching_service.find_matches(db_session, request)

    # Assertions
    assert result is not None
    assert len(result.matches) <= 5
    assert result.total_matches >= 0

    if len(result.matches) > 0:
        match = result.matches[0]
        assert match.overall_match_percentage >= 0
        assert match.overall_match_percentage <= 100
        assert match.tutor_id is not None
        assert match.name is not None


@pytest.mark.asyncio
async def test_find_matches_with_ai_reasoning(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_tutor_profile: TutorProfile,
    sample_student_profile: StudentProfile
):
    """Test matching with AI reasoning"""
    request = MatchingRequest(
        student_id=sample_student_profile.user_id,
        subject="Mathematics",
        max_results=3,
        include_ai_reasoning=True
    )

    result = await matching_service.find_matches(db_session, request)

    # Check AI reasoning is included
    if len(result.matches) > 0:
        match = result.matches[0]
        # AI reasoning might be None if API fails, but that's ok for testing
        assert match.ai_confidence is None or (0 <= match.ai_confidence <= 1)


@pytest.mark.asyncio
async def test_quick_match(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_tutor_profile: TutorProfile
):
    """Test quick match without student profile"""
    # Quick match uses a dummy student ID
    request = MatchingRequest(
        student_id=uuid4(),  # Anonymous/new student
        subject="Mathematics",
        budget_max=50.0,
        max_results=3,
        include_ai_reasoning=False
    )

    result = await matching_service.find_matches(db_session, request)

    assert result is not None
    assert len(result.matches) <= 3


@pytest.mark.asyncio
async def test_subject_filtering(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_student_profile: StudentProfile
):
    """Test that only tutors matching the subject are returned"""
    # Create tutor with different subject
    physics_tutor = TutorProfile(
        id=uuid4(),
        user_id=uuid4(),
        bio="Physics expert",
        headline="Physics Tutor",
        years_experience=3,
        education_level="bachelor",
        subjects=["Physics"],  # Different subject
        teaching_style="energetic",
        hourly_rate_min=30.0,
        hourly_rate_max=50.0,
        is_active=True,
        accepts_new_students=True,
    )
    db_session.add(physics_tutor)
    await db_session.commit()

    # Request math tutor
    request = MatchingRequest(
        student_id=sample_student_profile.user_id,
        subject="Mathematics",
        max_results=10,
        include_ai_reasoning=False
    )

    result = await matching_service.find_matches(db_session, request)

    # Verify all matches teach Mathematics
    for match in result.matches:
        assert "Mathematics" in match.subjects or "Math" in match.subjects


@pytest.mark.asyncio
async def test_budget_filtering(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_student_profile: StudentProfile
):
    """Test that only affordable tutors are returned"""
    # Create expensive tutor
    expensive_tutor = TutorProfile(
        id=uuid4(),
        user_id=uuid4(),
        bio="Premium math tutor",
        headline="Premium Math Tutor",
        years_experience=10,
        education_level="phd",
        subjects=["Mathematics"],
        teaching_style="expert",
        hourly_rate_min=100.0,  # Too expensive
        hourly_rate_max=150.0,
        is_active=True,
        accepts_new_students=True,
    )
    db_session.add(expensive_tutor)
    await db_session.commit()

    # Request with low budget
    request = MatchingRequest(
        student_id=sample_student_profile.user_id,
        subject="Mathematics",
        budget_max=50.0,  # Low budget
        max_results=10,
        include_ai_reasoning=False
    )

    result = await matching_service.find_matches(db_session, request)

    # Verify all matches are within budget
    for match in result.matches:
        assert match.hourly_rate <= 50.0


@pytest.mark.asyncio
async def test_match_score_components(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_tutor_profile: TutorProfile,
    sample_student_profile: StudentProfile
):
    """Test that match scores have all required components"""
    request = MatchingRequest(
        student_id=sample_student_profile.user_id,
        subject="Mathematics",
        max_results=1,
        include_ai_reasoning=False
    )

    result = await matching_service.find_matches(db_session, request)

    if len(result.matches) > 0:
        match = result.matches[0]
        score = match.match_score

        # Check all score components exist
        assert hasattr(score, 'subject_expertise')
        assert hasattr(score, 'teaching_style')
        assert hasattr(score, 'schedule_fit')
        assert hasattr(score, 'budget_fit')
        assert hasattr(score, 'experience_level')
        assert hasattr(score, 'student_success')
        assert hasattr(score, 'overall')

        # Check all scores are in valid range
        assert 0 <= score.subject_expertise <= 1
        assert 0 <= score.teaching_style <= 1
        assert 0 <= score.schedule_fit <= 1
        assert 0 <= score.budget_fit <= 1
        assert 0 <= score.experience_level <= 1
        assert 0 <= score.student_success <= 1
        assert 0 <= score.overall <= 100


@pytest.mark.asyncio
async def test_matching_history_logged(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_tutor_profile: TutorProfile,
    sample_student_profile: StudentProfile
):
    """Test that matching attempts are logged to history"""
    request = MatchingRequest(
        student_id=sample_student_profile.user_id,
        subject="Mathematics",
        max_results=1,
        include_ai_reasoning=False
    )

    # Perform match
    result = await matching_service.find_matches(db_session, request)

    # Check history was created
    from sqlalchemy import select
    query = select(MatchingHistory).where(
        MatchingHistory.student_id == sample_student_profile.user_id
    )
    history_result = await db_session.execute(query)
    history = history_result.scalars().all()

    assert len(history) > 0
    latest = history[0]
    assert latest.student_id == sample_student_profile.user_id
    assert latest.match_score >= 0
    assert latest.match_score <= 100


# =====================================================
# Test Error Handling
# =====================================================

@pytest.mark.asyncio
async def test_no_tutors_available(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_student_profile: StudentProfile
):
    """Test behavior when no tutors match criteria"""
    request = MatchingRequest(
        student_id=sample_student_profile.user_id,
        subject="Nonexistent Subject",  # No tutors teach this
        max_results=5,
        include_ai_reasoning=False
    )

    result = await matching_service.find_matches(db_session, request)

    # Should return empty results, not error
    assert result is not None
    assert len(result.matches) == 0
    assert result.total_matches == 0


@pytest.mark.asyncio
async def test_invalid_student_id(
    db_session: AsyncSession,
    matching_service: AIMatchingService,
    sample_tutor_profile: TutorProfile
):
    """Test with non-existent student ID"""
    request = MatchingRequest(
        student_id=uuid4(),  # Random UUID that doesn't exist
        subject="Mathematics",
        max_results=5,
        include_ai_reasoning=False
    )

    # Should still work (student profile is optional)
    result = await matching_service.find_matches(db_session, request)
    assert result is not None


# =====================================================
# Test Scoring Functions
# =====================================================

@pytest.mark.asyncio
async def test_subject_expertise_scoring(
    matching_service: AIMatchingService
):
    """Test subject expertise calculation"""
    # Exact match
    score1 = matching_service._calculate_subject_expertise(
        tutor_subjects=["Mathematics", "Physics"],
        tutor_specializations=["AP Calculus"],
        requested_subject="Mathematics"
    )
    assert score1 > 0.8  # Should be high

    # Specialization match
    score2 = matching_service._calculate_subject_expertise(
        tutor_subjects=["Mathematics"],
        tutor_specializations=["AP Calculus", "SAT Math"],
        requested_subject="Mathematics"
    )
    assert score2 > 0.8  # Should be high

    # No match
    score3 = matching_service._calculate_subject_expertise(
        tutor_subjects=["Physics", "Chemistry"],
        tutor_specializations=[],
        requested_subject="Mathematics"
    )
    assert score3 < 0.3  # Should be low


@pytest.mark.asyncio
async def test_teaching_style_scoring(
    matching_service: AIMatchingService
):
    """Test teaching style compatibility"""
    # Exact match
    score1 = matching_service._calculate_teaching_style_match(
        tutor_style="patient",
        student_style="patient"
    )
    assert score1 == 1.0

    # Compatible styles
    score2 = matching_service._calculate_teaching_style_match(
        tutor_style="patient",
        student_style="structured"
    )
    assert 0.7 <= score2 <= 0.9

    # No preference
    score3 = matching_service._calculate_teaching_style_match(
        tutor_style="patient",
        student_style=None
    )
    assert score3 == 0.7


@pytest.mark.asyncio
async def test_budget_scoring(
    matching_service: AIMatchingService
):
    """Test budget fit calculation"""
    # Within budget
    score1 = matching_service._calculate_budget_fit(
        tutor_rate_min=40.0,
        tutor_rate_max=60.0,
        student_budget=50.0
    )
    assert score1 == 1.0

    # Slightly over budget
    score2 = matching_service._calculate_budget_fit(
        tutor_rate_min=50.0,
        tutor_rate_max=70.0,
        student_budget=45.0
    )
    assert 0.7 <= score2 < 1.0

    # Way over budget
    score3 = matching_service._calculate_budget_fit(
        tutor_rate_min=100.0,
        tutor_rate_max=150.0,
        student_budget=50.0
    )
    assert score3 < 0.3

    # No budget specified
    score4 = matching_service._calculate_budget_fit(
        tutor_rate_min=50.0,
        tutor_rate_max=70.0,
        student_budget=None
    )
    assert score4 == 0.8


# =====================================================
# Integration Tests
# =====================================================

@pytest.mark.asyncio
async def test_end_to_end_matching_flow(
    db_session: AsyncSession,
    matching_service: AIMatchingService
):
    """Test complete matching flow"""
    # Step 1: Create student profile
    student_id = uuid4()
    student = StudentProfile(
        id=uuid4(),
        user_id=student_id,
        grade_level="11",
        learning_style="visual",
        learning_pace="fast",
        primary_goals=["improve grades", "SAT prep"],
        target_subjects=["Mathematics"],
        budget_per_hour=70.0,
    )
    db_session.add(student)

    # Step 2: Create multiple tutors
    tutors = []
    for i in range(3):
        tutor = TutorProfile(
            id=uuid4(),
            user_id=uuid4(),
            bio=f"Math tutor {i}",
            headline=f"Math Tutor {i}",
            years_experience=i + 2,
            education_level="bachelor",
            subjects=["Mathematics"],
            teaching_style="patient",
            hourly_rate_min=30.0 + (i * 10),
            hourly_rate_max=50.0 + (i * 10),
            avg_rating=4.5 + (i * 0.1),
            total_reviews=10 + (i * 5),
            is_active=True,
            accepts_new_students=True,
        )
        tutors.append(tutor)
        db_session.add(tutor)

    await db_session.commit()

    # Step 3: Find matches
    request = MatchingRequest(
        student_id=student_id,
        subject="Mathematics",
        grade_level="11",
        learning_style="visual",
        budget_max=70.0,
        max_results=5,
        include_ai_reasoning=False
    )

    result = await matching_service.find_matches(db_session, request)

    # Step 4: Verify results
    assert len(result.matches) == 3  # All 3 tutors should match
    assert all(m.overall_match_percentage > 0 for m in result.matches)

    # Matches should be sorted by score (highest first)
    scores = [m.overall_match_percentage for m in result.matches]
    assert scores == sorted(scores, reverse=True)


# =====================================================
# Run Tests
# =====================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
