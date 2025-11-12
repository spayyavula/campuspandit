-- AI Coaching System Database Schema
-- Tables for AI-based weak area identification, coaching sessions, and performance tracking

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE subject_enum AS ENUM (
    'physics',
    'mathematics',
    'chemistry',
    'biology',
    'computer_science',
    'english',
    'other'
);

CREATE TYPE weakness_severity_enum AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE weak_area_status_enum AS ENUM (
    'active',
    'improving',
    'resolved',
    'ignored'
);

CREATE TYPE identified_from_enum AS ENUM (
    'flashcard_accuracy',
    'tutor_session',
    'mock_test',
    'chapter_progress',
    'self_assessment',
    'ai_analysis'
);

CREATE TYPE session_type_enum AS ENUM (
    'daily',
    'weekly',
    'emergency',
    'milestone',
    'exam_prep'
);

CREATE TYPE repetition_status_enum AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'skipped',
    'rescheduled'
);

CREATE TYPE content_type_enum AS ENUM (
    'flashcards',
    'problems',
    'theory',
    'video',
    'tutor_session',
    'mixed'
);

CREATE TYPE recommendation_status_enum AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'dismissed'
);

CREATE TYPE recommendation_priority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE period_type_enum AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'all_time'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Student Weak Areas
CREATE TABLE student_weak_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject subject_enum NOT NULL,
    topic VARCHAR(255) NOT NULL,
    subtopic VARCHAR(255),
    chapter_id UUID,
    resource_id UUID,

    -- Severity and priority
    weakness_severity weakness_severity_enum NOT NULL,
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 10),

    -- Identification info
    identified_from identified_from_enum NOT NULL,
    identification_reason TEXT,

    -- Performance metrics
    current_accuracy_percentage FLOAT,
    attempts_count INTEGER DEFAULT 0,
    failures_count INTEGER DEFAULT 0,

    -- Status and progress
    status weak_area_status_enum NOT NULL DEFAULT 'active',
    times_repeated INTEGER DEFAULT 0,
    target_repetitions INTEGER DEFAULT 5,
    initial_accuracy FLOAT,
    current_improvement_percentage FLOAT,
    target_accuracy_percentage FLOAT DEFAULT 80.0,

    -- Next review
    next_review_date TIMESTAMPTZ,

    -- Notes and recommendations
    ai_recommendations JSONB,
    tutor_notes TEXT,
    student_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for student_weak_areas
CREATE INDEX idx_weak_areas_student ON student_weak_areas(student_id);
CREATE INDEX idx_weak_areas_status ON student_weak_areas(status);
CREATE INDEX idx_weak_areas_created ON student_weak_areas(created_at);
CREATE INDEX idx_weak_areas_severity ON student_weak_areas(weakness_severity);

-- AI Coaching Sessions
CREATE TABLE ai_coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session info
    session_type session_type_enum NOT NULL,
    session_focus JSONB,

    -- Weak area summary
    weak_areas_identified INTEGER DEFAULT 0,
    weak_areas_improving INTEGER DEFAULT 0,
    weak_areas_resolved INTEGER DEFAULT 0,
    new_weak_areas_found INTEGER DEFAULT 0,

    -- Performance summary
    overall_accuracy FLOAT,
    study_hours_this_week FLOAT,
    topics_studied_count INTEGER,
    flashcards_reviewed INTEGER,
    problems_solved INTEGER,

    -- AI-generated content
    recommendations JSONB,
    priority_actions JSONB,
    suggested_study_plan TEXT,
    motivational_message TEXT,

    -- Interaction
    student_viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_coaching_sessions
CREATE INDEX idx_coaching_sessions_student ON ai_coaching_sessions(student_id);
CREATE INDEX idx_coaching_sessions_created ON ai_coaching_sessions(created_at);
CREATE INDEX idx_coaching_sessions_type ON ai_coaching_sessions(session_type);

-- Repetition Schedule
CREATE TABLE repetition_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weak_area_id UUID NOT NULL REFERENCES student_weak_areas(id) ON DELETE CASCADE,

    -- Schedule info
    repetition_number INTEGER NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    scheduled_time_slot VARCHAR(50),

    -- Content to review
    content_type content_type_enum NOT NULL,
    flashcard_set_id UUID,
    problems_to_solve JSONB,
    chapters_to_review JSONB,
    estimated_duration_minutes INTEGER,

    -- Status and completion
    status repetition_status_enum NOT NULL DEFAULT 'scheduled',
    completed_at TIMESTAMPTZ,
    accuracy_achieved FLOAT,
    problems_attempted INTEGER,
    problems_solved INTEGER,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for repetition_schedule
CREATE INDEX idx_repetition_student ON repetition_schedule(student_id);
CREATE INDEX idx_repetition_weak_area ON repetition_schedule(weak_area_id);
CREATE INDEX idx_repetition_scheduled_date ON repetition_schedule(scheduled_date);
CREATE INDEX idx_repetition_status ON repetition_schedule(status);

