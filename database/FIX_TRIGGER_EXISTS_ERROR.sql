-- =====================================================
-- FIX: Trigger Already Exists Error
-- =====================================================
-- This script fixes the "trigger already exists" error
-- Run this BEFORE running CONSOLIDATED_MIGRATIONS_FINAL.sql
--
-- This will drop the existing trigger so it can be recreated
-- with the updated logic from v2.4
-- =====================================================

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- The migration script will then create the updated version
-- with the new auto_assign_user_role() function that reads
-- the role from user metadata (for Student vs Tutor selection)

-- =====================================================
-- DONE - Now you can run CONSOLIDATED_MIGRATIONS_FINAL.sql
-- =====================================================
