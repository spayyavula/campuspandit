-- AI-Based Coaching & Feedback System Schema
-- Identifies weak areas, manages repetition, and provides personalized coaching

-- =====================================================
-- 1. STUDENT WEAK AREAS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_weak_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Weak Area Identification
    subject TEXT NOT NULL CHECK (subject IN ('physics', 'mathematics', 'chemistry', 'biology', 'computer_science', 'english', 'other')),
    topic TEXT NOT NULL,
    subtopic TEXT,
    chapter_id UUID REFERENCES resource_chapters(id) ON DELETE SET NULL,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,

    -- Severity & Priority
    weakness_severity TEXT DEFAULT 'medium' CHECK (weakness_severity IN ('low', 'medium', 'high', 'critical')),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1 = highest priority

    -- Source of Identification
    identified_from TEXT CHECK (identified_from IN ('flashcard_accuracy', 'tutor_session', 'mock_test', 'chapter_progress', 'self_assessment', 'ai_analysis')),
    identification_reason TEXT,

    -- Performance Metrics
    current_accuracy_percentage DECIMAL(5,2),
    attempts_count INTEGER DEFAULT 0,
    failures_count INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,

    -- Status & Progress
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'improving', 'resolved', 'ignored')),
    times_repeated INTEGER DEFAULT 0,
    target_repetitions INTEGER DEFAULT 5,

    -- Improvement Tracking
    initial_accuracy DECIMAL(5,2),
    current_improvement_percentage DECIMAL(5,2),
    target_accuracy_percentage DECIMAL(5,2) DEFAULT 85.0,

    -- Dates
    first_identified_at TIMESTAMPTZ DEFAULT NOW(),
    last_attempted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    next_review_date DATE,

    -- Coaching Notes
    ai_recommendations TEXT[],
    tutor_notes TEXT,
    student_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, subject, topic, subtopic)
);

-- =====================================================
-- 2. AI COACHING SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Session Details
    session_type TEXT DEFAULT 'daily' CHECK (session_type IN ('daily', 'weekly', 'emergency', 'milestone', 'exam_prep')),
    session_focus TEXT[], -- ['weak_area_review', 'progress_check', 'motivation', 'strategy']

    -- Analysis Results
    weak_areas_identified INTEGER DEFAULT 0,
    weak_areas_improving INTEGER DEFAULT 0,
    weak_areas_resolved INTEGER DEFAULT 0,
    new_weak_areas_found INTEGER DEFAULT 0,

    -- Performance Summary
    overall_accuracy DECIMAL(5,2),
    study_hours_this_week DECIMAL(5,2),
    topics_studied_count INTEGER,
    flashcards_reviewed INTEGER,
    problems_solved INTEGER,

    -- AI Recommendations
    recommendations JSONB, -- Structured recommendations
    priority_actions TEXT[],
    suggested_study_plan TEXT,
    motivational_message TEXT,

    -- Engagement
    student_viewed BOOLEAN DEFAULT false,
    student_feedback_rating INTEGER CHECK (student_feedback_rating BETWEEN 1 AND 5),
    student_feedback_text TEXT,
    actions_taken TEXT[],

    -- Scheduling
    created_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- =====================================================
-- 3. REPETITION SCHEDULE
-- =====================================================

CREATE TABLE IF NOT EXISTS repetition_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    weak_area_id UUID REFERENCES student_weak_areas(id) ON DELETE CASCADE NOT NULL,

    -- Schedule Details
    repetition_number INTEGER NOT NULL, -- 1st, 2nd, 3rd repetition
    scheduled_date DATE NOT NULL,
    scheduled_time_slot TEXT, -- 'morning', 'afternoon', 'evening', 'night'

    -- Content to Review
    content_type TEXT CHECK (content_type IN ('flashcards', 'problems', 'theory', 'video', 'tutor_session', 'mixed')),
    flashcard_set_id UUID REFERENCES flashcard_sets(id) ON DELETE SET NULL,
    problems_to_solve TEXT[],
    chapters_to_review UUID[],
    estimated_duration_minutes INTEGER,

    -- Completion Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped', 'rescheduled')),
    completed_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER,

    -- Performance
    accuracy_achieved DECIMAL(5,2),
    problems_attempted INTEGER,
    problems_solved INTEGER,
    notes TEXT,

    -- Reminders
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. PERFORMANCE ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    analysis_date DATE NOT NULL,

    -- Time Period
    period_type TEXT DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Overall Metrics
    total_study_hours DECIMAL(6,2),
    total_flashcards_reviewed INTEGER,
    total_problems_solved INTEGER,
    total_tutor_sessions INTEGER,
    average_session_rating DECIMAL(3,2),

    -- Subject-wise Performance
    physics_accuracy DECIMAL(5,2),
    mathematics_accuracy DECIMAL(5,2),
    chemistry_accuracy DECIMAL(5,2),
    biology_accuracy DECIMAL(5,2),

    -- Weak Areas Summary
    active_weak_areas INTEGER,
    resolved_weak_areas_this_period INTEGER,
    new_weak_areas_this_period INTEGER,

    -- Progress Indicators
    overall_improvement_percentage DECIMAL(5,2),
    study_consistency_score INTEGER CHECK (study_consistency_score BETWEEN 0 AND 100),
    target_achievement_percentage DECIMAL(5,2),

    -- Strengths & Weaknesses
    strongest_topics TEXT[],
    weakest_topics TEXT[],
    most_improved_topics TEXT[],
    needs_attention_topics TEXT[],

    -- Study Patterns
    preferred_study_time TEXT,
    average_session_duration_minutes INTEGER,
    study_streak_days INTEGER,
    days_studied_this_period INTEGER,

    -- Predictions & Insights
    predicted_exam_readiness DECIMAL(5,2),
    estimated_weeks_to_target DECIMAL(4,1),
    ai_insights JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, analysis_date, period_type)
);

