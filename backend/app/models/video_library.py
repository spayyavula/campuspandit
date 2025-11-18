"""
Video Library Models
Handles recorded sessions and video library functionality
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class RecordingType(str, enum.Enum):
    """Type of recording"""
    TUTORING_SESSION = "tutoring_session"
    LECTURE = "lecture"
    WORKSHOP = "workshop"
    WEBINAR = "webinar"
    LIVE_CLASS = "live_class"
    DEMO = "demo"
    OTHER = "other"


class RecordingStatus(str, enum.Enum):
    """Status of recording"""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    ARCHIVED = "archived"


class RecordingVisibility(str, enum.Enum):
    """Who can view the recording"""
    PUBLIC = "public"  # Anyone can view
    ENROLLED = "enrolled"  # Only enrolled students
    PRIVATE = "private"  # Only specific users
    UNLISTED = "unlisted"  # Anyone with link


class RecordedSession(Base):
    """
    Recorded Session Model
    Stores metadata about recorded tutoring sessions, lectures, etc.
    """
    __tablename__ = "recorded_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic Information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    recording_type = Column(SQLEnum(RecordingType), default=RecordingType.TUTORING_SESSION)

    # Instructor/Tutor
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    instructor_name = Column(String(255))  # Cached for performance

    # Video Details
    video_provider = Column(String(50), default="cloudflare")  # cloudflare, youtube, vimeo
    video_id = Column(String(255))  # Provider's video ID
    video_url = Column(String(500))
    thumbnail_url = Column(String(500))
    duration_seconds = Column(Integer)  # Video duration
    video_status = Column(SQLEnum(RecordingStatus), default=RecordingStatus.UPLOADING)

    # Organization & Categorization
    subject = Column(String(100), index=True)  # Math, Science, English, etc.
    grade_level = Column(String(50))  # Grade 10, Grade 11, etc.
    board = Column(String(50))  # CBSE, ICSE, State Board
    topics = Column(ARRAY(String))  # ["Trigonometry", "Calculus"]
    tags = Column(ARRAY(String))  # ["important", "exam-prep"]

    # Related Course/Session
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    tutoring_session_id = Column(UUID(as_uuid=True), ForeignKey("tutoring_sessions.id"), nullable=True)

    # Visibility & Access
    visibility = Column(SQLEnum(RecordingVisibility), default=RecordingVisibility.ENROLLED)
    is_featured = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)

    # Metadata
    recorded_at = Column(DateTime, nullable=True)  # When session was recorded
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)

    # Engagement Metrics
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)

    # Additional Resources
    attachments = Column(JSON)  # [{"name": "notes.pdf", "url": "..."}]
    transcript_url = Column(String(500))  # Video transcript/subtitles

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    instructor = relationship("User", foreign_keys=[instructor_id], backref="recorded_sessions")
    views = relationship("SessionView", back_populates="session", cascade="all, delete-orphan")
    likes = relationship("SessionLike", back_populates="session", cascade="all, delete-orphan")


class SessionView(Base):
    """
    Track views of recorded sessions
    For analytics and recommendations
    """
    __tablename__ = "session_views"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    session_id = Column(UUID(as_uuid=True), ForeignKey("recorded_sessions.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Watch Progress
    watch_duration_seconds = Column(Integer, default=0)  # How much they watched
    completed = Column(Boolean, default=False)  # Watched >= 90%

    # Context
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    referrer = Column(String(500))

    # Timestamps
    first_viewed_at = Column(DateTime, default=datetime.utcnow)
    last_viewed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("RecordedSession", back_populates="views")
    user = relationship("User", backref="session_views")


class SessionLike(Base):
    """
    Likes/favorites for recorded sessions
    """
    __tablename__ = "session_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    session_id = Column(UUID(as_uuid=True), ForeignKey("recorded_sessions.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("RecordedSession", back_populates="likes")
    user = relationship("User", backref="session_likes")


class VideoLibraryCollection(Base):
    """
    Organize recordings into collections/playlists
    """
    __tablename__ = "video_library_collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Collection Details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))

    # Owner
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Visibility
    is_public = Column(Boolean, default=True)

    # Recordings (many-to-many through association table)
    recording_ids = Column(ARRAY(UUID(as_uuid=True)))  # Simple approach

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", backref="collections")
