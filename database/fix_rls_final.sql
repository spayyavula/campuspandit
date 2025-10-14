-- Final fix for RLS recursion - drops ALL policies first

-- Drop ALL possible policy variations
DROP POLICY IF EXISTS "Users can view channel members" ON channel_members;
DROP POLICY IF EXISTS "Users can join channels" ON channel_members;
DROP POLICY IF EXISTS "Users can leave channels" ON channel_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON channel_members;
DROP POLICY IF EXISTS "Channel creators can manage members" ON channel_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON channel_members;
DROP POLICY IF EXISTS "Users can view public channel members" ON channel_members;
DROP POLICY IF EXISTS "Users can add themselves as members" ON channel_members;
DROP POLICY IF EXISTS "Channel creators can add members" ON channel_members;
DROP POLICY IF EXISTS "Users can update own membership" ON channel_members;
DROP POLICY IF EXISTS "channel_members_select_own" ON channel_members;
DROP POLICY IF EXISTS "channel_members_insert_own" ON channel_members;
DROP POLICY IF EXISTS "channel_members_update_own" ON channel_members;
DROP POLICY IF EXISTS "channel_members_delete_own" ON channel_members;

-- Disable and re-enable RLS
ALTER TABLE channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Create ONLY simple, non-recursive policies
-- These policies check ONLY auth.uid() = user_id - no table joins that could cause recursion

CREATE POLICY "channel_members_select"
    ON channel_members FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "channel_members_insert"
    ON channel_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "channel_members_update"
    ON channel_members FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "channel_members_delete"
    ON channel_members FOR DELETE
    USING (auth.uid() = user_id);
