"""
Security Utilities
Password hashing and JWT token management
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import secrets

from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token

    Args:
        data: Dictionary containing claims to encode
        expires_delta: Optional expiration time delta

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT access token

    Args:
        token: JWT token string

    Returns:
        Dictionary containing decoded claims or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def generate_verification_token() -> str:
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Dependency to get the current authenticated user from JWT token

    NOTE: This function returns user_id as UUID. The route should fetch the full User object from database.

    Args:
        credentials: HTTP Bearer credentials from request

    Returns:
        User ID as UUID if authenticated

    Raises:
        HTTPException: If authentication fails
    """
    from loguru import logger

    logger.debug(f"get_current_user called - has credentials: {credentials is not None}")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode the JWT token
    token_data = decode_access_token(credentials.credentials)
    if token_data is None:
        logger.warning("Failed to decode JWT token")
        raise credentials_exception

    user_id: str = token_data.get("sub")
    if user_id is None:
        logger.warning("No 'sub' in JWT token")
        raise credentials_exception

    # Return user ID
    try:
        uuid_result = UUID(user_id)
        logger.debug(f"Successfully authenticated user: {uuid_result}")
        return uuid_result
    except ValueError:
        logger.warning(f"Invalid UUID format: {user_id}")
        raise credentials_exception
