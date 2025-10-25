"""
Real-Time Chat & Messaging Endpoints
Direct communication between students and tutors
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.database import get_db


router = APIRouter(prefix="/chat", tags=["Chat & Messaging"])


# =====================================================
# Pydantic Schemas
# =====================================================

class ConversationCreate(BaseModel):
    """Create a new conversation"""
    student_id: UUID
    tutor_id: UUID
    subject: Optional[str] = None
    initial_message: Optional[str] = None


class MessageCreate(BaseModel):
    """Send a new message"""
    conversation_id: UUID
    receiver_id: UUID
    content: str = Field(..., min_length=1, max_length=5000)
    reply_to_id: Optional[UUID] = None


class MessageUpdate(BaseModel):
    """Update a message"""
    content: str = Field(..., min_length=1, max_length=5000)


class ConversationResponse(BaseModel):
    """Conversation response"""
    id: UUID
    student_id: UUID
    tutor_id: UUID
    subject: Optional[str]
    last_message_preview: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int
    is_archived: bool
    other_user: dict  # {id, name, avatar_url, is_online}
    created_at: datetime


class MessageResponse(BaseModel):
    """Message response"""
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    receiver_id: UUID
    content: str
    message_type: str
    attachment_url: Optional[str]
    attachment_type: Optional[str]
    attachment_name: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    is_edited: bool
    edited_at: Optional[datetime]
    reply_to_id: Optional[UUID]
    sender_name: str
    sender_avatar: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TypingIndicator(BaseModel):
    """Typing indicator"""
    conversation_id: UUID


class OnlineStatusUpdate(BaseModel):
    """Update online status"""
    is_online: bool


class UnreadCountResponse(BaseModel):
    """Unread message count"""
    total_unread: int
    by_conversation: List[dict]


# =====================================================
# Conversation Endpoints
# =====================================================

@router.post("/conversations", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """
    Create or get existing conversation between student and tutor

    **Features:**
    - Creates new conversation if doesn't exist
    - Returns existing conversation if already exists
    - Optionally sends initial message
    """
    try:
        # Check if conversation already exists
        query = select(func.count()).select_from(
            db.query_class  # Use raw SQL for function call
        ).where(
            f"student_id = '{data.student_id}' AND tutor_id = '{data.tutor_id}'"
        )

        # Use the SQL function we created
        result = await db.execute(
            select(func.get_or_create_conversation(
                data.student_id,
                data.tutor_id,
                data.subject
            ))
        )
        conversation_id = result.scalar()

        # Send initial message if provided
        if data.initial_message:
            await db.execute(
                """
                INSERT INTO messages (conversation_id, sender_id, receiver_id, content)
                VALUES (:conv_id, :sender, :receiver, :content)
                """,
                {
                    'conv_id': conversation_id,
                    'sender': current_user_id,
                    'receiver': data.tutor_id if current_user_id == data.student_id else data.student_id,
                    'content': data.initial_message
                }
            )
            await db.commit()

        return {
            "status": "success",
            "conversation_id": str(conversation_id),
            "message": "Conversation created successfully"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating conversation: {str(e)}"
        )


@router.get("/conversations", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_conversations(
    current_user_id: UUID,  # TODO: Get from auth
    archived: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all conversations for current user

    **Features:**
    - Sorted by most recent activity
    - Includes unread count per conversation
    - Includes other user details
    - Pagination support
    """
    try:
        # Raw SQL query for better performance
        query = """
        SELECT
            c.id,
            c.student_id,
            c.tutor_id,
            c.subject,
            c.last_message_preview,
            c.last_message_at,
            c.created_at,
            CASE
                WHEN c.student_id = :user_id THEN c.is_archived_by_student
                ELSE c.is_archived_by_tutor
            END as is_archived,
            (
                SELECT COUNT(*)
                FROM messages m
                WHERE m.conversation_id = c.id
                AND m.receiver_id = :user_id
                AND m.is_read = FALSE
                AND m.is_deleted = FALSE
            ) as unread_count,
            CASE
                WHEN c.student_id = :user_id THEN c.tutor_id
                ELSE c.student_id
            END as other_user_id
        FROM conversations c
        WHERE (c.student_id = :user_id OR c.tutor_id = :user_id)
        AND (
            CASE
                WHEN c.student_id = :user_id THEN c.is_archived_by_student = :archived
                ELSE c.is_archived_by_tutor = :archived
            END
        )
        ORDER BY c.last_message_at DESC NULLS LAST
        LIMIT :limit OFFSET :offset
        """

        result = await db.execute(
            query,
            {
                'user_id': current_user_id,
                'archived': archived,
                'limit': limit,
                'offset': offset
            }
        )
        conversations = result.fetchall()

        # Format response
        response = []
        for conv in conversations:
            # Get other user details (you'd fetch from users table)
            # For now, using placeholder
            response.append({
                "id": str(conv.id),
                "student_id": str(conv.student_id),
                "tutor_id": str(conv.tutor_id),
                "subject": conv.subject,
                "last_message_preview": conv.last_message_preview,
                "last_message_at": conv.last_message_at,
                "unread_count": conv.unread_count,
                "is_archived": conv.is_archived,
                "other_user": {
                    "id": str(conv.other_user_id),
                    "name": "User Name",  # Fetch from users table
                    "avatar_url": None,
                    "is_online": False
                },
                "created_at": conv.created_at
            })

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching conversations: {str(e)}"
        )