-- =====================================================
-- 5. COACHING RECOMMENDATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS coaching_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    coaching_session_id UUID REFERENCES ai_coaching_sessions(id) ON DELETE CASCADE,

    -- Recommendation Details
    recommendation_type TEXT CHECK (recommendation_type IN ('study_plan', 'resource', 'tutor_session', 'practice', 'revision', 'break', 'motivation')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT, -- Why this recommendation is made

    -- Target
    subject TEXT,
    topics TEXT[],
    weak_area_id UUID REFERENCES student_weak_areas(id) ON DELETE SET NULL,

    -- Action Items
    action_steps TEXT[],
    estimated_time_hours DECIMAL(4,1),
    suggested_deadline DATE,

    -- Resources
    recommended_resources JSONB, -- {textbooks, videos, flashcards, etc.}
    tutor_required BOOLEAN DEFAULT false,
    tutor_specialization TEXT,

    -- Tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
    student_response TEXT,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Effectiveness
    was_helpful BOOLEAN,
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
    outcome_notes TEXT,

    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ
);

-- =====================================================
-- 6. IMPROVEMENT TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS improvement_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    weak_area_id UUID REFERENCES student_weak_areas(id) ON DELETE CASCADE,

    -- Milestone Details
    milestone_type TEXT CHECK (milestone_type IN ('first_improvement', 'consistency', 'target_reached', 'mastery', 'streak')),
    title TEXT NOT NULL,
    description TEXT,

    -- Metrics
    metric_name TEXT, -- 'accuracy', 'speed', 'consistency'
    previous_value DECIMAL(7,2),
    current_value DECIMAL(7,2),
    improvement_percentage DECIMAL(5,2),

    -- Achievement
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    celebration_message TEXT,
    badge_earned TEXT,
    points_awarded INTEGER DEFAULT 0,

    -- Visibility
    is_public BOOLEAN DEFAULT false,
    shared_with_tutor BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. STUDY REMINDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS study_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Reminder Details
    reminder_type TEXT CHECK (reminder_type IN ('weak_area_review', 'repetition_due', 'daily_goal', 'tutor_session', 'mock_test', 'custom')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Association
    weak_area_id UUID REFERENCES student_weak_areas(id) ON DELETE CASCADE,
    repetition_schedule_id UUID REFERENCES repetition_schedule(id) ON DELETE CASCADE,
    coaching_recommendation_id UUID REFERENCES coaching_recommendations(id) ON DELETE CASCADE,

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,

    -- Delivery
    delivery_channels TEXT[] DEFAULT ARRAY['in_app'], -- ['in_app', 'email', 'sms', 'push']
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),

    -- Response
    was_seen BOOLEAN DEFAULT false,
    seen_at TIMESTAMPTZ,
    action_taken BOOLEAN DEFAULT false,
    action_taken_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. AI COACHING CONFIG
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_coaching_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Preferences
    coaching_enabled BOOLEAN DEFAULT true,
    daily_coaching_time TIME DEFAULT '09:00:00',
    weekly_summary_day INTEGER DEFAULT 0 CHECK (weekly_summary_day BETWEEN 0 AND 6), -- 0 = Sunday

    -- Sensitivity Settings
    weak_area_threshold DECIMAL(5,2) DEFAULT 70.0, -- Below this is considered weak
    critical_threshold DECIMAL(5,2) DEFAULT 50.0, -- Below this is critical
    mastery_threshold DECIMAL(5,2) DEFAULT 85.0, -- Above this is mastered

    -- Repetition Settings
    default_repetition_count INTEGER DEFAULT 5,
    days_between_repetitions INTEGER DEFAULT 3,
    auto_schedule_repetitions BOOLEAN DEFAULT true,

    -- Notification Preferences
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_channels TEXT[] DEFAULT ARRAY['in_app', 'email'],
    motivation_messages_enabled BOOLEAN DEFAULT true,

    -- AI Personalization
    coaching_tone TEXT DEFAULT 'encouraging' CHECK (coaching_tone IN ('professional', 'encouraging', 'strict', 'friendly')),
    focus_areas TEXT[], -- Specific areas student wants to prioritize
    learning_style TEXT, -- 'visual', 'auditory', 'kinesthetic', 'reading_writing'

    -- Goals
    target_exam TEXT,
    target_exam_date DATE,
    daily_study_goal_hours DECIMAL(3,1) DEFAULT 4.0,
    weekly_study_goal_hours DECIMAL(4,1) DEFAULT 25.0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_weak_areas_student_id ON student_weak_areas(student_id);
