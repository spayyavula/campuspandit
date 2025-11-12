"""
AI Coaching Service
Business logic for weak area identification, coaching sessions, and recommendations
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
import json
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coaching import (
    StudentWeakArea, AICoachingSession, RepetitionSchedule,
    StudentPerformanceAnalytics, CoachingRecommendation,
    ImprovementMilestone, AICoachingConfig,
    WeaknessSeverity, WeakAreaStatus, SessionType, RepetitionStatus,
    ContentType, RecommendationPriority, RecommendationStatus,
    PeriodType, Subject, IdentifiedFrom
)
from app.core.config import settings


class CoachingService:
    """Service for AI coaching operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================================================
    # CONFIGURATION
    # =====================================================

    async def get_or_create_config(self, student_id: UUID) -> AICoachingConfig:
        """Get student coaching config or create default"""
        result = await self.db.execute(
            select(AICoachingConfig).where(AICoachingConfig.student_id == student_id)
        )
        config = result.scalar_one_or_none()

        if not config:
            config = AICoachingConfig(
                student_id=student_id,
                notification_channels=["push"],
                focus_areas=["physics", "mathematics"]
            )
            self.db.add(config)
            await self.db.flush()

        return config

    # =====================================================
    # WEAK AREA IDENTIFICATION
    # =====================================================

    async def analyze_weak_areas(self, student_id: UUID) -> List[StudentWeakArea]:
        """
        Comprehensive weak area analysis from multiple sources.
        For MVP, we'll create sample weak areas based on common patterns.
        In production, this would analyze flashcards, chapters, tests, etc.
        """
        config = await self.get_or_create_config(student_id)

        # Get existing weak areas to avoid duplicates
        result = await self.db.execute(
            select(StudentWeakArea).where(
                and_(
                    StudentWeakArea.student_id == student_id,
                    StudentWeakArea.status == WeakAreaStatus.ACTIVE
                )
            )
        )
        existing_areas = result.scalars().all()

        # For MVP, create sample weak areas if none exist
        # In production, this would analyze actual student data
        new_areas = []

        if len(existing_areas) == 0:
            # Create sample weak areas for demonstration
            sample_areas = [
                {
                    "subject": Subject.PHYSICS,
                    "topic": "Electromagnetism",
                    "subtopic": "Magnetic Fields",
                    "severity": WeaknessSeverity.MEDIUM,
                    "accuracy": 65.0,
                    "reason": "Struggling with right-hand rule applications"
                },
                {
                    "subject": Subject.MATHEMATICS,
                    "topic": "Calculus",
                    "subtopic": "Integration by Parts",
                    "severity": WeaknessSeverity.HIGH,
                    "accuracy": 55.0,
                    "reason": "Difficulty choosing u and dv correctly"
                }
            ]

            for area_data in sample_areas:
                weak_area = StudentWeakArea(
                    student_id=student_id,
                    subject=area_data["subject"],
                    topic=area_data["topic"],
                    subtopic=area_data.get("subtopic"),
                    weakness_severity=area_data["severity"],
                    priority=self._calculate_priority(area_data["severity"], area_data["accuracy"]),
                    identified_from=IdentifiedFrom.AI_ANALYSIS,
                    identification_reason=area_data["reason"],
                    current_accuracy_percentage=area_data["accuracy"],
                    initial_accuracy=area_data["accuracy"],
                    attempts_count=10,
                    failures_count=int(10 * (1 - area_data["accuracy"] / 100)),
                    status=WeakAreaStatus.ACTIVE,
                    target_accuracy_percentage=config.mastery_threshold_percentage,
                    ai_recommendations=self._generate_weak_area_recommendations(
                        area_data["subject"], area_data["topic"]
                    )
                )
                self.db.add(weak_area)
                new_areas.append(weak_area)

            await self.db.flush()

        return new_areas

    def _calculate_priority(self, severity: WeaknessSeverity, accuracy: float) -> int:
        """Calculate priority score (1-10) based on severity and accuracy"""
        base_priority = {
            WeaknessSeverity.CRITICAL: 9,
            WeaknessSeverity.HIGH: 7,
            WeaknessSeverity.MEDIUM: 5,
            WeaknessSeverity.LOW: 3
        }

        priority = base_priority.get(severity, 5)

        # Adjust based on accuracy
        if accuracy < 40:
            priority = min(10, priority + 1)
        elif accuracy > 75:
            priority = max(1, priority - 1)

        return priority

    def _generate_weak_area_recommendations(self, subject: Subject, topic: str) -> List[str]:
        """Generate AI recommendations for a weak area"""
        return [
            f"Review fundamentals of {topic}",
            "Practice 10 problems daily on this topic",
            "Watch concept videos for visual understanding",
            "Schedule a tutor session for personalized help"
        ]

    # =====================================================
    # COACHING SESSIONS
    # =====================================================

    async def generate_coaching_session(
        self,
        student_id: UUID,
        session_type: SessionType = SessionType.DAILY
    ) -> AICoachingSession:
        """Generate AI coaching session with insights and recommendations"""

        # Get weak areas stats
        weak_areas = await self._get_weak_area_stats(student_id)

        # Get recent performance
        performance = await self._get_recent_performance(student_id)

        # Generate session content
        session = AICoachingSession(
            student_id=student_id,
            session_type=session_type,
            session_focus=self._determine_session_focus(weak_areas),
            weak_areas_identified=weak_areas["total"],
            weak_areas_improving=weak_areas["improving"],
            weak_areas_resolved=weak_areas["resolved"],
            new_weak_areas_found=weak_areas["new"],
            overall_accuracy=performance.get("overall_accuracy", 70.0),
            study_hours_this_week=performance.get("study_hours", 12.5),
            topics_studied_count=performance.get("topics_count", 8),
            flashcards_reviewed=performance.get("flashcards", 145),
            problems_solved=performance.get("problems", 65),
            priority_actions=await self._generate_priority_actions(student_id, weak_areas),
            suggested_study_plan=self._generate_study_plan(weak_areas, performance),
            motivational_message=self._generate_motivational_message(weak_areas, performance),
            student_viewed=False
        )

        self.db.add(session)
        await self.db.flush()

        # Generate recommendations for this session
        await self._create_session_recommendations(session.id, student_id, weak_areas)

        return session

    async def _get_weak_area_stats(self, student_id: UUID) -> Dict[str, Any]:
        """Get weak area statistics"""
        result = await self.db.execute(
            select(
                func.count(StudentWeakArea.id).label("total"),
                func.count(func.nullif(StudentWeakArea.status == WeakAreaStatus.IMPROVING, False)).label("improving"),
                func.count(func.nullif(StudentWeakArea.status == WeakAreaStatus.RESOLVED, False)).label("resolved")
            ).where(StudentWeakArea.student_id == student_id)
        )

        row = result.one()

        # Get newly identified areas (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_result = await self.db.execute(
            select(func.count(StudentWeakArea.id)).where(
                and_(
                    StudentWeakArea.student_id == student_id,
                    StudentWeakArea.created_at >= week_ago
                )
            )
        )

        return {
            "total": row.total or 0,
            "improving": row.improving or 0,
            "resolved": row.resolved or 0,
            "new": new_result.scalar() or 0
        }

    async def _get_recent_performance(self, student_id: UUID) -> Dict[str, float]:
        """Get recent performance metrics - MVP returns sample data"""
        # In production, this would query actual flashcard/chapter/test data
        return {
            "overall_accuracy": 72.5,
            "study_hours": 12.5,
            "topics_count": 8,
            "flashcards": 145,
            "problems": 65
        }

    def _determine_session_focus(self, weak_areas: Dict[str, int]) -> List[str]:
        """Determine what this session should focus on"""
        focus = []

        if weak_areas["new"] > 0:
            focus.append(f"New weak areas identified ({weak_areas['new']})")

        if weak_areas["improving"] > 0:
            focus.append(f"Areas showing improvement ({weak_areas['improving']})")

        if weak_areas["total"] > 5:
            focus.append("High priority areas need attention")

        if not focus:
            focus.append("Maintain current progress")

        return focus

    async def _generate_priority_actions(
        self,
        student_id: UUID,
        weak_areas: Dict[str, int]
    ) -> List[str]:
        """Generate priority actions for student"""
        actions = []

        # Get highest priority weak areas
        result = await self.db.execute(
            select(StudentWeakArea).where(
                and_(
                    StudentWeakArea.student_id == student_id,
                    StudentWeakArea.status == WeakAreaStatus.ACTIVE
                )
            ).order_by(StudentWeakArea.priority.desc()).limit(3)
        )

        top_areas = result.scalars().all()

        for area in top_areas:
            actions.append(
                f"Focus on {area.subject.value}: {area.topic} "
                f"(current: {area.current_accuracy_percentage:.0f}%, target: {area.target_accuracy_percentage:.0f}%)"
            )

        if weak_areas["total"] == 0:
            actions.append("Great job! Keep practicing to maintain your skills")

        return actions[:5]  # Max 5 actions

    def _generate_study_plan(
        self,
        weak_areas: Dict[str, int],
        performance: Dict[str, float]
    ) -> str:
        """Generate suggested study plan"""
        plan_parts = []

        if weak_areas["total"] > 0:
            plan_parts.append(
                f"This week, focus on resolving {min(2, weak_areas['total'])} weak areas. "
                "Dedicate 30-45 minutes daily to these specific topics."
            )

        if performance["study_hours"] < 10:
            plan_parts.append(
                "Try to increase study hours to at least 2 hours daily for better progress."
            )

        plan_parts.append(
            "Mix flashcard reviews with problem-solving for balanced learning. "
            "Schedule regular breaks to maintain focus."
        )

        return " ".join(plan_parts)

    def _generate_motivational_message(
        self,
        weak_areas: Dict[str, int],
        performance: Dict[str, float]
    ) -> str:
        """Generate motivational message"""
        if weak_areas["improving"] > 0:
            return (
                f"Excellent progress! You're improving in {weak_areas['improving']} areas. "
                "Keep up the great work!"
            )
        elif weak_areas["resolved"] > 0:
            return (
                f"Amazing! You've resolved {weak_areas['resolved']} weak areas. "
                "Your dedication is paying off!"
            )
        elif performance["overall_accuracy"] > 75:
            return "You're doing great! Your accuracy is above target. Stay consistent!"
        else:
            return (
                "Every expert was once a beginner. Your consistent effort will lead to mastery. "
                "Keep going!"
            )

    async def _create_session_recommendations(
        self,
        session_id: UUID,
        student_id: UUID,
        weak_areas: Dict[str, int]
    ):
        """Create recommendations for coaching session"""
        # Get top weak areas
        result = await self.db.execute(
            select(StudentWeakArea).where(
                and_(
                    StudentWeakArea.student_id == student_id,
                    StudentWeakArea.status == WeakAreaStatus.ACTIVE
                )
            ).order_by(StudentWeakArea.priority.desc()).limit(3)
        )

        top_areas = result.scalars().all()

        for i, area in enumerate(top_areas):
            priority = RecommendationPriority.HIGH if i == 0 else (
                RecommendationPriority.MEDIUM if i == 1 else RecommendationPriority.LOW
            )

            rec = CoachingRecommendation(
                student_id=student_id,
                weak_area_id=area.id,
                coaching_session_id=session_id,
                title=f"Improve {area.topic}",
                description=f"Focus on mastering {area.topic} in {area.subject.value}. "
                           f"Current accuracy: {area.current_accuracy_percentage:.0f}%",
                action_items=[
                    "Complete 10 practice problems",
                    "Review theory concepts",
                    "Create summary notes",
                    "Schedule repetition session"
                ],
                priority=priority,
                category="content_review",
                estimated_time_minutes=45,
                status=RecommendationStatus.PENDING
            )
            self.db.add(rec)

    # =====================================================
    # SPACED REPETITION
    # =====================================================

    async def schedule_repetitions(
        self,
        weak_area_id: UUID,
        student_id: UUID
    ) -> List[RepetitionSchedule]:
        """Schedule spaced repetitions for a weak area"""

        # Get config for repetition settings
        config = await self.get_or_create_config(student_id)

        # Get weak area
        result = await self.db.execute(
            select(StudentWeakArea).where(StudentWeakArea.id == weak_area_id)
        )
        weak_area = result.scalar_one()

        # Create repetition schedule using spaced repetition intervals
        # Day 1, 3, 7, 14, 30 pattern
        intervals = [1, 3, 7, 14, 30]
        repetitions = []

        base_date = datetime.utcnow()

        for i, interval in enumerate(intervals[:config.default_repetition_count]):
            scheduled_date = base_date + timedelta(days=interval)

            rep = RepetitionSchedule(
                student_id=student_id,
                weak_area_id=weak_area_id,
                repetition_number=i + 1,
                scheduled_date=scheduled_date,
                content_type=ContentType.MIXED,
                estimated_duration_minutes=30,
                status=RepetitionStatus.SCHEDULED
            )
            self.db.add(rep)
            repetitions.append(rep)

        # Update weak area with next review date
        weak_area.next_review_date = base_date + timedelta(days=intervals[0])

        await self.db.flush()
        return repetitions

    async def get_upcoming_repetitions(
        self,
        student_id: UUID,
        days: int = 7
    ) -> List[RepetitionSchedule]:
        """Get upcoming repetitions for next N days"""
        end_date = datetime.utcnow() + timedelta(days=days)

        result = await self.db.execute(
            select(RepetitionSchedule).where(
                and_(
                    RepetitionSchedule.student_id == student_id,
                    RepetitionSchedule.status == RepetitionStatus.SCHEDULED,
                    RepetitionSchedule.scheduled_date <= end_date
                )
            ).order_by(RepetitionSchedule.scheduled_date)
        )

        return result.scalars().all()

    async def complete_repetition(
        self,
        repetition_id: UUID,
        accuracy: float,
        problems_attempted: int,
        problems_solved: int,
        notes: Optional[str] = None
    ) -> RepetitionSchedule:
        """Mark repetition as completed and update weak area"""
        result = await self.db.execute(
            select(RepetitionSchedule).where(RepetitionSchedule.id == repetition_id)
        )
        repetition = result.scalar_one()

        # Update repetition
        repetition.status = RepetitionStatus.COMPLETED
        repetition.completed_at = datetime.utcnow()
        repetition.accuracy_achieved = accuracy
        repetition.problems_attempted = problems_attempted
        repetition.problems_solved = problems_solved
        repetition.notes = notes

        # Update weak area
        weak_area_result = await self.db.execute(
            select(StudentWeakArea).where(StudentWeakArea.id == repetition.weak_area_id)
        )
        weak_area = weak_area_result.scalar_one()

        weak_area.times_repeated += 1
        weak_area.current_accuracy_percentage = accuracy

        # Calculate improvement
        if weak_area.initial_accuracy:
            improvement = ((accuracy - weak_area.initial_accuracy) / weak_area.initial_accuracy) * 100
            weak_area.current_improvement_percentage = improvement

            # Check if status should change
            if improvement > 10:
                weak_area.status = WeakAreaStatus.IMPROVING

            if accuracy >= weak_area.target_accuracy_percentage:
                weak_area.status = WeakAreaStatus.RESOLVED

                # Create milestone
                await self._create_milestone(
                    student_id=weak_area.student_id,
                    weak_area_id=weak_area.id,
                    milestone_type="weak_area_resolved",
                    title=f"Mastered {weak_area.topic}!",
                    previous_value=weak_area.initial_accuracy,
                    new_value=accuracy
                )

        await self.db.flush()
        return repetition

    # =====================================================
    # ANALYTICS
    # =====================================================

    async def generate_analytics(
        self,
        student_id: UUID,
        period_type: PeriodType = PeriodType.WEEKLY
    ) -> StudentPerformanceAnalytics:
        """Generate performance analytics for a period"""

        # Calculate period dates
        end_date = datetime.utcnow()
        if period_type == PeriodType.WEEKLY:
            start_date = end_date - timedelta(days=7)
        elif period_type == PeriodType.MONTHLY:
            start_date = end_date - timedelta(days=30)
        elif period_type == PeriodType.DAILY:
            start_date = end_date - timedelta(days=1)
        else:
            start_date = datetime(2020, 1, 1)  # All time

        # Get weak area stats for period
        active_result = await self.db.execute(
            select(func.count(StudentWeakArea.id)).where(
                and_(
                    StudentWeakArea.student_id == student_id,
                    StudentWeakArea.status == WeakAreaStatus.ACTIVE
                )
            )
        )

        resolved_result = await self.db.execute(
            select(func.count(StudentWeakArea.id)).where(
                and_(
                    StudentWeakArea.student_id == student_id,
                    StudentWeakArea.status == WeakAreaStatus.RESOLVED,
                    StudentWeakArea.updated_at >= start_date
                )
            )
        )

        new_result = await self.db.execute(
            select(func.count(StudentWeakArea.id)).where(
                and_(
                    StudentWeakArea.student_id == student_id,
                    StudentWeakArea.created_at >= start_date
                )
            )
        )

        # For MVP, use sample performance data
        # In production, this would aggregate from flashcards, chapters, tests
        analytics = StudentPerformanceAnalytics(
            student_id=student_id,
            analysis_date=datetime.utcnow(),
            period_type=period_type,
            period_start=start_date,
            period_end=end_date,
            total_study_hours=12.5,
            total_flashcards_reviewed=145,
            total_problems_solved=65,
            total_tutor_sessions=2,
            average_session_rating=4.5,
            physics_accuracy=68.5,
            mathematics_accuracy=75.2,
            chemistry_accuracy=82.1,
            biology_accuracy=None,
            active_weak_areas=active_result.scalar() or 0,
            resolved_weak_areas_this_period=resolved_result.scalar() or 0,
            new_weak_areas_this_period=new_result.scalar() or 0,
            overall_improvement_percentage=8.5,
            study_consistency_score=85.0,
            target_achievement_percentage=72.0
        )

        self.db.add(analytics)
        await self.db.flush()

        return analytics

    async def get_latest_analytics(
        self,
        student_id: UUID,
        period_type: PeriodType = PeriodType.WEEKLY
    ) -> Optional[StudentPerformanceAnalytics]:
        """Get the most recent analytics for a period type"""
        result = await self.db.execute(
            select(StudentPerformanceAnalytics).where(
                and_(
                    StudentPerformanceAnalytics.student_id == student_id,
                    StudentPerformanceAnalytics.period_type == period_type
                )
            ).order_by(StudentPerformanceAnalytics.analysis_date.desc()).limit(1)
        )

        return result.scalar_one_or_none()

    # =====================================================
    # RECOMMENDATIONS
    # =====================================================

    async def get_recommendations(
        self,
        student_id: UUID,
        status: Optional[RecommendationStatus] = None
    ) -> List[CoachingRecommendation]:
        """Get coaching recommendations for student"""
        query = select(CoachingRecommendation).where(
            CoachingRecommendation.student_id == student_id
        )

        if status:
            query = query.where(CoachingRecommendation.status == status)

        query = query.order_by(
            CoachingRecommendation.priority.desc(),
            CoachingRecommendation.created_at.desc()
        )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_recommendation_status(
        self,
        recommendation_id: UUID,
        status: RecommendationStatus,
        completion_percentage: Optional[int] = None
    ) -> CoachingRecommendation:
        """Update recommendation status and progress"""
        result = await self.db.execute(
            select(CoachingRecommendation).where(
                CoachingRecommendation.id == recommendation_id
            )
        )
        recommendation = result.scalar_one()

        recommendation.status = status

        if completion_percentage is not None:
            recommendation.completion_percentage = completion_percentage

        if status == RecommendationStatus.IN_PROGRESS and not recommendation.started_at:
            recommendation.started_at = datetime.utcnow()

        if status == RecommendationStatus.COMPLETED:
            recommendation.completed_at = datetime.utcnow()
            recommendation.completion_percentage = 100

        await self.db.flush()
        return recommendation

    # =====================================================
    # MILESTONES
    # =====================================================

    async def _create_milestone(
        self,
        student_id: UUID,
        weak_area_id: UUID,
        milestone_type: str,
        title: str,
        previous_value: float,
        new_value: float
    ):
        """Create an improvement milestone"""
        improvement_pct = ((new_value - previous_value) / previous_value) * 100 if previous_value > 0 else 0

        milestone = ImprovementMilestone(
            student_id=student_id,
            weak_area_id=weak_area_id,
            milestone_type=milestone_type,
            title=title,
            description=f"Improved from {previous_value:.1f}% to {new_value:.1f}%",
            previous_value=previous_value,
            new_value=new_value,
            improvement_percentage=improvement_pct,
            achievement_date=datetime.utcnow(),
            celebration_message=self._generate_celebration_message(improvement_pct),
            student_viewed=False
        )

        self.db.add(milestone)

    def _generate_celebration_message(self, improvement_pct: float) -> str:
        """Generate celebration message based on improvement"""
        if improvement_pct > 50:
            return "Outstanding achievement! You've made exceptional progress!"
        elif improvement_pct > 30:
            return "Excellent work! Your dedication is really showing!"
        elif improvement_pct > 15:
            return "Great job! You're on the right track!"
        else:
            return "Nice progress! Keep up the good work!"

    # =====================================================
    # QUERY HELPERS
    # =====================================================

    async def get_weak_areas(
        self,
        student_id: UUID,
        status: Optional[WeakAreaStatus] = None
    ) -> List[StudentWeakArea]:
        """Get student weak areas with optional status filter"""
        query = select(StudentWeakArea).where(
            StudentWeakArea.student_id == student_id
        )

        if status:
            query = query.where(StudentWeakArea.status == status)

        query = query.order_by(
            StudentWeakArea.priority.desc(),
            StudentWeakArea.created_at.desc()
        )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_coaching_sessions(
        self,
        student_id: UUID,
        limit: int = 10
    ) -> List[AICoachingSession]:
        """Get recent coaching sessions"""
        result = await self.db.execute(
            select(AICoachingSession).where(
                AICoachingSession.student_id == student_id
            ).order_by(AICoachingSession.created_at.desc()).limit(limit)
        )

        return result.scalars().all()

    async def mark_session_viewed(self, session_id: UUID) -> AICoachingSession:
        """Mark coaching session as viewed"""
        result = await self.db.execute(
            select(AICoachingSession).where(AICoachingSession.id == session_id)
        )
        session = result.scalar_one()

        session.student_viewed = True
        session.viewed_at = datetime.utcnow()

        await self.db.flush()
        return session
