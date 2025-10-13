-- Tutoring System Schema for CampusPandit
-- Global tutoring platform for Math, Physics, Chemistry and other subjects
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. TUTOR PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Basic Information
    full_name TEXT NOT NULL,
    display_name TEXT,
    bio TEXT,
    profile_image_url TEXT,
    country TEXT NOT NULL,
    timezone TEXT NOT NULL,
    languages TEXT[] DEFAULT ARRAY['English'],

    -- Professional Details
    qualifications JSONB, -- Degrees, certifications
    teaching_experience_years INTEGER DEFAULT 0,
    specialization TEXT[], -- ['JEE', 'NEET', 'IB', 'Cambridge', etc.]
    subjects TEXT[] NOT NULL, -- ['Physics', 'Math', 'Chemistry', etc.]
    expertise_level TEXT CHECK (expertise_level IN ('beginner', 'intermediate', 'expert', 'master')),

    -- Verification
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents JSONB, -- URLs to uploaded documents
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),

    -- Pricing
    hourly_rate_usd DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',

    -- Availability
    availability JSONB, -- Weekly schedule
    accepts_instant_booking BOOLEAN DEFAULT false,
    min_session_duration INTEGER DEFAULT 60, -- minutes
    max_session_duration INTEGER DEFAULT 180, -- minutes

    -- Stats
    total_sessions INTEGER DEFAULT 0,
    total_hours_taught DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),

    -- Metadata
    video_intro_url TEXT,
    teaching_style TEXT,
    achievements TEXT[],
    linkedin_url TEXT,
    website_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- =====================================================
-- 2. TUTOR AVAILABILITY SLOTS
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE NOT NULL,

    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT true,

    -- For one-time availability
    specific_date DATE,

    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (end_time > start_time)
);

-- =====================================================
-- 3. TUTORING SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS tutoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participants
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Session Details
    subject TEXT NOT NULL,
    topic TEXT,
    session_type TEXT CHECK (session_type IN ('one-on-one', 'group', 'workshop')),

    -- Scheduling
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    timezone TEXT NOT NULL,

    -- Actual times (recorded after session)
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,

    -- Session Info
    session_notes TEXT, -- Tutor's notes before session
    student_notes TEXT, -- Student's notes/questions
    homework_assigned TEXT,
    resources_shared TEXT[],

    -- Meeting Details
    meeting_platform TEXT DEFAULT 'zoom' CHECK (meeting_platform IN ('zoom', 'google_meet', 'microsoft_teams', 'custom')),
    meeting_url TEXT,
    meeting_id TEXT,
    meeting_password TEXT,

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES auth.users(id),
    cancelled_at TIMESTAMPTZ,

    -- Payment
    price_usd DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_id TEXT,

    -- Ratings (filled after session)
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
    student_review TEXT,
    tutor_rating INTEGER CHECK (tutor_rating BETWEEN 1 AND 5),
    tutor_feedback TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (scheduled_end > scheduled_start)
);

-- =====================================================
-- 4. SESSION REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS session_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES tutoring_sessions(id) ON DELETE CASCADE NOT NULL,
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Review by student
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,

    -- Detailed ratings
    subject_knowledge_rating INTEGER CHECK (subject_knowledge_rating BETWEEN 1 AND 5),
    teaching_style_rating INTEGER CHECK (teaching_style_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),

    -- Tags
    helpful_tags TEXT[], -- ['Patient', 'Clear explanations', 'Great examples', etc.]

    -- Moderation
    is_public BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false, -- Verified that session actually happened
    flagged BOOLEAN DEFAULT false,
    moderation_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(session_id, student_id)
);

-- =====================================================
-- 5. TUTOR SUBJECTS & EXPERTISE
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_subject_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE NOT NULL,

    subject TEXT NOT NULL,
    sub_topics TEXT[],
    proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

    -- Entrance exam expertise
    exam_types TEXT[], -- ['JEE Main', 'JEE Advanced', 'NEET', 'IIT', 'CBSE', 'ICSE', etc.]

    -- Board/Curriculum expertise
    boards TEXT[], -- ['CBSE', 'ICSE', 'IB', 'Cambridge', 'State Boards', etc.]
    grade_levels TEXT[], -- ['9', '10', '11', '12', 'College']

    years_teaching_subject INTEGER DEFAULT 0,
    students_taught INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tutor_id, subject)
);

-- =====================================================
-- 6. STUDENT BOOKINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS student_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES tutoring_sessions(id) ON DELETE SET NULL,

    -- Booking request
    requested_subject TEXT NOT NULL,
    requested_topic TEXT,
    requested_date DATE NOT NULL,
    requested_time_slots JSONB, -- Array of preferred time slots
    special_requirements TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    response_message TEXT,
    responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. TUTOR CERTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE NOT NULL,

    certification_name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    credential_id TEXT,
    credential_url TEXT,

    -- Verification
    document_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. TUTOR EARNINGS & PAYOUTS
-- =====================================================

CREATE TABLE IF NOT EXISTS tutor_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES tutoring_sessions(id) ON DELETE SET NULL,

    -- Earnings
    gross_amount_usd DECIMAL(10,2) NOT NULL,
    platform_fee_usd DECIMAL(10,2) NOT NULL,
    net_amount_usd DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',

    -- Payout
    payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    payout_method TEXT, -- 'bank_transfer', 'paypal', 'stripe', etc.
    payout_date TIMESTAMPTZ,
    payout_reference TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. STUDENT FAVORITES
