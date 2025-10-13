-- =====================================================
-- UPDATE TO v2.4 - Role-Based Signup
-- =====================================================
-- This migration updates the auto-assign trigger to support
-- role selection during signup (Student vs Tutor)
--
-- Run this if you already have v2.3 and want to update
-- to v2.4 without dropping all tables
-- =====================================================

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auto_assign_student_role();

-- Create the new function that reads role from metadata
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

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_user_role();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated to v2.4 - Role-based signup is now active!';
END $$;