CREATE INDEX IF NOT EXISTS idx_weak_areas_status ON student_weak_areas(status);
CREATE INDEX IF NOT EXISTS idx_weak_areas_subject ON student_weak_areas(subject);
CREATE INDEX IF NOT EXISTS idx_weak_areas_priority ON student_weak_areas(priority);
CREATE INDEX IF NOT EXISTS idx_weak_areas_next_review ON student_weak_areas(next_review_date);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_student_id ON ai_coaching_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_created ON ai_coaching_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_repetition_schedule_student_id ON repetition_schedule(student_id);
CREATE INDEX IF NOT EXISTS idx_repetition_schedule_date ON repetition_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_repetition_schedule_status ON repetition_schedule(status);

CREATE INDEX IF NOT EXISTS idx_performance_analytics_student_id ON student_performance_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_date ON student_performance_analytics(analysis_date);

CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_student_id ON coaching_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_status ON coaching_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_improvement_milestones_student_id ON improvement_milestones(student_id);

CREATE INDEX IF NOT EXISTS idx_study_reminders_student_id ON study_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_study_reminders_scheduled ON study_reminders(scheduled_for);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update weak area status based on improvement
CREATE OR REPLACE FUNCTION update_weak_area_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_accuracy_percentage IS NOT NULL AND NEW.target_accuracy_percentage IS NOT NULL THEN
        IF NEW.current_accuracy_percentage >= NEW.target_accuracy_percentage THEN
            NEW.status = 'resolved';
            NEW.resolved_at = NOW();
        ELSIF NEW.current_accuracy_percentage > NEW.initial_accuracy + 10 THEN
            NEW.status = 'improving';
        END IF;

        -- Calculate improvement percentage
        IF NEW.initial_accuracy > 0 THEN
            NEW.current_improvement_percentage =
                ((NEW.current_accuracy_percentage - NEW.initial_accuracy) / NEW.initial_accuracy) * 100;
        END IF;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weak_area_status_trigger
    BEFORE UPDATE ON student_weak_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_weak_area_status();

-- Auto-update timestamps
CREATE TRIGGER update_weak_areas_updated_at BEFORE UPDATE ON student_weak_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repetition_schedule_updated_at BEFORE UPDATE ON repetition_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_config_updated_at BEFORE UPDATE ON ai_coaching_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE student_weak_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE repetition_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coaching_config ENABLE ROW LEVEL SECURITY;

-- Students can manage their own data
CREATE POLICY "Students can manage own weak areas"
    ON student_weak_areas FOR ALL
    USING (auth.uid() = student_id);

CREATE POLICY "Students can view own coaching sessions"
    ON ai_coaching_sessions FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can manage own repetition schedule"
    ON repetition_schedule FOR ALL
    USING (auth.uid() = student_id);

CREATE POLICY "Students can view own analytics"
    ON student_performance_analytics FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can manage own coaching recommendations"
    ON coaching_recommendations FOR ALL
    USING (auth.uid() = student_id);

CREATE POLICY "Students can view own improvement milestones"
    ON improvement_milestones FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can manage own reminders"
    ON study_reminders FOR ALL
    USING (auth.uid() = student_id);

CREATE POLICY "Students can manage own coaching config"
    ON ai_coaching_config FOR ALL
    USING (auth.uid() = student_id);

-- Tutors can view their students' weak areas (if there's an active tutoring relationship)
CREATE POLICY "Tutors can view student weak areas"
    ON student_weak_areas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tutoring_sessions ts
            JOIN tutor_profiles tp ON ts.tutor_id = tp.id
            WHERE ts.student_id = student_weak_areas.student_id
            AND tp.user_id = auth.uid()
            AND ts.status IN ('scheduled', 'in_progress', 'completed')
        )
    );

-- Admin policies
CREATE POLICY "Admins can manage all coaching data"
    ON student_weak_areas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for student coaching dashboard
