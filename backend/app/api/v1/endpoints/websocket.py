"""
WebSocket endpoints for real-time messaging
Handles WebSocket connections, message broadcasting, and real-time features
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
import json
from datetime import datetime
from loguru import logger

from app.websockets.connection_manager import manager
from app.core.database import get_db
from app.models.messaging import Channel, ChannelMember, ChannelMessage, MessageReaction

router = APIRouter()


async def verify_channel_access(
    user_id: str,
    channel_id: str,
    db: AsyncSession
) -> bool:
    """Verify user has access to a channel"""
    result = await db.execute(
        select(ChannelMember).where(
            ChannelMember.channel_id == channel_id,
            ChannelMember.user_id == user_id
        )
    )
    return result.scalar_one_or_none() is not None


async def create_message_in_db(
    channel_id: str,
    user_id: str,
    content: str,
    db: AsyncSession
) -> ChannelMessage:
    """Create a message in the database"""
    message = ChannelMessage(
        channel_id=channel_id,
        user_id=user_id,
        content=content,
        created_at=datetime.utcnow()
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def handle_new_message(
    data: Dict[str, Any],
    user_id: str,
    db: AsyncSession
):
    """Handle new message event"""
    channel_id = data.get("channel_id")
    content = data.get("content")

    if not channel_id or not content:
        return {"error": "Missing channel_id or content"}

    # Verify access
    if not await verify_channel_access(user_id, channel_id, db):
        return {"error": "Access denied to channel"}

    # Create message in database
    message = await create_message_in_db(channel_id, user_id, content, db)

    # Broadcast to channel members
    message_data = {
        "id": str(message.id),
        "channel_id": channel_id,
        "user_id": user_id,
        "content": content,
        "created_at": message.created_at.isoformat()
    }

    await manager.broadcast_message(channel_id, message_data)

    return {"status": "sent", "message_id": str(message.id)}


async def handle_typing_indicator(
    data: Dict[str, Any],
    user_id: str,
    db: AsyncSession
):
    """Handle typing indicator event"""
    channel_id = data.get("channel_id")
    is_typing = data.get("is_typing", True)

    if not channel_id:
        return {"error": "Missing channel_id"}

    # Verify access
    if not await verify_channel_access(user_id, channel_id, db):
        return {"error": "Access denied to channel"}

    # Broadcast typing indicator
    await manager.broadcast_typing_indicator(channel_id, user_id, is_typing)

    return {"status": "sent"}


async def handle_read_receipt(
    data: Dict[str, Any],
    user_id: str,
    db: AsyncSession
):
    """Handle read receipt event"""
    channel_id = data.get("channel_id")
    message_id = data.get("message_id")

    if not channel_id or not message_id:
        return {"error": "Missing channel_id or message_id"}

    # Verify access
    if not await verify_channel_access(user_id, channel_id, db):
        return {"error": "Access denied to channel"}

    # Broadcast read receipt
    await manager.broadcast_read_receipt(channel_id, user_id, message_id)

    return {"status": "sent"}


async def handle_join_channel(
    data: Dict[str, Any],
    user_id: str,
    db: AsyncSession
):
    """Handle join channel event"""
    channel_id = data.get("channel_id")

    if not channel_id:
        return {"error": "Missing channel_id"}

    # Verify access
    if not await verify_channel_access(user_id, channel_id, db):
        return {"error": "Access denied to channel"}

    # Add user to channel members in connection manager
    await manager.join_channel(channel_id, user_id)

    return {"status": "joined", "channel_id": channel_id}


async def handle_leave_channel(
    data: Dict[str, Any],
    user_id: str,
    db: AsyncSession
):
    """Handle leave channel event"""
    channel_id = data.get("channel_id")

    if not channel_id:
        return {"error": "Missing channel_id"}

    # Remove user from channel members
    await manager.leave_channel(channel_id, user_id)

    return {"status": "left", "channel_id": channel_id}


async def handle_message_reaction(
    data: Dict[str, Any],
    user_id: str,
    db: AsyncSession
):
    """Handle message reaction event"""
    message_id = data.get("message_id")
    emoji = data.get("emoji")
    channel_id = data.get("channel_id")

    if not message_id or not emoji or not channel_id:
        return {"error": "Missing required fields"}

    # Verify access
    if not await verify_channel_access(user_id, channel_id, db):
        return {"error": "Access denied to channel"}

    # Create reaction in database
    reaction = MessageReaction(
        message_id=message_id,
        user_id=user_id,
        emoji=emoji,
        created_at=datetime.utcnow()
    )
    db.add(reaction)
    await db.commit()

    # Broadcast reaction to channel
    reaction_data = {
        "type": "message_reaction",
        "message_id": message_id,
        "user_id": user_id,
        "emoji": emoji,
        "timestamp": datetime.utcnow().isoformat()
    }

    await manager.broadcast_to_channel(channel_id, reaction_data)

    return {"status": "sent"}


# Event handlers mapping
EVENT_HANDLERS = {
    "new_message": handle_new_message,
    "typing": handle_typing_indicator,
    "read_receipt": handle_read_receipt,
    "join_channel": handle_join_channel,
    "leave_channel": handle_leave_channel,
    "message_reaction": handle_message_reaction,
}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time messaging

    Connection URL: ws://localhost:8000/api/v1/ws/{user_id}

    Expected message format:
    {
        "type": "new_message|typing|read_receipt|join_channel|leave_channel|message_reaction",
        "data": {
            "channel_id": "uuid",
            "content": "message content",  // for new_message
            "is_typing": true,  // for typing
            "message_id": "uuid",  // for read_receipt, message_reaction
            "emoji": "👍"  // for message_reaction
        }
    }
    """

    # Accept connection
    await manager.connect(websocket, user_id)

    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Get user's channels and auto-join them
        result = await db.execute(
            select(ChannelMember.channel_id).where(
                ChannelMember.user_id == user_id
            )
        )
        channel_ids = [row[0] for row in result.all()]

        for channel_id in channel_ids:
            await manager.join_channel(channel_id, user_id)

        logger.info(f"User {user_id} connected and joined {len(channel_ids)} channels")

        # Listen for messages
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                event_type = message.get("type")
                event_data = message.get("data", {})

                # Handle the event
                if event_type in EVENT_HANDLERS:
                    handler = EVENT_HANDLERS[event_type]
                    response = await handler(event_data, user_id, db)

                    # Send acknowledgment
                    await websocket.send_json({
                        "type": "ack",
                        "event": event_type,
                        "response": response,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown event type: {event_type}",
                        "timestamp": datetime.utcnow().isoformat()
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })

    except WebSocketDisconnect:
        # Handle disconnection
        await manager.disconnect(websocket, user_id)
        logger.info(f"User {user_id} disconnected")

    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(websocket, user_id)


@router.get("/online-users")
async def get_online_users():
    """Get list of currently online users"""
    online_users = await manager.get_online_users()
    return {
        "online_users": online_users,
        "count": len(online_users)
    }


@router.get("/channel/{channel_id}/online-members")
async def get_channel_online_members(
    channel_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get online members of a specific channel"""
    online_members = await manager.get_channel_online_members(channel_id)
    return {
        "channel_id": channel_id,
        "online_members": online_members,
        "count": len(online_members)
    }


@router.get("/user/{user_id}/status")
async def get_user_status(user_id: str):
    """Check if a user is currently online"""
    is_online = await manager.is_user_online(user_id)
    return {
        "user_id": user_id,
        "is_online": is_online
    }
