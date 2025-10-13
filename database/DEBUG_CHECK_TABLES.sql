-- =====================================================
-- DIAGNOSTIC SCRIPT - Check which tables exist and their columns
-- =====================================================
-- Run this in Supabase SQL Editor to see which tables
-- are already created and if they have user_id columns
-- =====================================================

-- Check if roles table exists and its columns
SELECT 'roles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'roles'
ORDER BY ordinal_position;

-- Check if user_roles table exists and its columns
SELECT 'user_roles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- Check if tutor_profiles table exists and its columns
SELECT 'tutor_profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tutor_profiles'
ORDER BY ordinal_position;

-- Check if email_subscribers table exists and its columns
SELECT 'email_subscribers' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'email_subscribers'
ORDER BY ordinal_position;

-- Check if channel_members table exists and its columns
SELECT 'channel_members' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'channel_members'
ORDER BY ordinal_position;

-- Check if messages table exists and its columns
SELECT 'messages' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

-- List all public tables that have user_id column
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'user_id'
ORDER BY table_name;

-- List all public tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
