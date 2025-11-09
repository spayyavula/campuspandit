"""
Pydantic schemas for messaging/channels
"""
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# =====================================================
# CHANNEL SCHEMAS
# =====================================================

class ChannelBase(BaseModel):
    """Base channel schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    channel_type: str = Field(default="group")
    is_private: bool = False
    subject: Optional[str] = None
    topic: Optional[str] = None


class ChannelCreate(ChannelBase):
    """Create channel request"""
    member_ids: Optional[List[UUID]] = None  # Initial members to add


class ChannelUpdate(BaseModel):
    """Update channel request"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    topic: Optional[str] = None
    is_archived: Optional[bool] = None


class ChannelMemberInfo(BaseModel):
    """Channel member info"""
    user_id: UUID
    role: str
    is_starred: bool = False
    is_muted: bool = False
    notifications_enabled: bool = True
    notification_level: str
    unread_count: int = 0
    joined_at: datetime
    last_read_at: datetime

    class Config:
        from_attributes = True


class ChannelResponse(BaseModel):
    """Channel response"""
    id: UUID
    name: str
    description: Optional[str]
    channel_type: str
    is_private: bool
    is_archived: bool
    created_by: UUID
    tutor_id: Optional[UUID]
    subject: Optional[str]
    topic: Optional[str]
    member_count: int
    message_count: int
    last_message_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    # Include member info if user is a member
    my_membership: Optional[ChannelMemberInfo] = None

    class Config:
        from_attributes = True


# =====================================================
# MESSAGE SCHEMAS
# =====================================================

class MessageBase(BaseModel):
    """Base message schema"""
    content: str = Field(..., min_length=1)
    message_type: str = Field(default="text")
    parent_message_id: Optional[UUID] = None
    mentioned_user_ids: Optional[List[UUID]] = None


class MessageCreate(MessageBase):
    """Create message request"""
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None


class MessageUpdate(BaseModel):
    """Update message request"""
    content: str = Field(..., min_length=1)


class MessageReactionInfo(BaseModel):
    """Message reaction info"""
    emoji: str
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Message response"""
    id: UUID
    channel_id: UUID
    user_id: UUID
    content: str
    message_type: str
    parent_message_id: Optional[UUID]
    thread_reply_count: int
    thread_last_reply_at: Optional[datetime]
    mentioned_user_ids: Optional[List[UUID]]
    file_url: Optional[str]
    file_name: Optional[str]
    file_type: Optional[str]
    file_size: Optional[int]
    is_edited: bool
    edited_at: Optional[datetime]
    is_deleted: bool
    deleted_at: Optional[datetime]
    is_pinned: bool
    reaction_count: int
    created_at: datetime
    updated_at: datetime

    # Include reactions if requested
    reactions: Optional[List[MessageReactionInfo]] = None

    class Config:
        from_attributes = True


# =====================================================
# MEMBER SCHEMAS
# =====================================================

class ChannelMemberAdd(BaseModel):
    """Add member to channel"""
    user_ids: List[UUID] = Field(..., min_items=1)
    role: str = Field(default="member")


class ChannelMemberUpdate(BaseModel):
    """Update channel member"""
    role: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    notification_level: Optional[str] = None
    is_muted: Optional[bool] = None
    is_starred: Optional[bool] = None


class MarkAsReadRequest(BaseModel):
    """Mark channel as read"""
    message_id: Optional[UUID] = None  # If None, mark all as read


# =====================================================
# REACTION SCHEMAS
# =====================================================

class ReactionCreate(BaseModel):
    """Add reaction to message"""
    emoji: str = Field(..., min_length=1, max_length=50)


# =====================================================
# DIRECT MESSAGE SCHEMAS
# =====================================================

class DirectMessageCreate(BaseModel):
    """Create or get direct message channel"""
    user_id: UUID  # The other user


# =====================================================
# TYPING INDICATOR SCHEMAS
# =====================================================

class TypingIndicatorCreate(BaseModel):
    """Send typing indicator"""
    is_typing: bool = True