CREATE OR REPLACE VIEW student_coaching_dashboard AS
SELECT
    s.id as student_id,
    s.email,

    -- Weak Areas Summary
    COUNT(DISTINCT wa.id) FILTER (WHERE wa.status = 'active') as active_weak_areas,
    COUNT(DISTINCT wa.id) FILTER (WHERE wa.status = 'improving') as improving_areas,
    COUNT(DISTINCT wa.id) FILTER (WHERE wa.status = 'resolved') as resolved_areas,

    -- This Week's Progress
    COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'completed' AND rs.completed_at >= NOW() - INTERVAL '7 days') as repetitions_completed_this_week,
    COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'scheduled' AND rs.scheduled_date <= CURRENT_DATE + INTERVAL '7 days') as upcoming_repetitions,

    -- Latest Coaching Session
    (SELECT created_at FROM ai_coaching_sessions WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1) as last_coaching_session,

    -- Study Consistency
    (SELECT study_streak_days FROM student_performance_analytics
     WHERE student_id = s.id AND period_type = 'weekly'
     ORDER BY analysis_date DESC LIMIT 1) as current_study_streak,

    -- Overall Improvement
    (SELECT overall_improvement_percentage FROM student_performance_analytics
     WHERE student_id = s.id AND period_type = 'monthly'
     ORDER BY analysis_date DESC LIMIT 1) as monthly_improvement

FROM auth.users s
LEFT JOIN student_weak_areas wa ON wa.student_id = s.id
LEFT JOIN repetition_schedule rs ON rs.student_id = s.id
GROUP BY s.id, s.email;

-- Comments
COMMENT ON TABLE student_weak_areas IS 'Tracks identified weak areas for students based on performance analytics';
COMMENT ON TABLE ai_coaching_sessions IS 'AI-generated coaching sessions with recommendations and insights';
COMMENT ON TABLE repetition_schedule IS 'Manages scheduled repetitions for weak areas to ensure mastery';
COMMENT ON TABLE student_performance_analytics IS 'Aggregated performance analytics for coaching insights';
COMMENT ON TABLE coaching_recommendations IS 'Personalized recommendations generated by AI coach';
COMMENT ON TABLE improvement_milestones IS 'Tracks improvement milestones and achievements';
COMMENT ON TABLE ai_coaching_config IS 'Student preferences and configuration for AI coaching';
-- Messaging System Schema (Slack-like)
-- Real-time chat system for tutors and students

-- =====================================================
-- 1. CHANNELS (Similar to Slack channels)
-- =====================================================

CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Channel Details
    name TEXT NOT NULL,
    description TEXT,
    channel_type TEXT DEFAULT 'group' CHECK (channel_type IN ('direct', 'group', 'tutor_student', 'class', 'subject')),

    -- Privacy
    is_private BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,

    -- Creator
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Related Entities
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
    subject TEXT,
    topic TEXT,

    -- Channel Settings
    allow_threads BOOLEAN DEFAULT true,
    allow_reactions BOOLEAN DEFAULT true,
    allow_file_sharing BOOLEAN DEFAULT true,

    -- Metadata
    member_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique channel names for group channels
    UNIQUE(name, channel_type)
);

-- =====================================================
-- 2. CHANNEL MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Role in channel
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),

    -- Notification Settings
    notifications_enabled BOOLEAN DEFAULT true,
    notification_level TEXT DEFAULT 'all' CHECK (notification_level IN ('all', 'mentions', 'none')),

    -- Status
    is_muted BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,

    -- Read Status
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(channel_id, user_id)
);

-- =====================================================
-- 3. MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Message Content
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video', 'audio', 'code', 'system')),

    -- Threading (like Slack threads)
    parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    thread_reply_count INTEGER DEFAULT 0,
    thread_last_reply_at TIMESTAMPTZ,

    -- Mentions & Links
    mentioned_user_ids UUID[],
    contains_link BOOLEAN DEFAULT false,
    links TEXT[],

    -- Files (if message_type is 'file', 'image', etc.)
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER, -- in bytes

    -- Status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT false,
    pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pinned_at TIMESTAMPTZ,

    -- Reactions
    reaction_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. MESSAGE REACTIONS (Like Slack emoji reactions)
-- =====================================================

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Reaction
    emoji TEXT NOT NULL, -- e.g., '👍', '❤️', '😊', etc.

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(message_id, user_id, emoji)
);

-- =====================================================
-- 5. DIRECT MESSAGES (1-on-1 conversations)
-- =====================================================

CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,

    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- =====================================================
-- 6. TYPING INDICATORS (Real-time)
-- =====================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    started_typing_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 seconds'),

    UNIQUE(channel_id, user_id)
);

-- =====================================================
-- 7. MESSAGE READ RECEIPTS
-- =====================================================

CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,

    read_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(message_id, user_id)
);

