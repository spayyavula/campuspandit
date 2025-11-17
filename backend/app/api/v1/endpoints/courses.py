"""
Course Platform API Endpoints
Complete Udemy-style course management system
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from typing import List, Optional, Dict
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
from app.services.certificate_service import certificate_service
from app.services.file_upload_service import file_upload_service
from app.core.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# COURSE ENDPOINTS
# ============================================================================

@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: UUID = Depends(get_current_user),
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
        instructor_id=current_user,
        slug=slug,
        status=CourseStatus.DRAFT
    )

    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)

    logger.info(f"Course created: {new_course.id} by {current_user}")
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
                    Enrollment.student_id == current_user
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
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update course (instructor only)"""

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user:
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
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Publish a course"""

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user:
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
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course"""

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(course)
    await db.commit()

    return None


# ============================================================================
# SECTION ENDPOINTS
# ============================================================================

@router.post("/courses/{course_id}/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    course_id: UUID,
    section_data: SectionCreate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new section in a course (instructor only)"""

    # Verify course exists and user is the instructor
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this course")

    # Create section
    new_section = CourseSection(
        course_id=course_id,
        title=section_data.title,
        description=section_data.description,
        order=section_data.order
    )

    db.add(new_section)
    await db.commit()
    await db.refresh(new_section)

    logger.info(f"Section created: {new_section.id} for course {course_id}")

    return SectionResponse.model_validate(new_section)


@router.get("/courses/{course_id}/sections", response_model=List[SectionResponse])
async def get_course_sections(
    course_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all sections for a course (ordered)"""

    # Verify course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Get all sections ordered
    sections_result = await db.execute(
        select(CourseSection)
        .where(CourseSection.course_id == course_id)
        .order_by(CourseSection.order)
    )
    sections = sections_result.scalars().all()

    return [SectionResponse.model_validate(s) for s in sections]


@router.patch("/sections/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: UUID,
    section_data: SectionUpdate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a section (instructor only)"""

    # Get section and verify ownership
    section_result = await db.execute(select(CourseSection).where(CourseSection.id == section_id))
    section = section_result.scalar_one_or_none()

    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Verify course ownership
    course_result = await db.execute(select(Course).where(Course.id == section.course_id))
    course = course_result.scalar_one_or_none()

    if course.instructor_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields
    update_data = section_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(section, field, value)

    await db.commit()
    await db.refresh(section)

    return SectionResponse.model_validate(section)


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: UUID,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a section (instructor only)"""

    # Get section and verify ownership
    section_result = await db.execute(select(CourseSection).where(CourseSection.id == section_id))
    section = section_result.scalar_one_or_none()

    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Verify course ownership
    course_result = await db.execute(select(Course).where(Course.id == section.course_id))
    course = course_result.scalar_one_or_none()

    if course.instructor_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(section)
    await db.commit()

    return None


# ============================================================================
# LESSON ENDPOINTS
# ============================================================================

@router.post("/sections/{section_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    section_id: UUID,
    lesson_data: LessonCreate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new lesson in a section (instructor only)"""

    # Get section and verify it exists
    section_result = await db.execute(select(CourseSection).where(CourseSection.id == section_id))
    section = section_result.scalar_one_or_none()

    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Verify course ownership
    course_result = await db.execute(select(Course).where(Course.id == section.course_id))
    course = course_result.scalar_one_or_none()

    if course.instructor_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this course")

    # Create lesson
    new_lesson = Lesson(
        section_id=section_id,
        course_id=section.course_id,
        title=lesson_data.title,
        description=lesson_data.description,
        lesson_type=lesson_data.lesson_type,
        order=lesson_data.order,
        content=lesson_data.content,
        attachments=lesson_data.attachments,
        resources=lesson_data.resources,
        is_preview=lesson_data.is_preview,
        is_downloadable=lesson_data.is_downloadable,
        requires_completion=lesson_data.requires_completion,
        video_status=VideoStatus.UPLOADING if lesson_data.lesson_type == "video" else None
    )

    db.add(new_lesson)
    await db.commit()
    await db.refresh(new_lesson)

    # Update course total_lessons count
    course.total_lessons = (course.total_lessons or 0) + 1
    await db.commit()

    logger.info(f"Lesson created: {new_lesson.id} in section {section_id}")

    return LessonResponse.model_validate(new_lesson)


@router.get("/sections/{section_id}/lessons", response_model=List[LessonResponse])
async def get_section_lessons(
    section_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all lessons in a section (ordered)"""

    # Verify section exists
    section_result = await db.execute(select(CourseSection).where(CourseSection.id == section_id))
    section = section_result.scalar_one_or_none()

    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Get all lessons ordered
    lessons_result = await db.execute(
        select(Lesson)
        .where(Lesson.section_id == section_id)
        .order_by(Lesson.order)
    )
    lessons = lessons_result.scalars().all()

    return [LessonResponse.model_validate(l) for l in lessons]


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a single lesson"""

    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return LessonResponse.model_validate(lesson)


@router.patch("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: UUID,
    lesson_data: LessonUpdate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a lesson (instructor only)"""

    # Get lesson and verify ownership
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Verify course ownership
    course_result = await db.execute(select(Course).where(Course.id == lesson.course_id))
    course = course_result.scalar_one_or_none()

    if course.instructor_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields
    update_data = lesson_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)

    await db.commit()
    await db.refresh(lesson)

    return LessonResponse.model_validate(lesson)


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: UUID,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a lesson (instructor only)"""

    # Get lesson and verify ownership
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Verify course ownership
    course_result = await db.execute(select(Course).where(Course.id == lesson.course_id))
    course = course_result.scalar_one_or_none()

    if course.instructor_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update course total_lessons count
    course.total_lessons = max(0, (course.total_lessons or 0) - 1)

    await db.delete(lesson)
    await db.commit()

    return None


# ============================================================================
# ENROLLMENT ENDPOINTS
# ============================================================================

@router.post("/{course_id}/enroll", response_model=EnrollmentResponse)
async def enroll_in_course(
    course_id: UUID,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enroll student in a course"""

    # Check if already enrolled
    existing = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.student_id == current_user
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
        student_id=current_user,
        course_id=course_id,
        price_paid=course.discount_price or course.price
    )

    db.add(enrollment)

    # Update course enrollment count
    course.enrollment_count += 1

    await db.commit()
    await db.refresh(enrollment)

    logger.info(f"Student {current_user} enrolled in course {course_id}")
    return enrollment


# ============================================================================
# PROGRESS TRACKING ENDPOINTS
# ============================================================================

@router.post("/lessons/{lesson_id}/progress", response_model=ProgressResponse)
async def update_lesson_progress(
    lesson_id: UUID,
    progress_data: ProgressUpdate,
    current_user: UUID = Depends(get_current_user),
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
                Enrollment.student_id == current_user
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
            student_id=current_user,
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

        # Check if course is 100% complete and issue certificate
        if enrollment.progress_percentage >= 100 and not enrollment.completed_at:
            enrollment.completed_at = now

            # Issue certificate if enabled for the course
            course_for_cert = await db.execute(select(Course).where(Course.id == lesson.course_id))
            course_cert = course_for_cert.scalar_one_or_none()

            if course_cert and course_cert.certificate_enabled:
                # Generate certificate using certificate service
                enrollment.certificate_issued_at = now
                enrollment.certificate_url = certificate_service.generate_certificate_url(enrollment.id)

                logger.info(f"Course {lesson.course_id} completed by student {current_user}. Certificate issued.")

    await db.commit()
    await db.refresh(progress)

    return progress


@router.get("/lessons/{lesson_id}/progress", response_model=Optional[ProgressResponse])
async def get_lesson_progress(
    lesson_id: UUID,
    current_user: UUID = Depends(get_current_user),
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
                Enrollment.student_id == current_user
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
    current_user: UUID = Depends(get_current_user),
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

    if course.instructor_id != current_user:
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
    current_user: UUID = Depends(get_current_user),
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


# ============================================================================
# COURSE COMPLETION & CERTIFICATE ENDPOINTS
# ============================================================================

@router.get("/enrollments/{enrollment_id}/certificate", response_class=HTMLResponse)
async def get_certificate(
    enrollment_id: UUID,
    format: str = Query("html", description="Format: html or json"),
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get certificate for a completed course (HTML or JSON)"""

    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Verify user owns this enrollment
    if enrollment.student_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if course is completed
    if not enrollment.completed_at:
        raise HTTPException(status_code=400, detail="Course not yet completed")

    # Check if certificate was issued
    if not enrollment.certificate_issued_at or not enrollment.certificate_url:
        raise HTTPException(status_code=400, detail="Certificate not available")

    # Get course details for certificate
    course_result = await db.execute(select(Course).where(Course.id == enrollment.course_id))
    course = course_result.scalar_one_or_none()

    # Get instructor details
    instructor_result = await db.execute(select(User).where(User.id == course.instructor_id))
    instructor = instructor_result.scalar_one_or_none()

    # Get student details
    student_result = await db.execute(select(User).where(User.id == enrollment.student_id))
    student = student_result.scalar_one_or_none()

    # Build student and instructor names
    student_name = student.full_name or f"{student.first_name} {student.last_name}".strip()
    instructor_name = None
    if instructor:
        instructor_name = instructor.full_name or f"{instructor.first_name} {instructor.last_name}".strip()

    # Calculate course duration in hours
    course_duration_hours = None
    if course.duration_minutes:
        course_duration_hours = round(course.duration_minutes / 60, 1)

    # Generate certificate data
    cert_data = certificate_service.generate_certificate_data(
        enrollment_id=enrollment.id,
        course_id=course.id,
        student_id=student.id,
        student_name=student_name,
        course_title=course.title,
        completion_date=enrollment.completed_at,
        instructor_name=instructor_name,
        course_duration_hours=course_duration_hours
    )

    # Return HTML or JSON based on format parameter
    if format.lower() == "html":
        html_content = certificate_service.generate_certificate_html(cert_data)
        return HTMLResponse(content=html_content)
    else:
        return cert_data


@router.post("/enrollments/{enrollment_id}/complete", response_model=EnrollmentResponse)
async def mark_course_complete(
    enrollment_id: UUID,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually mark a course as complete (for instructors/admins or to override)"""

    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Get course to check instructor
    course_result = await db.execute(select(Course).where(Course.id == enrollment.course_id))
    course = course_result.scalar_one_or_none()

    # Only student or instructor can mark complete
    if enrollment.student_id != current_user and course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    now = datetime.utcnow()

    # Mark as completed
    if not enrollment.completed_at:
        enrollment.completed_at = now

    # Issue certificate if enabled and not already issued
    if course.certificate_enabled and not enrollment.certificate_issued_at:
        enrollment.certificate_issued_at = now
        enrollment.certificate_url = certificate_service.generate_certificate_url(enrollment.id)

        logger.info(f"Course {course.id} manually marked complete for student {enrollment.student_id}. Certificate issued.")

    # Set progress to 100% if not already
    if enrollment.progress_percentage < 100:
        enrollment.progress_percentage = 100.0

    await db.commit()
    await db.refresh(enrollment)

    return enrollment


@router.get("/enrollments/{enrollment_id}/completion-status")
async def get_completion_status(
    enrollment_id: UUID,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed completion status for an enrollment"""

    enrollment_result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Verify user owns this enrollment or is the instructor
    course_result = await db.execute(select(Course).where(Course.id == enrollment.course_id))
    course = course_result.scalar_one_or_none()

    if enrollment.student_id != current_user and course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get total lessons in course
    total_lessons_result = await db.execute(
        select(func.count(Lesson.id)).where(Lesson.course_id == enrollment.course_id)
    )
    total_lessons = total_lessons_result.scalar() or 0

    # Get completed lessons count
    completed_lessons_result = await db.execute(
        select(func.count(LessonProgress.id)).where(
            and_(
                LessonProgress.enrollment_id == enrollment.id,
                LessonProgress.is_completed == True
            )
        )
    )
    completed_lessons = completed_lessons_result.scalar() or 0

    # Get all lesson progress for this enrollment
    progress_result = await db.execute(
        select(LessonProgress)
        .where(LessonProgress.enrollment_id == enrollment.id)
        .order_by(LessonProgress.last_watched_at.desc())
    )
    lesson_progress = progress_result.scalars().all()

    return {
        "enrollment_id": enrollment.id,
        "course_id": enrollment.course_id,
        "student_id": enrollment.student_id,
        "is_completed": enrollment.completed_at is not None,
        "completed_at": enrollment.completed_at,
        "progress_percentage": enrollment.progress_percentage,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "remaining_lessons": total_lessons - completed_lessons,
        "total_watch_time_minutes": enrollment.total_watch_time_minutes,
        "certificate_available": enrollment.certificate_issued_at is not None,
        "certificate_issued_at": enrollment.certificate_issued_at,
        "certificate_url": enrollment.certificate_url,
        "enrolled_at": enrollment.enrolled_at,
        "last_accessed_at": enrollment.last_accessed_at,
        "recent_progress": [
            {
                "lesson_id": p.lesson_id,
                "completion_percentage": p.completion_percentage,
                "is_completed": p.is_completed,
                "last_watched_at": p.last_watched_at
            }
            for p in lesson_progress[:5]  # Last 5 lessons watched
        ]
    }


@router.get("/certificates/verify/{certificate_id}")
async def verify_certificate(
    certificate_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify a certificate ID and return certificate details
    Public endpoint - no authentication required for verification
    """

    # Certificate ID format: CERT-XXXXXXXXXXXXXXXX
    if not certificate_id.startswith("CERT-"):
        raise HTTPException(status_code=400, detail="Invalid certificate ID format")

    # Search for enrollments with certificates
    # Since we generate certificate IDs based on enrollment details,
    # we need to check all completed enrollments
    enrollments_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.completed_at.isnot(None),
                Enrollment.certificate_issued_at.isnot(None)
            )
        )
    )
    enrollments = enrollments_result.scalars().all()

    # Find matching enrollment by verifying certificate ID
    matching_enrollment = None
    for enrollment in enrollments:
        # Get course for this enrollment
        course_result = await db.execute(select(Course).where(Course.id == enrollment.course_id))
        course = course_result.scalar_one_or_none()

        if course and certificate_service.verify_certificate_id(
            certificate_id,
            enrollment.id,
            enrollment.course_id,
            enrollment.student_id
        ):
            matching_enrollment = enrollment
            break

    if not matching_enrollment:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid")

    # Get student and course details
    student_result = await db.execute(select(User).where(User.id == matching_enrollment.student_id))
    student = student_result.scalar_one_or_none()

    course_result = await db.execute(select(Course).where(Course.id == matching_enrollment.course_id))
    course = course_result.scalar_one_or_none()

    instructor_result = await db.execute(select(User).where(User.id == course.instructor_id))
    instructor = instructor_result.scalar_one_or_none()

    student_name = student.full_name or f"{student.first_name} {student.last_name}".strip()
    instructor_name = None
    if instructor:
        instructor_name = instructor.full_name or f"{instructor.first_name} {instructor.last_name}".strip()

    return {
        "valid": True,
        "certificate_id": certificate_id,
        "student_name": student_name,
        "course_title": course.title,
        "course_id": str(course.id),
        "completion_date": matching_enrollment.completed_at,
        "issued_date": matching_enrollment.certificate_issued_at,
        "instructor_name": instructor_name,
        "enrollment_id": str(matching_enrollment.id),
        "verification_timestamp": datetime.utcnow()
    }


# ============================================================================
# FILE UPLOAD ENDPOINTS
# ============================================================================

@router.post("/courses/{course_id}/upload-thumbnail")
async def upload_course_thumbnail(
    course_id: UUID,
    file: UploadFile = File(...),
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload course thumbnail image"""

    # Get course and verify ownership
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Read file content
    file_content = await file.read()

    # Upload thumbnail
    thumbnail_url = file_upload_service.upload_course_thumbnail(
        file_content=file_content,
        original_filename=file.filename,
        course_id=str(course_id)
    )

    if not thumbnail_url:
        raise HTTPException(status_code=400, detail="Invalid file or upload failed")

    # Delete old thumbnail if exists
    if course.thumbnail_url:
        file_upload_service.delete_file(course.thumbnail_url)

    # Update course
    course.thumbnail_url = thumbnail_url
    await db.commit()

    logger.info(f"Thumbnail uploaded for course {course_id}")

    return {
        "success": True,
        "thumbnail_url": thumbnail_url,
        "course_id": str(course_id)
    }


@router.post("/lessons/{lesson_id}/upload-attachment")
async def upload_lesson_attachment(
    lesson_id: UUID,
    file: UploadFile = File(...),
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload lesson attachment (PDF, documents, etc.)"""

    # Get lesson and verify ownership
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Verify course ownership
    course_result = await db.execute(select(Course).where(Course.id == lesson.course_id))
    course = course_result.scalar_one_or_none()

    if course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Read file content
    file_content = await file.read()

    # Upload attachment
    attachment_info = file_upload_service.upload_attachment(
        file_content=file_content,
        original_filename=file.filename,
        lesson_id=str(lesson_id)
    )

    if not attachment_info:
        raise HTTPException(status_code=400, detail="Invalid file or upload failed")

    # Add to lesson attachments
    current_attachments = lesson.attachments or []
    current_attachments.append(attachment_info)
    lesson.attachments = current_attachments

    await db.commit()

    logger.info(f"Attachment uploaded for lesson {lesson_id}")

    return {
        "success": True,
        "attachment": attachment_info,
        "lesson_id": str(lesson_id)
    }


# ============================================================================
# BULK COURSE CREATION ENDPOINTS
# ============================================================================

@router.post("/courses/{course_id}/bulk-curriculum")
async def create_bulk_curriculum(
    course_id: UUID,
    curriculum_data: Dict,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create multiple sections and lessons at once

    Expected format:
    {
        "sections": [
            {
                "title": "Section 1",
                "description": "...",
                "lessons": [
                    {"title": "Lesson 1", "lesson_type": "video", ...},
                    {"title": "Lesson 2", "lesson_type": "article", ...}
                ]
            }
        ]
    }
    """

    # Get course and verify ownership
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    sections_data = curriculum_data.get("sections", [])
    created_sections = []
    total_lessons = 0

    for section_order, section_data in enumerate(sections_data, start=1):
        # Create section
        new_section = CourseSection(
            course_id=course_id,
            title=section_data.get("title"),
            description=section_data.get("description"),
            order=section_order
        )
        db.add(new_section)
        await db.flush()

        lessons_data = section_data.get("lessons", [])
        created_lessons = []

        for lesson_order, lesson_data in enumerate(lessons_data, start=1):
            # Create lesson
            new_lesson = Lesson(
                section_id=new_section.id,
                course_id=course_id,
                title=lesson_data.get("title"),
                description=lesson_data.get("description"),
                lesson_type=lesson_data.get("lesson_type", "video"),
                order=lesson_order,
                content=lesson_data.get("content"),
                is_preview=lesson_data.get("is_preview", False),
                is_downloadable=lesson_data.get("is_downloadable", False),
                requires_completion=lesson_data.get("requires_completion", True)
            )
            db.add(new_lesson)
            created_lessons.append(new_lesson)
            total_lessons += 1

        await db.flush()

        created_sections.append({
            "section_id": str(new_section.id),
            "title": new_section.title,
            "lessons_count": len(created_lessons)
        })

    # Update course total lessons
    course.total_lessons = (course.total_lessons or 0) + total_lessons

    await db.commit()

    logger.info(f"Bulk curriculum created for course {course_id}: {len(created_sections)} sections, {total_lessons} lessons")

    return {
        "success": True,
        "course_id": str(course_id),
        "sections_created": len(created_sections),
        "lessons_created": total_lessons,
        "sections": created_sections
    }


# ============================================================================
# COURSE DUPLICATION
# ============================================================================

@router.post("/courses/{course_id}/duplicate", response_model=CourseResponse)
async def duplicate_course(
    course_id: UUID,
    new_title: Optional[str] = None,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Duplicate an existing course with all its content"""

    # Get original course
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    original_course = course_result.scalar_one_or_none()

    if not original_course:
        raise HTTPException(status_code=404, detail="Course not found")

    if original_course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Create new course (copy)
    new_course_title = new_title or f"{original_course.title} (Copy)"
    slug = slugify(new_course_title)

    # Ensure unique slug
    existing = await db.execute(select(Course).where(Course.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{datetime.utcnow().timestamp()}"

    new_course = Course(
        instructor_id=current_user,
        title=new_course_title,
        subtitle=original_course.subtitle,
        description=original_course.description,
        category=original_course.category,
        subcategory=original_course.subcategory,
        board=original_course.board,
        grade_level=original_course.grade_level,
        topics=original_course.topics,
        level=original_course.level,
        language=original_course.language,
        what_you_will_learn=original_course.what_you_will_learn,
        prerequisites=original_course.prerequisites,
        target_audience=original_course.target_audience,
        is_free=original_course.is_free,
        price=original_course.price,
        certificate_enabled=original_course.certificate_enabled,
        slug=slug,
        status=CourseStatus.DRAFT  # Always start as draft
    )

    db.add(new_course)
    await db.flush()

    # Copy sections and lessons
    sections_result = await db.execute(
        select(CourseSection)
        .where(CourseSection.course_id == course_id)
        .order_by(CourseSection.order)
    )
    sections = sections_result.scalars().all()

    for section in sections:
        new_section = CourseSection(
            course_id=new_course.id,
            title=section.title,
            description=section.description,
            order=section.order
        )
        db.add(new_section)
        await db.flush()

        # Copy lessons
        lessons_result = await db.execute(
            select(Lesson)
            .where(Lesson.section_id == section.id)
            .order_by(Lesson.order)
        )
        lessons = lessons_result.scalars().all()

        for lesson in lessons:
            new_lesson = Lesson(
                section_id=new_section.id,
                course_id=new_course.id,
                title=lesson.title,
                description=lesson.description,
                lesson_type=lesson.lesson_type,
                order=lesson.order,
                content=lesson.content,
                attachments=lesson.attachments,
                resources=lesson.resources,
                is_preview=lesson.is_preview,
                is_downloadable=lesson.is_downloadable,
                requires_completion=lesson.requires_completion
                # Note: Video files are NOT copied, instructor needs to re-upload
            )
            db.add(new_lesson)

    await db.commit()
    await db.refresh(new_course)

    logger.info(f"Course {course_id} duplicated to {new_course.id}")

    return new_course


# ============================================================================
# INSTRUCTOR DASHBOARD ENDPOINTS
# ============================================================================

@router.get("/instructor/my-courses", response_model=CourseListResponse)
async def get_instructor_courses(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all courses created by the current instructor"""

    query = select(Course).where(Course.instructor_id == current_user)

    if status_filter:
        query = query.where(Course.status == status_filter)

    query = query.order_by(Course.created_at.desc())

    # Get total count
    count_query = select(func.count()).select_from(
        select(Course).where(Course.instructor_id == current_user).subquery()
    )
    if status_filter:
        count_query = select(func.count()).select_from(
            select(Course).where(
                and_(
                    Course.instructor_id == current_user,
                    Course.status == status_filter
                )
            ).subquery()
        )

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
# COURSE VALIDATION & PUBLISHING
# ============================================================================

@router.get("/courses/{course_id}/validate")
async def validate_course_for_publishing(
    course_id: UUID,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Validate if a course is ready to be published"""

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    validation_errors = []
    validation_warnings = []

    # Required fields
    if not course.title or len(course.title) < 10:
        validation_errors.append("Title must be at least 10 characters")

    if not course.description or len(course.description) < 50:
        validation_errors.append("Description must be at least 50 characters")

    if not course.category:
        validation_errors.append("Category is required")

    if not course.thumbnail_url:
        validation_warnings.append("Course thumbnail is recommended")

    # Check for sections
    sections_result = await db.execute(
        select(func.count(CourseSection.id)).where(CourseSection.course_id == course_id)
    )
    sections_count = sections_result.scalar() or 0

    if sections_count == 0:
        validation_errors.append("Course must have at least one section")

    # Check for lessons
    lessons_result = await db.execute(
        select(func.count(Lesson.id)).where(Lesson.course_id == course_id)
    )
    lessons_count = lessons_result.scalar() or 0

    if lessons_count == 0:
        validation_errors.append("Course must have at least one lesson")
    elif lessons_count < 3:
        validation_warnings.append("Course should have at least 3 lessons for better student experience")

    # Check for video content
    video_lessons_result = await db.execute(
        select(func.count(Lesson.id)).where(
            and_(
                Lesson.course_id == course_id,
                Lesson.lesson_type == "video",
                Lesson.video_status == VideoStatus.READY
            )
        )
    )
    video_lessons_count = video_lessons_result.scalar() or 0

    if video_lessons_count == 0:
        validation_warnings.append("No video lessons found. Consider adding video content")

    # Pricing validation
    if not course.is_free and (not course.price or course.price <= 0):
        validation_errors.append("Paid courses must have a price greater than 0")

    is_valid = len(validation_errors) == 0

    return {
        "is_valid": is_valid,
        "can_publish": is_valid,
        "errors": validation_errors,
        "warnings": validation_warnings,
        "stats": {
            "sections_count": sections_count,
            "lessons_count": lessons_count,
            "video_lessons_count": video_lessons_count
        }
    }


# ============================================================================
# COURSE STATISTICS FOR INSTRUCTORS
# ============================================================================

@router.get("/courses/{course_id}/statistics")
async def get_course_statistics(
    course_id: UUID,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed statistics for a course (instructor only)"""

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get enrollment stats
    total_enrollments = course.enrollment_count

    active_students_result = await db.execute(
        select(func.count(Enrollment.id)).where(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.is_active == True
            )
        )
    )
    active_students = active_students_result.scalar() or 0

    completed_students_result = await db.execute(
        select(func.count(Enrollment.id)).where(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.completed_at.isnot(None)
            )
        )
    )
    completed_students = completed_students_result.scalar() or 0

    # Calculate completion rate
    completion_rate = (completed_students / total_enrollments * 100) if total_enrollments > 0 else 0

    # Get average progress
    avg_progress_result = await db.execute(
        select(func.avg(Enrollment.progress_percentage)).where(
            Enrollment.course_id == course_id
        )
    )
    avg_progress = avg_progress_result.scalar() or 0

    # Get total watch time
    total_watch_time_result = await db.execute(
        select(func.sum(Enrollment.total_watch_time_minutes)).where(
            Enrollment.course_id == course_id
        )
    )
    total_watch_time = total_watch_time_result.scalar() or 0

    # Get revenue (if applicable)
    revenue_result = await db.execute(
        select(func.sum(Enrollment.price_paid)).where(
            Enrollment.course_id == course_id
        )
    )
    revenue = revenue_result.scalar() or 0

    # Get reviews stats
    reviews_result = await db.execute(
        select(CourseReview).where(CourseReview.course_id == course_id)
    )
    reviews = reviews_result.scalars().all()

    # Recent enrollments (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    recent_enrollments_result = await db.execute(
        select(func.count(Enrollment.id)).where(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.enrolled_at >= thirty_days_ago
            )
        )
    )
    recent_enrollments = recent_enrollments_result.scalar() or 0

    return {
        "course_id": str(course_id),
        "course_title": course.title,
        "status": course.status,
        "enrollment_stats": {
            "total_enrollments": total_enrollments,
            "active_students": active_students,
            "completed_students": completed_students,
            "recent_enrollments_30d": recent_enrollments,
            "completion_rate": round(completion_rate, 2)
        },
        "engagement": {
            "average_progress": round(float(avg_progress), 2),
            "total_watch_time_hours": round(total_watch_time / 60, 2)
        },
        "reviews": {
            "average_rating": course.average_rating,
            "total_reviews": course.total_reviews,
            "rating_distribution": course.rating_distribution or {}
        },
        "revenue": {
            "total_revenue": round(revenue, 2),
            "currency": "USD"  # or from course settings
        },
        "content": {
            "total_lessons": course.total_lessons,
            "total_quizzes": course.total_quizzes,
            "duration_minutes": course.duration_minutes
        }
    }
