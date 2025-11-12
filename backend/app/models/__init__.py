"""
Models Package
Import all models to ensure they are registered with SQLAlchemy
"""

from app.models.user import User, UserRole, EmailVerificationToken, PasswordResetToken, UserSession
from app.models.coaching import (
    StudentWeakArea, AICoachingSession, RepetitionSchedule,
    StudentPerformanceAnalytics, CoachingRecommendation,
    ImprovementMilestone, AICoachingConfig,
    Subject, WeaknessSeverity, WeakAreaStatus, IdentifiedFrom,
    SessionType, RepetitionStatus, ContentType,
    RecommendationStatus, RecommendationPriority, PeriodType
)
from app.models.messaging import (
    Channel, ChannelMember, ChannelMessage, MessageReaction,
    TypingIndicator, DirectMessage,
    ChannelType, MemberRole, NotificationLevel, MessageType
)

__all__ = [
    # User models
    "User",
    "UserRole",
    "EmailVerificationToken",
    "PasswordResetToken",
    "UserSession",
    # Coaching models
    "StudentWeakArea",
    "AICoachingSession",
    "RepetitionSchedule",
    "StudentPerformanceAnalytics",
    "CoachingRecommendation",
    "ImprovementMilestone",
    "AICoachingConfig",
    # Messaging models
    "Channel",
    "ChannelMember",
    "ChannelMessage",
    "MessageReaction",
    "TypingIndicator",
    "DirectMessage",
    # Coaching Enums
    "Subject",
    "WeaknessSeverity",
    "WeakAreaStatus",
    "IdentifiedFrom",
    "SessionType",
    "RepetitionStatus",
    "ContentType",
    "RecommendationStatus",
    "RecommendationPriority",
    "PeriodType",
    # Messaging Enums
    "ChannelType",
    "MemberRole",
    "NotificationLevel",
    "MessageType",
]
