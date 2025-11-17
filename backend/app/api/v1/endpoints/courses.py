"""
Course Platform API Endpoints
Complete Udemy-style course management system
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import logging
from slugify import slugify

from app.core.database import get_db
from app.models.user import User
from app.models.courses import (
    Course, CourseSection, Lesson, Enrollment, LessonProgress,
    CourseReview, VideoAnalytics, Quiz, QuizAttempt,
    CourseStatus, VideoStatus
)
from app.schemas.courses import (
    CourseCreate, CourseUpdate, CourseResponse, CourseListResponse,
    SectionCreate, SectionUpdate, SectionResponse,
    LessonCreate, LessonUpdate, LessonResponse,
    VideoUploadRequest, VideoUploadResponse, VideoUploadFromURLRequest, VideoStatusUpdate,
    EnrollmentCreate, EnrollmentResponse,
    ProgressUpdate, ProgressResponse, BookmarkCreate, NoteUpdate,
    ReviewCreate, ReviewUpdate, ReviewResponse,
    VideoAnalyticsEvent, CourseAnalyticsResponse,
    CourseDetailResponse, SectionWithLessons, LessonWithProgress
)
from app.services.video_storage_service import video_storage_service
from app.core.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# COURSE ENDPOINTS
# ============================================================================

@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new course (instructor only)"""

    # Generate slug from title
    slug = slugify(course_data.title)

    # Check if slug already exists
    existing = await db.execute(select(Course).where(Course.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{datetime.utcnow().timestamp()}"

    new_course = Course(
        **course_data.model_dump(),
        instructor_id=current_user.id,
        slug=slug,
        status=CourseStatus.DRAFT
    )

    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)

    logger.info(f"Course created: {new_course.id} by {current_user.id}")
    return new_course


@router.get("/courses", response_model=CourseListResponse)
async def get_courses(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    board: Optional[str] = None,
    grade_level: Optional[str] = None,
    level: Optional[str] = None,
    is_free: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",  # created_at, rating, enrollment_count, price
    db: AsyncSession = Depends(get_db)
):
    """Get list of published courses with filters"""

    query = select(Course).where(Course.status == CourseStatus.PUBLISHED)

    # Apply filters
    if category:
        query = query.where(Course.category == category)
    if board:
        query = query.where(Course.board == board)
    if grade_level:
        query = query.where(Course.grade_level == grade_level)
    if level:
        query = query.where(Course.level == level)
    if is_free is not None:
        query = query.where(Course.is_free == is_free)
    if search:
        query = query.where(
            or_(
                Course.title.ilike(f"%{search}%"),
                Course.description.ilike(f"%{search}%")
            )
        )

    # Sort
    if sort_by == "rating":
        query = query.order_by(Course.average_rating.desc())
    elif sort_by == "enrollment_count":
        query = query.order_by(Course.enrollment_count.desc())
    elif sort_by == "price":
        query = query.order_by(Course.price.asc())
    else:
        query = query.order_by(Course.created_at.desc())

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    courses = result.scalars().all()

    return CourseListResponse(
        courses=courses,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )


# ============================================================================
# MY COURSES ENDPOINT (must be before /courses/{course_id} to avoid route conflict)
# ============================================================================

@router.get("/courses/my-courses", response_model=List[CourseDetailResponse])
async def get_my_courses(
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all courses student is enrolled in"""

    enrollments_result = await db.execute(
        select(Enrollment)
        .where(Enrollment.student_id == current_user_id)
        .where(Enrollment.is_active == True)
        .order_by(Enrollment.last_accessed_at.desc())
    )
    enrollments = enrollments_result.scalars().all()

    courses = []
    for enrollment in enrollments:
        course_result = await db.execute(
            select(Course).where(Course.id == enrollment.course_id)
        )
        course = course_result.scalar_one()

        # Get instructor name
        instructor_result = await db.execute(select(User).where(User.id == course.instructor_id))
        instructor = instructor_result.scalar_one_or_none()

        # Construct instructor name from first_name and last_name
        instructor_name = None
        if instructor:
            name_parts = [instructor.first_name, instructor.last_name]
            instructor_name = " ".join(filter(None, name_parts)) or None

        courses.append(CourseDetailResponse(
            **CourseResponse.model_validate(course).model_dump(),
            sections=[],
            instructor_name=instructor_name,
            is_enrolled=True,
            enrollment=EnrollmentResponse.model_validate(enrollment)
        ))

    return courses


@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
async def get_course(
    course_id: UUID,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed course information with curriculum"""

    # Get course
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get sections with lessons
    sections_result = await db.execute(
        select(CourseSection)
        .where(CourseSection.course_id == course_id)
        .order_by(CourseSection.order)
    )
    sections = sections_result.scalars().all()

    sections_with_lessons = []
    enrollment = None

    # Check if user is enrolled
    if current_user:
        enrollment_result = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.student_id == current_user.id
                )
            )
        )
        enrollment = enrollment_result.scalar_one_or_none()

    for section in sections:
        # Get lessons for this section
        lessons_result = await db.execute(
            select(Lesson)
            .where(Lesson.section_id == section.id)
            .order_by(Lesson.order)
        )
        lessons = lessons_result.scalars().all()

        lessons_with_progress = []
        for lesson in lessons:
            lesson_dict = LessonResponse.model_validate(lesson)

            # Get progress if enrolled
            progress = None
            if enrollment:
                progress_result = await db.execute(
                    select(LessonProgress).where(
                        and_(
                            LessonProgress.lesson_id == lesson.id,
                            LessonProgress.enrollment_id == enrollment.id
                        )
                    )
                )
                progress_data = progress_result.scalar_one_or_none()
                if progress_data:
                    progress = ProgressResponse.model_validate(progress_data)

            lessons_with_progress.append(LessonWithProgress(
                **lesson_dict.model_dump(),
                progress=progress
            ))

        sections_with_lessons.append(SectionWithLessons(
            **SectionResponse.model_validate(section).model_dump(),
            lessons=lessons_with_progress
        ))

    # Get instructor name
    instructor_result = await db.execute(select(User).where(User.id == course.instructor_id))
    instructor = instructor_result.scalar_one_or_none()

    # Construct instructor name from first_name and last_name
    instructor_name = None
    if instructor:
        name_parts = [instructor.first_name, instructor.last_name]
        instructor_name = " ".join(filter(None, name_parts)) or None

    return CourseDetailResponse(
        **CourseResponse.model_validate(course).model_dump(),
        sections=sections_with_lessons,
        instructor_name=instructor_name,
        is_enrolled=enrollment is not None,
        enrollment=EnrollmentResponse.model_validate(enrollment) if enrollment else None
    )