-- =====================================================

CREATE TABLE IF NOT EXISTS student_favorite_tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, tutor_id)
);

-- =====================================================
-- 10. SUBJECT MASTER LIST (for standardization)
-- =====================================================

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT, -- 'Science', 'Mathematics', 'Language', etc.
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO subjects (name, category, description, display_order) VALUES
('Physics', 'Science', 'Classical mechanics, thermodynamics, electromagnetism, optics, modern physics', 1),
('Chemistry', 'Science', 'Physical, organic, and inorganic chemistry', 2),
('Mathematics', 'Mathematics', 'Algebra, calculus, geometry, trigonometry, statistics', 3),
('Biology', 'Science', 'Botany, zoology, human biology, genetics', 4),
('Computer Science', 'Technology', 'Programming, algorithms, data structures', 5),
('English', 'Language', 'Grammar, literature, composition', 6),
('Hindi', 'Language', 'Grammar, literature, composition', 7),
('Economics', 'Social Science', 'Microeconomics, macroeconomics', 8),
('Accountancy', 'Commerce', 'Financial accounting, cost accounting', 9),
('Business Studies', 'Commerce', 'Business management and operations', 10)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user_id ON tutor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_verification_status ON tutor_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_subjects ON tutor_profiles USING GIN(subjects);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_country ON tutor_profiles(country);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_is_active ON tutor_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor_id ON tutoring_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student_id ON tutoring_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_status ON tutoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_scheduled_start ON tutoring_sessions(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_session_reviews_tutor_id ON session_reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_session_reviews_is_public ON session_reviews(is_public);

CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id ON tutor_availability_slots(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_day ON tutor_availability_slots(day_of_week);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tutor_profiles_updated_at BEFORE UPDATE ON tutor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutoring_sessions_updated_at BEFORE UPDATE ON tutoring_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update tutor stats when review is added
CREATE OR REPLACE FUNCTION update_tutor_stats_on_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tutor_profiles
    SET
        average_rating = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM session_reviews
            WHERE tutor_id = NEW.tutor_id AND is_public = true
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM session_reviews
            WHERE tutor_id = NEW.tutor_id AND is_public = true
        )
    WHERE id = NEW.tutor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tutor_stats_after_review
    AFTER INSERT OR UPDATE ON session_reviews
    FOR EACH ROW EXECUTE FUNCTION update_tutor_stats_on_review();

-- Update tutor stats when session is completed
CREATE OR REPLACE FUNCTION update_tutor_stats_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE tutor_profiles
        SET
            total_sessions = total_sessions + 1,
            total_hours_taught = total_hours_taught + (NEW.duration_minutes / 60.0)
        WHERE id = NEW.tutor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tutor_stats_after_session
    AFTER UPDATE ON tutoring_sessions
    FOR EACH ROW EXECUTE FUNCTION update_tutor_stats_on_session_complete();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_subject_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_favorite_tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Tutor Profiles Policies
CREATE POLICY "Anyone can view verified tutor profiles"
    ON tutor_profiles FOR SELECT
    USING (verification_status = 'verified' AND is_active = true);

CREATE POLICY "Tutors can view own profile"
    ON tutor_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Tutors can update own profile"
    ON tutor_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create tutor profile"
    ON tutor_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Tutoring Sessions Policies
CREATE POLICY "Users can view their own sessions"
    ON tutoring_sessions FOR SELECT
    USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM tutor_profiles WHERE id = tutor_id));

CREATE POLICY "Students can create session bookings"
    ON tutoring_sessions FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors and students can update their sessions"
    ON tutoring_sessions FOR UPDATE
    USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM tutor_profiles WHERE id = tutor_id));

-- Reviews Policies
CREATE POLICY "Anyone can view public reviews"
    ON session_reviews FOR SELECT
    USING (is_public = true);

CREATE POLICY "Students can create reviews for their sessions"
    ON session_reviews FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Student Favorites Policies
CREATE POLICY "Students can manage their favorites"
    ON student_favorite_tutors FOR ALL
    USING (auth.uid() = student_id);

-- Subjects are public
CREATE POLICY "Anyone can view subjects"
    ON subjects FOR SELECT
    USING (true);

-- Admin policies (assuming roles table exists)
CREATE POLICY "Admins can manage all tutor profiles"
    ON tutor_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

CREATE OR REPLACE VIEW tutor_statistics AS
SELECT
    tp.id as tutor_id,
    tp.full_name,
    tp.country,
    tp.subjects,
    tp.total_sessions,
    tp.total_hours_taught,
    tp.average_rating,
    tp.total_reviews,
    COUNT(DISTINCT ts.student_id) as unique_students,
    SUM(CASE WHEN ts.status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
    SUM(CASE WHEN ts.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_sessions
FROM tutor_profiles tp
LEFT JOIN tutoring_sessions ts ON tp.id = ts.tutor_id
GROUP BY tp.id, tp.full_name, tp.country, tp.subjects, tp.total_sessions,
         tp.total_hours_taught, tp.average_rating, tp.total_reviews;

-- Comments for documentation
COMMENT ON TABLE tutor_profiles IS 'Stores tutor profile information and credentials';
COMMENT ON TABLE tutoring_sessions IS 'Manages all tutoring sessions between students and tutors';
COMMENT ON TABLE session_reviews IS 'Student reviews and ratings for completed sessions';
COMMENT ON TABLE tutor_subject_expertise IS 'Detailed subject expertise for each tutor';
COMMENT ON TABLE subjects IS 'Master list of available subjects';
