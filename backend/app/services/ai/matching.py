"""
AI-Powered Tutor Matching Service
Uses OpenAI GPT-4 for intelligent tutor-student matching
"""

import json
from typing import List, Dict, Any, Optional
from uuid import UUID
from loguru import logger
from openai import AsyncOpenAI
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.tutors import TutorProfile, StudentProfile, MatchingHistory
from app.schemas.matching import (
    MatchingRequest, TutorMatch, TutorMatchScore, MatchingResponse
)


class AIMatchingService:
    """AI-powered tutor matching service"""

    def __init__(self):
        """Initialize OpenAI client"""
        self.enabled = bool(settings.OPENAI_API_KEY)

        if not self.enabled:
            logger.warning("⚠️  OPENAI_API_KEY not configured - AI matching will use fallback scoring")
            self.client = None
            self.model = None
        else:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4-turbo-preview"  # or gpt-4o for faster responses
            logger.info("✅ AI Matching Service initialized with OpenAI")

    async def find_matches(
        self,
        db: AsyncSession,
        request: MatchingRequest
    ) -> MatchingResponse:
        """
        Find best tutor matches for a student using AI

        Process:
        1. Get eligible tutors from database
        2. Build context for AI
        3. Ask GPT-4 to rank and explain matches
        4. Calculate detailed match scores
        5. Return ranked results
        """

        logger.info(f"Finding matches for student {request.student_id}, subject: {request.subject}")

        # Step 1: Get student profile
        student_profile = await self._get_student_profile(db, request.student_id)

        # Step 2: Get eligible tutors from database
        eligible_tutors = await self._get_eligible_tutors(db, request)

        if not eligible_tutors:
            logger.warning("No eligible tutors found")
            return MatchingResponse(
                matches=[],
                total_matches=0,
                ai_summary="No tutors found matching your criteria. Try adjusting your filters."
            )

        logger.info(f"Found {len(eligible_tutors)} eligible tutors")

        # Step 3: Use AI to rank and match tutors
        ai_matches = await self._ai_rank_tutors(
            student_profile=student_profile,
            request=request,
            tutors=eligible_tutors
        )

        # Step 4: Calculate detailed match scores
        matches = await self._calculate_match_scores(
            db=db,
            ai_matches=ai_matches,
            tutors=eligible_tutors,
            request=request
        )

        # Step 5: Log matching history
        await self._log_matching_history(db, request.student_id, matches)

        # Step 6: Generate AI summary
        ai_summary = await self._generate_match_summary(matches, request)

        logger.info(f"Returning {len(matches)} matches")

        return MatchingResponse(
            matches=matches[:request.max_results],
            total_matches=len(matches),
            ai_summary=ai_summary,
            search_metadata={
                "subject": request.subject,
                "algorithm": "gpt-4",
                "version": "1.0"
            }
        )

    async def _get_student_profile(
        self,
        db: AsyncSession,
        student_id: UUID
    ) -> Optional[StudentProfile]:
        """Get student profile from database"""

        stmt = select(StudentProfile).where(StudentProfile.user_id == student_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_eligible_tutors(
        self,
        db: AsyncSession,
        request: MatchingRequest
    ) -> List[TutorProfile]:
        """Get tutors who match basic criteria"""

        # Build query filters
        filters = [
            TutorProfile.is_active == True,
            TutorProfile.accepts_new_students == True,
            TutorProfile.subjects.contains([request.subject])  # Must teach the subject
        ]

        # Budget filter
        if request.budget_max:
            filters.append(TutorProfile.hourly_rate_min <= request.budget_max)

        # Grade level filter
        if request.grade_level:
            filters.append(TutorProfile.grade_levels.contains([request.grade_level]))

        # Build query
        stmt = select(TutorProfile).where(and_(*filters)).limit(50)  # Max 50 candidates

        result = await db.execute(stmt)
        tutors = result.scalars().all()

        return tutors

    async def _ai_rank_tutors(
        self,
        student_profile: Optional[StudentProfile],
        request: MatchingRequest,
        tutors: List[TutorProfile]
    ) -> List[Dict[str, Any]]:
        """Use GPT-4 to rank tutors and provide reasoning"""

        # If OpenAI is not configured, return empty list (will use fallback scoring)
        if not self.enabled or not self.client:
            logger.info("Using fallback scoring (OpenAI not configured)")
            return []

        # Build prompt for AI
        prompt = self._build_matching_prompt(student_profile, request, tutors)

        logger.info("Calling GPT-4 for tutor ranking...")

        try:
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"}  # Force JSON response
            )

            # Parse AI response
            ai_response = json.loads(response.choices[0].message.content)

            logger.info(f"GPT-4 ranked {len(ai_response.get('matches', []))} tutors")

            return ai_response.get("matches", [])

        except Exception as e:
            logger.error(f"AI ranking failed: {e}")
            # Fallback to rule-based ranking
            return self._fallback_ranking(tutors, request)

    def _get_system_prompt(self) -> str:
        """System prompt for AI matching"""

        return """You are an expert educational consultant and tutor matching specialist.
Your job is to match students with the best possible tutors based on:
- Subject expertise and specializations
- Teaching style compatibility
- Learning style alignment
- Schedule and budget fit
- Past success rates
- Student goals and needs

Analyze each tutor carefully and provide:
1. A match score (0-100)
2. Clear reasoning for the match
3. Key strengths of the match
4. Any considerations or potential concerns
5. Confidence level (0-1)

Be honest, thorough, and student-focused in your recommendations.
Prioritize tutors who will truly help the student succeed.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "matches": [
    {
      "tutor_id": "uuid-here",
      "match_score": 95,
      "reasoning": "Clear explanation...",
      "strengths": ["Strength 1", "Strength 2"],
      "considerations": ["Thing to consider"],
      "confidence": 0.92
    }
  ],
  "summary": "Overall recommendation summary"
}
"""

    def _build_matching_prompt(
        self,
        student_profile: Optional[StudentProfile],
        request: MatchingRequest,
        tutors: List[TutorProfile]
    ) -> str:
        """Build detailed prompt for AI"""

        # Student info
        student_info = f"""
STUDENT PROFILE:
- Subject Needed: {request.subject}
- Grade Level: {request.grade_level or 'Not specified'}
- Learning Style: {request.learning_style or 'Not specified'}
- Learning Pace: {request.learning_pace or 'Not specified'}
- Goals: {', '.join(request.goals) if request.goals else 'Not specified'}
- Budget (max per hour): ${request.budget_max or 'Flexible'}
- Preferred Days: {', '.join(request.preferred_days) if request.preferred_days else 'Flexible'}
- Preferred Times: {', '.join(request.preferred_times) if request.preferred_times else 'Flexible'}
- Session Type: {request.session_type or 'Not specified'}
"""

        if student_profile:
            student_info += f"""
- Personality: {student_profile.personality_type or 'Not specified'}
- Challenges: {', '.join(student_profile.specific_challenges) if student_profile.specific_challenges else 'None specified'}
- Current GPA: {student_profile.current_gpa or 'Not specified'}
"""

        # Tutor info
        tutor_list = []
        for i, tutor in enumerate(tutors, 1):
            tutor_info = f"""
{i}. Tutor ID: {tutor.id}
   - Headline: {tutor.headline or 'No headline'}
   - Experience: {tutor.years_experience} years
   - Education: {tutor.education_level or 'Not specified'}
   - Subjects: {', '.join(tutor.subjects)}
   - Specializations: {', '.join(tutor.specializations) if tutor.specializations else 'None'}
   - Teaching Style: {tutor.teaching_style or 'Not specified'}
   - Teaching Methods: {', '.join(tutor.teaching_methods) if tutor.teaching_methods else 'Not specified'}
   - Grade Levels: {', '.join(tutor.grade_levels)}
   - Hourly Rate: ${tutor.hourly_rate_min}-${tutor.hourly_rate_max}
   - Rating: {tutor.avg_rating:.1f}/5.0 ({tutor.total_reviews} reviews)
   - Student Success Rate: {tutor.student_success_rate:.1%}
   - Completion Rate: {tutor.completion_rate:.1%}
   - Total Sessions: {tutor.total_sessions}
   - Response Time: {tutor.response_time_minutes} minutes avg
   - Availability: {tutor.weekly_availability_hours} hours/week
"""
            tutor_list.append(tutor_info)

        tutors_info = "\n".join(tutor_list)

        prompt = f"""{student_info}

AVAILABLE TUTORS:
{tutors_info}

TASK:
Rank these tutors from best to worst match for this student.
For each tutor, provide:
1. Match score (0-100)
2. Detailed reasoning explaining why this tutor is (or isn't) a good match
3. 2-4 key strengths of this match
4. Any considerations or concerns
5. Your confidence level (0-1)

Consider:
- Subject expertise and specializations
- Teaching style vs learning style compatibility
- Experience level appropriate for student's needs
- Budget alignment
- Schedule flexibility
- Past success rates
- Student goals and specific challenges

Be honest and student-focused. Return top {min(request.max_results, len(tutors))} matches.
Respond in JSON format ONLY.
"""

        return prompt

    def _fallback_ranking(
        self,
        tutors: List[TutorProfile],
        request: MatchingRequest
    ) -> List[Dict[str, Any]]:
        """Fallback rule-based ranking if AI fails"""

        logger.warning("Using fallback ranking algorithm")

        ranked = []
        for tutor in tutors:
            # Simple scoring
            score = 0

            # Subject match (required)
            if request.subject in tutor.subjects:
                score += 30

            # Rating
            score += (tutor.avg_rating / 5.0) * 20

            # Success rate
            score += tutor.student_success_rate * 20

            # Completion rate
            score += tutor.completion_rate * 10

            # Experience (capped at 10 points)
            score += min(tutor.years_experience, 10)

            # Budget fit
            if request.budget_max:
                if tutor.hourly_rate_min <= request.budget_max:
                    score += 10

            ranked.append({
                "tutor_id": str(tutor.id),
                "match_score": score,
                "reasoning": "Rule-based matching (AI unavailable)",
                "strengths": ["Subject expertise", "Good ratings"],
                "considerations": [],
                "confidence": 0.5
            })

        # Sort by score
        ranked.sort(key=lambda x: x["match_score"], reverse=True)

        return ranked

    async def _calculate_match_scores(
        self,
        db: AsyncSession,
        ai_matches: List[Dict[str, Any]],
        tutors: List[TutorProfile],
        request: MatchingRequest
    ) -> List[TutorMatch]:
        """Calculate detailed match scores for each tutor"""

        matches = []
        tutor_dict = {str(t.id): t for t in tutors}

        for ai_match in ai_matches:
            tutor_id = ai_match.get("tutor_id")
            tutor = tutor_dict.get(tutor_id)

            if not tutor:
                continue

            # Calculate sub-scores
            scores = TutorMatchScore(
                subject_expertise=self._score_subject_expertise(tutor, request),
                teaching_style=self._score_teaching_style(tutor, request),
                schedule_fit=self._score_schedule_fit(tutor, request),
                budget_fit=self._score_budget_fit(tutor, request),
                experience_level=self._score_experience(tutor, request),
                student_success=tutor.student_success_rate,
                overall=float(ai_match.get("match_score", 0))
            )

            # Build match object
            match = TutorMatch(
                tutor_id=tutor.id,
                name="Tutor Name",  # Get from user table
                headline=tutor.headline,
                bio=tutor.bio,
                avatar_url=None,  # Get from user table
                subjects=tutor.subjects,
                specializations=tutor.specializations,
                years_experience=tutor.years_experience,
                education_level=tutor.education_level,
                avg_rating=tutor.avg_rating,
                total_reviews=tutor.total_reviews,
                student_success_rate=tutor.student_success_rate,
                completion_rate=tutor.completion_rate,
                hourly_rate=tutor.hourly_rate_min,
                weekly_availability_hours=tutor.weekly_availability_hours,
                response_time_minutes=tutor.response_time_minutes,
                match_score=scores,
                overall_match_percentage=scores.overall,
                ai_reasoning=ai_match.get("reasoning"),
                ai_confidence=ai_match.get("confidence"),
                match_strengths=ai_match.get("strengths", []),
                match_considerations=ai_match.get("considerations", []),
                can_book_now=tutor.accepts_new_students,
                estimated_wait_time_hours=tutor.response_time_minutes // 60
            )

            matches.append(match)

        return matches

    def _score_subject_expertise(self, tutor: TutorProfile, request: MatchingRequest) -> float:
        """Score subject expertise (0-1)"""

        score = 0.0

        # Subject match
        if request.subject in tutor.subjects:
            score += 0.5

        # Specialization match
        if tutor.specializations and request.subject in tutor.specializations:
            score += 0.3

        # Experience
        if tutor.years_experience >= 5:
            score += 0.2
        elif tutor.years_experience >= 2:
            score += 0.1

        return min(score, 1.0)

    def _score_teaching_style(self, tutor: TutorProfile, request: MatchingRequest) -> float:
        """Score teaching style compatibility (0-1)"""

        # If no preference specified, assume good fit
        if not request.learning_style:
            return 0.8

        # Simple heuristic (in production, use ML model)
        style_map = {
            "visual": ["visual", "interactive", "hands-on"],
            "auditory": ["lecture", "discussion", "interactive"],
            "kinesthetic": ["hands-on", "interactive", "flexible"],
            "reading-writing": ["structured", "lecture", "flexible"]
        }

        compatible_styles = style_map.get(request.learning_style, [])
        tutor_methods = tutor.teaching_methods or []

        # Check overlap
        overlap = set(compatible_styles) & set(tutor_methods)

        if overlap:
            return 0.9
        else:
            return 0.5  # Still possible, just not perfectly aligned

    def _score_schedule_fit(self, tutor: TutorProfile, request: MatchingRequest) -> float:
        """Score schedule compatibility (0-1)"""

        if not request.preferred_days and not request.preferred_times:
            return 0.8  # No preference

        # Check availability
        if tutor.weekly_availability_hours >= 10:
            return 0.9
        elif tutor.weekly_availability_hours >= 5:
            return 0.7
        else:
            return 0.5

    def _score_budget_fit(self, tutor: TutorProfile, request: MatchingRequest) -> float:
        """Score budget fit (0-1)"""

        if not request.budget_max:
            return 0.8  # No budget specified

        if tutor.hourly_rate_min <= request.budget_max:
            # Perfect fit
            if tutor.hourly_rate_max <= request.budget_max:
                return 1.0
            # Partially fits
            else:
                return 0.7
        else:
            # Over budget
            return 0.3

    def _score_experience(self, tutor: TutorProfile, request: MatchingRequest) -> float:
        """Score experience level (0-1)"""

        years = tutor.years_experience

        if years >= 10:
            return 1.0
        elif years >= 5:
            return 0.8
        elif years >= 2:
            return 0.6
        elif years >= 1:
            return 0.4
        else:
            return 0.2

    async def _log_matching_history(
        self,
        db: AsyncSession,
        student_id: UUID,
        matches: List[TutorMatch]
    ):
        """Log matching history to database for analytics"""

        try:
            for match in matches:
                history = MatchingHistory(
                    student_id=student_id,
                    tutor_id=match.tutor_id,
                    match_score=match.overall_match_percentage,
                    match_algorithm="gpt-4",
                    match_version="1.0",
                    ai_reasoning=match.ai_reasoning,
                    ai_confidence=match.ai_confidence,
                    match_factors={
                        "subject": match.match_score.subject_expertise,
                        "style": match.match_score.teaching_style,
                        "schedule": match.match_score.schedule_fit,
                        "budget": match.match_score.budget_fit,
                        "experience": match.match_score.experience_level,
                        "success": match.match_score.student_success
                    }
                )
                db.add(history)

            await db.commit()

        except Exception as e:
            logger.error(f"Failed to log matching history: {e}")
            await db.rollback()

    async def _generate_match_summary(
        self,
        matches: List[TutorMatch],
        request: MatchingRequest
    ) -> str:
        """Generate AI summary of all matches"""

        if not matches:
            return "No matches found. Try adjusting your search criteria."

        # Build summary using AI (if available)
        if not self.enabled or not self.client:
            return f"Found {len(matches)} great tutors for {request.subject}. Check out the top matches below!"

        try:
            top_3 = matches[:3]

            summary_prompt = f"""
Student needs help with {request.subject}.
Found {len(matches)} matching tutors.

Top 3 matches:
{chr(10).join([f"{i+1}. {m.name} - Match: {m.overall_match_percentage:.0f}%" for i, m in enumerate(top_3)])}

Write a brief (2-3 sentences) summary helping the student choose.
Focus on what makes these tutors good matches.
"""

            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Cheaper model for summaries
                messages=[
                    {"role": "system", "content": "You are a helpful educational advisor."},
                    {"role": "user", "content": summary_prompt}
                ],
                max_tokens=150
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Failed to generate summary: {e}")
            return f"Found {len(matches)} great tutors for {request.subject}. Check out the top matches below!"


# Global instance
matching_service = AIMatchingService()
