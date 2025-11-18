"""
Scheduling Models
SQLAlchemy models for smart scheduling system
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, Time, Date,
    ForeignKey, CheckConstraint, UniqueConstraint, Index, ARRAY, JSON
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime

from app.core.database import Base


class TutorAvailability(Base):
    """Tutor's recurring weekly availability"""
    __tablename__ = "tutor_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tutor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Sunday, 6=Saturday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    timezone = Column(String(50), nullable=False, default="UTC")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    # tutor = relationship("User", back_populates="availability")

    # Constraints
    __table_args__ = (
        CheckConstraint('day_of_week >= 0 AND day_of_week <= 6', name='valid_day_of_week'),
        CheckConstraint('end_time > start_time', name='valid_time_range'),
        UniqueConstraint('tutor_id', 'day_of_week', 'start_time', 'end_time', name='unique_availability_slot'),
        Index('idx_tutor_availability_tutor_id', 'tutor_id'),
        Index('idx_tutor_availability_day', 'day_of_week'),
        Index('idx_tutor_availability_active', 'is_active'),
    )


class TutorTimeBlock(Base):
    """One-off time blocks (available/blocked time)"""
    __tablename__ = "tutor_time_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tutor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    block_type = Column(String(20), nullable=False)  # available, blocked, booked
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    # tutor = relationship("User", back_populates="time_blocks")

    # Constraints
    __table_args__ = (
        CheckConstraint("block_type IN ('available', 'blocked', 'booked')", name='valid_block_type'),
        CheckConstraint('end_datetime > start_datetime', name='valid_datetime_range'),
        Index('idx_time_blocks_tutor_id', 'tutor_id'),
        Index('idx_time_blocks_dates', 'start_datetime', 'end_datetime'),
        Index('idx_time_blocks_type', 'block_type'),
    )


class TutoringSession(Base):
    """Tutoring sessions/bookings"""
    __tablename__ = "tutoring_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tutor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Session details
    subject = Column(String(100), nullable=False)
    topic = Column(Text)
    duration_minutes = Column(Integer, nullable=False, default=60)

    # Scheduling
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(50), nullable=False, default="UTC")

    # Status
    status = Column(String(20), nullable=False, default="scheduled")
    # scheduled, confirmed, in_progress, completed, cancelled, no_show

    # Actual times
    actual_start = Column(DateTime(timezone=True))
    actual_end = Column(DateTime(timezone=True))

    # Video Conferencing
    video_room_id = Column(String(255))  # Daily.co room name
    video_room_url = Column(String(500))  # Daily.co room URL
    video_room_token_tutor = Column(Text)  # JWT token for tutor
    video_room_token_student = Column(Text)  # JWT token for student
    recording_enabled = Column(Boolean, default=True)
    recording_url = Column(String(500))  # URL to recorded session
    recording_id = Column(String(255))  # Daily.co recording ID
    recording_duration = Column(Integer)  # Duration in seconds

    # Whiteboard & Collaboration
    whiteboard_enabled = Column(Boolean, default=True)
    whiteboard_data = Column(JSONB, default={})  # Store whiteboard state
    shared_files = Column(JSONB, default=[])  # Files shared during session

    # Session Metrics
    connection_quality = Column(String(20))  # excellent, good, fair, poor
    participant_join_times = Column(JSONB, default={})  # Track when users joined/left
    total_screen_share_duration = Column(Integer)  # Seconds of screen sharing

    # Cancellation/Rescheduling
    cancelled_at = Column(DateTime(timezone=True))
    cancelled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    cancellation_reason = Column(Text)
    rescheduled_from = Column(UUID(as_uuid=True), ForeignKey("tutoring_sessions.id"))

    # Pricing
    price_per_hour = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    payment_status = Column(String(20), default="pending")  # pending, paid, refunded, failed
    payment_transaction_id = Column(String(255))

    # Session materials
    student_notes = Column(Text)
    tutor_notes = Column(Text)
    homework_assigned = Column(Text)
    files_uploaded = Column(JSONB, default=[])

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    # student = relationship("User", foreign_keys=[student_id], back_populates="sessions_as_student")
    # tutor = relationship("User", foreign_keys=[tutor_id], back_populates="sessions_as_tutor")

    # Constraints
    __table_args__ = (
        CheckConstraint('duration_minutes > 0', name='positive_duration'),
        CheckConstraint('scheduled_end > scheduled_start', name='valid_session_time'),
        CheckConstraint('student_id != tutor_id', name='student_not_tutor'),
        CheckConstraint(
            "status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')",
            name='valid_status'
        ),
        CheckConstraint(
            "payment_status IN ('pending', 'paid', 'refunded', 'failed')",
            name='valid_payment_status'
        ),
        Index('idx_sessions_student_id', 'student_id'),
        Index('idx_sessions_tutor_id', 'tutor_id'),
        Index('idx_sessions_status', 'status'),
        Index('idx_sessions_scheduled_start', 'scheduled_start'),
        Index('idx_sessions_date_range', 'scheduled_start', 'scheduled_end'),
    )