@router.patch("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_update: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update course (instructor only)"""

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields
    update_data = course_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)

    await db.commit()
    await db.refresh(course)

    return course


@router.post("/courses/{course_id}/publish", response_model=CourseResponse)
async def publish_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Publish a course"""

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    course.status = CourseStatus.PUBLISHED
    course.published_at = datetime.utcnow()

    await db.commit()
    await db.refresh(course)

    logger.info(f"Course published: {course_id}")
    return course


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course"""

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(course)
    await db.commit()

    return None


# ============================================================================
# ENROLLMENT ENDPOINTS
# ============================================================================

@router.post("/{course_id}/enroll", response_model=EnrollmentResponse)
async def enroll_in_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enroll student in a course"""

    # Check if already enrolled
    existing = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.student_id == current_user.id
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already enrolled")

    # Get course
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.status != CourseStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Course not available")

    # Create enrollment
    enrollment = Enrollment(
        student_id=current_user.id,
        course_id=course_id,
        price_paid=course.discount_price or course.price
    )

    db.add(enrollment)

    # Update course enrollment count
    course.enrollment_count += 1

    await db.commit()
    await db.refresh(enrollment)

    logger.info(f"Student {current_user.id} enrolled in course {course_id}")
    return enrollment


# ============================================================================
# PROGRESS TRACKING ENDPOINTS
# ============================================================================

@router.post("/lessons/{lesson_id}/progress", response_model=ProgressResponse)
async def update_lesson_progress(
    lesson_id: UUID,
    progress_data: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update student's progress on a lesson (for resume feature)"""

    # Get lesson
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Get enrollment
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.course_id == lesson.course_id,
                Enrollment.student_id == current_user.id
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Get or create progress
    progress_result = await db.execute(
        select(LessonProgress).where(
            and_(
                LessonProgress.lesson_id == lesson_id,
                LessonProgress.enrollment_id == enrollment.id
            )
        )
    )
    progress = progress_result.scalar_one_or_none()

    now = datetime.utcnow()

    if not progress:
        progress = LessonProgress(
            enrollment_id=enrollment.id,
            lesson_id=lesson_id,
            student_id=current_user.id,
            first_watched_at=now
        )
        db.add(progress)

    # Update progress
    progress.watch_time_seconds = progress_data.watch_time_seconds
    progress.last_position_seconds = progress_data.last_position_seconds
    progress.completion_percentage = progress_data.completion_percentage
    progress.last_watched_at = now
    progress.times_watched = (progress.times_watched or 0) + 1

    if progress_data.playback_speed:
        progress.playback_speed = progress_data.playback_speed

    if progress_data.quality_selected:
        progress.quality_selected = progress_data.quality_selected

    # Mark as completed if >= 90%
    if progress_data.completion_percentage >= 90 and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = now

        # Update enrollment progress
        total_lessons_result = await db.execute(
            select(func.count(Lesson.id)).where(Lesson.course_id == lesson.course_id)
        )
        total = total_lessons_result.scalar() or 1

        completed_result = await db.execute(
            select(func.count(LessonProgress.id)).where(
                and_(
                    LessonProgress.enrollment_id == enrollment.id,
                    LessonProgress.is_completed == True
                )
            )
        )
        completed = completed_result.scalar() or 0

        enrollment.progress_percentage = (completed / total) * 100 if total > 0 else 0
        enrollment.completed_lessons = completed
        enrollment.last_accessed_at = now

    await db.commit()
    await db.refresh(progress)

    return progress


