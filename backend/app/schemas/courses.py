"""
Course Schemas
Pydantic schemas for course platform
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# ============================================================================
# COURSE SCHEMAS
# ============================================================================

class CourseBase(BaseModel):
    """Base course schema"""
    title: str = Field(..., max_length=255)
    subtitle: Optional[str] = Field(None, max_length=500)
    description: str
    thumbnail_url: Optional[str] = None
    promo_video_url: Optional[str] = None
    category: str = Field(..., max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    board: Optional[str] = Field(None, max_length=50)
    grade_level: Optional[str] = Field(None, max_length=50)
    topics: Optional[List[str]] = []
    level: str = "beginner"
    language: str = "English"
    is_free: bool = False
    price: float = 0.0
    discount_price: Optional[float] = None
    discount_expires_at: Optional[datetime] = None
    what_you_will_learn: List[str] = []
    prerequisites: List[str] = []
    target_audience: List[str] = []
    max_enrollments: Optional[int] = None
    certificate_enabled: bool = True


class CourseCreate(CourseBase):
    """Schema for creating a course"""
    pass


class CourseUpdate(BaseModel):
    """Schema for updating a course"""
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    promo_video_url: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    board: Optional[str] = None
    grade_level: Optional[str] = None
    topics: Optional[List[str]] = None
    level: Optional[str] = None
    language: Optional[str] = None
    is_free: Optional[bool] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    discount_expires_at: Optional[datetime] = None
    what_you_will_learn: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    target_audience: Optional[List[str]] = None
    status: Optional[str] = None


class CourseResponse(CourseBase):
    """Response schema for course"""
    id: UUID
    instructor_id: UUID
    slug: str
    duration_minutes: Optional[int] = None
    total_lessons: int = 0
    total_quizzes: int = 0
    total_assignments: int = 0
    enrollment_count: int = 0
    average_rating: float = 0.0
    total_reviews: int = 0
    rating_distribution: Optional[Dict[str, int]] = None
    status: str
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @validator('rating_distribution', pre=True, always=True)
    def set_rating_distribution_default(cls, v):
        return v if v is not None else {}

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Response for course list"""
    courses: List[CourseResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# SECTION SCHEMAS
# ============================================================================

class SectionBase(BaseModel):
    """Base section schema"""
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    order: int


class SectionCreate(SectionBase):
    """Schema for creating a section"""
    course_id: UUID


class SectionUpdate(BaseModel):
    """Schema for updating a section"""
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


class SectionResponse(SectionBase):
    """Response schema for section"""
    id: UUID
    course_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# LESSON SCHEMAS
# ============================================================================

class LessonBase(BaseModel):
    """Base lesson schema"""
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    lesson_type: str = "video"
    order: int
    content: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = []
    resources: Optional[List[Dict[str, Any]]] = []
    is_preview: bool = False
    is_downloadable: bool = False
    requires_completion: bool = True


class LessonCreate(LessonBase):
    """Schema for creating a lesson"""
    section_id: UUID
    course_id: UUID


class LessonUpdate(BaseModel):
    """Schema for updating a lesson"""
    title: Optional[str] = None
    description: Optional[str] = None
    lesson_type: Optional[str] = None
    order: Optional[int] = None
    content: Optional[str] = None
    video_provider: Optional[str] = None
    video_id: Optional[str] = None
    video_url: Optional[str] = None
    video_duration: Optional[int] = None
    video_status: Optional[str] = None
    video_qualities: Optional[Dict[str, str]] = None
    thumbnail_url: Optional[str] = None
    subtitles: Optional[List[Dict[str, str]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    resources: Optional[List[Dict[str, Any]]] = None
    is_preview: Optional[bool] = None
    is_downloadable: Optional[bool] = None
    requires_completion: Optional[bool] = None


class LessonResponse(LessonBase):
    """Response schema for lesson"""
    id: UUID
    section_id: UUID
    course_id: UUID
    video_provider: Optional[str] = None
    video_id: Optional[str] = None
    video_url: Optional[str] = None
    video_duration: Optional[int] = None
    video_status: Optional[str] = None
    video_qualities: Optional[Dict[str, str]] = None
    thumbnail_url: Optional[str] = None
    subtitles: Optional[List[Dict[str, str]]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# VIDEO UPLOAD SCHEMAS
# ============================================================================

class VideoUploadRequest(BaseModel):
    """Request to create video upload URL"""
    lesson_id: UUID
    max_duration_seconds: int = 7200  # 2 hours default


class VideoUploadResponse(BaseModel):
    """Response with upload URL"""
    upload_url: str
    video_id: str
    lesson_id: UUID


class VideoUploadFromURLRequest(BaseModel):
    """Request to upload video from URL"""
    lesson_id: UUID
    video_url: str
    title: str
    description: Optional[str] = ""


class VideoStatusUpdate(BaseModel):
    """Update video status"""
    video_id: str
    status: str  # ready, processing, failed
    duration: Optional[int] = None
    thumbnail_url: Optional[str] = None


# ============================================================================
# ENROLLMENT SCHEMAS
# ============================================================================

class EnrollmentCreate(BaseModel):
    """Schema for enrolling in a course"""
    course_id: UUID
    payment_transaction_id: Optional[str] = None


class EnrollmentResponse(BaseModel):
    """Response schema for enrollment"""
    id: UUID
    student_id: UUID
    course_id: UUID
    enrolled_at: datetime
    price_paid: float
    progress_percentage: float = 0.0
    completed_lessons: int = 0
    total_watch_time_minutes: int = 0
    is_active: bool = True
    completed_at: Optional[datetime] = None
    certificate_issued_at: Optional[datetime] = None
    certificate_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# PROGRESS TRACKING SCHEMAS
# ============================================================================

class ProgressUpdate(BaseModel):
    """Update lesson progress"""
    lesson_id: UUID
    watch_time_seconds: int
    last_position_seconds: int
    completion_percentage: float
    playback_speed: Optional[float] = 1.0
    quality_selected: Optional[str] = None


class ProgressResponse(BaseModel):
    """Response schema for lesson progress"""
    id: UUID
    enrollment_id: UUID
    lesson_id: UUID
    student_id: UUID
    watch_time_seconds: int = 0
    last_position_seconds: int = 0
    completion_percentage: float = 0.0
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    times_watched: int = 0
    first_watched_at: Optional[datetime] = None
    last_watched_at: Optional[datetime] = None
    playback_speed: float = 1.0
    quality_selected: Optional[str] = None
    notes: Optional[str] = None
    bookmarks: Optional[List[Dict[str, Any]]] = []

    class Config:
        from_attributes = True


class BookmarkCreate(BaseModel):
    """Create a bookmark in a lesson"""
    lesson_id: UUID
    time_seconds: int
    note: Optional[str] = None


class NoteUpdate(BaseModel):
    """Update notes for a lesson"""
    lesson_id: UUID
    notes: str


# ============================================================================
# REVIEW SCHEMAS
# ============================================================================

class ReviewCreate(BaseModel):
    """Create a course review"""
    course_id: UUID
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    review: Optional[str] = None
    content_quality: Optional[int] = Field(None, ge=1, le=5)
    instructor_quality: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)


class ReviewUpdate(BaseModel):
    """Update a review"""
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    review: Optional[str] = None
    content_quality: Optional[int] = Field(None, ge=1, le=5)
    instructor_quality: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)


class ReviewResponse(BaseModel):
    """Response schema for review"""
    id: UUID
    course_id: UUID
    student_id: UUID
    rating: int
    title: Optional[str] = None
    review: Optional[str] = None
    content_quality: Optional[int] = None
    instructor_quality: Optional[int] = None
    value_for_money: Optional[int] = None
    helpful_count: int = 0
    not_helpful_count: int = 0
    is_featured: bool = False
    is_approved: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# ANALYTICS SCHEMAS
# ============================================================================

class VideoAnalyticsEvent(BaseModel):
    """Log a video analytics event"""
    lesson_id: UUID
    event_type: str  # play, pause, seek, complete, error
    timestamp_seconds: Optional[int] = None
    session_id: Optional[UUID] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    video_quality: Optional[str] = None
    playback_speed: Optional[float] = None


class CourseAnalyticsResponse(BaseModel):
    """Course analytics summary"""
    course_id: UUID
    total_enrollments: int
    active_students: int
    completion_rate: float
    average_progress: float
    total_watch_time_hours: float
    average_rating: float
    total_reviews: int
    revenue: float


# ============================================================================
# QUIZ SCHEMAS
# ============================================================================

class QuizCreate(BaseModel):
    """Create a quiz"""
    course_id: UUID
    lesson_id: Optional[UUID] = None
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    passing_score: int = 70
    max_attempts: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    questions: List[Dict[str, Any]] = []


class QuizAttemptCreate(BaseModel):
    """Create a quiz attempt"""
    quiz_id: UUID
    answers: Dict[str, Any]


class QuizAttemptResponse(BaseModel):
    """Response for quiz attempt"""
    id: UUID
    quiz_id: UUID
    student_id: UUID
    score: Optional[float] = None
    passed: bool = False
    started_at: datetime
    completed_at: Optional[datetime] = None
    time_taken_seconds: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================================
# COURSE WITH CURRICULUM (Detailed Response)
# ============================================================================

class LessonWithProgress(LessonResponse):
    """Lesson with student progress"""
    progress: Optional[ProgressResponse] = None


class SectionWithLessons(SectionResponse):
    """Section with lessons"""
    lessons: List[LessonWithProgress] = []


class CourseDetailResponse(CourseResponse):
    """Detailed course with curriculum"""
    sections: List[SectionWithLessons] = []
    instructor_name: Optional[str] = None
    is_enrolled: bool = False
    enrollment: Optional[EnrollmentResponse] = None