@router.get("/conversations/{conversation_id}", response_model=dict)
async def get_conversation(
    conversation_id: UUID,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Get single conversation details"""
    try:
        query = """
        SELECT * FROM conversations
        WHERE id = :conv_id
        AND (student_id = :user_id OR tutor_id = :user_id)
        """

        result = await db.execute(
            query,
            {'conv_id': conversation_id, 'user_id': current_user_id}
        )
        conversation = result.fetchone()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        return {
            "id": str(conversation.id),
            "student_id": str(conversation.student_id),
            "tutor_id": str(conversation.tutor_id),
            "subject": conversation.subject,
            "created_at": conversation.created_at
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: UUID,
    current_user_id: UUID,  # TODO: Get from auth
    archive: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Archive or unarchive a conversation"""
    try:
        # Determine which field to update based on user role
        query = """
        UPDATE conversations
        SET
            is_archived_by_student = CASE WHEN student_id = :user_id THEN :archive ELSE is_archived_by_student END,
            is_archived_by_tutor = CASE WHEN tutor_id = :user_id THEN :archive ELSE is_archived_by_tutor END
        WHERE id = :conv_id
        AND (student_id = :user_id OR tutor_id = :user_id)
        """

        await db.execute(
            query,
            {'conv_id': conversation_id, 'user_id': current_user_id, 'archive': archive}
        )
        await db.commit()

        return {"status": "success", "archived": archive}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# =====================================================
# Message Endpoints
# =====================================================

@router.post("/messages", response_model=dict, status_code=status.HTTP_201_CREATED)
async def send_message(
    data: MessageCreate,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """
    Send a new message

    **Features:**
    - Sends text message
    - Updates conversation last_message
    - Triggers realtime notification
    - Supports message replies
    """
    try:
        # Verify user is part of the conversation
        verify_query = """
        SELECT student_id, tutor_id FROM conversations
        WHERE id = :conv_id
        AND (student_id = :user_id OR tutor_id = :user_id)
        """
        result = await db.execute(
            verify_query,
            {'conv_id': data.conversation_id, 'user_id': current_user_id}
        )
        conversation = result.fetchone()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied"
            )

        # Insert message
        insert_query = """
        INSERT INTO messages (
            conversation_id, sender_id, receiver_id, content, reply_to_id
        ) VALUES (
            :conv_id, :sender_id, :receiver_id, :content, :reply_to_id
        )
        RETURNING id, created_at
        """

        result = await db.execute(
            insert_query,
            {
                'conv_id': data.conversation_id,
                'sender_id': current_user_id,
                'receiver_id': data.receiver_id,
                'content': data.content,
                'reply_to_id': data.reply_to_id
            }
        )
        message = result.fetchone()
        await db.commit()

        return {
            "status": "success",
            "message_id": str(message.id),
            "created_at": message.created_at,
            "message": "Message sent successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending message: {str(e)}"
        )


@router.get("/messages/{conversation_id}", response_model=List[dict])
async def get_messages(
    conversation_id: UUID,
    current_user_id: UUID,  # TODO: Get from auth
    limit: int = 50,
    offset: int = 0,
    before_message_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get messages for a conversation

    **Features:**
    - Pagination support
    - Cursor-based pagination with before_message_id
    - Ordered newest first
    - Includes sender details
    """
    try:
        # Verify access
        verify_query = """
        SELECT 1 FROM conversations
        WHERE id = :conv_id
        AND (student_id = :user_id OR tutor_id = :user_id)
        """
        result = await db.execute(
            verify_query,
            {'conv_id': conversation_id, 'user_id': current_user_id}
        )
        if not result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        # Fetch messages
        query = """
        SELECT
            m.id,
            m.conversation_id,
            m.sender_id,
            m.receiver_id,
            m.content,
            m.message_type,
            m.attachment_url,
            m.attachment_type,
            m.attachment_name,
            m.is_read,
            m.read_at,
            m.is_edited,
            m.edited_at,
            m.reply_to_id,
            m.created_at
        FROM messages m
        WHERE m.conversation_id = :conv_id
        AND m.is_deleted = FALSE
        """

        params = {'conv_id': conversation_id, 'limit': limit, 'offset': offset}

        if before_message_id:
            query += " AND m.created_at < (SELECT created_at FROM messages WHERE id = :before_id)"
            params['before_id'] = before_message_id

        query += " ORDER BY m.created_at DESC LIMIT :limit OFFSET :offset"

        result = await db.execute(query, params)
        messages = result.fetchall()

        # Format response
        response = []
        for msg in messages:
            response.append({
                "id": str(msg.id),
                "conversation_id": str(msg.conversation_id),
                "sender_id": str(msg.sender_id),
                "receiver_id": str(msg.receiver_id),
                "content": msg.content,
                "message_type": msg.message_type,
                "attachment_url": msg.attachment_url,
                "attachment_type": msg.attachment_type,
                "attachment_name": msg.attachment_name,
                "is_read": msg.is_read,
                "read_at": msg.read_at,
                "is_edited": msg.is_edited,
                "edited_at": msg.edited_at,
                "reply_to_id": str(msg.reply_to_id) if msg.reply_to_id else None,
                "sender_name": "User",  # Fetch from users table
                "sender_avatar": None,
                "created_at": msg.created_at
            })

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/messages/{message_id}/read")
async def mark_message_read(
    message_id: UUID,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Mark a message as read"""
    try:
        query = """
        UPDATE messages
        SET is_read = TRUE, read_at = NOW()
        WHERE id = :msg_id
        AND receiver_id = :user_id
        AND is_read = FALSE
        """

        await db.execute(query, {'msg_id': message_id, 'user_id': current_user_id})
        await db.commit()

        return {"status": "success", "marked_read": True}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/messages/conversation/{conversation_id}/read-all")
async def mark_conversation_read(
    conversation_id: UUID,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Mark all messages in a conversation as read"""
    try:
        query = """
        UPDATE messages
        SET is_read = TRUE, read_at = NOW()
        WHERE conversation_id = :conv_id
        AND receiver_id = :user_id
        AND is_read = FALSE
        """

        result = await db.execute(
            query,
            {'conv_id': conversation_id, 'user_id': current_user_id}
        )
        await db.commit()

        return {
            "status": "success",
            "messages_marked_read": result.rowcount
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/messages/{message_id}")
async def edit_message(
    message_id: UUID,
    data: MessageUpdate,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Edit a message (only allowed within 15 minutes)"""
    try:
        query = """
        UPDATE messages
        SET content = :content, is_edited = TRUE, edited_at = NOW()
        WHERE id = :msg_id
        AND sender_id = :user_id
        AND created_at > NOW() - INTERVAL '15 minutes'
        """

        result = await db.execute(
            query,
            {'msg_id': message_id, 'user_id': current_user_id, 'content': data.content}
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot edit this message (too old or not yours)"
            )

        await db.commit()
        return {"status": "success", "edited": True}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: UUID,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a message"""
    try:
        query = """
        UPDATE messages
        SET is_deleted = TRUE, deleted_at = NOW(), content = '[Message deleted]'
        WHERE id = :msg_id
        AND sender_id = :user_id
        """

        result = await db.execute(query, {'msg_id': message_id, 'user_id': current_user_id})

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or access denied"
            )

        await db.commit()
        return {"status": "success", "deleted": True}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# =====================================================
# Unread Count
# =====================================================

@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Get total unread message count and per-conversation breakdown"""
    try:
        # Total unread
        total_query = "SELECT get_unread_count(:user_id)"
        result = await db.execute(total_query, {'user_id': current_user_id})
        total_unread = result.scalar() or 0

        # Per conversation
        conv_query = """
        SELECT
            conversation_id,
            COUNT(*) as unread_count
        FROM messages
        WHERE receiver_id = :user_id
        AND is_read = FALSE
        AND is_deleted = FALSE
        GROUP BY conversation_id
        """
        result = await db.execute(conv_query, {'user_id': current_user_id})
        by_conversation = [
            {"conversation_id": str(row[0]), "unread_count": row[1]}
            for row in result.fetchall()
        ]

        return {
            "total_unread": total_unread,
            "by_conversation": by_conversation
        }

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# =====================================================
# Typing Indicators
# =====================================================

@router.post("/typing/{conversation_id}")
async def set_typing_indicator(
    conversation_id: UUID,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Set typing indicator (auto-expires in 5 seconds)"""
    try:
        query = """
        INSERT INTO typing_indicators (conversation_id, user_id)
        VALUES (:conv_id, :user_id)
        ON CONFLICT (conversation_id, user_id)
        DO UPDATE SET expires_at = NOW() + INTERVAL '5 seconds'
        """

        await db.execute(query, {'conv_id': conversation_id, 'user_id': current_user_id})
        await db.commit()

        return {"status": "success", "typing": True}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# =====================================================
# Online Status
# =====================================================

@router.post("/online-status")
async def update_online_status(
    data: OnlineStatusUpdate,
    current_user_id: UUID,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Update user online status"""
    try:
        query = """
        INSERT INTO user_online_status (user_id, is_online, last_seen_at)
        VALUES (:user_id, :is_online, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET is_online = :is_online, last_seen_at = NOW()
        """

        await db.execute(query, {'user_id': current_user_id, 'is_online': data.is_online})
        await db.commit()

        return {"status": "success", "is_online": data.is_online}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/online-status/{user_id}")
async def get_online_status(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get user online status"""
    try:
        query = "SELECT is_online, last_seen_at FROM user_online_status WHERE user_id = :user_id"
        result = await db.execute(query, {'user_id': user_id})
        status_row = result.fetchone()

        if not status_row:
            return {"is_online": False, "last_seen_at": None}

        return {
            "is_online": status_row[0],
            "last_seen_at": status_row[1]
        }

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# =====================================================
# Health Check
# =====================================================

@router.get("/health")
async def chat_health_check():
    """Health check for chat service"""
    return {
        "status": "healthy",
        "service": "Chat & Messaging",
        "version": "1.0.0",
        "features": [
            "Real-time messaging",
            "Typing indicators",
            "Read receipts",
            "Online status",
            "File sharing"
        ]
    }
