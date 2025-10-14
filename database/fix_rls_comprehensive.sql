-- Comprehensive fix for RLS recursion issue
-- This will completely reset the channel_members policies

-- Step 1: Check existing policies (for debugging)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'channel_members';

-- Step 2: Drop ALL policies on channel_members
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'channel_members'
          AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON channel_members', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Temporarily disable RLS on channel_members
ALTER TABLE channel_members DISABLE ROW LEVEL SECURITY;

-- Step 4: Re-enable RLS
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple policies with NO recursion

-- Policy 1: Allow users to see their own memberships
CREATE POLICY "channel_members_select_own"
    ON channel_members FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Allow users to insert their own memberships
CREATE POLICY "channel_members_insert_own"
    ON channel_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow users to update their own memberships
CREATE POLICY "channel_members_update_own"
    ON channel_members FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Allow users to delete their own memberships
CREATE POLICY "channel_members_delete_own"
    ON channel_members FOR DELETE
    USING (auth.uid() = user_id);

-- Step 6: Verify policies were created
SELECT
    policyname,
    cmd as operation,
    CASE
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_check,
    CASE
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check
FROM pg_policies
WHERE tablename = 'channel_members'
ORDER BY policyname;
