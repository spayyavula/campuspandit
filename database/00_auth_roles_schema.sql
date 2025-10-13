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
