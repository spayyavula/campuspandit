"""
Messaging & Channels Models
Slack-like messaging system with channels, direct messages, and real-time features
"""

from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


# =====================================================
# ENUMS
# =====================================================

class ChannelType(str, enum.Enum):
    """Channel type"""
    DIRECT = "direct"
    GROUP = "group"
    TUTOR_STUDENT = "tutor_student"
    CLASS = "class"
    SUBJECT = "subject"


class MemberRole(str, enum.Enum):
    """Channel member role"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    GUEST = "guest"


class NotificationLevel(str, enum.Enum):
    """Notification preferences"""
    ALL = "all"
    MENTIONS = "mentions"
    NONE = "none"


class MessageType(str, enum.Enum):
    """Message type"""
    TEXT = "text"
    FILE = "file"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    CODE = "code"
    SYSTEM = "system"


# =====================================================
# MODELS
# =====================================================

class Channel(Base):
    """Channel model - like Slack channels"""
    __tablename__ = "channels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    channel_type = Column(SQLEnum(ChannelType), nullable=False, default=ChannelType.GROUP)
    is_private = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)

    # Creator and metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    tutor_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))  # For tutor-specific channels
    subject = Column(String(100))  # Subject/topic
    topic = Column(String(200))  # Channel topic/description

    # Stats
    member_count = Column(Integer, default=0)
    message_count = Column(Integer, default=0)
    last_message_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    members = relationship("ChannelMember", back_populates="channel", cascade="all, delete-orphan")
    messages = relationship("ChannelMessage", back_populates="channel", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Channel {self.name}>"


class ChannelMember(Base):
    """Channel membership"""
    __tablename__ = "channel_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id = Column(UUID(as_uuid=True), ForeignKey('channels.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Role and permissions
    role = Column(SQLEnum(MemberRole), nullable=False, default=MemberRole.MEMBER)

    # Preferences
    notifications_enabled = Column(Boolean, default=True)
    notification_level = Column(SQLEnum(NotificationLevel), default=NotificationLevel.ALL)
    is_muted = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)

    # Read tracking
    last_read_at = Column(DateTime(timezone=True), server_default=func.now())
    unread_count = Column(Integer, default=0)

    # Activity tracking
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_viewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    channel = relationship("Channel", back_populates="members")

    def __repr__(self):
        return f"<ChannelMember user={self.user_id} channel={self.channel_id}>"


class ChannelMessage(Base):
    """Messages in channels"""
    __tablename__ = "channel_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id = Column(UUID(as_uuid=True), ForeignKey('channels.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    # Content
    content = Column(Text, nullable=False)
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT)

    # Threading
    parent_message_id = Column(UUID(as_uuid=True), ForeignKey('channel_messages.id'))
    thread_reply_count = Column(Integer, default=0)
    thread_last_reply_at = Column(DateTime(timezone=True))

    # Mentions
    mentioned_user_ids = Column(JSON)  # Array of user IDs

    # Attachments
    file_url = Column(String(500))
    file_name = Column(String(255))
    file_type = Column(String(100))
    file_size = Column(Integer)  # in bytes

    # Status
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime(timezone=True))
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True))
    is_pinned = Column(Boolean, default=False)

    # Stats
    reaction_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    channel = relationship("Channel", back_populates="messages")
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChannelMessage id={self.id}>"


class MessageReaction(Base):
    """Reactions to messages"""
    __tablename__ = "message_reactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey('channel_messages.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    emoji = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("ChannelMessage", back_populates="reactions")

    def __repr__(self):
        return f"<MessageReaction {self.emoji}>"


class TypingIndicator(Base):
    """Real-time typing indicators"""
    __tablename__ = "typing_indicators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id = Column(UUID(as_uuid=True), ForeignKey('channels.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    started_typing_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)  # Auto-expire after 10 seconds

    def __repr__(self):
        return f"<TypingIndicator user={self.user_id} channel={self.channel_id}>"


class DirectMessage(Base):
    """Mapping table for direct message channels"""
    __tablename__ = "direct_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id = Column(UUID(as_uuid=True), ForeignKey('channels.id', ondelete='CASCADE'), nullable=False, unique=True)
    user1_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    user2_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<DirectMessage {self.user1_id} <-> {self.user2_id}>"
