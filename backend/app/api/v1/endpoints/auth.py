"""
Authentication Endpoints
User signup, login, email verification, and password reset
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from uuid import UUID
from loguru import logger

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_verification_token,
    generate_reset_token,
    get_current_user
)
from app.models.user import User, EmailVerificationToken, PasswordResetToken
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    MessageResponse
)
from app.core.config import settings

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    User signup with email and password

    Creates a new user account and returns access token
    """
    try:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == request.email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        user = User(
            email=request.email,
            password_hash=hash_password(request.password),
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            role=request.role,
            is_active=True,
            is_verified=False  # Will be verified via email
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Generate email verification token
        verification_token = generate_verification_token()
        token_expires = datetime.utcnow() + timedelta(hours=24)

        email_token = EmailVerificationToken(
            user_id=user.id,
            token=verification_token,
            expires_at=token_expires
        )

        db.add(email_token)
        await db.commit()

        # TODO: Send verification email
        logger.info(f"User registered: {user.email} (verification token: {verification_token})")

        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )

        # Prepare user response
        user_response = UserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    User login with email and password

    Returns access token on successful authentication
    """
    try:
        # Find user by email
        result = await db.execute(
            select(User).where(User.email == request.email)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        # Update last login
        user.last_login_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)

        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )

        # Prepare user response
        user_response = UserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at
        )

        logger.info(f"User logged in: {user.email}")

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    request: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify user email with verification token
    """
    try:
        # Find verification token
        result = await db.execute(
            select(EmailVerificationToken).where(
                EmailVerificationToken.token == request.token
            )
        )
        token = result.scalar_one_or_none()

        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )

        # Check if token is expired
        if token.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired"
            )

        # Find and update user
        result = await db.execute(
            select(User).where(User.id == token.user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user.is_verified = True
        user.email_verified_at = datetime.utcnow()

        # Delete verification token
        await db.delete(token)
        await db.commit()

        logger.info(f"Email verified: {user.email}")

        return MessageResponse(message="Email verified successfully")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed"
        )


@router.post("/password-reset-request", response_model=MessageResponse)
async def password_reset_request(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset - sends reset token to user's email
    """
    try:
        # Find user by email
        result = await db.execute(
            select(User).where(User.email == request.email)
        )
        user = result.scalar_one_or_none()

        # Always return success to prevent email enumeration
        if not user:
            return MessageResponse(
                message="If the email exists, a password reset link has been sent"
            )

        # Generate reset token
        reset_token = generate_reset_token()
        token_expires = datetime.utcnow() + timedelta(hours=1)

        password_token = PasswordResetToken(
            user_id=user.id,
            token=reset_token,
            expires_at=token_expires
        )

        db.add(password_token)
        await db.commit()

        # TODO: Send password reset email
        logger.info(f"Password reset requested: {user.email} (token: {reset_token})")

        return MessageResponse(
            message="If the email exists, a password reset link has been sent"
        )

    except Exception as e:
        logger.error(f"Password reset request error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed"
        )


@router.post("/password-reset-confirm", response_model=MessageResponse)
async def password_reset_confirm(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """
    Confirm password reset with token and new password
    """
    try:
        # Find reset token
        result = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token == request.token,
                PasswordResetToken.used_at.is_(None)
            )
        )
        token = result.scalar_one_or_none()

        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already used reset token"
            )

        # Check if token is expired
        if token.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )

        # Find and update user
        result = await db.execute(
            select(User).where(User.id == token.user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Update password
        user.password_hash = hash_password(request.new_password)

        # Mark token as used
        token.used_at = datetime.utcnow()

        await db.commit()

        logger.info(f"Password reset completed: {user.email}")

        return MessageResponse(message="Password has been reset successfully")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirm error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: UUID = Depends(get_current_user)
):
    """
    User logout endpoint

    Logs the logout event. Token invalidation is handled client-side.
    In the future, this can be extended to implement token blacklisting.
    """
    try:
        logger.info(f"User logged out: {current_user}")

        return MessageResponse(message="Logged out successfully")

    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )
