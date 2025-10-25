-- =====================================================
-- AI-Powered Tutor Matching System - Database Migration
-- Creates tables for tutor profiles, student profiles, matching history, and reviews
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TUTOR PROFILES
-- Extended tutor profile for AI matching
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Basic Info
    bio TEXT,
    headline VARCHAR(200),  -- e.g., "Expert Math Tutor specializing in Calculus"
    years_experience INTEGER DEFAULT 0,
    education_level VARCHAR(50),  -- bachelor, master, phd, professional

    -- Subjects & Expertise
    subjects TEXT[] DEFAULT '{}',
    specializations TEXT[] DEFAULT '{}',  -- e.g., ["AP Calculus", "SAT Math"]
    grade_levels TEXT[] DEFAULT '{}',  -- e.g., ["9-10", "11-12", "college"]

    -- Teaching Style & Approach
    teaching_style VARCHAR(50),  -- patient, energetic, structured, flexible
    teaching_methods TEXT[] DEFAULT '{}',  -- visual, hands-on, lecture, interactive
    languages TEXT[] DEFAULT '{English}',

    -- Certifications & Credentials
    certifications JSONB DEFAULT '[]',  -- [{name, issuer, year}]
    degrees JSONB DEFAULT '[]',  -- [{degree, field, institution, year}]

    -- Pricing
    hourly_rate_min DECIMAL(10,2) NOT NULL,
    hourly_rate_max DECIMAL(10,2) NOT NULL,
    pricing_type VARCHAR(20) DEFAULT 'hourly',  -- hourly, package, subscription

    -- Availability Summary
    weekly_availability_hours INTEGER DEFAULT 0,
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Performance Metrics
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    response_time_minutes INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,4) DEFAULT 0.0,
    no_show_rate DECIMAL(5,4) DEFAULT 0.0,

    -- Student Success Metrics (AI uses these)
    student_success_rate DECIMAL(5,4) DEFAULT 0.0,  -- % of students who improved
    avg_grade_improvement DECIMAL(5,2) DEFAULT 0.0,
    student_satisfaction DECIMAL(5,2) DEFAULT 0.0,  -- 0-100 score

    -- AI-Generated Profile Insights
    ai_profile_summary TEXT,
    ai_strengths TEXT[] DEFAULT '{}',
    ai_ideal_student_profile TEXT,

    -- Matching Preferences
    preferred_student_types TEXT[] DEFAULT '{}',  -- beginner, intermediate, advanced
    preferred_session_types TEXT[] DEFAULT '{}',  -- one-time, ongoing, exam-prep
    max_students_per_week INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    accepts_new_students BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_min_rate CHECK (hourly_rate_min > 0),
    CONSTRAINT valid_rate_range CHECK (hourly_rate_max >= hourly_rate_min),
    CONSTRAINT valid_rating CHECK (avg_rating >= 0 AND avg_rating <= 5),
    CONSTRAINT valid_completion_rate CHECK (completion_rate >= 0 AND completion_rate <= 1)
);

-- Indexes for tutor_profiles
CREATE INDEX idx_tutor_profiles_user_id ON tutor_profiles(user_id);
CREATE INDEX idx_tutor_profiles_active ON tutor_profiles(is_active);
CREATE INDEX idx_tutor_profiles_subjects ON tutor_profiles USING GIN(subjects);
CREATE INDEX idx_tutor_profiles_rating ON tutor_profiles(avg_rating DESC);
CREATE INDEX idx_tutor_profiles_accepts_students ON tutor_profiles(accepts_new_students) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_profiles
CREATE POLICY "Public can view active tutor profiles"
    ON tutor_profiles FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Tutors can update own profile"
    ON tutor_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Tutors can insert own profile"
    ON tutor_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- 2. STUDENT PROFILES
-- Student profile for AI matching
-- =====================================================

CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Basic Info
    grade_level VARCHAR(20),  -- K-12, college, adult
    current_gpa DECIMAL(3,2),

    -- Learning Profile
    learning_style VARCHAR(50),  -- visual, auditory, kinesthetic, reading-writing
    learning_pace VARCHAR(20),  -- slow, moderate, fast
    personality_type VARCHAR(50),  -- introverted, extroverted, balanced

    -- Goals & Needs
    primary_goals TEXT[] DEFAULT '{}',  -- improve-grades, exam-prep, homework-help, enrichment
    specific_challenges TEXT[] DEFAULT '{}',  -- time-management, test-anxiety, focus
    target_subjects TEXT[] DEFAULT '{}',

    -- Preferences
    preferred_tutor_gender VARCHAR(20),  -- male, female, no-preference
    preferred_tutor_age_range VARCHAR(20),  -- 20-30, 30-40, 40+, no-preference
    preferred_teaching_style VARCHAR(50),
    preferred_session_length INTEGER DEFAULT 60,  -- minutes

    -- Budget & Schedule
    budget_per_hour DECIMAL(10,2),
    budget_per_month DECIMAL(10,2),
    preferred_days TEXT[] DEFAULT '{}',  -- monday, tuesday, etc.
    preferred_times TEXT[] DEFAULT '{}',  -- morning, afternoon, evening
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Parent/Guardian Info (for K-12)
    parent_involvement_level VARCHAR(20),  -- high, medium, low
    parent_preferences JSONB DEFAULT '{}',

    -- AI-Generated Insights
    ai_learning_profile_summary TEXT,
    ai_recommended_approach TEXT,
    ai_success_predictors JSONB DEFAULT '{}',

    -- Matching History Stats
    total_tutors_tried INTEGER DEFAULT 0,
    successful_matches INTEGER DEFAULT 0,
    avg_session_rating DECIMAL(3,2) DEFAULT 0.0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_looking_for_tutor BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for student_profiles
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_active ON student_profiles(is_active);
CREATE INDEX idx_student_profiles_subjects ON student_profiles USING GIN(target_subjects);

-- Enable RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_profiles
CREATE POLICY "Students can view own profile"
    ON student_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile"
    ON student_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile"
    ON student_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- 3. MATCHING HISTORY
-- Track tutor-student matching history
-- =====================================================

CREATE TABLE IF NOT EXISTS matching_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Matching Details
    match_score DECIMAL(5,2) NOT NULL,  -- 0-100 AI confidence score
    match_algorithm VARCHAR(50) DEFAULT 'gpt-4',  -- gpt-4, claude-3, hybrid
    match_version VARCHAR(20) DEFAULT '1.0',

    -- AI Reasoning
    ai_reasoning TEXT,
    ai_confidence DECIMAL(5,4),  -- 0-1 confidence level
    match_factors JSONB DEFAULT '{}',  -- {subject: 0.9, schedule: 0.8, style: 0.95}

    -- Student Actions
    viewed_at TIMESTAMP WITH TIME ZONE,
    contacted_at TIMESTAMP WITH TIME ZONE,
    booked_at TIMESTAMP WITH TIME ZONE,
    accepted BOOLEAN,  -- Did student accept this match?

    -- Outcome Tracking
    first_session_completed BOOLEAN DEFAULT FALSE,
    total_sessions_together INTEGER DEFAULT 0,
    avg_session_rating DECIMAL(3,2),
    relationship_duration_days INTEGER DEFAULT 0,
    match_success BOOLEAN,  -- Overall success of this match

    -- Feedback
    student_feedback TEXT,
    tutor_feedback TEXT,
    what_worked TEXT[] DEFAULT '{}',
    what_didnt_work TEXT[] DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_match_score CHECK (match_score >= 0 AND match_score <= 100)
);

-- Indexes for matching_history
CREATE INDEX idx_matching_history_student_id ON matching_history(student_id);
CREATE INDEX idx_matching_history_tutor_id ON matching_history(tutor_id);
CREATE INDEX idx_matching_history_score ON matching_history(match_score DESC);
CREATE INDEX idx_matching_history_created ON matching_history(created_at DESC);

-- Enable RLS
ALTER TABLE matching_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matching_history
CREATE POLICY "Students can view own matching history"
    ON matching_history FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Tutors can view own matching history"
    ON matching_history FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "System can insert matching history"
    ON matching_history FOR INSERT
    WITH CHECK (TRUE);  -- In production, restrict to service role

CREATE POLICY "Students can update own matching history"
    ON matching_history FOR UPDATE
    USING (auth.uid() = student_id);


