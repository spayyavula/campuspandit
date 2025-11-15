"""
Channels & Messaging Endpoints
Slack-like channels with messages, reactions, and real-time features
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, update, delete as sql_delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID
from loguru import logger

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.messaging import (
    Channel, ChannelMember, ChannelMessage, MessageReaction,
    TypingIndicator, DirectMessage,
    ChannelType, MemberRole, MessageType
)
from app.models.user import User
from app.schemas.messaging import (
    ChannelCreate, ChannelUpdate, ChannelResponse,
    MessageCreate, MessageUpdate, MessageResponse,
    ChannelMemberAdd, ChannelMemberUpdate, ChannelMemberInfo,
    MarkAsReadRequest, ReactionCreate, DirectMessageCreate,
    TypingIndicatorCreate
)

router = APIRouter()


# =====================================================
# CHANNEL ENDPOINTS
# =====================================================

@router.get("/", response_model=List[ChannelResponse])
async def get_user_channels(
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    include_archived: bool = Query(False)
):
    """
    Get all channels for the current user
    """
    # Get user's channel memberships
    query = select(Channel).join(
        ChannelMember, Channel.id == ChannelMember.channel_id
    ).where(
        ChannelMember.user_id == current_user_id
    )

    if not include_archived:
        query = query.where(Channel.is_archived == False)

    result = await db.execute(query.order_by(Channel.last_message_at.desc().nullslast()))
    channels = result.scalars().all()

    # Get membership info for each channel
    channel_responses = []
    for channel in channels:
        member_result = await db.execute(
            select(ChannelMember).where(
                and_(
                    ChannelMember.channel_id == channel.id,
                    ChannelMember.user_id == current_user_id
                )
            )
        )
        membership = member_result.scalar_one()

        channel_dict = {
            **{k: v for k, v in channel.__dict__.items() if not k.startswith('_')},
            'my_membership': ChannelMemberInfo.from_orm(membership)
        }
        channel_responses.append(ChannelResponse(**channel_dict))

    return channel_responses


@router.post("/", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    request: ChannelCreate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new channel
    """
    # Create channel
    channel = Channel(
        name=request.name,
        description=request.description,
        channel_type=ChannelType(request.channel_type),
        is_private=request.is_private,
        subject=request.subject,
        topic=request.topic,
        created_by=current_user_id,
        member_count=1
    )
    db.add(channel)
    await db.flush()

    # Add creator as owner
    creator_member = ChannelMember(
        channel_id=channel.id,
        user_id=current_user_id,
        role=MemberRole.OWNER
    )
    db.add(creator_member)

    # Add additional members
    if request.member_ids:
        for user_id in request.member_ids:
            if user_id != current_user_id:  # Don't add creator twice
                member = ChannelMember(
                    channel_id=channel.id,
                    user_id=user_id,
                    role=MemberRole.MEMBER
                )
                db.add(member)
                channel.member_count += 1

    await db.commit()
    await db.refresh(channel)

    return ChannelResponse(
        **{k: v for k, v in channel.__dict__.items() if not k.startswith('_')},
        my_membership=ChannelMemberInfo.from_orm(creator_member)
    )