-- =====================================================
-- 8. CHANNEL INVITATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS channel_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),

    invited_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,

    UNIQUE(channel_id, invited_user_id)
);

-- =====================================================
-- 9. SAVED MESSAGES (Bookmarks)
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,

    note TEXT, -- Optional note about why saved

    saved_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, message_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channels_tutor_id ON channels(tutor_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channels_archived ON channels(is_archived);

CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_unread ON channel_members(user_id, unread_count);

CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON messages(channel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel_id ON typing_indicators(channel_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user_id ON message_read_receipts(user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update channel member count
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE channels
    SET member_count = (
        SELECT COUNT(*) FROM channel_members WHERE channel_id = COALESCE(NEW.channel_id, OLD.channel_id)
    )
    WHERE id = COALESCE(NEW.channel_id, OLD.channel_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_channel_member_count_on_insert
    AFTER INSERT ON channel_members
    FOR EACH ROW EXECUTE FUNCTION update_channel_member_count();

CREATE TRIGGER update_channel_member_count_on_delete
    AFTER DELETE ON channel_members
    FOR EACH ROW EXECUTE FUNCTION update_channel_member_count();

-- Update channel message count and last message time
CREATE OR REPLACE FUNCTION update_channel_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE channels
    SET
        message_count = (SELECT COUNT(*) FROM messages WHERE channel_id = NEW.channel_id AND is_deleted = false),
        last_message_at = NEW.created_at
    WHERE id = NEW.channel_id;

    -- Update thread reply count if this is a reply
    IF NEW.parent_message_id IS NOT NULL THEN
        UPDATE messages
        SET
            thread_reply_count = thread_reply_count + 1,
            thread_last_reply_at = NEW.created_at
        WHERE id = NEW.parent_message_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_channel_message_stats_on_insert
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_channel_message_stats();

-- Update unread counts
CREATE OR REPLACE FUNCTION update_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE channel_members
    SET unread_count = unread_count + 1
    WHERE channel_id = NEW.channel_id
    AND user_id != NEW.user_id
    AND last_read_at < NEW.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unread_counts_on_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_unread_counts();

-- Update reaction count
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE messages
    SET reaction_count = (
        SELECT COUNT(*) FROM message_reactions WHERE message_id = COALESCE(NEW.message_id, OLD.message_id)
    )
    WHERE id = COALESCE(NEW.message_id, OLD.message_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reaction_count_on_add
    AFTER INSERT ON message_reactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

CREATE TRIGGER update_reaction_count_on_remove
    AFTER DELETE ON message_reactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

-- Auto-update timestamps
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_messages ENABLE ROW LEVEL SECURITY;

-- Users can view channels they are members of
CREATE POLICY "Users can view their channels"
    ON channels FOR SELECT
    USING (
        NOT is_private
        OR id IN (
            SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
        )
    );

-- Channel owners/admins can update channels
CREATE POLICY "Channel owners can update"
    ON channels FOR UPDATE
    USING (
        created_by = auth.uid()
        OR id IN (
            SELECT channel_id FROM channel_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Users can create channels
CREATE POLICY "Users can create channels"
    ON channels FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Channel members policies
CREATE POLICY "Users can view channel members"
    ON channel_members FOR SELECT
    USING (
        channel_id IN (
            SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join channels"
    ON channel_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave channels"
    ON channel_members FOR DELETE
    USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their channels"
    ON messages FOR SELECT
    USING (
        channel_id IN (
            SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their channels"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND channel_id IN (
            SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
    ON messages FOR DELETE
    USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Users can view reactions"
    ON message_reactions FOR SELECT
    USING (
        message_id IN (
            SELECT id FROM messages WHERE channel_id IN (
                SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can add reactions"
    ON message_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
    ON message_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- Other policies
CREATE POLICY "Users can view their DMs"
    ON direct_messages FOR SELECT
    USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "Users can manage typing indicators"
    ON typing_indicators FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their read receipts"
    ON message_read_receipts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view invitations"
    ON channel_invitations FOR SELECT
    USING (auth.uid() IN (invited_by, invited_user_id));

CREATE POLICY "Users can manage their saved messages"
    ON saved_messages FOR ALL
    USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can manage all"
    ON channels FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VIEWS
-- =====================================================

-- View for user's channels with unread counts
CREATE OR REPLACE VIEW user_channels_with_unread AS
SELECT
    c.id,
    c.name,
    c.description,
    c.channel_type,
    c.is_private,
    c.member_count,
    c.message_count,
    c.last_message_at,
    cm.role,
    cm.unread_count,
    cm.is_starred,
    cm.is_muted,
    cm.last_viewed_at
FROM channels c
JOIN channel_members cm ON c.id = cm.channel_id
WHERE NOT c.is_archived
ORDER BY cm.is_starred DESC, c.last_message_at DESC NULLS LAST;

-- Comments
COMMENT ON TABLE channels IS 'Channels for group or direct messaging, similar to Slack';
COMMENT ON TABLE messages IS 'Individual messages with support for threads and reactions';
COMMENT ON TABLE channel_members IS 'Members of each channel with notification preferences';
COMMENT ON TABLE message_reactions IS 'Emoji reactions to messages';
-- CRM System Schema - Minimalistic Design
-- Sales, Post-Sales/Service, and Marketing Modules
-- Following Zerodha's clean, simple approach

-- =====================================================
-- 1. CONTACTS (Leads & Customers)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    mobile TEXT,

    -- Contact Type
    contact_type TEXT DEFAULT 'lead' CHECK (contact_type IN ('lead', 'customer', 'partner', 'vendor')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'customer', 'inactive')),

    -- Company Info
    company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
    job_title TEXT,
    department TEXT,

    -- Lead Source
    source TEXT CHECK (source IN ('website', 'referral', 'cold_call', 'email_campaign', 'social_media', 'event', 'partner', 'other')),
    source_details TEXT,

    -- Qualification
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    qualification_notes TEXT,

    -- Assignment
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- Social & Web
    linkedin_url TEXT,
    twitter_handle TEXT,
    website TEXT,

    -- Address
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',

    -- Preferences
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'sms')),
    timezone TEXT DEFAULT 'Asia/Kolkata',
    language TEXT DEFAULT 'en',

    -- Marketing
    email_opted_in BOOLEAN DEFAULT true,
    sms_opted_in BOOLEAN DEFAULT false,
    whatsapp_opted_in BOOLEAN DEFAULT false,
    do_not_contact BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    last_contacted_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Search
    search_vector tsvector
);

-- =====================================================
-- 2. COMPANIES/ORGANIZATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    legal_name TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,

    -- Business Info
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    annual_revenue DECIMAL(15, 2),
    employee_count INTEGER,

    -- Status
    status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'customer', 'partner', 'inactive')),
    customer_since DATE,

    -- Address
    billing_street TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_postal_code TEXT,
    billing_country TEXT DEFAULT 'India',

    shipping_street TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_postal_code TEXT,
    shipping_country TEXT DEFAULT 'India',

    -- Social
    linkedin_url TEXT,
    twitter_handle TEXT,
    facebook_url TEXT,

    -- Assignment
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Parent Company
    parent_company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,

    -- Tax Info
    tax_id TEXT,
    gst_number TEXT,
    pan_number TEXT,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 3. DEALS/OPPORTUNITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Financial
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    expected_revenue DECIMAL(15, 2),

    -- Pipeline
    stage TEXT DEFAULT 'prospecting' CHECK (stage IN (
        'prospecting',      -- Initial contact
        'qualification',    -- Qualifying the lead
        'proposal',         -- Proposal sent
        'negotiation',      -- Negotiating terms
        'closed_won',       -- Deal won
        'closed_lost'       -- Deal lost
    )),
    probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),

    -- Timeline
    expected_close_date DATE,
    actual_close_date DATE,
    closed_reason TEXT,

    -- Competition
    competitors TEXT[],

    -- Products/Services
    products JSONB DEFAULT '[]', -- Array of {product_id, quantity, price}

    -- Status
    is_closed BOOLEAN DEFAULT false,
    is_won BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    next_step TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 4. ACTIVITIES (Calls, Emails, Meetings)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Activity Type
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'call',
        'email',
        'meeting',
        'task',
        'note',
        'sms',
        'whatsapp',
        'linkedin_message'
    )),

    -- Basic Info
    subject TEXT NOT NULL,
    description TEXT,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),

    -- Call-specific
    call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
    call_outcome TEXT CHECK (call_outcome IN ('connected', 'no_answer', 'voicemail', 'busy', 'wrong_number')),

    -- Meeting-specific
    meeting_location TEXT,
    meeting_link TEXT,
    attendees TEXT[], -- Array of contact IDs or emails

    -- Email-specific
    email_thread_id TEXT,
    email_from TEXT,
    email_to TEXT[],
    email_cc TEXT[],
    email_opened BOOLEAN DEFAULT false,
    email_clicked BOOLEAN DEFAULT false,

    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_date DATE,

    -- Metadata
    tags TEXT[],
    attachments JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 5. TASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Priority & Status
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),

    -- Timeline
    due_date DATE,
    due_time TIME,
    completed_at TIMESTAMPTZ,

    -- Reminders
    remind_at TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[],

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 6. NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    title TEXT,
    content TEXT NOT NULL,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,

    -- Visibility
    is_pinned BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[],
    attachments JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 7. MARKETING CAMPAIGNS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,

    -- Campaign Type
    campaign_type TEXT NOT NULL CHECK (campaign_type IN (
        'email',
        'sms',
        'social_media',
        'webinar',
        'event',
        'content',
        'paid_ads'
    )),

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),

    -- Timeline
    start_date DATE,
    end_date DATE,

    -- Budget
    budget DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',

    -- Target Audience
    target_segment TEXT,
    target_filters JSONB DEFAULT '{}',
    estimated_reach INTEGER,

    -- Goals
    primary_goal TEXT CHECK (primary_goal IN ('awareness', 'engagement', 'lead_generation', 'conversion', 'retention')),
    target_leads INTEGER,
    target_conversions INTEGER,

    -- Performance
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_leads INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,

    -- Email Campaign Specific
    email_subject TEXT,
    email_content TEXT,
    email_template_id UUID,

    -- Metadata
    tags TEXT[],
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 8. CAMPAIGN MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_campaign_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE NOT NULL,

    -- Status
    status TEXT DEFAULT 'added' CHECK (status IN (
        'added',
        'sent',
        'delivered',
        'opened',
        'clicked',
        'responded',
        'bounced',
        'unsubscribed'
    )),

    -- Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,

    -- Response
    response_type TEXT CHECK (response_type IN ('positive', 'negative', 'neutral')),
    response_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(campaign_id, contact_id)
);

-- =====================================================
-- 9. SERVICE TICKETS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ticket Number
    ticket_number SERIAL,

    -- Basic Info
    subject TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL NOT NULL,
    company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Classification
    category TEXT CHECK (category IN ('bug', 'feature_request', 'question', 'complaint', 'feedback', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open',
        'in_progress',
        'waiting_customer',
        'waiting_internal',
        'resolved',
        'closed',
        'cancelled'
    )),

    -- SLA
    sla_due_at TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT false,

    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ,

    -- Satisfaction
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    satisfaction_comment TEXT,

    -- Source
    source TEXT CHECK (source IN ('email', 'phone', 'chat', 'web_form', 'social_media', 'in_person')),

    -- Metadata
    tags TEXT[],
    attachments JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 10. TICKET COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_id UUID REFERENCES crm_tickets(id) ON DELETE CASCADE NOT NULL,

    -- Content
    comment TEXT NOT NULL,

    -- Type
    comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'internal_note', 'resolution')),
    is_public BOOLEAN DEFAULT true,

    -- Attachments
    attachments JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 11. PRODUCTS/SERVICES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    product_code TEXT UNIQUE,

    -- Type
    product_type TEXT CHECK (product_type IN ('product', 'service', 'subscription')),
    category TEXT,

    -- Pricing
    unit_price DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    cost_price DECIMAL(15, 2),

    -- Stock (for products)
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 12. EMAIL TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,

    -- Template
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,

    -- Category
    category TEXT CHECK (category IN ('sales', 'marketing', 'support', 'onboarding', 'general')),

    -- Variables
    variables TEXT[], -- e.g., ['{{first_name}}', '{{company_name}}']

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Usage
    usage_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Contacts
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_owner ON crm_contacts(owner_id);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_type ON crm_contacts(contact_type);
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_created ON crm_contacts(created_at DESC);

