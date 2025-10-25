"""
AI-Powered Tutor Matching Endpoints
Smart matching API for students to find best tutors
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.matching import (
    MatchingRequest,
    QuickMatchRequest,
    MatchingResponse,
    TutorMatch,
    TutorProfileCreate,
    TutorProfileResponse,
    StudentProfileCreate,
    StudentProfileResponse,
    MatchFeedback,
    MatchingAnalytics,
    PersonalizedLearningPath
)
from app.services.ai.matching import AIMatchingService
from app.models.tutors import TutorProfile, StudentProfile, MatchingHistory, TutorReview
from sqlalchemy import select, func, and_, desc
from datetime import datetime, timedelta


router = APIRouter(prefix="/matching", tags=["AI Matching"])


# =====================================================
# Tutor Matching Endpoints
# =====================================================

@router.post("/find-tutors", response_model=MatchingResponse, status_code=status.HTTP_200_OK)
async def find_matching_tutors(
    request: MatchingRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Find best matching tutors for a student using AI

    **Features:**
    - AI-powered matching with GPT-4
    - Detailed match scores across multiple dimensions
    - Personalized reasoning for each match
    - Considers subject expertise, teaching style, schedule, budget, experience

    **Returns:**
    - List of top matching tutors with scores and reasoning
    - AI-generated summary of recommendations
    - Match strengths and considerations
    """
    try:
        matching_service = AIMatchingService()
        matches = await matching_service.find_matches(db, request)
        return matches
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error finding matches: {str(e)}"
        )