@router.post("/direct", response_model=ChannelResponse)
async def get_or_create_direct_message(
    request: DirectMessageCreate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get or create a direct message channel between two users
    """
    # Check if DM already exists
    result = await db.execute(
        select(DirectMessage).where(
            or_(
                and_(
                    DirectMessage.user1_id == current_user_id,
                    DirectMessage.user2_id == request.user_id
                ),
                and_(
                    DirectMessage.user1_id == request.user_id,
                    DirectMessage.user2_id == current_user_id
                )
            )
        )
    )
    existing_dm = result.scalar_one_or_none()

    if existing_dm:
        # Return existing channel
        channel_result = await db.execute(
            select(Channel).where(Channel.id == existing_dm.channel_id)
        )
        channel = channel_result.scalar_one()
    else:
        # Create new DM channel
        channel = Channel(
            name=f"DM-{current_user_id}-{request.user_id}",
            channel_type=ChannelType.DIRECT,
            is_private=True,
            created_by=current_user_id,
            member_count=2
        )
        db.add(channel)
        await db.flush()

        # Create DM mapping
        dm = DirectMessage(
            channel_id=channel.id,
            user1_id=current_user_id,
            user2_id=request.user_id
        )
        db.add(dm)

        # Add both users as members
        for user_id in [current_user_id, request.user_id]:
            member = ChannelMember(
                channel_id=channel.id,
                user_id=user_id,
                role=MemberRole.MEMBER
            )
            db.add(member)

        await db.commit()
        await db.refresh(channel)

    # Get membership info
    member_result = await db.execute(
        select(ChannelMember).where(
            and_(
                ChannelMember.channel_id == channel.id,
                ChannelMember.user_id == current_user_id
            )
        )
    )
    membership = member_result.scalar_one()

    return ChannelResponse(
        **{k: v for k, v in channel.__dict__.items() if not k.startswith('_')},
        my_membership=ChannelMemberInfo.from_orm(membership)
    )


@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(
    channel_id: UUID,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get channel details
    """
    # Verify user is a member
    member_result = await db.execute(
        select(ChannelMember).where(
            and_(
                ChannelMember.channel_id == channel_id,
                ChannelMember.user_id == current_user_id
            )
        )
    )
    membership = member_result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this channel"
        )

    # Get channel
    result = await db.execute(
        select(Channel).where(Channel.id == channel_id)
    )
    channel = result.scalar_one_or_none()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )

    return ChannelResponse(
        **{k: v for k, v in channel.__dict__.items() if not k.startswith('_')},
        my_membership=ChannelMemberInfo.from_orm(membership)
    )