class ReminderPreferences(Base):
    """User reminder/notification preferences"""
    __tablename__ = "reminder_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Channel preferences
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    push_enabled = Column(Boolean, default=True)

    # Timing preferences (minutes before session)
    reminder_24h = Column(Boolean, default=True)
    reminder_2h = Column(Boolean, default=True)
    reminder_30m = Column(Boolean, default=True)
    reminder_custom = Column(Integer)  # Custom minutes before

    # Do Not Disturb
    dnd_enabled = Column(Boolean, default=False)
    dnd_start_time = Column(Time)
    dnd_end_time = Column(Time)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    # user = relationship("User", back_populates="reminder_preferences")


class ReminderLog(Base):
    """Log of sent reminders"""
    __tablename__ = "reminder_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("tutoring_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Reminder details
    reminder_type = Column(String(20), nullable=False)  # 24h, 2h, 30m, custom, prep_checklist, post_session
    channel = Column(String(20), nullable=False)  # email, sms, push, in_app

    # Status
    status = Column(String(20), nullable=False, default="pending")  # pending, sent, failed, cancelled
    sent_at = Column(DateTime(timezone=True))
    error_message = Column(Text)

    # Delivery tracking
    opened_at = Column(DateTime(timezone=True))
    clicked_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    # session = relationship("TutoringSession", back_populates="reminders")
    # user = relationship("User", back_populates="reminder_logs")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "reminder_type IN ('24h', '2h', '30m', 'custom', 'prep_checklist', 'post_session')",
            name='valid_reminder_type'
        ),
        CheckConstraint(
            "channel IN ('email', 'sms', 'push', 'in_app')",
            name='valid_channel'
        ),
        CheckConstraint(
            "status IN ('pending', 'sent', 'failed', 'cancelled')",
            name='valid_reminder_status'
        ),
        Index('idx_reminder_logs_session_id', 'session_id'),
        Index('idx_reminder_logs_user_id', 'user_id'),
        Index('idx_reminder_logs_status', 'status'),
        Index('idx_reminder_logs_sent_at', 'sent_at'),
    )


class NoShowHistory(Base):
    """Track no-shows and penalties"""
    __tablename__ = "no_show_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("tutoring_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_role = Column(String(20), nullable=False)  # student, tutor

    # No-show details
    marked_at = Column(DateTime(timezone=True), server_default=func.now())
    marked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reason = Column(Text)
    penalty_applied = Column(Boolean, default=False)
    penalty_amount = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint("user_role IN ('student', 'tutor')", name='valid_user_role'),
        Index('idx_no_show_history_user_id', 'user_id'),
    )


class SessionAnalytics(Base):
    """Aggregated session analytics"""
    __tablename__ = "session_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_role = Column(String(20), nullable=False)  # student, tutor
    date = Column(Date, nullable=False)

    # Metrics
    total_sessions = Column(Integer, default=0)
    completed_sessions = Column(Integer, default=0)
    cancelled_sessions = Column(Integer, default=0)
    no_show_sessions = Column(Integer, default=0)

    # Timing metrics
    avg_response_time_minutes = Column(Integer)
    total_session_minutes = Column(Integer, default=0)

    # Revenue (for tutors)
    total_revenue = Column(Float, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint("user_role IN ('student', 'tutor')", name='valid_analytics_user_role'),
        UniqueConstraint('user_id', 'user_role', 'date', name='unique_analytics_per_day'),
        Index('idx_session_analytics_user_id', 'user_id'),
        Index('idx_session_analytics_date', 'date'),
    )
