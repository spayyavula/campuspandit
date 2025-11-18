"""
Video Library API Endpoints
Handles recorded sessions and video library functionality
"""
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from uuid import UUID
from typing import List, Optional
import os
import logging
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.video_library import RecordedSession, SessionView, SessionLike, RecordingType, RecordingVisibility
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# VIDEO LIBRARY ENDPOINTS
# ============================================================================

@router.get("/sessions")
async def get_recorded_sessions(
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    recording_type: Optional[RecordingType] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Browse recorded sessions
    Public endpoint - shows only public/unlisted sessions
    """

    query = select(RecordedSession).where(
        and_(
            RecordedSession.is_archived == False,
            RecordedSession.video_status == "ready",
            or_(
                RecordedSession.visibility == RecordingVisibility.PUBLIC,
                RecordedSession.visibility == RecordingVisibility.UNLISTED
            )
        )
    )

    # Filters
    if subject:
        query = query.where(RecordedSession.subject == subject)
    if grade_level:
        query = query.where(RecordedSession.grade_level == grade_level)
    if recording_type:
        query = query.where(RecordedSession.recording_type == recording_type)
    if search:
        query = query.where(
            or_(
                RecordedSession.title.ilike(f"%{search}%"),
                RecordedSession.description.ilike(f"%{search}%")
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get sessions
    query = query.order_by(RecordedSession.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    sessions = result.scalars().all()

    return {
        "sessions": sessions,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit
    }


@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id: UUID,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get session details and increment view count"""

    result = await db.execute(
        select(RecordedSession).where(RecordedSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check visibility
    if session.visibility == RecordingVisibility.PRIVATE:
        if not current_user or session.instructor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

    # Track view
    if current_user:
        view = SessionView(
            session_id=session_id,
            user_id=current_user.id
        )
        db.add(view)
        session.view_count += 1
        await db.commit()

    return session


@router.post("/sessions")
async def create_recorded_session(
    title: str,
    description: str,
    recording_type: RecordingType,
    subject: str,
    video_url: Optional[str] = None,
    grade_level: Optional[str] = None,
    board: Optional[str] = None,
    topics: Optional[List[str]] = None,
    visibility: RecordingVisibility = RecordingVisibility.PUBLIC,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a new recorded session"""

    session = RecordedSession(
        title=title,
        description=description,
        recording_type=recording_type,
        instructor_id=current_user.id,
        instructor_name=f"{current_user.first_name} {current_user.last_name}",
        subject=subject,
        grade_level=grade_level,
        board=board,
        topics=topics or [],
        visibility=visibility,
        video_url=video_url,
        video_status="ready" if video_url else "uploading"
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return session


@router.post("/sessions/{session_id}/like")
async def toggle_like(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Like/unlike a session"""

    # Check if already liked
    existing = await db.execute(
        select(SessionLike).where(
            and_(
                SessionLike.session_id == session_id,
                SessionLike.user_id == current_user.id
            )
        )
    )
    like = existing.scalar_one_or_none()

    session_result = await db.execute(
        select(RecordedSession).where(RecordedSession.id == session_id)
    )
    session = session_result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if like:
        # Unlike
        await db.delete(like)
        session.like_count = max(0, session.like_count - 1)
        await db.commit()
        return {"liked": False, "like_count": session.like_count}
    else:
        # Like
        new_like = SessionLike(
            session_id=session_id,
            user_id=current_user.id
        )
        db.add(new_like)
        session.like_count += 1
        await db.commit()
        return {"liked": True, "like_count": session.like_count}


@router.get("/my-sessions")
async def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get my uploaded recordings"""

    result = await db.execute(
        select(RecordedSession).where(
            RecordedSession.instructor_id == current_user.id
        ).order_by(RecordedSession.created_at.desc())
    )
    sessions = result.scalars().all()

    return {"sessions": sessions}


@router.post("/upload-video")
async def upload_video(
    request: Request,
    video: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a video file to cloud storage

    Supports multiple backends:
    1. Azure Blob Storage (Primary)
    2. Cloudflare Stream (Fallback)

    Returns the video URL for use in creating a session
    """
    from app.core.security import decode_access_token

    # Manually extract and validate token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    token_data = decode_access_token(token)
    if not token_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id_str = token_data.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"}
        )

    logger.info(f"Upload video endpoint called - user_id: {user_id}, filename: {video.filename}")
    from app.services.video_storage_service import video_storage_service
    from io import BytesIO

    # Validate file type
    allowed_types = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-matroska']
    if video.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Validate file size (max 500MB)
    max_size = 500 * 1024 * 1024  # 500MB
    contents = await video.read()
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 500MB"
        )

    try:
        # Create a BytesIO object from the file contents
        file_obj = BytesIO(contents)

        # Upload to storage
        result = video_storage_service.upload_video(
            video_file=file_obj,
            filename=video.filename,
            user_id=str(user_id),
            content_type=video.content_type
        )

        if not result:
            raise HTTPException(
                status_code=500,
                detail="Video upload failed. No storage backend available. Please configure Azure Blob Storage or Cloudflare Stream."
            )

        return {
            "message": "Video uploaded successfully",
            "video_url": result["video_url"],
            "storage_backend": result.get("storage_backend"),
            "size_bytes": result.get("size_bytes"),
            "uploaded_at": result.get("uploaded_at")
        }

    except Exception as e:
        logger.error(f"Error uploading video: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload video: {str(e)}"
        )
