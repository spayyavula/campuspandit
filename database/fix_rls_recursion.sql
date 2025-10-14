-- Fix infinite recursion in channel_members RLS policies
-- The issue is that policies were checking channel_members within channel_members policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view channel members" ON channel_members;
DROP POLICY IF EXISTS "Users can join channels" ON channel_members;
DROP POLICY IF EXISTS "Users can leave channels" ON channel_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON channel_members;
DROP POLICY IF EXISTS "Channel creators can manage members" ON channel_members;

-- Temporarily disable RLS to allow inserting during channel creation
-- We'll use simpler policies that don't recurse
ALTER TABLE channel_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- Allow users to view all channel members (for channels they're in)
-- This uses the user_id directly without recursion
CREATE POLICY "Users can view their own memberships"
    ON channel_members FOR SELECT
    USING (user_id = auth.uid());

-- Allow users to view members of public channels
CREATE POLICY "Users can view public channel members"
    ON channel_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM channels
            WHERE channels.id = channel_members.channel_id
            AND channels.is_private = false
        )
    );

-- Allow authenticated users to insert themselves as members
-- This is needed when creating a channel
CREATE POLICY "Users can add themselves as members"
    ON channel_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Allow channel creators to add members
CREATE POLICY "Channel creators can add members"
    ON channel_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM channels
            WHERE channels.id = channel_members.channel_id
            AND channels.created_by = auth.uid()
        )
    );

-- Allow users to update their own membership settings
CREATE POLICY "Users can update own membership"
    ON channel_members FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow users to remove themselves from channels
CREATE POLICY "Users can leave channels"
    ON channel_members FOR DELETE
    USING (user_id = auth.uid());
