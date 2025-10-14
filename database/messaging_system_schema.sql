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
    cm.user_id,
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
