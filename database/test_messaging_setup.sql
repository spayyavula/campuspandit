-- Test script to verify messaging system setup
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if tables exist
SELECT 'channels table exists' AS status, COUNT(*) AS count FROM channels;
SELECT 'channel_members table exists' AS status, COUNT(*) AS count FROM channel_members;
SELECT 'messages table exists' AS status, COUNT(*) AS count FROM messages;

-- 2. Check if the update_updated_at_column function exists
SELECT
    'update_updated_at_column function' AS check_type,
    COUNT(*) AS exists
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- 3. Check triggers on channels table
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'channels';

-- 4. Check RLS policies on channels
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'channels';

-- 5. Try a simple insert (this will show the actual error)
-- Note: Replace 'your-user-id-here' with an actual user ID from auth.users
-- You can get one by running: SELECT id FROM auth.users LIMIT 1;
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a real user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Try to insert a test channel
        INSERT INTO channels (name, description, channel_type, is_private, created_by)
        VALUES ('test-channel-' || gen_random_uuid()::text, 'Test', 'group', false, test_user_id);

        RAISE NOTICE 'SUCCESS: Test channel created successfully';

        -- Clean up
        DELETE FROM channels WHERE name LIKE 'test-channel-%';
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;
