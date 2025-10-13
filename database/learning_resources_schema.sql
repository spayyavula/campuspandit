-- Learning Resources & Self-Study System Schema
-- Integrates textbooks, resources, and self-paced learning with tutoring

-- =====================================================
-- 1. TEXTBOOKS & LEARNING RESOURCES
-- =====================================================

CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Resource Details
    title TEXT NOT NULL,
    subtitle TEXT,
    authors TEXT[] NOT NULL,
    isbn TEXT,
    publisher TEXT,
    edition TEXT,
    publication_year INTEGER,

    -- Classification
    resource_type TEXT CHECK (resource_type IN ('textbook', 'reference_book', 'problem_book', 'workbook', 'guide', 'video_course', 'online_course')),
    subject TEXT NOT NULL CHECK (subject IN ('physics', 'mathematics', 'chemistry', 'biology', 'computer_science', 'english', 'other')),
    topics TEXT[], -- ['mechanics', 'thermodynamics', etc.]

    -- Target Audience
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    target_exams TEXT[], -- ['jee_main', 'jee_advanced', 'neet', 'ib', 'cambridge', etc.]
    recommended_grades TEXT[], -- ['11', '12', 'college']

    -- Content Info
    description TEXT,
    key_features TEXT[],
    total_chapters INTEGER,
    total_pages INTEGER,
    language TEXT DEFAULT 'english',

    -- Availability & Pricing
    purchase_links JSONB, -- {amazon: 'url', flipkart: 'url', etc.}
    price_range TEXT,
    is_free BOOLEAN DEFAULT false,
    digital_version_available BOOLEAN DEFAULT false,

    -- Media
    cover_image_url TEXT,
    preview_url TEXT,

    -- Ratings & Reviews
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    recommendation_score INTEGER DEFAULT 0, -- 1-10

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 2. RESOURCE CHAPTERS/MODULES
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE NOT NULL,

    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    topics_covered TEXT[],

    -- Learning Objectives
    learning_objectives TEXT[],
    prerequisites TEXT[],
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),

    -- Time Estimates
    estimated_study_hours DECIMAL(4,1),
    estimated_problem_solving_hours DECIMAL(4,1),

    -- Content Details
    number_of_problems INTEGER,
    has_theory BOOLEAN DEFAULT true,
    has_examples BOOLEAN DEFAULT true,
    has_exercises BOOLEAN DEFAULT true,

    -- Google Learn Your Way Integration
    google_learn_module_id TEXT,
    google_learn_path_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(resource_id, chapter_number)
);

-- =====================================================
-- 3. STUDENT READING PROGRESS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_resource_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE NOT NULL,

    -- Progress Tracking
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
    chapters_completed INTEGER DEFAULT 0,
    chapters_total INTEGER,
    progress_percentage DECIMAL(5,2) DEFAULT 0,

    -- Time Tracking
    total_study_hours DECIMAL(6,2) DEFAULT 0,
    last_studied_at TIMESTAMPTZ,

    -- Goals
    target_completion_date DATE,
    daily_goal_hours DECIMAL(3,1),

    -- Notes & Bookmarks
    bookmarked_chapters INTEGER[],
    notes TEXT,

    -- Rating
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
    student_review TEXT,

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, resource_id)
);

-- =====================================================
-- 4. CHAPTER-LEVEL PROGRESS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_chapter_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES resource_chapters(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE NOT NULL,

    -- Completion Status
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'reading', 'practicing', 'completed')),

    -- Detailed Progress
    theory_completed BOOLEAN DEFAULT false,
    examples_completed BOOLEAN DEFAULT false,
    exercises_completed BOOLEAN DEFAULT false,
    problems_solved INTEGER DEFAULT 0,
    problems_total INTEGER,

    -- Time Tracking
    time_spent_minutes INTEGER DEFAULT 0,

    -- Understanding
    self_assessed_understanding INTEGER CHECK (self_assessed_understanding BETWEEN 1 AND 5),
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
    needs_tutor_help BOOLEAN DEFAULT false,

    -- Notes & Doubts
    notes TEXT,
    doubts TEXT[],
    key_learnings TEXT[],

    -- Dates
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, chapter_id)
);

