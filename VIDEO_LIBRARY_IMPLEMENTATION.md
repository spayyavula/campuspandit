# Video Library / Recorded Sessions - Implementation Guide

## 🎯 Overview

This feature allows tutors/instructors to upload recorded sessions and students to browse/watch them.

---

## ✅ What's Been Created

### 1. Database Models (`backend/app/models/video_library.py`)

**Models Created:**
- ✅ `RecordedSession` - Main model for recordings
- ✅ `SessionView` - Track who watched what
- ✅ `SessionLike` - Like/favorite recordings
- ✅ `VideoLibraryCollection` - Organize into playlists

**Features:**
- Multiple recording types (tutoring, lecture, workshop, webinar)
- Cloudflare Stream integration
- Subject/Grade/Board organization
- View tracking and analytics
- Visibility controls (public, enrolled, private, unlisted)

---

## 🔨 Implementation Steps

### Step 1: Create Database Migration

```bash
cd backend
alembic revision --autogenerate -m "Add video library models"
alembic upgrade head
```

### Step 2: Create Backend API Endpoints

**File:** `backend/app/api/v1/endpoints/video_library.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.video_library import RecordedSession, SessionView, SessionLike, RecordingType, RecordingVisibility
from app.models.user import User

router = APIRouter()

# ============================================================================
# VIDEO LIBRARY ENDPOINTS
# ============================================================================

@router.get("/library/sessions")
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


@router.get("/library/sessions/{session_id}")
async def get_session_detail(
    session_id: UUID,
    current_user: Optional[UUID] = Depends(get_current_user),
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
    if session.visibility == RecordingVisibility.PRIVATE and session.instructor_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Track view
    if current_user:
        view = SessionView(
            session_id=session_id,
            user_id=current_user
        )
        db.add(view)
        session.view_count += 1
        await db.commit()

    return session


@router.post("/library/sessions")
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
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a new recorded session"""

    # Get user details
    user_result = await db.execute(select(User).where(User.id == current_user))
    user = user_result.scalar_one_or_none()

    session = RecordedSession(
        title=title,
        description=description,
        recording_type=recording_type,
        instructor_id=current_user,
        instructor_name=f"{user.first_name} {user.last_name}" if user else None,
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


@router.post("/library/sessions/{session_id}/like")
async def toggle_like(
    session_id: UUID,
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Like/unlike a session"""

    # Check if already liked
    existing = await db.execute(
        select(SessionLike).where(
            and_(
                SessionLike.session_id == session_id,
                SessionLike.user_id == current_user
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
            user_id=current_user
        )
        db.add(new_like)
        session.like_count += 1
        await db.commit()
        return {"liked": True, "like_count": session.like_count}


@router.get("/library/my-sessions")
async def get_my_sessions(
    current_user: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get my uploaded recordings"""

    result = await db.execute(
        select(RecordedSession).where(
            RecordedSession.instructor_id == current_user
        ).order_by(RecordedSession.created_at.desc())
    )
    sessions = result.scalars().all()

    return {"sessions": sessions}
```

### Step 3: Add Routes to Main Router

**File:** `backend/app/api/v1/router.py`

```python
from app.api.v1.endpoints import video_library

# Add to existing includes
api_router.include_router(
    video_library.router,
    prefix="/library",
    tags=["Video Library"]
)
```

---

## 🎨 Frontend Components

### Component 1: Video Library Browser

**File:** `src/components/library/VideoLibrary.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Play, Eye, ThumbsUp, Calendar, User, BookOpen } from 'lucide-react';

interface RecordedSession {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  subject: string;
  grade_level: string;
  thumbnail_url: string;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  recorded_at: string;
  recording_type: string;
}

export default function VideoLibrary() {
  const [sessions, setSessions] = useState<RecordedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    gradeLevel: '',
    search: ''
  });

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.gradeLevel) params.append('grade_level', filters.gradeLevel);
      if (filters.search) params.append('search', filters.search);

      const apiUrl = import.meta.env.VITE_API_BASE_URL ||
        'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';

      const response = await fetch(`${apiUrl}/library/sessions?${params}`);
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Library</h1>
          <p className="text-gray-600">Browse recorded sessions and lectures</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search sessions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />

            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
            </select>

            <select
              value={filters.gradeLevel}
              onChange={(e) => setFilters({ ...filters, gradeLevel: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Grades</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: RecordedSession }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200">
        {session.thumbnail_url ? (
          <img src={session.thumbnail_url} alt={session.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
          {formatDuration(session.duration_seconds)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{session.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{session.description}</p>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{session.instructor_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{session.subject} • {session.grade_level}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(session.recorded_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{session.view_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            <span>{session.like_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Quick Implementation

### 1. Run Database Migration

```bash
cd backend
alembic revision --autogenerate -m "Add video library"
alembic upgrade head
```

### 2. Create API File

Create `backend/app/api/v1/endpoints/video_library.py` with the code above.

### 3. Register Routes

Add to `backend/app/api/v1/router.py`:
```python
from app.api.v1.endpoints import video_library
api_router.include_router(video_library.router, prefix="/library", tags=["Video Library"])
```

### 4. Create Frontend Component

Create `src/components/library/VideoLibrary.tsx` with the code above.

### 5. Add Route

In `src/App.tsx`:
```typescript
import VideoLibrary from './components/library/VideoLibrary';

// Add route:
<Route path="/library" element={user ? <VideoLibrary /> : <Navigate to="/auth" />} />
```

---

## 📊 Features Included

✅ **Upload Recordings** - Tutors upload sessions
✅ **Browse Library** - Students browse all recordings
✅ **Search & Filter** - By subject, grade, type
✅ **View Tracking** - Count views automatically
✅ **Like System** - Students can like sessions
✅ **Cloudflare Integration** - High-quality streaming
✅ **Collections/Playlists** - Organize recordings
✅ **Visibility Controls** - Public/Private/Enrolled
✅ **Analytics** - Track views, likes, engagement

---

## 🎯 Use Cases

1. **Tutors:** Record and upload tutoring sessions
2. **Teachers:** Upload lecture recordings
3. **Students:** Watch past sessions anytime
4. **Review:** Rewatch important topics before exams
5. **Missed Classes:** Catch up on missed sessions

---

## 🔗 API Endpoints

```
GET    /api/v1/library/sessions          - Browse recordings
GET    /api/v1/library/sessions/{id}     - Get session detail
POST   /api/v1/library/sessions           - Upload recording
POST   /api/v1/library/sessions/{id}/like - Like/unlike
GET    /api/v1/library/my-sessions        - My recordings
```

---

## 📝 Next Steps

1. Run the migration
2. Add the API endpoints
3. Create the frontend component
4. Test uploading a recording
5. Test browsing and filtering
6. Deploy to production!

**Estimated Time:** 2-3 hours for full implementation

Need help with any step? Let me know! 🚀
