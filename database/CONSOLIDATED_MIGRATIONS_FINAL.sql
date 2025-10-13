-- =====================================================
-- CAMPUSPANDIT - COMPLETE DATABASE MIGRATIONS v2.4
-- =====================================================
--
-- This file contains ALL database schemas in the correct dependency order.
-- Run this ONCE in your Supabase SQL Editor.
--
-- ⚠️ IMPORTANT: Run 00_DROP_ALL_TABLES.sql FIRST to ensure clean slate!
--
-- Order of execution:
-- 0. Authentication & Roles (roles, user_roles, permissions)
-- 1. Tutoring System (tutor_profiles, tutoring_sessions, etc.)
-- 2. Learning Resources (learning_resources, resource_chapters, etc.)
-- 3. Notes & Flashcards (flashcard_sets, flashcard_cards, etc.)
-- 4. Email Marketing (email_subscribers, email_campaigns, etc.)
-- 5. AI Coaching (student_weak_areas, ai_coaching_sessions, etc.)
-- 6. Messaging System (channels, messages, reactions, etc.)
-- 7. CRM System (crm_companies, crm_contacts, crm_deals, etc.)
--
-- Total Lines: ~4050
-- Estimated execution time: 30-90 seconds
--
-- CHANGELOG v2.4:
-- ✅ Added role-based signup - users can choose Student or Tutor during registration
-- ✅ Updated auto_assign_user_role() trigger to read role from user metadata
-- ✅ Student/Tutor roles assigned automatically, Admin assigned manually
--
-- CHANGELOG v2.3:
-- ✅ Fixed CRM table order - crm_companies now created BEFORE crm_contacts
-- ✅ Fixed note_templates INSERT - added missing structure JSONB column
-- ✅ Fixed circular dependency in RLS policies
-- ✅ All foreign key dependencies properly ordered
--
-- FEATURES:
-- ✅ 70+ tables across 8 schemas
-- ✅ Roles table with 6 default roles (student, tutor, admin, etc.)
-- ✅ Auto-assigns "student" role to new users on signup
-- ✅ Helper functions for role management
-- ✅ Complete RLS policies for security
-- ✅ Spaced repetition flashcards system
-- ✅ NotebookLM integration
-- ✅ Full CRM system with companies, contacts, deals
-- ✅ Real-time messaging with channels
-- ✅ Service ticketing system
--
-- =====================================================

-- =====================================================
-- AUTHENTICATION & AUTHORIZATION SCHEMA
-- =====================================================
-- This schema MUST be executed FIRST before all other schemas
-- as other tables depend on the roles/user_roles tables for RLS policies
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ROLES TABLE
-- =====================================================
-- Defines the different roles users can have in the system

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT roles_name_lowercase CHECK (name = LOWER(name))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roles_updated_at_trigger
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

-- =====================================================
-- USER ROLES TABLE
-- =====================================================
-- Maps users to their roles (many-to-many relationship)

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure a user can only have each role once
    CONSTRAINT user_roles_unique UNIQUE(user_id, role_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);

-- =====================================================
-- PERMISSIONS TABLE (Optional - for fine-grained control)
-- =====================================================

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- e.g., 'tutoring_sessions', 'learning_resources'
    action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT permissions_name_lowercase CHECK (name = LOWER(name)),
    CONSTRAINT permissions_resource_lowercase CHECK (resource = LOWER(resource)),
    CONSTRAINT permissions_action_lowercase CHECK (action = LOWER(action))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active);