-- =====================================================
-- 5. STUDY SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Session Details
    session_type TEXT CHECK (session_type IN ('reading', 'problem_solving', 'revision', 'mixed')),
    resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES resource_chapters(id) ON DELETE SET NULL,

    -- Time Tracking
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,

    -- Productivity
    focus_level INTEGER CHECK (focus_level BETWEEN 1 AND 5),
    problems_attempted INTEGER DEFAULT 0,
    problems_solved INTEGER DEFAULT 0,

    -- Integration
    google_learn_activity BOOLEAN DEFAULT false,
    tutor_session_id UUID REFERENCES tutoring_sessions(id) ON DELETE SET NULL,

    -- Notes
    session_notes TEXT,
    topics_covered TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. LEARNING GOALS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_learning_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Goal Details
    goal_type TEXT CHECK (goal_type IN ('complete_book', 'complete_chapter', 'master_topic', 'solve_problems', 'exam_prep', 'custom')),
    title TEXT NOT NULL,
    description TEXT,

    -- Target
    target_resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,
    target_chapters INTEGER[],
    target_topics TEXT[],

    -- Timeline
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,

    -- Progress
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue')),
    progress_percentage DECIMAL(5,2) DEFAULT 0,

    -- Tracking
    days_remaining INTEGER,
    on_track BOOLEAN DEFAULT true,

    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. RESOURCE RECOMMENDATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Association
    for_exam TEXT, -- 'jee_main', 'neet', etc.
    for_subject TEXT,
    for_level TEXT,

    -- Recommendation
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE NOT NULL,
    priority_order INTEGER, -- 1 = highest priority
    is_essential BOOLEAN DEFAULT false,

    -- Context
    recommendation_reason TEXT,
    study_phase TEXT CHECK (study_phase IN ('foundation', 'intermediate', 'advanced', 'revision')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. GOOGLE LEARN YOUR WAY INTEGRATION
-- =====================================================

CREATE TABLE IF NOT EXISTS google_learn_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Google Account
    google_email TEXT,
    google_user_id TEXT,

    -- Learning Paths
    active_learning_paths JSONB, -- Array of Google learning path IDs
    completed_modules INTEGER DEFAULT 0,

    -- Progress Sync
    last_synced_at TIMESTAMPTZ,
    auto_sync_enabled BOOLEAN DEFAULT true,

    -- Preferences
    daily_goal_minutes INTEGER DEFAULT 60,
    preferred_learning_time TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_learning_resources_subject ON learning_resources(subject);
CREATE INDEX IF NOT EXISTS idx_learning_resources_type ON learning_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_learning_resources_level ON learning_resources(level);
CREATE INDEX IF NOT EXISTS idx_learning_resources_target_exams ON learning_resources USING GIN(target_exams);

CREATE INDEX IF NOT EXISTS idx_resource_chapters_resource_id ON resource_chapters(resource_id);
CREATE INDEX IF NOT EXISTS idx_student_resource_progress_student_id ON student_resource_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_resource_progress_status ON student_resource_progress(status);

CREATE INDEX IF NOT EXISTS idx_student_chapter_progress_student_id ON student_chapter_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_chapter_progress_chapter_id ON student_chapter_progress(chapter_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_student_id ON study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON study_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_student_learning_goals_student_id ON student_learning_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_student_learning_goals_status ON student_learning_goals(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update resource progress percentage
CREATE OR REPLACE FUNCTION update_resource_progress_percentage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.chapters_total > 0 THEN
        NEW.progress_percentage = (NEW.chapters_completed::DECIMAL / NEW.chapters_total) * 100;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resource_progress_before_update
    BEFORE UPDATE ON student_resource_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_resource_progress_percentage();

-- Update timestamps
CREATE TRIGGER update_learning_resources_updated_at BEFORE UPDATE ON learning_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_resource_progress_updated_at BEFORE UPDATE ON student_resource_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_chapter_progress_updated_at BEFORE UPDATE ON student_chapter_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_resource_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_learn_integration ENABLE ROW LEVEL SECURITY;

-- Learning resources are public
CREATE POLICY "Anyone can view learning resources"
    ON learning_resources FOR SELECT
    USING (is_active = true);

-- Chapters are public
CREATE POLICY "Anyone can view resource chapters"
    ON resource_chapters FOR SELECT
    USING (true);

-- Students can view their own progress
CREATE POLICY "Students can view own progress"
    ON student_resource_progress FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can manage own progress"
    ON student_resource_progress FOR ALL
    USING (auth.uid() = student_id);

-- Chapter progress
CREATE POLICY "Students can manage own chapter progress"
    ON student_chapter_progress FOR ALL
    USING (auth.uid() = student_id);

-- Study sessions
CREATE POLICY "Students can manage own study sessions"
    ON study_sessions FOR ALL
    USING (auth.uid() = student_id);

-- Learning goals
CREATE POLICY "Students can manage own learning goals"
    ON student_learning_goals FOR ALL
    USING (auth.uid() = student_id);

-- Recommendations are public
CREATE POLICY "Anyone can view recommendations"
    ON resource_recommendations FOR SELECT
    USING (true);

-- Google integration
CREATE POLICY "Students can manage own Google integration"
    ON google_learn_integration FOR ALL
    USING (auth.uid() = student_id);

-- Admin policies
CREATE POLICY "Admins can manage all learning resources"
    ON learning_resources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- SEED DATA - RECOMMENDED TEXTBOOKS
-- =====================================================

-- Insert recommended textbooks from our curated list
INSERT INTO learning_resources (
    title, authors, isbn, subject, resource_type, level, target_exams,
    description, price_range, recommendation_score, is_active
) VALUES
-- Physics
('Concepts of Physics Vol 1 & 2', ARRAY['H.C. Verma'], '978-8177091878', 'physics', 'textbook', 'intermediate',
 ARRAY['jee_main', 'jee_advanced', 'neet'],
 'Gold standard for conceptual clarity in physics with excellent problems', '₹800-1000', 10, true),

('Fundamentals of Physics', ARRAY['Halliday', 'Resnick', 'Walker'], '978-1118230725', 'physics', 'textbook', 'advanced',
 ARRAY['ib', 'cambridge'],
 'Comprehensive physics coverage, international standard', '₹1500-2000', 9, true),

('Problems in General Physics', ARRAY['I.E. Irodov'], '978-8123910301', 'physics', 'problem_book', 'advanced',
 ARRAY['jee_advanced', 'olympiad'],
 'Challenging problems for advanced preparation', '₹600-800', 9, true),

-- Mathematics
('Higher Algebra', ARRAY['Hall & Knight'], '978-8121925631', 'mathematics', 'textbook', 'advanced',
 ARRAY['jee_main', 'jee_advanced'],
 'Classic algebra text with comprehensive problems', '₹400-600', 9, true),

('Calculus', ARRAY['Thomas & Finney'], '978-0321587992', 'mathematics', 'textbook', 'advanced',
 ARRAY['ib', 'cambridge'],
 'Comprehensive calculus coverage', '₹1800-2200', 10, true),

('Problems in Calculus of One Variable', ARRAY['I.A. Maron'], '978-9387999039', 'mathematics', 'problem_book', 'advanced',
 ARRAY['jee_advanced', 'olympiad'],
 'Challenging calculus problems', '₹500-700', 9, true),

-- Chemistry
('Physical Chemistry', ARRAY['O.P. Tandon'], '978-9388031417', 'chemistry', 'textbook', 'intermediate',
 ARRAY['jee_main', 'jee_advanced', 'neet'],
 'Comprehensive physical chemistry coverage', '₹600-800', 9, true),

('Organic Chemistry', ARRAY['Morrison & Boyd'], '978-0205052363', 'chemistry', 'textbook', 'advanced',
 ARRAY['jee_advanced', 'neet'],
 'In-depth organic chemistry with mechanisms', '₹1200-1500', 10, true),

('Concise Inorganic Chemistry', ARRAY['J.D. Lee'], '978-8126515547', 'chemistry', 'textbook', 'intermediate',
 ARRAY['jee', 'neet', 'ib'],
 'Comprehensive inorganic chemistry', '₹800-1000', 9, true)

ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE learning_resources IS 'Catalog of textbooks and learning resources';
COMMENT ON TABLE student_resource_progress IS 'Tracks student progress through learning resources';
COMMENT ON TABLE study_sessions IS 'Records individual study sessions for time tracking';
COMMENT ON TABLE google_learn_integration IS 'Integration with Google Learn Your Way platform';
