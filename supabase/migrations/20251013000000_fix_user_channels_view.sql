-- Fix user_channels_with_unread view to include user_id column
-- This resolves the 400 error when fetching user channels

DROP VIEW IF EXISTS user_channels_with_unread;

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