-- =====================================================
-- ROLE PERMISSIONS TABLE
-- =====================================================
-- Maps roles to their permissions

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure a role can only have each permission once
    CONSTRAINT role_permissions_unique UNIQUE(role_id, permission_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- =====================================================
-- SEED DATA - Default Roles
-- =====================================================

INSERT INTO roles (name, description) VALUES
    ('student', 'Regular student user with access to learning materials'),
    ('tutor', 'Tutoring instructor who can conduct sessions and create content'),
    ('admin', 'System administrator with full access'),
    ('content_creator', 'Can create and manage learning resources'),
    ('moderator', 'Can moderate content and user interactions'),
    ('support', 'Customer support staff')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid
        AND r.name = role_name
        AND ur.is_active = true
        AND r.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has any of the specified roles
CREATE OR REPLACE FUNCTION has_any_role(user_uuid UUID, role_names TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid
        AND r.name = ANY(role_names)
        AND ur.is_active = true
        AND r.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all active roles for a user
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name VARCHAR(50), role_description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.description
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign a role to a user
CREATE OR REPLACE FUNCTION assign_role(
    user_uuid UUID,
    role_name TEXT,
    assigned_by_uuid UUID DEFAULT NULL,
    expires_at_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    role_uuid UUID;
    user_role_id UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_uuid FROM roles WHERE name = role_name AND is_active = true;

    IF role_uuid IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist or is inactive', role_name;
    END IF;

    -- Insert or update user_role
    INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, is_active)
    VALUES (user_uuid, role_uuid, assigned_by_uuid, expires_at_param, true)
    ON CONFLICT (user_id, role_id)
    DO UPDATE SET
        is_active = true,
        assigned_by = COALESCE(EXCLUDED.assigned_by, user_roles.assigned_by),
        expires_at = COALESCE(EXCLUDED.expires_at, user_roles.expires_at),
        assigned_at = NOW()
    RETURNING id INTO user_role_id;

    RETURN user_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a role from a user
CREATE OR REPLACE FUNCTION remove_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    role_uuid UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_uuid FROM roles WHERE name = role_name;

    IF role_uuid IS NULL THEN
        RETURN false;
    END IF;

    -- Deactivate the user_role
    UPDATE user_roles
    SET is_active = false
    WHERE user_id = user_uuid AND role_id = role_uuid;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY "Anyone can view active roles"
    ON roles FOR SELECT
    USING (is_active = true);

CREATE POLICY "Service role can manage roles"
    ON roles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- User roles policies
-- Note: Cannot use has_role() here as it would create circular dependency
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Service role can view all roles"
    ON user_roles FOR SELECT
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can assign roles"
    ON user_roles FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can modify roles"
    ON user_roles FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can remove roles"
    ON user_roles FOR DELETE
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Permissions policies
CREATE POLICY "Anyone can view active permissions"
    ON permissions FOR SELECT
    USING (is_active = true);

CREATE POLICY "Service role can manage permissions"
    ON permissions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Role permissions policies
CREATE POLICY "Anyone can view role permissions"
    ON role_permissions FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage role permissions"
    ON role_permissions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TRIGGER: Auto-assign role on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_user_role()
RETURNS TRIGGER AS $$
DECLARE
    selected_role TEXT;
    role_id_to_assign UUID;
BEGIN
    -- Get role from user metadata, default to 'student' if not specified
    selected_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'student'
    );

    -- Validate that role is either 'student' or 'tutor'
    -- Admin roles should be assigned manually, not during signup
    IF selected_role NOT IN ('student', 'tutor') THEN
        selected_role := 'student';
    END IF;

    -- Get the role ID
    SELECT id INTO role_id_to_assign FROM roles WHERE name = selected_role LIMIT 1;

    IF role_id_to_assign IS NOT NULL THEN
        -- Assign the selected role to new user
        INSERT INTO user_roles (user_id, role_id, is_active)
        VALUES (NEW.id, role_id_to_assign, true)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_user_role();

-- =====================================================
-- VIEWS
-- =====================================================

-- View to see all users with their roles
CREATE OR REPLACE VIEW user_roles_view AS
SELECT
    u.id AS user_id,
    u.email,
    u.created_at AS user_created_at,
    r.name AS role_name,
    r.description AS role_description,
    ur.assigned_at,
    ur.expires_at,
    ur.is_active,
    ur.assigned_by
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE ur.is_active = true AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- View to see role distribution
CREATE OR REPLACE VIEW role_statistics AS
SELECT
    r.name AS role_name,
    r.description,
    COUNT(ur.user_id) AS user_count,
    COUNT(CASE WHEN ur.expires_at IS NOT NULL THEN 1 END) AS temporary_assignments
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
WHERE r.is_active = true
GROUP BY r.id, r.name, r.description
ORDER BY user_count DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE roles IS 'Defines available user roles in the system';
COMMENT ON TABLE user_roles IS 'Maps users to their assigned roles (many-to-many)';
COMMENT ON TABLE permissions IS 'Defines granular permissions for resources and actions';
COMMENT ON TABLE role_permissions IS 'Maps roles to their permissions';
COMMENT ON FUNCTION has_role IS 'Check if a user has a specific active role';
COMMENT ON FUNCTION has_any_role IS 'Check if a user has any of the specified roles';
COMMENT ON FUNCTION get_user_roles IS 'Get all active roles for a user';
COMMENT ON FUNCTION assign_role IS 'Assign a role to a user with optional expiration';
COMMENT ON FUNCTION remove_role IS 'Remove (deactivate) a role from a user';
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
-- Notes and Flashcards System Schema
-- For storing student notes and flashcards from NotebookLM and other sources

-- =====================================================
-- 1. STUDENT NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Association
    resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES resource_chapters(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    topic TEXT,

    -- Note Content
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown supported
    summary TEXT,

    -- Source
    source_type TEXT CHECK (source_type IN ('notebooklm', 'manual', 'tutor_session', 'textbook', 'online', 'other')),
    notebooklm_notebook_id TEXT, -- Reference to NotebookLM notebook
    original_source_url TEXT,

    -- Organization
    tags TEXT[],
    category TEXT CHECK (category IN ('concept', 'formula', 'problem_solving', 'revision', 'doubt', 'important', 'exam_tip')),

    -- Quality Metrics
    completeness_score INTEGER CHECK (completeness_score BETWEEN 1 AND 5),
    usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 5),

    -- Study Info
    estimated_revision_time_minutes INTEGER,
    last_reviewed_at TIMESTAMPTZ,
    times_reviewed INTEGER DEFAULT 0,
    is_important BOOLEAN DEFAULT false,
    is_doubt_cleared BOOLEAN DEFAULT false,

    -- Sharing
    is_shared BOOLEAN DEFAULT false,
    shared_with_tutor BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. FLASHCARD SETS
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcard_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Association
    resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES resource_chapters(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    topic TEXT,

    -- Set Details
    title TEXT NOT NULL,
    description TEXT,
    total_cards INTEGER DEFAULT 0,

    -- Source
    source_type TEXT CHECK (source_type IN ('notebooklm', 'manual', 'anki_import', 'quizlet_import', 'tutor_provided', 'other')),
    notebooklm_reference TEXT,

    -- Organization
    tags TEXT[],
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'mixed')),
    card_types TEXT[], -- ['definition', 'formula', 'concept', 'numerical']

    -- Progress
    cards_mastered INTEGER DEFAULT 0,
    cards_learning INTEGER DEFAULT 0,
    cards_new INTEGER DEFAULT 0,
    average_confidence DECIMAL(3,2) DEFAULT 0,

    -- Study Schedule
    recommended_daily_cards INTEGER DEFAULT 20,
    last_studied_at TIMESTAMPTZ,
    next_review_date DATE,

    -- Spaced Repetition
    uses_spaced_repetition BOOLEAN DEFAULT true,
    repetition_algorithm TEXT DEFAULT 'sm2', -- SM2, FSRS, etc.

    -- Sharing
    is_public BOOLEAN DEFAULT false,
    is_shared_with_study_group BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Stats
    total_study_sessions INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0
);