@router.patch("/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: UUID,
    request: ChannelUpdate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update channel (admin/owner only)
    """
    # Verify user is admin or owner
    member_result = await db.execute(
        select(ChannelMember).where(
            and_(
                ChannelMember.channel_id == channel_id,
                ChannelMember.user_id == current_user_id
            )
        )
    )
    membership = member_result.scalar_one_or_none()

    if not membership or membership.role not in [MemberRole.ADMIN, MemberRole.OWNER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only channel admins/owners can update channel"
        )

    # Get channel
    result = await db.execute(
        select(Channel).where(Channel.id == channel_id)
    )
    channel = result.scalar_one_or_none()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )

    # Update fields
    if request.name is not None:
        channel.name = request.name
    if request.description is not None:
        channel.description = request.description
    if request.topic is not None:
        channel.topic = request.topic
    if request.is_archived is not None:
        channel.is_archived = request.is_archived

    await db.commit()
    await db.refresh(channel)

    return ChannelResponse(
        **{k: v for k, v in channel.__dict__.items() if not k.startswith('_')},
        my_membership=ChannelMemberInfo.from_orm(membership)
    )


# =====================================================
# MESSAGE ENDPOINTS
# =====================================================

@router.get("/{channel_id}/messages", response_model=List[MessageResponse])
async def get_channel_messages(
    channel_id: UUID,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, le=100),
    before_id: Optional[UUID] = None
):
    """
    Get messages in a channel
    """
    try:
        # Verify user is a member
        member_result = await db.execute(
            select(ChannelMember).where(
                and_(
                    ChannelMember.channel_id == channel_id,
                    ChannelMember.user_id == current_user_id
                )
            )
        )
        membership = member_result.scalar_one_or_none()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this channel"
            )

        # Build query with eager loading of reactions to avoid lazy-loading issues
        query = select(ChannelMessage).where(
            and_(
                ChannelMessage.channel_id == channel_id,
                ChannelMessage.is_deleted == False
            )
        ).options(selectinload(ChannelMessage.reactions))

        if before_id:
            query = query.where(ChannelMessage.id < before_id)

        query = query.order_by(ChannelMessage.created_at.desc()).limit(limit)

        result = await db.execute(query)
        messages = result.scalars().all()

        logger.info(f"Retrieved {len(messages)} messages from channel {channel_id}")
        return [MessageResponse.from_orm(msg) for msg in messages]

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error fetching messages for channel {channel_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve messages: {str(e)}"
        )


@router.post("/{channel_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    channel_id: UUID,
    request: MessageCreate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message to a channel
    """
    # Verify user is a member
    member_result = await db.execute(
        select(ChannelMember).where(
            and_(
                ChannelMember.channel_id == channel_id,
                ChannelMember.user_id == current_user_id
            )
        )
    )
    membership = member_result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this channel"
        )

    # Create message
    message = ChannelMessage(
        channel_id=channel_id,
        user_id=current_user_id,
        content=request.content,
        message_type=MessageType(request.message_type),
        parent_message_id=request.parent_message_id,
        mentioned_user_ids=request.mentioned_user_ids,
        file_url=request.file_url,
        file_name=request.file_name,
        file_type=request.file_type,
        file_size=request.file_size
    )
    db.add(message)

    # Update channel stats
    await db.execute(
        update(Channel).where(Channel.id == channel_id).values(
            message_count=Channel.message_count + 1,
            last_message_at=func.now()
        )
    )

    # Update thread stats if reply
    if request.parent_message_id:
        await db.execute(
            update(ChannelMessage).where(
                ChannelMessage.id == request.parent_message_id
            ).values(
                thread_reply_count=ChannelMessage.thread_reply_count + 1,
                thread_last_reply_at=func.now()
            )
        )

    await db.commit()

    # Query the message back with reactions eagerly loaded to prevent lazy-loading error
    result = await db.execute(
        select(ChannelMessage)
        .where(ChannelMessage.id == message.id)
        .options(selectinload(ChannelMessage.reactions))
    )
    message = result.scalar_one()

    return MessageResponse.from_orm(message)