-- Companies
CREATE INDEX idx_crm_companies_name ON crm_companies(name);
CREATE INDEX idx_crm_companies_owner ON crm_companies(owner_id);
CREATE INDEX idx_crm_companies_status ON crm_companies(status);

-- Deals
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_crm_deals_close_date ON crm_deals(expected_close_date);
CREATE INDEX idx_crm_deals_amount ON crm_deals(amount DESC);

-- Activities
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_company ON crm_activities(company_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_owner ON crm_activities(owner_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at);

-- Tasks
CREATE INDEX idx_crm_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_due ON crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX idx_crm_tasks_priority ON crm_tasks(priority);

-- Tickets
CREATE INDEX idx_crm_tickets_number ON crm_tickets(ticket_number);
CREATE INDEX idx_crm_tickets_contact ON crm_tickets(contact_id);
CREATE INDEX idx_crm_tickets_assigned ON crm_tickets(assigned_to);
CREATE INDEX idx_crm_tickets_status ON crm_tickets(status);
CREATE INDEX idx_crm_tickets_priority ON crm_tickets(priority);
CREATE INDEX idx_crm_tickets_created ON crm_tickets(created_at DESC);

-- Campaigns
CREATE INDEX idx_crm_campaigns_status ON crm_campaigns(status);
CREATE INDEX idx_crm_campaigns_type ON crm_campaigns(campaign_type);
CREATE INDEX idx_crm_campaigns_dates ON crm_campaigns(start_date, end_date);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_companies_updated_at BEFORE UPDATE ON crm_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON crm_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON crm_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON crm_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tickets_updated_at BEFORE UPDATE ON crm_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_campaigns_updated_at BEFORE UPDATE ON crm_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_activity_at on contacts when activity is created
CREATE OR REPLACE FUNCTION update_contact_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE crm_contacts
    SET last_activity_at = NOW()
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_activity_trigger
    AFTER INSERT ON crm_activities
    FOR EACH ROW
    WHEN (NEW.contact_id IS NOT NULL)
    EXECUTE FUNCTION update_contact_last_activity();

-- Update deal status when stage changes to closed
CREATE OR REPLACE FUNCTION update_deal_closed_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stage = 'closed_won' THEN
        NEW.is_closed = true;
        NEW.is_won = true;
        NEW.actual_close_date = CURRENT_DATE;
    ELSIF NEW.stage = 'closed_lost' THEN
        NEW.is_closed = true;
        NEW.is_won = false;
        NEW.actual_close_date = CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deal_status_trigger
    BEFORE UPDATE ON crm_deals
    FOR EACH ROW
    WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
    EXECUTE FUNCTION update_deal_closed_status();

-- Update campaign performance stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE crm_campaigns c
    SET
        total_sent = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND sent_at IS NOT NULL),
        total_delivered = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND delivered_at IS NOT NULL),
        total_opened = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
        total_clicked = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL),
        total_responded = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND responded_at IS NOT NULL)
    WHERE c.id = NEW.campaign_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
    AFTER INSERT OR UPDATE ON crm_campaign_members
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_stats();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_products ENABLE ROW LEVEL SECURITY;

