-- Video Library Tables Migration
-- Creates tables for recorded sessions, views, likes, and collections

-- Recorded Sessions Table
CREATE TABLE IF NOT EXISTS recorded_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recording_type VARCHAR(50) NOT NULL DEFAULT 'tutoring_session',

    -- Instructor/Tutor
    instructor_id UUID NOT NULL REFERENCES users(id),
    instructor_name VARCHAR(255),

    -- Video Details
    video_provider VARCHAR(50) DEFAULT 'cloudflare',
    video_id VARCHAR(255),
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    duration_seconds INTEGER,
    video_status VARCHAR(50) DEFAULT 'uploading',

    -- Organization & Categorization
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    board VARCHAR(50),
    topics TEXT[],
    tags TEXT[],

    -- Related Course/Session
    course_id UUID REFERENCES courses(id),
    tutoring_session_id UUID REFERENCES tutoring_sessions(id),

    -- Visibility & Access
    visibility VARCHAR(50) DEFAULT 'enrolled',
    is_featured BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Metadata
    recorded_at TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Engagement Metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,

    -- Additional Resources
    attachments JSONB,
    transcript_url VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for recorded_sessions
CREATE INDEX IF NOT EXISTS idx_recorded_sessions_title ON recorded_sessions(title);
CREATE INDEX IF NOT EXISTS idx_recorded_sessions_instructor_id ON recorded_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_recorded_sessions_subject ON recorded_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_recorded_sessions_created_at ON recorded_sessions(created_at);


-- Session Views Table
CREATE TABLE IF NOT EXISTS session_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES recorded_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    -- Watch Progress
    watch_duration_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,

    -- Context
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    referrer VARCHAR(500),

    -- Timestamps
    first_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for session_views
CREATE INDEX IF NOT EXISTS idx_session_views_session_id ON session_views(session_id);
CREATE INDEX IF NOT EXISTS idx_session_views_user_id ON session_views(user_id);


-- Session Likes Table
CREATE TABLE IF NOT EXISTS session_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES recorded_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure a user can only like a session once
    UNIQUE(session_id, user_id)
);

-- Indexes for session_likes
CREATE INDEX IF NOT EXISTS idx_session_likes_session_id ON session_likes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_likes_user_id ON session_likes(user_id);


-- Video Library Collections Table
CREATE TABLE IF NOT EXISTS video_library_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Collection Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),

    -- Owner
    created_by UUID NOT NULL REFERENCES users(id),

    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,

    -- Recordings
    recording_ids UUID[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for video_library_collections
CREATE INDEX IF NOT EXISTS idx_video_library_collections_created_by ON video_library_collections(created_by);
