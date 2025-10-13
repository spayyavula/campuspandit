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