-- Users can view contacts they own or their team's contacts
CREATE POLICY "Users can view their contacts"
    ON crm_contacts FOR SELECT
    USING (
        auth.uid() = owner_id
        OR auth.uid() = created_by
    );

CREATE POLICY "Users can create contacts"
    ON crm_contacts FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their contacts"
    ON crm_contacts FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- Similar policies for other tables
CREATE POLICY "Users can view their companies"
    ON crm_companies FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can view their deals"
    ON crm_deals FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can view their activities"
    ON crm_activities FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can view their tasks"
    ON crm_tasks FOR SELECT
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can view their tickets"
    ON crm_tickets FOR SELECT
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- Admin policies
CREATE POLICY "Admins can manage all CRM data"
    ON crm_contacts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Contact Summary View
CREATE OR REPLACE VIEW crm_contact_summary AS
SELECT
    contact_type,
    status,
    COUNT(*) as total_contacts,
    AVG(lead_score) as avg_lead_score,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
FROM crm_contacts
GROUP BY contact_type, status;

-- Deal Pipeline View
CREATE OR REPLACE VIEW crm_deal_pipeline AS
SELECT
    stage,
    COUNT(*) as deal_count,
    SUM(amount) as total_value,
    AVG(amount) as avg_deal_size,
    AVG(probability) as avg_probability
