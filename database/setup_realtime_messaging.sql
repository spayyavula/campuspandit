-- =====================================================
-- Real-time Messaging System Setup
-- Creates tables and PostgreSQL LISTEN/NOTIFY triggers
-- =====================================================

-- =====================================================
-- 1. CREATE TABLES (if using SQL instead of SQLAlchemy)
-- =====================================================
-- Note: These tables will be created by SQLAlchemy models
-- This section is for reference or manual setup only

-- =====================================================
-- 2. SETUP LISTEN/NOTIFY TRIGGERS
-- =====================================================

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS notify_new_message ON channel_messages;
DROP TRIGGER IF EXISTS notify_new_reaction ON message_reactions;
DROP FUNCTION IF EXISTS notify_message_change();
DROP FUNCTION IF EXISTS notify_reaction_change();

-- Create function that sends NOTIFY when messages change
CREATE OR REPLACE FUNCTION notify_message_change()
RETURNS trigger AS $$
DECLARE
    payload JSON;
BEGIN
    -- Build JSON payload with message data
    IF (TG_OP = 'INSERT') THEN
        payload = json_build_object(
            'operation', 'INSERT',
            'table', 'channel_messages',
            'id', NEW.id,
            'channel_id', NEW.channel_id,
            'user_id', NEW.user_id,
            'content', NEW.content,
            'created_at', NEW.created_at,
            'is_pinned', COALESCE(NEW.is_pinned, false),
            'reaction_count', COALESCE(NEW.reaction_count, 0)
        );

        -- Send notification on 'channel_messages' channel
        PERFORM pg_notify('channel_messages', payload::text);

        -- Also send on channel-specific channel for targeted listening
        PERFORM pg_notify('channel_' || NEW.channel_id::text, payload::text);

        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        payload = json_build_object(
            'operation', 'UPDATE',
            'table', 'channel_messages',
            'id', NEW.id,
            'channel_id', NEW.channel_id,
            'user_id', NEW.user_id,
            'content', NEW.content,
            'created_at', NEW.created_at,
            'is_pinned', COALESCE(NEW.is_pinned, false),
            'reaction_count', COALESCE(NEW.reaction_count, 0)
        );

        PERFORM pg_notify('channel_messages', payload::text);
        PERFORM pg_notify('channel_' || NEW.channel_id::text, payload::text);

        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        payload = json_build_object(
            'operation', 'DELETE',
            'table', 'channel_messages',
            'id', OLD.id,
            'channel_id', OLD.channel_id
        );

        PERFORM pg_notify('channel_messages', payload::text);
        PERFORM pg_notify('channel_' || OLD.channel_id::text, payload::text);

        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on channel_messages table
CREATE TRIGGER notify_new_message
AFTER INSERT OR UPDATE OR DELETE ON channel_messages
FOR EACH ROW
EXECUTE FUNCTION notify_message_change();

-- Create trigger function for message reactions
CREATE OR REPLACE FUNCTION notify_reaction_change()
RETURNS trigger AS $$
DECLARE
    payload JSON;
    msg_channel_id UUID;
BEGIN
    -- Get the channel_id from the message
    SELECT channel_id INTO msg_channel_id
    FROM channel_messages
    WHERE id = COALESCE(NEW.message_id, OLD.message_id);

    IF (TG_OP = 'INSERT') THEN
        payload = json_build_object(
            'operation', 'INSERT',
            'table', 'message_reactions',
            'id', NEW.id,
            'message_id', NEW.message_id,
            'user_id', NEW.user_id,
            'emoji', NEW.emoji,
            'created_at', NEW.created_at,
            'channel_id', msg_channel_id
        );

        PERFORM pg_notify('message_reactions', payload::text);
        IF msg_channel_id IS NOT NULL THEN
            PERFORM pg_notify('channel_' || msg_channel_id::text, payload::text);
        END IF;

        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        payload = json_build_object(
            'operation', 'DELETE',
            'table', 'message_reactions',
            'id', OLD.id,
            'message_id', OLD.message_id,
            'user_id', OLD.user_id,
            'channel_id', msg_channel_id
        );

        PERFORM pg_notify('message_reactions', payload::text);
        IF msg_channel_id IS NOT NULL THEN
            PERFORM pg_notify('channel_' || msg_channel_id::text, payload::text);
        END IF;

        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on message_reactions table
CREATE TRIGGER notify_new_reaction
AFTER INSERT OR DELETE ON message_reactions
FOR EACH ROW
EXECUTE FUNCTION notify_reaction_change();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all triggers
SELECT
    schemaname,
    tablename,
    trigger_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('notify_new_message', 'notify_new_reaction')
ORDER BY tablename;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Real-time messaging triggers created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created triggers:';
    RAISE NOTICE '  - notify_new_message on channel_messages';
    RAISE NOTICE '  - notify_new_reaction on message_reactions';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTIFY channels:';
    RAISE NOTICE '  - channel_messages (all message changes)';
    RAISE NOTICE '  - message_reactions (all reaction changes)';
    RAISE NOTICE '  - channel_{channel_id} (channel-specific messages and reactions)';
END $$;