-- =====================================================
-- 4. TUTOR REVIEWS
-- Student reviews of tutors
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES tutoring_sessions(id),

    -- Ratings (1-5 scale)
    overall_rating DECIMAL(3,2) NOT NULL,
    subject_expertise DECIMAL(3,2),
    communication DECIMAL(3,2),
    patience DECIMAL(3,2),
    punctuality DECIMAL(3,2),
    helpfulness DECIMAL(3,2),

    -- Review Content
    title VARCHAR(200),
    review_text TEXT,
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',

    -- Outcome
    would_recommend BOOLEAN,
    grade_improvement DECIMAL(5,2),  -- GPA improvement or test score increase
    learning_goals_met BOOLEAN,

    -- AI Analysis
    ai_sentiment_score DECIMAL(5,4),  -- -1 to 1 (negative to positive)
    ai_key_themes TEXT[] DEFAULT '{}',
    ai_summary TEXT,

    -- Visibility
    is_verified BOOLEAN DEFAULT FALSE,  -- Verified purchase
    is_published BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_overall_rating CHECK (overall_rating >= 1 AND overall_rating <= 5)
);

-- Indexes for tutor_reviews
CREATE INDEX idx_tutor_reviews_tutor_id ON tutor_reviews(tutor_id);
CREATE INDEX idx_tutor_reviews_rating ON tutor_reviews(overall_rating DESC);
CREATE INDEX idx_tutor_reviews_published ON tutor_reviews(is_published) WHERE is_published = TRUE;

-- Enable RLS
ALTER TABLE tutor_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_reviews
CREATE POLICY "Public can view published reviews"
    ON tutor_reviews FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Students can insert own reviews"
    ON tutor_reviews FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own reviews"
    ON tutor_reviews FOR UPDATE
    USING (auth.uid() = student_id);


-- =====================================================
-- 5. TRIGGER FUNCTIONS
-- Auto-update metrics and timestamps
-- =====================================================

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tutor_profiles_updated_at BEFORE UPDATE ON tutor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matching_history_updated_at BEFORE UPDATE ON matching_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_reviews_updated_at BEFORE UPDATE ON tutor_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Update tutor profile metrics when new review is added
CREATE OR REPLACE FUNCTION update_tutor_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tutor_profiles
    SET
        total_reviews = (
            SELECT COUNT(*)
            FROM tutor_reviews
            WHERE tutor_id = NEW.tutor_id AND is_published = TRUE
        ),
        avg_rating = (
            SELECT COALESCE(AVG(overall_rating), 0)
            FROM tutor_reviews
            WHERE tutor_id = NEW.tutor_id AND is_published = TRUE
        )
    WHERE user_id = NEW.tutor_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tutor_metrics_on_review
    AFTER INSERT OR UPDATE ON tutor_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_tutor_metrics();


-- Update student matching stats
CREATE OR REPLACE FUNCTION update_student_matching_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE student_profiles
    SET
        total_tutors_tried = (
            SELECT COUNT(DISTINCT tutor_id)
            FROM matching_history
            WHERE student_id = NEW.student_id AND contacted_at IS NOT NULL
        ),
        successful_matches = (
            SELECT COUNT(*)
            FROM matching_history
            WHERE student_id = NEW.student_id AND match_success = TRUE
        )
    WHERE user_id = NEW.student_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_stats_on_match
    AFTER INSERT OR UPDATE ON matching_history
    FOR EACH ROW
    EXECUTE FUNCTION update_student_matching_stats();


-- =====================================================
-- 6. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- You can uncomment these to add sample data for testing

-- INSERT INTO tutor_profiles (
--     user_id, bio, headline, years_experience, education_level,
--     subjects, specializations, teaching_style, hourly_rate_min, hourly_rate_max
-- ) VALUES (
--     'your-test-user-id-here',
--     'Experienced math tutor with a passion for helping students excel',
--     'Expert Math Tutor - Calculus & Statistics Specialist',
--     5,
--     'master',
--     '{Mathematics, Statistics, Calculus}',
--     '{AP Calculus, SAT Math, College Algebra}',
--     'patient',
--     40.00,
--     60.00
-- );


COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================

-- To run this migration:
-- psql -d your_database_url -f 20251024120000_create_ai_matching_tables.sql

-- To rollback (if needed):
-- DROP TABLE IF EXISTS tutor_reviews CASCADE;
-- DROP TABLE IF EXISTS matching_history CASCADE;
-- DROP TABLE IF EXISTS student_profiles CASCADE;
-- DROP TABLE IF EXISTS tutor_profiles CASCADE;