-- =====================================================
-- 3. FLASHCARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Card Content
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT,
    explanation TEXT,

    -- Additional Content
    image_url TEXT, -- For diagram-based cards
    formula_latex TEXT, -- LaTeX formatted formulas

    -- Classification
    card_type TEXT CHECK (card_type IN ('basic', 'definition', 'formula', 'concept', 'numerical', 'diagram', 'mechanism', 'fact')),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    importance_level INTEGER CHECK (importance_level BETWEEN 1 AND 5),

    -- Spaced Repetition Data (SM2 Algorithm)
    repetitions INTEGER DEFAULT 0,
    easiness_factor DECIMAL(3,2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    next_review_date DATE,

    -- Performance
    times_reviewed INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    average_response_time_seconds DECIMAL(5,2),

    -- Status
    learning_status TEXT DEFAULT 'new' CHECK (learning_status IN ('new', 'learning', 'review', 'mastered', 'difficult')),
    is_suspended BOOLEAN DEFAULT false, -- Temporarily skip this card
    is_leech BOOLEAN DEFAULT false, -- Card that keeps being wrong

    -- Tags & Organization
    tags TEXT[],
    related_card_ids UUID[], -- Related flashcards

    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. FLASHCARD REVIEW SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,

    -- Review Details
    review_date TIMESTAMPTZ DEFAULT NOW(),
    response_quality INTEGER CHECK (response_quality BETWEEN 0 AND 5),
    -- 0: Blackout, 1: Incorrect, 2: Incorrect but remembered, 3: Correct with difficulty,
    -- 4: Correct with hesitation, 5: Perfect recall

    response_time_seconds INTEGER,
    was_correct BOOLEAN,

    -- Context
    study_session_id UUID,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'

    -- Metadata
    previous_interval_days INTEGER,
    new_interval_days INTEGER,
    new_easiness_factor DECIMAL(3,2)
);

