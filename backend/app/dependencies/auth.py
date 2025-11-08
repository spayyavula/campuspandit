"""
Authentication Dependencies
FastAPI dependencies for user authentication and authorization
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.middleware.auth_context import set_user_context


security = HTTPBearer()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    Also sets PostgreSQL session variable for RLS policies

    Usage:
        @app.get("/profile")
        async def get_profile(user: User = Depends(get_current_user)):
            return {"email": user.email}
    """
    token = credentials.credentials

    # Decode JWT token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user ID from token
    user_id_str: str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Set PostgreSQL session variable for RLS
    await set_user_context(db, user_id_str)

    # Fetch user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (alias for clarity)
    """
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user that has verified their email
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return current_user


def require_role(*allowed_roles: str):
    """
    Dependency factory for role-based access control

    Usage:
        @app.get("/admin/dashboard")
        async def admin_dashboard(
            user: User = Depends(require_role("admin"))
        ):
            return {"message": "Admin dashboard"}

    Args:
        *allowed_roles: One or more role names (e.g., "admin", "tutor", "student")

    Returns:
        FastAPI dependency function
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


# Convenience dependencies for common roles
async def require_admin(user: User = Depends(require_role("admin"))) -> User:
    """Require admin role"""
    return user


async def require_tutor(user: User = Depends(require_role("tutor", "admin"))) -> User:
    """Require tutor or admin role"""
    return user


async def require_student(user: User = Depends(require_role("student", "admin"))) -> User:
    """Require student or admin role"""
    return user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise
    Useful for endpoints that work for both authenticated and anonymous users

    Usage:
        @app.get("/posts")
        async def get_posts(user: Optional[User] = Depends(get_optional_user)):
            if user:
                # Show personalized posts
            else:
                # Show public posts
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)

    if not payload:
        return None

    user_id_str = payload.get("sub")
    if not user_id_str:
        return None

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        return None

    # Set PostgreSQL session variable for RLS (even for optional user)
    await set_user_context(db, user_id_str)

    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)
    )

    return result.scalar_one_or_none()
