"""
Azure PostgreSQL Auth Context Middleware
Sets the current user ID in PostgreSQL session for RLS policies
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
from loguru import logger

from app.core.security import decode_access_token
from app.core.database import async_session_maker


class AuthContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to set PostgreSQL session variable for current user

    This enables Row-Level Security (RLS) policies to work correctly
    by setting app.current_user_id which is read by auth.uid()
    """

    async def dispatch(self, request: Request, call_next):
        user_id: Optional[str] = None

        # Extract user ID from JWT token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)

            if payload:
                user_id = payload.get("sub")  # Subject contains user ID

        # Store user_id in request state for later use
        request.state.user_id = user_id

        # Process the request
        response = await call_next(request)

        return response


async def set_user_context(db_session, user_id: Optional[str]):
    """
    Set the current user ID in PostgreSQL session

    Args:
        db_session: AsyncSession instance
        user_id: UUID string of current user

    This allows auth.uid() function to return the current user's ID
    enabling Row-Level Security policies to filter data correctly
    """
    if user_id:
        await db_session.execute(
            f"SET LOCAL app.current_user_id = '{user_id}'"
        )
        logger.debug(f"Set PostgreSQL user context: {user_id}")
    else:
        # Clear the setting if no user
        await db_session.execute(
            "SET LOCAL app.current_user_id = ''"
        )