-- =====================================================
-- 5. STUDY SESSIONS (Enhanced for Flashcards)
-- =====================================================

CREATE TABLE IF NOT EXISTS flashcard_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,

    -- Session Info
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,

    -- Performance
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    cards_incorrect INTEGER DEFAULT 0,
    new_cards_learned INTEGER DEFAULT 0,
    cards_relearned INTEGER DEFAULT 0,

    -- Stats
    average_response_time_seconds DECIMAL(5,2),
    accuracy_percentage DECIMAL(5,2),
    focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),

    -- Study Mode
    study_mode TEXT CHECK (study_mode IN ('learn', 'review', 'cram', 'test', 'mixed')),
    settings JSONB, -- Study session settings

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. NOTE TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS note_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    template_type TEXT CHECK (template_type IN ('chapter_notes', 'concept_map', 'formula_sheet', 'problem_solving', 'revision', 'custom')),

    -- Template Content
    structure JSONB NOT NULL, -- JSON defining the template structure
    sections TEXT[], -- ['Introduction', 'Key Concepts', 'Formulas', 'Examples', 'Summary']

    -- Prompts for NotebookLM
    notebooklm_prompts TEXT[], -- Pre-defined prompts for generating notes

    -- Metadata
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. SHARED NOTES & FLASHCARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS shared_study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    material_type TEXT CHECK (material_type IN ('note', 'flashcard_set')),
    material_id UUID NOT NULL, -- References either student_notes.id or flashcard_sets.id
    shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Sharing Settings
    shared_with_user_ids UUID[], -- Specific users
    shared_with_study_group_id UUID, -- Reference to study group
    is_public BOOLEAN DEFAULT false,

    -- Access Control
    can_edit BOOLEAN DEFAULT false,
    can_download BOOLEAN DEFAULT true,
    can_reshare BOOLEAN DEFAULT false,

    -- Engagement
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,

    -- Comments
    comments_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Optional expiration
);

-- =====================================================
-- 8. NOTEBOOKLM INTEGRATION
-- =====================================================

