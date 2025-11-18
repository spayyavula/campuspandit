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
from app.models.crm import (
    CRMContact, CRMCompany, CRMDeal, CRMActivity, CRMTask,
    CRMCampaign, CRMTicket, CRMTicketComment,
    ContactType, ContactStatus, CompanyStatus, DealStage,
    ActivityType, ActivityStatus, TaskStatus, Priority,
    CampaignType, CampaignStatus, TicketStatus
)
from app.models.video_library import (
    RecordedSession, SessionView, SessionLike, VideoLibraryCollection,
    RecordingType, RecordingStatus, RecordingVisibility
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
    # CRM models
    "CRMContact",
    "CRMCompany",
    "CRMDeal",
    "CRMActivity",
    "CRMTask",
    "CRMCampaign",
    "CRMTicket",
    "CRMTicketComment",
    # CRM Enums
    "ContactType",
    "ContactStatus",
    "CompanyStatus",
    "DealStage",
    "ActivityType",
    "ActivityStatus",
    "TaskStatus",
    "Priority",
    "CampaignType",
    "CampaignStatus",
    "TicketStatus",
    # Video Library models
    "RecordedSession",
    "SessionView",
    "SessionLike",
    "VideoLibraryCollection",
    # Video Library Enums
    "RecordingType",
    "RecordingStatus",
    "RecordingVisibility",
]