-- Student Performance Analytics
CREATE TABLE student_performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Period info
    analysis_date TIMESTAMPTZ NOT NULL,
    period_type period_type_enum NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Activity metrics
    total_study_hours FLOAT,
    total_flashcards_reviewed INTEGER,
    total_problems_solved INTEGER,
    total_tutor_sessions INTEGER,
    average_session_rating FLOAT,

    -- Subject-wise accuracy
    physics_accuracy FLOAT,
    mathematics_accuracy FLOAT,
    chemistry_accuracy FLOAT,
    biology_accuracy FLOAT,

    -- Weak area metrics
    active_weak_areas INTEGER,
    resolved_weak_areas_this_period INTEGER,
    new_weak_areas_this_period INTEGER,

    -- Performance indicators
    overall_improvement_percentage FLOAT,
    study_consistency_score FLOAT,
    target_achievement_percentage FLOAT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for student_performance_analytics
CREATE INDEX idx_analytics_student ON student_performance_analytics(student_id);
CREATE INDEX idx_analytics_date ON student_performance_analytics(analysis_date);
CREATE INDEX idx_analytics_period ON student_performance_analytics(period_type);

-- Coaching Recommendations
CREATE TABLE coaching_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weak_area_id UUID REFERENCES student_weak_areas(id) ON DELETE SET NULL,
    coaching_session_id UUID REFERENCES ai_coaching_sessions(id) ON DELETE SET NULL,

    -- Recommendation details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_items JSONB,

    -- Priority and categorization
    priority recommendation_priority_enum NOT NULL,
    category VARCHAR(100),
    estimated_time_minutes INTEGER,

    -- Status and progress
    status recommendation_status_enum NOT NULL DEFAULT 'pending',
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),

    -- Tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    student_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for coaching_recommendations
CREATE INDEX idx_recommendations_student ON coaching_recommendations(student_id);
CREATE INDEX idx_recommendations_weak_area ON coaching_recommendations(weak_area_id);
CREATE INDEX idx_recommendations_session ON coaching_recommendations(coaching_session_id);
CREATE INDEX idx_recommendations_status ON coaching_recommendations(status);
CREATE INDEX idx_recommendations_created ON coaching_recommendations(created_at);

-- Improvement Milestones
CREATE TABLE improvement_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weak_area_id UUID REFERENCES student_weak_areas(id) ON DELETE SET NULL,

    -- Milestone info
    milestone_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Metrics
    previous_value FLOAT,
    new_value FLOAT,
    improvement_percentage FLOAT,

    -- Achievement
    achievement_date TIMESTAMPTZ NOT NULL,
    celebration_message TEXT,
    student_viewed BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for improvement_milestones
CREATE INDEX idx_milestones_student ON improvement_milestones(student_id);
CREATE INDEX idx_milestones_weak_area ON improvement_milestones(weak_area_id);
CREATE INDEX idx_milestones_date ON improvement_milestones(achievement_date);

-- AI Coaching Configuration
CREATE TABLE ai_coaching_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Schedule preferences
    daily_coaching_time VARCHAR(10),
    weekly_summary_day VARCHAR(10),

    -- Thresholds
    weak_area_threshold_percentage FLOAT DEFAULT 70.0,
    critical_threshold_percentage FLOAT DEFAULT 50.0,
    mastery_threshold_percentage FLOAT DEFAULT 80.0,

    -- Repetition settings
    default_repetition_count INTEGER DEFAULT 5,
    days_between_repetitions INTEGER DEFAULT 3,
    auto_schedule_repetitions BOOLEAN DEFAULT TRUE,

    -- Notification preferences
    notifications_enabled BOOLEAN DEFAULT TRUE,
    notification_channels JSONB,
    receive_motivation_messages BOOLEAN DEFAULT TRUE,

    -- Personalization
    coaching_tone VARCHAR(50) DEFAULT 'encouraging',
    focus_areas JSONB,
    learning_style_preference VARCHAR(50),

    -- Goals
    target_exam VARCHAR(100),
    target_exam_date TIMESTAMPTZ,
    daily_study_goal_hours FLOAT DEFAULT 2.0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ai_coaching_config
CREATE INDEX idx_coaching_config_student ON ai_coaching_config(student_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weak_areas_updated_at BEFORE UPDATE ON student_weak_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repetition_updated_at BEFORE UPDATE ON repetition_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON coaching_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_config_updated_at BEFORE UPDATE ON ai_coaching_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE student_weak_areas IS 'Tracks student weak areas identified from various sources';
COMMENT ON TABLE ai_coaching_sessions IS 'Daily/weekly AI-generated coaching sessions with insights';
COMMENT ON TABLE repetition_schedule IS 'Spaced repetition schedule for weak areas';
COMMENT ON TABLE student_performance_analytics IS 'Aggregated performance metrics over time';
COMMENT ON TABLE coaching_recommendations IS 'AI-generated personalized recommendations';
COMMENT ON TABLE improvement_milestones IS 'Tracks and celebrates student improvements';
COMMENT ON TABLE ai_coaching_config IS 'Student-specific coaching configuration and preferences';