@router.get("/lessons/{lesson_id}/progress", response_model=Optional[ProgressResponse])
async def get_lesson_progress(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get student's progress on a lesson"""

    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        return None

    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.course_id == lesson.course_id,
                Enrollment.student_id == current_user.id
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        return None

    progress_result = await db.execute(
        select(LessonProgress).where(
            and_(
                LessonProgress.lesson_id == lesson_id,
                LessonProgress.enrollment_id == enrollment.id
            )
        )
    )
    progress = progress_result.scalar_one_or_none()

    return progress


# ============================================================================
# VIDEO UPLOAD ENDPOINTS
# ============================================================================

@router.post("/lessons/{lesson_id}/upload-url", response_model=VideoUploadResponse)
async def get_video_upload_url(
    lesson_id: UUID,
    upload_request: VideoUploadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get one-time upload URL for video"""

    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Verify user is instructor of this course
    course_result = await db.execute(select(Course).where(Course.id == lesson.course_id))
    course = course_result.scalar_one()

    if course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Create upload URL with Cloudflare
    upload_data = video_storage_service.create_upload_url(
        max_duration_seconds=upload_request.max_duration_seconds
    )

    if not upload_data:
        raise HTTPException(status_code=500, detail="Failed to create upload URL")

    # Update lesson with video ID
    lesson.video_provider = "cloudflare"
    lesson.video_id = upload_data["video_id"]
    lesson.video_status = VideoStatus.UPLOADING

    await db.commit()

    return VideoUploadResponse(
        upload_url=upload_data["upload_url"],
        video_id=upload_data["video_id"],
        lesson_id=lesson_id
    )


@router.post("/lessons/{lesson_id}/video-status")
async def update_video_status(
    lesson_id: UUID,
    status_update: VideoStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update video status after processing"""

    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson.video_status = VideoStatus(status_update.status)

    if status_update.status == "ready":
        # Get video details from Cloudflare
        video_details = video_storage_service.get_video_details(status_update.video_id)

        if video_details:
            lesson.video_url = video_details["playback_url"]
            lesson.video_duration = video_details["duration"]
            lesson.thumbnail_url = video_details["thumbnail_url"]

    await db.commit()

    return {"status": "updated"}
