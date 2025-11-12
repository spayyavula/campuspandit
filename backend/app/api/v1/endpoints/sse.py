"""
Server-Sent Events (SSE) endpoints for real-time messaging
Handles SSE connections and streams real-time updates to clients
"""

from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import AsyncGenerator
import asyncio
import json
from datetime import datetime
from loguru import logger

from app.sse.sse_manager import sse_manager
from app.core.database import async_session_maker
from app.models.messaging import ChannelMember

router = APIRouter()


async def event_stream(user_id: str) -> AsyncGenerator[str, None]:
    """
    Generator function that yields Server-Sent Events

    Args:
        user_id: The user ID for this SSE connection

    Yields:
        SSE-formatted strings (data: {...})
    """
    # Connect to SSE manager and get message queue
    queue = await sse_manager.connect(user_id)

    try:
        # Send connection confirmation
        yield f"data: {json.dumps({'type': 'connection', 'status': 'connected', 'user_id': user_id, 'timestamp': datetime.utcnow().isoformat()})}\n\n"

        # Auto-join user's channels
        async with async_session_maker() as db:
            result = await db.execute(
                select(ChannelMember.channel_id).where(
                    ChannelMember.user_id == user_id
                )
            )
            channel_ids = [str(row[0]) for row in result.all()]

        # Join all channels
        for channel_id in channel_ids:
            await sse_manager.join_channel(channel_id, user_id)

        logger.info(f"SSE: User {user_id} connected and joined {len(channel_ids)} channels")

        # Send ping every 15 seconds to keep connection alive
        last_ping = asyncio.get_event_loop().time()
        ping_interval = 15.0  # seconds

        # Stream events from queue
        while True:
            try:
                # Check if it's time to send a ping
                current_time = asyncio.get_event_loop().time()
                time_until_ping = ping_interval - (current_time - last_ping)

                if time_until_ping <= 0:
                    # Send ping
                    yield f": ping\n\n"
                    last_ping = current_time
                    time_until_ping = ping_interval

                # Wait for message with timeout
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=time_until_ping)

                    # Send message as SSE event
                    yield f"data: {json.dumps(message)}\n\n"

                except asyncio.TimeoutError:
                    # Timeout reached, send ping on next iteration
                    continue

            except asyncio.CancelledError:
                logger.info(f"SSE: Stream cancelled for user {user_id}")
                break
            except Exception as e:
                logger.error(f"SSE: Error in event stream for user {user_id}: {e}")
                break

    finally:
        # Disconnect when stream ends
        await sse_manager.disconnect(user_id, queue)
        logger.info(f"SSE: User {user_id} disconnected")


@router.get("/sse/{user_id}")
async def sse_endpoint(user_id: str, request: Request):
    """
    Server-Sent Events endpoint for real-time messaging

    Connection URL: GET /api/v1/sse/{user_id}

    The client will receive events in this format:
    ```
    data: {"type": "connection", "status": "connected", ...}

    data: {"type": "new_message", "data": {...}, "timestamp": "..."}

    data: {"type": "message_reaction", "data": {...}, "timestamp": "..."}
    ```

    Event types:
    - connection: Initial connection confirmation
    - new_message: New message in a channel
    - message_updated: Message was edited
    - message_deleted: Message was removed
    - message_reaction: Reaction added to message
    - reaction_removed: Reaction removed from message
    - typing: User is typing indicator
    - read_receipt: User read a message
    """

    return StreamingResponse(
        event_stream(user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.get("/online-users")
async def get_online_users():
    """Get list of currently online users"""
    online_users = await sse_manager.get_online_users()
    return {
        "online_users": online_users,
        "count": len(online_users)
    }


@router.get("/channel/{channel_id}/online-members")
async def get_channel_online_members(channel_id: str):
    """Get online members of a specific channel"""
    online_members = await sse_manager.get_channel_online_members(channel_id)
    return {
        "channel_id": channel_id,
        "online_members": online_members,
        "count": len(online_members)
    }


@router.get("/user/{user_id}/status")
async def get_user_status(user_id: str):
    """Check if a user is currently online"""
    is_online = await sse_manager.is_user_online(user_id)
    return {
        "user_id": user_id,
        "is_online": is_online
    }
