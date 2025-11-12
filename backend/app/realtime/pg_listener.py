"""
PostgreSQL LISTEN/NOTIFY Listener Service
Listens for database notifications and broadcasts to SSE clients
"""

import asyncio
import json
from typing import Optional, Callable, Any
from loguru import logger
import asyncpg
from app.core.config import settings


class PostgreSQLListener:
    """
    PostgreSQL LISTEN/NOTIFY listener service

    Maintains a persistent connection to PostgreSQL and listens for
    NOTIFY events from database triggers. When notifications are received,
    they are forwarded to registered callback handlers.
    """

    def __init__(self):
        self.connection: Optional[asyncpg.Connection] = None
        self.is_running = False
        self.callbacks: dict[str, list[Callable]] = {}
        self._listener_task: Optional[asyncio.Task] = None

    async def connect(self):
        """Establish connection to PostgreSQL"""
        try:
            # Parse DATABASE_URL to get connection parameters
            db_url = settings.DATABASE_URL

            # Convert SQLAlchemy URL to asyncpg format
            # postgresql+asyncpg://user:pass@host:port/db -> postgresql://user:pass@host:port/db
            if db_url.startswith("postgresql+asyncpg://"):
                db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

            # Remove SSL query parameter if present - asyncpg handles it differently
            # We'll use SSL by default for secure connections
            import ssl as ssl_module

            # Parse URL to separate SSL parameter
            if "?ssl=" in db_url or "&ssl=" in db_url:
                # Remove SSL parameter from URL
                base_url = db_url.split('?')[0]

                # Create SSL context for secure connections
                ssl_context = ssl_module.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl_module.CERT_NONE

                self.connection = await asyncpg.connect(base_url, ssl=ssl_context)
            else:
                self.connection = await asyncpg.connect(db_url)

            logger.info("PostgreSQL LISTEN/NOTIFY: Connected to database")

        except Exception as e:
            logger.error(f"PostgreSQL LISTEN/NOTIFY: Failed to connect: {e}")
            raise

    async def disconnect(self):
        """Close connection to PostgreSQL"""
        if self.connection:
            await self.connection.close()
            self.connection = None
            logger.info("PostgreSQL LISTEN/NOTIFY: Disconnected from database")

    def register_callback(self, channel: str, callback: Callable):
        """
        Register a callback for a specific NOTIFY channel

        Args:
            channel: The NOTIFY channel name (e.g., 'channel_messages')
            callback: Async function to call when notification received
        """
        if channel not in self.callbacks:
            self.callbacks[channel] = []

        self.callbacks[channel].append(callback)
        logger.info(f"PostgreSQL LISTEN/NOTIFY: Registered callback for channel '{channel}'")

    async def _handle_notification(self, connection, pid, channel, payload):
        """
        Handle incoming NOTIFY from PostgreSQL

        Args:
            connection: The connection that received the notification
            pid: PostgreSQL backend process ID
            channel: The channel name
            payload: The notification payload (JSON string)
        """
        try:
            # Parse JSON payload
            data = json.loads(payload)

            logger.debug(f"PostgreSQL NOTIFY received on '{channel}': {data.get('operation')} "
                        f"on {data.get('table')} id={data.get('id')}")

            # Call all registered callbacks for this channel
            if channel in self.callbacks:
                for callback in self.callbacks[channel]:
                    try:
                        await callback(channel, data)
                    except Exception as e:
                        logger.error(f"Error in callback for channel '{channel}': {e}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse NOTIFY payload as JSON: {e}")
        except Exception as e:
            logger.error(f"Error handling notification: {e}")

    async def listen(self, channel: str):
        """
        Start listening to a PostgreSQL NOTIFY channel

        Args:
            channel: The channel name to listen to
        """
        if not self.connection:
            raise RuntimeError("Not connected to database. Call connect() first.")

        try:
            # Add listener for this channel
            await self.connection.add_listener(channel, self._handle_notification)
            logger.info(f"PostgreSQL LISTEN/NOTIFY: Now listening to channel '{channel}'")

        except Exception as e:
            logger.error(f"Failed to listen to channel '{channel}': {e}")
            raise

    async def unlisten(self, channel: str):
        """
        Stop listening to a PostgreSQL NOTIFY channel

        Args:
            channel: The channel name to stop listening to
        """
        if not self.connection:
            return

        try:
            await self.connection.remove_listener(channel, self._handle_notification)
            logger.info(f"PostgreSQL LISTEN/NOTIFY: Stopped listening to channel '{channel}'")

        except Exception as e:
            logger.error(f"Failed to unlisten from channel '{channel}': {e}")

    async def start_listening(self):
        """
        Start the listener service

        This method:
        1. Connects to PostgreSQL
        2. Listens to configured channels
        3. Keeps the connection alive
        """
        if self.is_running:
            logger.warning("Listener is already running")
            return

        self.is_running = True

        try:
            # Connect to database
            await self.connect()

            # Start listening to the main channels
            await self.listen('channel_messages')
            await self.listen('message_reactions')

            logger.info("PostgreSQL LISTEN/NOTIFY: Service started successfully")

            # Keep connection alive
            while self.is_running:
                await asyncio.sleep(1)

                # Periodically check connection is alive
                if self.connection.is_closed():
                    logger.error("PostgreSQL connection closed unexpectedly. Reconnecting...")
                    await self.connect()
                    await self.listen('channel_messages')
                    await self.listen('message_reactions')

        except Exception as e:
            logger.error(f"PostgreSQL LISTEN/NOTIFY: Error in listener: {e}")
            self.is_running = False
            raise
        finally:
            await self.disconnect()

    async def stop_listening(self):
        """Stop the listener service"""
        logger.info("PostgreSQL LISTEN/NOTIFY: Stopping service...")
        self.is_running = False

        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass

        await self.disconnect()

    def start_background_task(self):
        """Start the listener as a background task"""
        if self._listener_task is None or self._listener_task.done():
            self._listener_task = asyncio.create_task(self.start_listening())
            logger.info("PostgreSQL LISTEN/NOTIFY: Started as background task")
        return self._listener_task


# Global listener instance
pg_listener = PostgreSQLListener()