FROM crm_deals
WHERE NOT is_closed
GROUP BY stage
ORDER BY
    CASE stage
        WHEN 'prospecting' THEN 1
        WHEN 'qualification' THEN 2
        WHEN 'proposal' THEN 3
        WHEN 'negotiation' THEN 4
    END;

-- Sales Performance View
CREATE OR REPLACE VIEW crm_sales_performance AS
SELECT
    owner_id,
    COUNT(*) as total_deals,
    COUNT(*) FILTER (WHERE is_won = true) as won_deals,
    SUM(amount) FILTER (WHERE is_won = true) as total_revenue,
    AVG(amount) FILTER (WHERE is_won = true) as avg_deal_size,
    ROUND(COUNT(*) FILTER (WHERE is_won = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as win_rate
FROM crm_deals
WHERE is_closed = true
GROUP BY owner_id;

-- Ticket Stats View
CREATE OR REPLACE VIEW crm_ticket_stats AS
SELECT
    status,
    priority,
    COUNT(*) as ticket_count,
    AVG(satisfaction_rating) as avg_satisfaction,
    COUNT(*) FILTER (WHERE sla_breached = true) as sla_breaches
FROM crm_tickets
GROUP BY status, priority;

-- Comments
COMMENT ON TABLE crm_contacts IS 'Leads and customer contacts with full profile information';
COMMENT ON TABLE crm_companies IS 'Organizations and companies in the CRM';
COMMENT ON TABLE crm_deals IS 'Sales opportunities and deals pipeline';
COMMENT ON TABLE crm_activities IS 'All customer interactions - calls, emails, meetings';
COMMENT ON TABLE crm_tasks IS 'Tasks and to-dos for sales and service teams';
COMMENT ON TABLE crm_campaigns IS 'Marketing campaigns for lead generation and nurturing';
COMMENT ON TABLE crm_tickets IS 'Customer service and support tickets';
COMMENT ON TABLE crm_products IS 'Products and services catalog';