@router.patch("/{channel_id}/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    channel_id: UUID,
    message_id: UUID,
    request: MessageUpdate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a message (author only)
    """
    # Get message with eager-loaded reactions
    result = await db.execute(
        select(ChannelMessage).where(
            and_(
                ChannelMessage.id == message_id,
                ChannelMessage.channel_id == channel_id
            )
        ).options(selectinload(ChannelMessage.reactions))
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    if message.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own messages"
        )

    # Update message
    message.content = request.content
    message.is_edited = True
    message.edited_at = func.now()

    await db.commit()
    await db.refresh(message)

    return MessageResponse.from_orm(message)


@router.delete("/{channel_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    channel_id: UUID,
    message_id: UUID,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a message (author only)
    """
    # Get message
    result = await db.execute(
        select(ChannelMessage).where(
            and_(
                ChannelMessage.id == message_id,
                ChannelMessage.channel_id == channel_id
            )
        )
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    if message.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own messages"
        )

    # Soft delete
    message.is_deleted = True
    message.deleted_at = func.now()

    await db.commit()


# =====================================================
# MEMBER ENDPOINTS
# =====================================================

@router.post("/{channel_id}/members")
async def add_channel_members(
    channel_id: UUID,
    request: ChannelMemberAdd,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add members to channel (admin/owner only)
    """
    # Verify user is admin or owner
    member_result = await db.execute(
        select(ChannelMember).where(
            and_(
                ChannelMember.channel_id == channel_id,
                ChannelMember.user_id == current_user_id
            )
        )
    )
    membership = member_result.scalar_one_or_none()

    if not membership or membership.role not in [MemberRole.ADMIN, MemberRole.OWNER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only channel admins/owners can add members"
        )

    # Add new members
    added_count = 0
    for user_id in request.user_ids:
        # Check if already a member
        existing = await db.execute(
            select(ChannelMember).where(
                and_(
                    ChannelMember.channel_id == channel_id,
                    ChannelMember.user_id == user_id
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        member = ChannelMember(
            channel_id=channel_id,
            user_id=user_id,
            role=MemberRole(request.role)
        )
        db.add(member)
        added_count += 1

    # Update member count
    if added_count > 0:
        await db.execute(
            update(Channel).where(Channel.id == channel_id).values(
                member_count=Channel.member_count + added_count
            )
        )

    await db.commit()

    return {"message": f"Added {added_count} members"}


@router.patch("/{channel_id}/members/me")
async def update_my_membership(
    channel_id: UUID,
    request: ChannelMemberUpdate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update own channel membership settings
    """
    # Get membership
    result = await db.execute(
        select(ChannelMember).where(
            and_(
                ChannelMember.channel_id == channel_id,
                ChannelMember.user_id == current_user_id
            )
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this channel"
        )

    # Update fields
    if request.notifications_enabled is not None:
        membership.notifications_enabled = request.notifications_enabled
    if request.notification_level is not None:
        membership.notification_level = request.notification_level
    if request.is_muted is not None:
        membership.is_muted = request.is_muted
    if request.is_starred is not None:
        membership.is_starred = request.is_starred

    await db.commit()

    return {"message": "Membership updated"}


@router.post("/{channel_id}/read")
async def mark_channel_as_read(
    channel_id: UUID,
    request: MarkAsReadRequest,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark channel as read
    """
    # Get membership
    result = await db.execute(
        select(ChannelMember).where(
            and_(
                ChannelMember.channel_id == channel_id,
                ChannelMember.user_id == current_user_id
            )
        )
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this channel"
        )

    # Update last read timestamp
    membership.last_read_at = func.now()
    membership.unread_count = 0

    await db.commit()

    return {"message": "Marked as read"}


# =====================================================
# REACTION ENDPOINTS
# =====================================================

@router.post("/{channel_id}/messages/{message_id}/reactions")
async def add_reaction(
    channel_id: UUID,
    message_id: UUID,
    request: ReactionCreate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add reaction to message
    """
    # Verify user is a member
    member_result = await db.execute(
        select(ChannelMember).where(
            and_(
                ChannelMember.channel_id == channel_id,
                ChannelMember.user_id == current_user_id
            )
        )
    )
    if not member_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this channel"
        )

    # Check if reaction already exists
    existing = await db.execute(
        select(MessageReaction).where(
            and_(
                MessageReaction.message_id == message_id,
                MessageReaction.user_id == current_user_id,
                MessageReaction.emoji == request.emoji
            )
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Reaction already exists"}

    # Add reaction
    reaction = MessageReaction(
        message_id=message_id,
        user_id=current_user_id,
        emoji=request.emoji
    )
    db.add(reaction)

    # Update message reaction count
    await db.execute(
        update(ChannelMessage).where(ChannelMessage.id == message_id).values(
            reaction_count=ChannelMessage.reaction_count + 1
        )
    )

    await db.commit()

    return {"message": "Reaction added"}


@router.delete("/{channel_id}/messages/{message_id}/reactions/{emoji}")
async def remove_reaction(
    channel_id: UUID,
    message_id: UUID,
    emoji: str,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove reaction from message
    """
    # Delete reaction
    result = await db.execute(
        sql_delete(MessageReaction).where(
            and_(
                MessageReaction.message_id == message_id,
                MessageReaction.user_id == current_user_id,
                MessageReaction.emoji == emoji
            )
        )
    )

    if result.rowcount > 0:
        # Update message reaction count
        await db.execute(
            update(ChannelMessage).where(ChannelMessage.id == message_id).values(
                reaction_count=ChannelMessage.reaction_count - 1
            )
        )

    await db.commit()

    return {"message": "Reaction removed"}
