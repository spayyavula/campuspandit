-- =====================================================
-- Real-Time Chat & Messaging System
-- Enables direct communication between students and tutors
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CONVERSATIONS TABLE
-- Stores chat threads between users
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participants (student and tutor)
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Metadata
    subject VARCHAR(100),  -- What subject is being discussed
    session_id UUID REFERENCES tutoring_sessions(id),  -- Optional: linked to a session

    -- Last Activity
    last_message_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,  -- First 100 chars of last message

    -- Status
    is_archived_by_student BOOLEAN DEFAULT FALSE,
    is_archived_by_tutor BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique conversation between two users
    CONSTRAINT unique_conversation UNIQUE (student_id, tutor_id)
);

-- Indexes for conversations
CREATE INDEX idx_conversations_student_id ON conversations(student_id);
CREATE INDEX idx_conversations_tutor_id ON conversations(tutor_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_active_student ON conversations(student_id, last_message_at DESC)
    WHERE is_archived_by_student = FALSE;
CREATE INDEX idx_conversations_active_tutor ON conversations(tutor_id, last_message_at DESC)
    WHERE is_archived_by_tutor = FALSE;

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Students can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Tutors can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Participants can update conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = student_id OR auth.uid() = tutor_id);


-- =====================================================
-- 2. MESSAGES TABLE
-- Stores individual messages in conversations
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Conversation
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Sender
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Message Content
    message_type VARCHAR(20) DEFAULT 'text',  -- text, image, file, system
    content TEXT,  -- Message text (max 5000 chars)

    -- Attachments
    attachment_url TEXT,  -- URL to uploaded file/image
    attachment_type VARCHAR(50),  -- image/png, application/pdf, etc.
    attachment_size INTEGER,  -- Size in bytes
    attachment_name VARCHAR(255),  -- Original filename

    -- Message Status
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Read Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    reply_to_id UUID REFERENCES messages(id),  -- For message replies
    metadata JSONB DEFAULT '{}',  -- Extra data (reactions, etc.)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_message_length CHECK (char_length(content) <= 5000),
    CONSTRAINT message_has_content CHECK (content IS NOT NULL OR attachment_url IS NOT NULL)
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.student_id = auth.uid() OR conversations.tutor_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_id
            AND (conversations.student_id = auth.uid() OR conversations.tutor_id = auth.uid())
        )
    );

CREATE POLICY "Senders can update own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete own messages"
    ON messages FOR DELETE
    USING (auth.uid() = sender_id);


-- =====================================================
-- 3. TYPING INDICATORS TABLE
-- Track when users are typing (ephemeral data)
-- =====================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Auto-expire after 5 seconds
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 seconds'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Only one typing indicator per user per conversation
    CONSTRAINT unique_typing_indicator UNIQUE (conversation_id, user_id)
);

-- Index for quick lookups
CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id, expires_at);

-- Enable RLS
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for typing indicators
CREATE POLICY "Users can view typing in their conversations"
    ON typing_indicators FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = typing_indicators.conversation_id
            AND (conversations.student_id = auth.uid() OR conversations.tutor_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert typing indicators"
    ON typing_indicators FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own typing indicators"
    ON typing_indicators FOR DELETE
    USING (auth.uid() = user_id);


-- =====================================================
-- 4. ONLINE STATUS TABLE
-- Track user online/offline status
-- =====================================================

CREATE TABLE IF NOT EXISTS user_online_status (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_user_online_status_online ON user_online_status(is_online, last_seen_at DESC);

-- Enable RLS
ALTER TABLE user_online_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view online status"
    ON user_online_status FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can update own status"
    ON user_online_status FOR ALL
    USING (auth.uid() = user_id);


-- =====================================================
-- 5. TRIGGER FUNCTIONS
-- Auto-update conversation metadata and cleanup
-- =====================================================

-- Update conversation when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_after_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_new_message();


-- Auto-delete expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run cleanup every minute (set up with pg_cron or external scheduler)
-- For now, we'll handle this client-side


-- Mark messages as read when viewed
CREATE OR REPLACE FUNCTION mark_message_as_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_read_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION mark_message_as_read();


-- =====================================================
-- 6. HELPER FUNCTIONS
-- Useful functions for chat operations
-- =====================================================

-- Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM messages
    WHERE receiver_id = p_user_id
    AND is_read = FALSE
    AND is_deleted = FALSE;
$$ LANGUAGE sql STABLE;


-- Get unread count for a specific conversation
CREATE OR REPLACE FUNCTION get_conversation_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM messages
    WHERE conversation_id = p_conversation_id
    AND receiver_id = p_user_id
    AND is_read = FALSE
    AND is_deleted = FALSE;
$$ LANGUAGE sql STABLE;


-- Get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_student_id UUID,
    p_tutor_id UUID,
    p_subject VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE student_id = p_student_id AND tutor_id = p_tutor_id;

    -- If not found, create new conversation
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (student_id, tutor_id, subject)
        VALUES (p_student_id, p_tutor_id, p_subject)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 7. ENABLE REALTIME
-- Enable Supabase Realtime for chat tables
-- =====================================================

-- Enable realtime for messages (most important)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for conversations (for unread counts, etc.)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Enable realtime for online status
ALTER PUBLICATION supabase_realtime ADD TABLE user_online_status;


-- =====================================================
-- 8. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- You can uncomment these to add test data

-- INSERT INTO conversations (student_id, tutor_id, subject) VALUES
-- ('student-uuid-here', 'tutor-uuid-here', 'Mathematics');

-- INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES
-- ('conversation-uuid-here', 'sender-uuid', 'receiver-uuid', 'Hello! I have a question about calculus.');


COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================

-- To run this migration:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run"

-- To verify:
-- SELECT * FROM conversations;
-- SELECT * FROM messages;

-- To enable realtime in your app:
-- const channel = supabase.channel('messages')
--   .on('postgres_changes', {
--     event: 'INSERT',
--     schema: 'public',
--     table: 'messages'
--   }, handleNewMessage)
--   .subscribe()