CREATE TABLE IF NOT EXISTS notebooklm_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- NotebookLM Info
    notebooklm_email TEXT,
    notebooklm_user_id TEXT,

    -- Notebooks
    total_notebooks INTEGER DEFAULT 0,
    active_notebooks JSONB, -- Array of notebook objects

    -- Usage Stats
    total_notes_created INTEGER DEFAULT 0,
    total_flashcards_generated INTEGER DEFAULT 0,
    total_queries_asked INTEGER DEFAULT 0,

    -- Sync
    last_synced_at TIMESTAMPTZ,
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'manual')),

    -- Preferences
    default_note_template_id UUID REFERENCES note_templates(id),
    auto_generate_flashcards BOOLEAN DEFAULT true,
    flashcards_per_chapter INTEGER DEFAULT 50,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_subject ON student_notes(subject);
CREATE INDEX IF NOT EXISTS idx_student_notes_resource_id ON student_notes(resource_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_tags ON student_notes USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_flashcard_sets_student_id ON flashcard_sets(student_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_subject ON flashcard_sets(subject);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_next_review ON flashcard_sets(next_review_date);

CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_status ON flashcards(learning_status);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcards_difficulty ON flashcards(difficulty);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_card_id ON flashcard_reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_student_id ON flashcard_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_date ON flashcard_reviews(review_date);

CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_student_id ON flashcard_study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_set_id ON flashcard_study_sessions(set_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update flashcard set statistics
CREATE OR REPLACE FUNCTION update_flashcard_set_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE flashcard_sets
    SET
        total_cards = (SELECT COUNT(*) FROM flashcards WHERE set_id = NEW.set_id),
        cards_mastered = (SELECT COUNT(*) FROM flashcards WHERE set_id = NEW.set_id AND learning_status = 'mastered'),
        cards_learning = (SELECT COUNT(*) FROM flashcards WHERE set_id = NEW.set_id AND learning_status = 'learning'),
        cards_new = (SELECT COUNT(*) FROM flashcards WHERE set_id = NEW.set_id AND learning_status = 'new'),
        updated_at = NOW()
    WHERE id = NEW.set_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcard_set_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_flashcard_set_stats();

-- Update flashcard accuracy
CREATE OR REPLACE FUNCTION update_flashcard_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.times_reviewed > 0 THEN
        NEW.accuracy_percentage = (NEW.times_correct::DECIMAL / NEW.times_reviewed) * 100;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcard_accuracy_trigger
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_flashcard_accuracy();

-- Update timestamps
CREATE TRIGGER update_student_notes_updated_at BEFORE UPDATE ON student_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcard_sets_updated_at BEFORE UPDATE ON flashcard_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooklm_integration ENABLE ROW LEVEL SECURITY;

-- Students can manage their own notes
CREATE POLICY "Students can manage own notes"
    ON student_notes FOR ALL
    USING (auth.uid() = student_id);

-- Students can view shared notes
CREATE POLICY "Students can view shared notes"
    ON student_notes FOR SELECT
    USING (
        is_shared = true OR
        auth.uid() = student_id
    );

-- Students can manage their own flashcard sets
CREATE POLICY "Students can manage own flashcard sets"
    ON flashcard_sets FOR ALL
    USING (auth.uid() = student_id);

-- Students can view public flashcard sets
CREATE POLICY "Students can view public flashcard sets"
    ON flashcard_sets FOR SELECT
    USING (
        is_public = true OR
        auth.uid() = student_id
    );

-- Students can manage their own flashcards
CREATE POLICY "Students can manage own flashcards"
    ON flashcards FOR ALL
    USING (auth.uid() = student_id);

-- Students can manage their own reviews
CREATE POLICY "Students can manage own reviews"
    ON flashcard_reviews FOR ALL
    USING (auth.uid() = student_id);

-- Students can manage their own study sessions
CREATE POLICY "Students can manage own study sessions"
    ON flashcard_study_sessions FOR ALL
    USING (auth.uid() = student_id);

-- Everyone can view note templates
CREATE POLICY "Anyone can view note templates"
    ON note_templates FOR SELECT
    USING (true);

-- Students can create templates
CREATE POLICY "Students can create templates"
    ON note_templates FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Students can manage their own NotebookLM integration
CREATE POLICY "Students can manage own NotebookLM integration"
    ON notebooklm_integration FOR ALL
    USING (auth.uid() = student_id);

-- =====================================================
-- SEED DATA - NOTE TEMPLATES
-- =====================================================

INSERT INTO note_templates (name, description, subject, template_type, structure, sections, notebooklm_prompts) VALUES
('Standard Chapter Notes', 'Comprehensive notes for any chapter', 'general', 'chapter_notes',
 '{"type": "chapter_notes", "layout": "linear", "sections": ["introduction", "key_concepts", "formulas", "examples", "points", "mistakes", "summary"]}'::jsonb,
 ARRAY['Introduction', 'Key Concepts', 'Formulas & Definitions', 'Solved Examples', 'Important Points', 'Common Mistakes', 'Summary'],
 ARRAY['Create comprehensive notes with all key concepts', 'List all important formulas with explanations', 'Provide 5 solved examples', 'What are common mistakes in this chapter?']),

('Formula Sheet', 'Quick reference for all formulas', 'mathematics', 'formula_sheet',
 '{"type": "formula_sheet", "layout": "table", "columns": ["topic", "formula", "usage", "example"]}'::jsonb,
 ARRAY['Topic', 'Formula', 'When to Use', 'Example'],
 ARRAY['List all formulas in this chapter', 'Provide usage examples for each formula', 'Create a quick reference guide']),

('Concept Map', 'Visual representation of relationships', 'general', 'concept_map',
 '{"type": "concept_map", "layout": "hierarchical", "elements": ["main_topic", "subtopics", "related_concepts", "applications"]}'::jsonb,
 ARRAY['Main Topic', 'Sub-topics', 'Related Concepts', 'Applications'],
 ARRAY['Create a concept map showing all relationships', 'How do these topics connect?', 'What are the applications?']),

('Problem-Solving Guide', 'Step-by-step problem-solving strategies', 'general', 'problem_solving',
 '{"type": "problem_solving", "layout": "step_by_step", "sections": ["problem_types", "approach", "mistakes", "examples", "practice"]}'::jsonb,
 ARRAY['Problem Type', 'Approach', 'Common Mistakes', 'Solved Examples', 'Practice Problems'],
 ARRAY['What are the common problem types?', 'Provide solving strategies', 'List common mistakes']),

('Revision Sheet', 'Quick revision before exams', 'general', 'revision',
 '{"type": "revision", "layout": "compact", "sections": ["concepts", "formulas", "diagrams", "tips"]}'::jsonb,
 ARRAY['One-line Concepts', 'Key Formulas', 'Important Diagrams', 'Tips & Tricks'],
 ARRAY['Create a one-page revision sheet', 'List the most important points', 'What should I remember for exam?'])

ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE student_notes IS 'Student-created and AI-generated notes from various sources';
COMMENT ON TABLE flashcard_sets IS 'Collections of flashcards for spaced repetition learning';
COMMENT ON TABLE flashcards IS 'Individual flashcards with spaced repetition data';
COMMENT ON TABLE flashcard_reviews IS 'History of flashcard review sessions';
COMMENT ON TABLE notebooklm_integration IS 'Integration with Google NotebookLM platform';
-- Email Marketing Schema for CampusPandit
-- This schema creates tables for managing email subscribers and marketing preferences
-- Run this in your Supabase SQL Editor

-- Create email_subscribers table
CREATE TABLE IF NOT EXISTS email_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    subscribed BOOLEAN NOT NULL DEFAULT true,
    consent_date TIMESTAMPTZ,
    unsubscribe_date TIMESTAMPTZ,
    source TEXT CHECK (source IN ('registration', 'profile', 'landing_page', 'manual')),
    preferences JSONB DEFAULT '{
        "course_updates": true,
        "tournament_notifications": true,
        "weekly_digest": true,
        "promotional_offers": true
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);

-- Create index on user_id for user lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_user_id ON email_subscribers(user_id);

-- Create index on subscribed status for filtering
CREATE INDEX IF NOT EXISTS idx_email_subscribers_subscribed ON email_subscribers(subscribed);

-- Create index on source for analytics
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON email_subscribers(source);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_email_subscribers_updated_at ON email_subscribers;
CREATE TRIGGER update_email_subscribers_updated_at
    BEFORE UPDATE ON email_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriber record
CREATE POLICY "Users can view own subscriber record"
    ON email_subscribers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own subscriber record
CREATE POLICY "Users can update own subscriber record"
    ON email_subscribers
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriber record
CREATE POLICY "Users can insert own subscriber record"
    ON email_subscribers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all subscriber records
CREATE POLICY "Admins can view all subscriber records"
    ON email_subscribers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- Policy: Admins can update all subscriber records
CREATE POLICY "Admins can update all subscriber records"
    ON email_subscribers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- Policy: Allow public inserts for landing page signups (optional)
-- Uncomment if you want to allow anonymous signups from landing pages
-- CREATE POLICY "Allow public subscriber inserts"
--     ON email_subscribers
--     FOR INSERT
--     WITH CHECK (true);

-- Create view for subscriber statistics (admin only)
CREATE OR REPLACE VIEW subscriber_stats AS
SELECT
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
    COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
    COUNT(*) FILTER (WHERE source = 'registration') as from_registration,
    COUNT(*) FILTER (WHERE source = 'profile') as from_profile,
    COUNT(*) FILTER (WHERE source = 'landing_page') as from_landing_page,
    COUNT(*) FILTER (WHERE source = 'manual') as from_manual,
    COUNT(*) FILTER (WHERE preferences->>'course_updates' = 'true') as wants_course_updates,
    COUNT(*) FILTER (WHERE preferences->>'tournament_notifications' = 'true') as wants_tournament_notifications,
    COUNT(*) FILTER (WHERE preferences->>'weekly_digest' = 'true') as wants_weekly_digest,
    COUNT(*) FILTER (WHERE preferences->>'promotional_offers' = 'true') as wants_promotional_offers
FROM email_subscribers;

-- Grant access to subscriber_stats view for admins
GRANT SELECT ON subscriber_stats TO authenticated;

-- Create function to get subscriber stats
CREATE OR REPLACE FUNCTION get_subscriber_stats()
RETURNS TABLE (
    total_subscribers BIGINT,
    active_subscribers BIGINT,
    unsubscribed BIGINT,
    from_registration BIGINT,
    from_profile BIGINT,
    from_landing_page BIGINT,
    from_manual BIGINT,
    wants_course_updates BIGINT,
    wants_tournament_notifications BIGINT,
    wants_weekly_digest BIGINT,
    wants_promotional_offers BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM subscriber_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE email_subscribers IS 'Stores email subscriber information for marketing purposes';
COMMENT ON COLUMN email_subscribers.user_id IS 'References the authenticated user (nullable for non-users)';
COMMENT ON COLUMN email_subscribers.email IS 'Email address (unique)';
COMMENT ON COLUMN email_subscribers.subscribed IS 'Current subscription status';
COMMENT ON COLUMN email_subscribers.consent_date IS 'When the user gave consent to receive emails';
COMMENT ON COLUMN email_subscribers.unsubscribe_date IS 'When the user unsubscribed';
COMMENT ON COLUMN email_subscribers.source IS 'How the subscriber was acquired';
COMMENT ON COLUMN email_subscribers.preferences IS 'JSON object storing email preferences';

-- Sample data for testing (optional - remove in production)
-- INSERT INTO email_subscribers (email, name, subscribed, consent_date, source) VALUES
-- ('test1@example.com', 'Test User 1', true, NOW(), 'registration'),
-- ('test2@example.com', 'Test User 2', true, NOW(), 'profile'),
-- ('test3@example.com', 'Test User 3', false, NOW() - INTERVAL '30 days', 'landing_page');
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
