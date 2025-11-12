"""
Server-Sent Events (SSE) Connection Manager
Manages SSE connections and broadcasts messages to connected clients
"""

import asyncio
import json
from typing import Dict, Set, Any
from datetime import datetime
from loguru import logger
from fastapi import Request


class SSEConnectionManager:
    """
    Manages Server-Sent Events connections and message broadcasting

    SSE is unidirectional (server → client), so this manager:
    - Maintains active connections per user
    - Broadcasts messages to specific channels
    - Tracks user presence
    - Handles connection lifecycle
    """

    def __init__(self):
        # User ID -> Set of queues (each queue represents an SSE connection)
        self.user_connections: Dict[str, Set[asyncio.Queue]] = {}

        # Channel ID -> Set of user IDs in that channel
        self.channel_members: Dict[str, Set[str]] = {}

        # User ID -> last activity timestamp
        self.user_presence: Dict[str, datetime] = {}

        # Lock for thread-safe operations
        self.lock = asyncio.Lock()

    async def connect(self, user_id: str) -> asyncio.Queue:
        """
        Register a new SSE connection for a user

        Args:
            user_id: The user ID to connect

        Returns:
            asyncio.Queue: Message queue for this connection
        """
        async with self.lock:
            # Create message queue for this connection
            queue = asyncio.Queue(maxsize=100)

            # Add queue to user's connections
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()

            self.user_connections[user_id].add(queue)

            # Update presence
            self.user_presence[user_id] = datetime.utcnow()

            total_connections = sum(len(queues) for queues in self.user_connections.values())
            logger.info(f"SSE: User {user_id} connected. Total connections: {total_connections}")

            return queue

    async def disconnect(self, user_id: str, queue: asyncio.Queue):
        """
        Disconnect an SSE connection

        Args:
            user_id: The user ID to disconnect
            queue: The message queue to remove
        """
        async with self.lock:
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(queue)

                # If no more connections for this user, remove from tracking
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]

                    # Remove from all channels
                    for channel_id in list(self.channel_members.keys()):
                        self.channel_members[channel_id].discard(user_id)
                        if not self.channel_members[channel_id]:
                            del self.channel_members[channel_id]

                    # Remove presence
                    if user_id in self.user_presence:
                        del self.user_presence[user_id]

            total_connections = sum(len(queues) for queues in self.user_connections.values())
            logger.info(f"SSE: User {user_id} disconnected. Total connections: {total_connections}")

    async def join_channel(self, channel_id: str, user_id: str):
        """
        Add a user to a channel's member list

        Args:
            channel_id: The channel ID
            user_id: The user ID to add
        """
        async with self.lock:
            if channel_id not in self.channel_members:
                self.channel_members[channel_id] = set()

            self.channel_members[channel_id].add(user_id)
            logger.info(f"SSE: User {user_id} joined channel {channel_id}")

    async def leave_channel(self, channel_id: str, user_id: str):
        """
        Remove a user from a channel's member list

        Args:
            channel_id: The channel ID
            user_id: The user ID to remove
        """
        async with self.lock:
            if channel_id in self.channel_members:
                self.channel_members[channel_id].discard(user_id)

                if not self.channel_members[channel_id]:
                    del self.channel_members[channel_id]

            logger.info(f"SSE: User {user_id} left channel {channel_id}")

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """
        Send a message to all of a user's SSE connections

        Args:
            user_id: The user ID to send to
            message: The message data to send
        """
        if user_id not in self.user_connections:
            return

        # Send to all connections for this user
        for queue in list(self.user_connections[user_id]):
            try:
                await queue.put(message)
            except Exception as e:
                logger.error(f"SSE: Error sending to user {user_id}: {e}")

    async def broadcast_to_channel(self, channel_id: str, message: Dict[str, Any], exclude_user: str = None):
        """
        Broadcast a message to all members of a channel

        Args:
            channel_id: The channel ID to broadcast to
            message: The message data to send
            exclude_user: Optional user ID to exclude from broadcast
        """
        if channel_id not in self.channel_members:
            return

        # Get all users in the channel
        members = list(self.channel_members[channel_id])

        # Send to each member (except excluded user)
        for user_id in members:
            if user_id == exclude_user:
                continue

            await self.send_to_user(user_id, message)

        logger.debug(f"SSE: Broadcast to channel {channel_id}: {len(members)} members")

    async def broadcast_message(self, channel_id: str, message_data: Dict[str, Any]):
        """
        Broadcast a new message to channel members

        Args:
            channel_id: The channel ID
            message_data: The message data
        """
        event = {
            "type": "new_message",
            "data": message_data,
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_channel(channel_id, event)

    async def broadcast_typing_indicator(self, channel_id: str, user_id: str, is_typing: bool):
        """
        Broadcast typing indicator to channel members

        Args:
            channel_id: The channel ID
            user_id: The user who is typing
            is_typing: Whether user is typing
        """
        event = {
            "type": "typing",
            "data": {
                "channel_id": channel_id,
                "user_id": user_id,
                "is_typing": is_typing
            },
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_channel(channel_id, event, exclude_user=user_id)

    async def broadcast_read_receipt(self, channel_id: str, user_id: str, message_id: str):
        """
        Broadcast read receipt to channel members

        Args:
            channel_id: The channel ID
            user_id: The user who read the message
            message_id: The message ID that was read
        """
        event = {
            "type": "read_receipt",
            "data": {
                "channel_id": channel_id,
                "user_id": user_id,
                "message_id": message_id
            },
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_channel(channel_id, event, exclude_user=user_id)

    async def get_online_users(self) -> list[str]:
        """Get list of all online user IDs"""
        return list(self.user_connections.keys())

    async def get_channel_online_members(self, channel_id: str) -> list[str]:
        """Get list of online members in a channel"""
        if channel_id not in self.channel_members:
            return []

        # Return only users who are actually connected
        return [
            user_id for user_id in self.channel_members[channel_id]
            if user_id in self.user_connections
        ]

    async def is_user_online(self, user_id: str) -> bool:
        """Check if a user is currently connected"""
        return user_id in self.user_connections

    async def handle_pg_notification(self, channel: str, data: Dict[str, Any]):
        """
        Handle PostgreSQL NOTIFY events and broadcast to SSE clients

        This is called by the PostgreSQL listener when a notification is received.

        Args:
            channel: The PostgreSQL channel name (e.g., 'channel_messages')
            data: The notification payload with message/reaction data
        """
        try:
            operation = data.get('operation')
            table = data.get('table')

            if table == 'channel_messages':
                # Message was inserted, updated, or deleted
                channel_id = data.get('channel_id')

                if operation == 'INSERT':
                    # New message - broadcast to channel members
                    message_event = {
                        "type": "new_message",
                        "data": {
                            "id": str(data.get('id')),
                            "channel_id": str(channel_id),
                            "user_id": str(data.get('user_id')),
                            "content": data.get('content'),
                            "created_at": data.get('created_at'),
                            "is_pinned": data.get('is_pinned', False),
                            "reaction_count": data.get('reaction_count', 0)
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    }

                    await self.broadcast_to_channel(str(channel_id), message_event)
                    logger.debug(f"Broadcasted new message to channel {channel_id}")

                elif operation == 'UPDATE':
                    # Message updated - broadcast update
                    update_event = {
                        "type": "message_updated",
                        "data": {
                            "id": str(data.get('id')),
                            "channel_id": str(channel_id),
                            "content": data.get('content'),
                            "is_pinned": data.get('is_pinned', False),
                            "reaction_count": data.get('reaction_count', 0)
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    }

                    await self.broadcast_to_channel(str(channel_id), update_event)

                elif operation == 'DELETE':
                    # Message deleted - broadcast deletion
                    delete_event = {
                        "type": "message_deleted",
                        "data": {
                            "id": str(data.get('id')),
                            "channel_id": str(channel_id)
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    }

                    await self.broadcast_to_channel(str(channel_id), delete_event)

            elif table == 'message_reactions':
                # Reaction was added or removed
                channel_id = data.get('channel_id')

                if operation == 'INSERT':
                    # New reaction - broadcast to channel
                    reaction_event = {
                        "type": "message_reaction",
                        "data": {
                            "id": str(data.get('id')),
                            "message_id": str(data.get('message_id')),
                            "user_id": str(data.get('user_id')),
                            "emoji": data.get('emoji'),
                            "created_at": data.get('created_at')
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    }

                    await self.broadcast_to_channel(str(channel_id), reaction_event)

                elif operation == 'DELETE':
                    # Reaction removed - broadcast removal
                    reaction_remove_event = {
                        "type": "reaction_removed",
                        "data": {
                            "id": str(data.get('id')),
                            "message_id": str(data.get('message_id')),
                            "user_id": str(data.get('user_id'))
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    }

                    await self.broadcast_to_channel(str(channel_id), reaction_remove_event)

        except Exception as e:
            logger.error(f"Error handling PostgreSQL notification: {e}")


# Global SSE manager instance
sse_manager = SSEConnectionManager()
