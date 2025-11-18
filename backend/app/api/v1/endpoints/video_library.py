"""
Video Library API Endpoints
Handles recorded sessions and video library functionality
"""
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from uuid import UUID
from typing import List, Optional
import os
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.video_library import RecordedSession, SessionView, SessionLike, RecordingType, RecordingVisibility
from app.models.user import User

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
    video: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a video file
    Returns the video URL for use in creating a session
    """

    # For now, return a placeholder URL
    # TODO: Implement actual cloud storage upload (Azure Blob Storage or Cloudflare Stream)

    # Validate file type
    allowed_types = ['video/webm', 'video/mp4', 'video/quicktime']
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

    # For now, return a message that video upload is not yet configured
    # The frontend should allow users to provide video URLs instead
    return {
        "message": "Video upload received. Please use a video URL (YouTube, Vimeo, etc.) for now.",
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Placeholder
        "note": "Direct video upload coming soon! For now, please upload to YouTube/Vimeo and provide the URL."
    }