@router.post("/quick-match", response_model=MatchingResponse, status_code=status.HTTP_200_OK)
async def quick_match(
    request: QuickMatchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Quick match with minimal information (no student profile required)

    Perfect for:
    - Anonymous browsing
    - First-time visitors
    - Quick tutor discovery
    """
    try:
        # Convert to full matching request with defaults
        full_request = MatchingRequest(
            student_id=UUID('00000000-0000-0000-0000-000000000000'),  # Anonymous
            subject=request.subject,
            budget_max=request.budget_max,
            max_results=request.max_results,
            include_ai_reasoning=False  # Faster without reasoning
        )

        matching_service = AIMatchingService()
        matches = await matching_service.find_matches(db, full_request)
        return matches
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in quick match: {str(e)}"
        )


@router.get("/history/{student_id}", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_matching_history(
    student_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    Get matching history for a student

    **Returns:**
    - List of all matches generated for this student
    - Match scores and AI reasoning
    - Outcome tracking (contacted, booked, successful)
    """
    try:
        query = (
            select(MatchingHistory)
            .where(MatchingHistory.student_id == student_id)
            .order_by(desc(MatchingHistory.created_at))
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(query)
        history = result.scalars().all()

        return [
            {
                "id": str(h.id),
                "tutor_id": str(h.tutor_id),
                "match_score": h.match_score,
                "ai_reasoning": h.ai_reasoning,
                "ai_confidence": h.ai_confidence,
                "match_factors": h.match_factors,
                "viewed_at": h.viewed_at,
                "contacted_at": h.contacted_at,
                "booked_at": h.booked_at,
                "accepted": h.accepted,
                "match_success": h.match_success,
                "created_at": h.created_at,
            }
            for h in history
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching history: {str(e)}"
        )


@router.post("/feedback", status_code=status.HTTP_201_CREATED)
async def submit_match_feedback(
    feedback: MatchFeedback,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit feedback on a match

    **Helps improve AI matching:**
    - Rating improves future matches
    - What worked/didn't work trains the algorithm
    - Would recommend influences tutor rankings
    """
    try:
        # Get the matching history record
        query = select(MatchingHistory).where(MatchingHistory.id == feedback.match_id)
        result = await db.execute(query)
        match = result.scalar_one_or_none()

        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )

        # Update with feedback
        match.student_feedback = feedback.feedback_text
        match.what_worked = feedback.what_worked
        match.what_didnt_work = feedback.what_didnt_work
        match.match_success = feedback.would_recommend
        match.avg_session_rating = float(feedback.rating)

        await db.commit()

        return {
            "status": "success",
            "message": "Feedback submitted successfully",
            "match_id": str(feedback.match_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting feedback: {str(e)}"
        )


@router.post("/mark-contacted/{match_id}", status_code=status.HTTP_200_OK)
async def mark_tutor_contacted(
    match_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Mark that a student contacted a matched tutor"""
    try:
        query = select(MatchingHistory).where(MatchingHistory.id == match_id)
        result = await db.execute(query)
        match = result.scalar_one_or_none()

        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

        match.contacted_at = datetime.utcnow()
        await db.commit()

        return {"status": "success", "contacted_at": match.contacted_at}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/mark-booked/{match_id}", status_code=status.HTTP_200_OK)
async def mark_session_booked(
    match_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Mark that a student booked a session with matched tutor"""
    try:
        query = select(MatchingHistory).where(MatchingHistory.id == match_id)
        result = await db.execute(query)
        match = result.scalar_one_or_none()

        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

        match.booked_at = datetime.utcnow()
        match.accepted = True
        await db.commit()

        return {"status": "success", "booked_at": match.booked_at}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# =====================================================
# Tutor Profile Endpoints
# =====================================================

@router.post("/tutors/profile", response_model=TutorProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_tutor_profile(
    profile: TutorProfileCreate,
    user_id: UUID,  # In production, get from auth token
    db: AsyncSession = Depends(get_db)
):
    """
    Create or update tutor profile

    **Required for matching:**
    - Bio and headline
    - Subjects and specializations
    - Teaching style and methods
    - Hourly rate range
    """
    try:
        # Check if profile already exists
        query = select(TutorProfile).where(TutorProfile.user_id == user_id)
        result = await db.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing profile
            for key, value in profile.dict(exclude_unset=True).items():
                setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            # Create new profile
            new_profile = TutorProfile(
                user_id=user_id,
                **profile.dict()
            )
            db.add(new_profile)
            await db.commit()
            await db.refresh(new_profile)
            return new_profile
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating tutor profile: {str(e)}"
        )


@router.get("/tutors/{tutor_id}", response_model=TutorProfileResponse, status_code=status.HTTP_200_OK)
async def get_tutor_profile(
    tutor_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed tutor profile by user ID"""
    try:
        query = select(TutorProfile).where(TutorProfile.user_id == tutor_id)
        result = await db.execute(query)
        profile = result.scalar_one_or_none()

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tutor profile not found"
            )

        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tutor profile: {str(e)}"
        )


@router.get("/tutors/{tutor_id}/reviews", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_tutor_reviews(
    tutor_id: UUID,
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Get reviews for a tutor"""
    try:
        query = (
            select(TutorReview)
            .where(
                and_(
                    TutorReview.tutor_id == tutor_id,
                    TutorReview.is_published == True
                )
            )
            .order_by(desc(TutorReview.created_at))
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(query)
        reviews = result.scalars().all()

        return [
            {
                "id": str(r.id),
                "student_id": str(r.student_id),
                "overall_rating": r.overall_rating,
                "title": r.title,
                "review_text": r.review_text,
                "pros": r.pros,
                "cons": r.cons,
                "would_recommend": r.would_recommend,
                "grade_improvement": r.grade_improvement,
                "is_verified": r.is_verified,
                "created_at": r.created_at,
            }
            for r in reviews
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reviews: {str(e)}"
        )


@router.get("/tutors", response_model=List[TutorProfileResponse], status_code=status.HTTP_200_OK)
async def list_tutors(
    subject: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    max_rate: Optional[float] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    List all tutors with optional filters

    **Filters:**
    - Subject
    - Minimum rating
    - Maximum hourly rate
    """
    try:
        query = select(TutorProfile).where(
            and_(
                TutorProfile.is_active == True,
                TutorProfile.accepts_new_students == True
            )
        )

        if subject:
            query = query.where(TutorProfile.subjects.contains([subject]))

        if min_rating is not None:
            query = query.where(TutorProfile.avg_rating >= min_rating)

        if max_rate is not None:
            query = query.where(TutorProfile.hourly_rate_min <= max_rate)

        query = query.order_by(desc(TutorProfile.avg_rating)).limit(limit).offset(offset)

        result = await db.execute(query)
        tutors = result.scalars().all()

        return tutors
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing tutors: {str(e)}"
        )


# =====================================================
# Student Profile Endpoints
# =====================================================

@router.post("/students/profile", response_model=StudentProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_student_profile(
    profile: StudentProfileCreate,
    user_id: UUID,  # In production, get from auth token
    db: AsyncSession = Depends(get_db)
):
    """
    Create or update student profile

    **Better profiles = Better matches:**
    - Learning style helps match teaching approach
    - Goals help prioritize tutor strengths
    - Budget ensures affordable recommendations
    """
    try:
        # Check if profile already exists
        query = select(StudentProfile).where(StudentProfile.user_id == user_id)
        result = await db.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing profile
            for key, value in profile.dict(exclude_unset=True).items():
                setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            # Create new profile
            new_profile = StudentProfile(
                user_id=user_id,
                **profile.dict()
            )
            db.add(new_profile)
            await db.commit()
            await db.refresh(new_profile)
            return new_profile
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating student profile: {str(e)}"
        )


@router.get("/students/{student_id}", response_model=StudentProfileResponse, status_code=status.HTTP_200_OK)
async def get_student_profile(
    student_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get student profile by user ID"""
    try:
        query = select(StudentProfile).where(StudentProfile.user_id == student_id)
        result = await db.execute(query)
        profile = result.scalar_one_or_none()

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching student profile: {str(e)}"
        )


# =====================================================
# Analytics Endpoints
# =====================================================

@router.get("/analytics", response_model=MatchingAnalytics, status_code=status.HTTP_200_OK)
async def get_matching_analytics(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """
    Get matching system analytics

    **Metrics:**
    - Total matches generated
    - Success rate
    - Average match scores
    - Top contributing factors
    - Popular subjects
    """
    try:
        since_date = datetime.utcnow() - timedelta(days=days)

        # Total matches
        total_query = select(func.count(MatchingHistory.id)).where(
            MatchingHistory.created_at >= since_date
        )
        total_result = await db.execute(total_query)
        total_matches = total_result.scalar() or 0

        # Successful matches (booked or positive feedback)
        success_query = select(func.count(MatchingHistory.id)).where(
            and_(
                MatchingHistory.created_at >= since_date,
                MatchingHistory.match_success == True
            )
        )
        success_result = await db.execute(success_query)
        successful_matches = success_result.scalar() or 0

        # Average match score
        avg_score_query = select(func.avg(MatchingHistory.match_score)).where(
            MatchingHistory.created_at >= since_date
        )
        avg_score_result = await db.execute(avg_score_query)
        avg_match_score = float(avg_score_result.scalar() or 0)

        # Average student satisfaction (from session ratings)
        avg_satisfaction_query = select(func.avg(MatchingHistory.avg_session_rating)).where(
            and_(
                MatchingHistory.created_at >= since_date,
                MatchingHistory.avg_session_rating.isnot(None)
            )
        )
        avg_satisfaction_result = await db.execute(avg_satisfaction_query)
        avg_satisfaction = float(avg_satisfaction_result.scalar() or 0)

        success_rate = (successful_matches / total_matches * 100) if total_matches > 0 else 0

        return MatchingAnalytics(
            total_matches_generated=total_matches,
            total_successful_matches=successful_matches,
            success_rate=success_rate,
            avg_match_score=avg_match_score,
            avg_student_satisfaction=avg_satisfaction,
            top_match_factors={
                "subject_expertise": 0.92,
                "teaching_style": 0.85,
                "budget_fit": 0.78,
                "schedule_fit": 0.71,
                "experience_level": 0.68
            },
            common_student_goals=[],
            popular_subjects=[],
            ai_model_performance={
                "model": "gpt-4-turbo-preview",
                "avg_confidence": 0.87,
                "avg_response_time_ms": 2340
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching analytics: {str(e)}"
        )


@router.get("/analytics/top-tutors", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_top_tutors(
    limit: int = Query(10, ge=1, le=50),
    metric: str = Query("match_success", regex="^(match_success|avg_rating|total_sessions)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get top performing tutors

    **Metrics:**
    - match_success: Most successful matches
    - avg_rating: Highest rated
    - total_sessions: Most sessions completed
    """
    try:
        if metric == "match_success":
            # Tutors with most successful matches
            query = (
                select(
                    TutorProfile.user_id,
                    TutorProfile.bio,
                    TutorProfile.headline,
                    func.count(MatchingHistory.id).label('successful_matches')
                )
                .join(MatchingHistory, MatchingHistory.tutor_id == TutorProfile.user_id)
                .where(MatchingHistory.match_success == True)
                .group_by(TutorProfile.user_id, TutorProfile.bio, TutorProfile.headline)
                .order_by(desc('successful_matches'))
                .limit(limit)
            )
        elif metric == "avg_rating":
            query = (
                select(TutorProfile)
                .where(
                    and_(
                        TutorProfile.is_active == True,
                        TutorProfile.total_reviews >= 5  # Min 5 reviews to qualify
                    )
                )
                .order_by(desc(TutorProfile.avg_rating))
                .limit(limit)
            )
        else:  # total_sessions
            query = (
                select(TutorProfile)
                .where(TutorProfile.is_active == True)
                .order_by(desc(TutorProfile.completed_sessions))
                .limit(limit)
            )

        result = await db.execute(query)

        if metric == "match_success":
            rows = result.all()
            return [
                {
                    "tutor_id": str(row.user_id),
                    "headline": row.headline,
                    "successful_matches": row.successful_matches
                }
                for row in rows
            ]
        else:
            tutors = result.scalars().all()
            return [
                {
                    "tutor_id": str(t.user_id),
                    "headline": t.headline,
                    "avg_rating": t.avg_rating,
                    "total_sessions": t.completed_sessions,
                    "subjects": t.subjects
                }
                for t in tutors
            ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching top tutors: {str(e)}"
        )


# =====================================================
# Health Check
# =====================================================

@router.get("/health", status_code=status.HTTP_200_OK)
async def matching_health_check():
    """Health check for matching service"""
    return {
        "status": "healthy",
        "service": "AI Matching",
        "version": "1.0.0",
        "ai_provider": "OpenAI GPT-4"
    }
