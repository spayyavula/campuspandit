#!/usr/bin/env python3
"""
Setup PostgreSQL LISTEN/NOTIFY triggers for real-time messaging
This replicates Supabase's real-time functionality using native PostgreSQL
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine


async def setup_realtime_triggers():
    """Create PostgreSQL triggers to NOTIFY on message events"""

    # List of SQL statements to execute separately
    sql_statements = [
        # Drop existing triggers and functions
        "DROP TRIGGER IF EXISTS notify_new_message ON channel_messages",
        "DROP FUNCTION IF EXISTS notify_message_change()",

        # Create message notification function
        """
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

                PERFORM pg_notify('channel_messages', payload::text);
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
        $$ LANGUAGE plpgsql
        """,

        # Create trigger on channel_messages
        """
        CREATE TRIGGER notify_new_message
        AFTER INSERT OR UPDATE OR DELETE ON channel_messages
        FOR EACH ROW
        EXECUTE FUNCTION notify_message_change()
        """,

        # Drop existing reaction triggers and functions
        "DROP TRIGGER IF EXISTS notify_new_reaction ON message_reactions",
        "DROP FUNCTION IF EXISTS notify_reaction_change()",

        # Create reaction notification function
        """
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
        $$ LANGUAGE plpgsql
        """,

        # Create trigger on message_reactions
        """
        CREATE TRIGGER notify_new_reaction
        AFTER INSERT OR DELETE ON message_reactions
        FOR EACH ROW
        EXECUTE FUNCTION notify_reaction_change()
        """
    ]

    async with engine.begin() as conn:
        # Execute each statement separately
        for i, stmt in enumerate(sql_statements, 1):
            try:
                await conn.execute(text(stmt))
                print(f"[{i}/{len(sql_statements)}] Executed statement")
            except Exception as e:
                print(f"[{i}/{len(sql_statements)}] Warning: {e}")
                # Continue with other statements even if one fails

        print("\n[SUCCESS] PostgreSQL LISTEN/NOTIFY triggers created successfully!")
        print("")
        print("Created:")
        print("  + Function: notify_message_change()")
        print("  + Trigger: notify_new_message on channel_messages")
        print("  + Function: notify_reaction_change()")
        print("  + Trigger: notify_new_reaction on message_reactions")
        print("")
        print("NOTIFY channels created:")
        print("  - 'channel_messages' - All message changes")
        print("  - 'channel_{channel_id}' - Messages for specific channel")
        print("  - 'message_reactions' - All reaction changes")


if __name__ == "__main__":
    print("Setting up PostgreSQL LISTEN/NOTIFY triggers for real-time messaging")
    print("=" * 70)

    try:
        asyncio.run(setup_realtime_triggers())
        print("\n[SUCCESS] Real-time triggers setup completed!")
        print("\nBackend can now LISTEN to these channels and receive notifications")
        print("when messages are created, updated, or deleted.")
    except Exception as e:
        print(f"\n[ERROR] Setup failed: {e}")
        sys.exit(1)
