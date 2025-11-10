"""
WebSocket Connection Manager
Handles real-time connections for messaging, typing indicators, and presence
"""

from typing import Dict, Set, List
from fastapi import WebSocket
from uuid import UUID
import json
import asyncio
from datetime import datetime
from loguru import logger


class ConnectionManager:
    """
    Manages WebSocket connections for real-time features

    Features:
    - Multiple connections per user (mobile + web)
    - Channel-based message broadcasting
    - Typing indicators
    - Online presence
    - Message read receipts
    """

    def __init__(self):
        # user_id -> Set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

        # channel_id -> Set of user_ids
        self.channel_members: Dict[str, Set[str]] = {}

        # user_id -> last_activity timestamp
        self.user_presence: Dict[str, datetime] = {}

        # Lock for thread-safe operations
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()

        async with self.lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()

            self.active_connections[user_id].add(websocket)
            self.user_presence[user_id] = datetime.utcnow()

        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")

        # Broadcast online status
        await self.broadcast_presence_update(user_id, True)

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        async with self.lock:
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)

                # If no more connections for this user, mark as offline
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                    if user_id in self.user_presence:
                        del self.user_presence[user_id]

                    # Broadcast offline status
                    await self.broadcast_presence_update(user_id, False)

        logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, user_id: str, message: dict):
        """Send message to all connections of a specific user"""
        if user_id not in self.active_connections:
            return

        message_json = json.dumps(message)
        disconnected = set()

        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending to user {user_id}: {e}")
                disconnected.add(websocket)

        # Clean up disconnected sockets
        if disconnected:
            async with self.lock:
                self.active_connections[user_id] -= disconnected

    async def broadcast_to_channel(self, channel_id: str, message: dict, exclude_user: str = None):
        """Broadcast message to all users in a channel"""
        if channel_id not in self.channel_members:
            return

        message_json = json.dumps(message)

        for user_id in self.channel_members[channel_id]:
            if exclude_user and user_id == exclude_user:
                continue

            if user_id in self.active_connections:
                for websocket in self.active_connections[user_id]:
                    try:
                        await websocket.send_text(message_json)
                    except Exception as e:
                        logger.error(f"Error broadcasting to user {user_id}: {e}")

    async def join_channel(self, channel_id: str, user_id: str):
        """Add user to channel's member list"""
        async with self.lock:
            if channel_id not in self.channel_members:
                self.channel_members[channel_id] = set()

            self.channel_members[channel_id].add(user_id)

        logger.info(f"User {user_id} joined channel {channel_id}")

    async def leave_channel(self, channel_id: str, user_id: str):
        """Remove user from channel's member list"""
        async with self.lock:
            if channel_id in self.channel_members:
                self.channel_members[channel_id].discard(user_id)

                # Clean up empty channels
                if not self.channel_members[channel_id]:
                    del self.channel_members[channel_id]

        logger.info(f"User {user_id} left channel {channel_id}")

    async def broadcast_typing_indicator(self, channel_id: str, user_id: str, is_typing: bool):
        """Broadcast typing indicator to channel members"""
        message = {
            "type": "typing",
            "channel_id": channel_id,
            "user_id": user_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_channel(channel_id, message, exclude_user=user_id)

    async def broadcast_message(self, channel_id: str, message_data: dict):
        """Broadcast a new message to channel members"""
        message = {
            "type": "message",
            "channel_id": channel_id,
            "data": message_data,
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_channel(channel_id, message)

    async def broadcast_message_update(self, channel_id: str, message_id: str, content: str):
        """Broadcast message edit to channel members"""
        message = {
            "type": "message_updated",
            "channel_id": channel_id,
            "message_id": message_id,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_channel(channel_id, message)

    async def broadcast_message_delete(self, channel_id: str, message_id: str):
        """Broadcast message deletion to channel members"""
        message = {
            "type": "message_deleted",
            "channel_id": channel_id,
            "message_id": message_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_channel(channel_id, message)

    async def broadcast_presence_update(self, user_id: str, is_online: bool):
        """Broadcast user presence status to all active connections"""
        message = {
            "type": "presence",
            "user_id": user_id,
            "is_online": is_online,
            "last_seen": datetime.utcnow().isoformat()
        }

        # Broadcast to all connected users
        for uid in list(self.active_connections.keys()):
            await self.send_personal_message(uid, message)

    async def broadcast_read_receipt(self, channel_id: str, user_id: str, message_id: str):
        """Broadcast read receipt to channel members"""
        message = {
            "type": "read_receipt",
            "channel_id": channel_id,
            "user_id": user_id,
            "message_id": message_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_channel(channel_id, message)

    async def get_online_users(self) -> List[str]:
        """Get list of currently online user IDs"""
        return list(self.active_connections.keys())

    async def is_user_online(self, user_id: str) -> bool:
        """Check if a user is currently online"""
        return user_id in self.active_connections

    async def get_channel_online_members(self, channel_id: str) -> List[str]:
        """Get online members of a specific channel"""
        if channel_id not in self.channel_members:
            return []

        return [
            user_id for user_id in self.channel_members[channel_id]
            if user_id in self.active_connections
        ]


# Global connection manager instance
manager = ConnectionManager()
