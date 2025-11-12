#!/usr/bin/env python3
"""
Test script for real-time messaging system
Tests PostgreSQL LISTEN/NOTIFY integration with SSE
"""

import asyncio
import sys
import os
import uuid
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.realtime.pg_listener import PostgreSQLListener
from app.sse.sse_manager import SSEConnectionManager


async def test_trigger_installation():
    """Test 1: Verify triggers are installed"""
    print("\n" + "="*70)
    print("TEST 1: Checking if triggers are installed")
    print("="*70)

    async with engine.begin() as conn:
        # Check for message trigger
        result = await conn.execute(text("""
            SELECT trigger_name, event_manipulation, action_timing
            FROM information_schema.triggers
            WHERE trigger_name IN ('notify_new_message', 'notify_new_reaction')
            ORDER BY trigger_name
        """))

        triggers = result.fetchall()

        if len(triggers) >= 2:
            print("[PASS] Triggers found:")
            for trigger in triggers:
                print(f"  - {trigger[0]} ({trigger[2]} {trigger[1]})")
            return True
        else:
            print(f"[FAIL] Expected 2+ triggers, found {len(triggers)}")
            return False


async def test_table_existence():
    """Test 2: Verify messaging tables exist"""
    print("\n" + "="*70)
    print("TEST 2: Checking if messaging tables exist")
    print("="*70)

    required_tables = ['channels', 'channel_members', 'channel_messages', 'message_reactions']

    async with engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('channels', 'channel_members', 'channel_messages', 'message_reactions')
            ORDER BY table_name
        """))

        tables = [row[0] for row in result.fetchall()]

        missing = set(required_tables) - set(tables)

        if not missing:
            print("[PASS] All required tables exist:")
            for table in tables:
                print(f"  - {table}")
            return True
        else:
            print(f"[FAIL] Missing tables: {missing}")
            print(f"Found tables: {tables}")
            return False


async def test_listener_connection():
    """Test 3: Test PostgreSQL listener can connect"""
    print("\n" + "="*70)
    print("TEST 3: Testing PostgreSQL LISTEN/NOTIFY connection")
    print("="*70)

    listener = PostgreSQLListener()

    try:
        await listener.connect()
        print("[PASS] Successfully connected to PostgreSQL")

        # Test listening to a channel
        await listener.listen('channel_messages')
        print("[PASS] Successfully started listening to 'channel_messages' channel")

        await listener.disconnect()
        print("[PASS] Successfully disconnected")

        return True

    except Exception as e:
        print(f"[FAIL] Connection test failed: {e}")
        return False


async def test_message_notification():
    """Test 4: Insert a test message and verify NOTIFY is sent"""
    print("\n" + "="*70)
    print("TEST 4: Testing message INSERT trigger")
    print("="*70)

    listener = PostgreSQLListener()
    notifications_received = []

    # Callback to capture notifications
    async def capture_notification(channel, data):
        notifications_received.append((channel, data))
        print(f"[INFO] Received notification on '{channel}': {data.get('operation')} message_id={data.get('id')}")

    try:
        # Connect and register callback
        await listener.connect()
        listener.register_callback('channel_messages', capture_notification)
        await listener.listen('channel_messages')

        print("[INFO] Listener ready, inserting test message...")

        # Create test data
        test_channel_id = uuid.uuid4()
        test_user_id = uuid.uuid4()
        test_message_id = uuid.uuid4()

        # Create test user first
        async with engine.begin() as conn:
            await conn.execute(text("""
                INSERT INTO users (id, email, password_hash, role)
                VALUES (:id, :email, 'test_hash', 'STUDENT')
            """), {
                'id': test_user_id,
                'email': f'test-{test_user_id}@example.com'
            })

            print(f"[INFO] Created test user: {test_user_id}")

        # Insert test channel
        async with engine.begin() as conn:
            await conn.execute(text("""
                INSERT INTO channels (id, name, channel_type, created_by)
                VALUES (:id, :name, 'GROUP', :created_by)
            """), {
                'id': test_channel_id,
                'name': f'test-channel-{test_channel_id}',
                'created_by': test_user_id
            })

            print(f"[INFO] Created test channel: {test_channel_id}")

        # Insert test message
        async with engine.begin() as conn:
            await conn.execute(text("""
                INSERT INTO channel_messages (id, channel_id, user_id, content)
                VALUES (:id, :channel_id, :user_id, :content)
            """), {
                'id': test_message_id,
                'channel_id': test_channel_id,
                'user_id': test_user_id,
                'content': 'Test message for NOTIFY trigger'
            })

            print(f"[INFO] Inserted test message: {test_message_id}")

        # Wait for notification
        print("[INFO] Waiting for notification...")
        await asyncio.sleep(2)

        # Check if notification was received
        if notifications_received:
            print(f"[PASS] Received {len(notifications_received)} notification(s)")
            return True
        else:
            print("[FAIL] No notifications received")
            return False

    except Exception as e:
        print(f"[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Cleanup
        try:
            async with engine.begin() as conn:
                # Delete in correct order (messages -> channels -> users)
                await conn.execute(text("""
                    DELETE FROM channel_messages WHERE channel_id = :channel_id
                """), {'channel_id': test_channel_id})
                await conn.execute(text("""
                    DELETE FROM channels WHERE id = :id
                """), {'id': test_channel_id})
                await conn.execute(text("""
                    DELETE FROM users WHERE id = :id
                """), {'id': test_user_id})
                print("[INFO] Cleaned up test data")
        except Exception as e:
            print(f"[WARN] Cleanup failed: {e}")

        await listener.disconnect()


async def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("REAL-TIME MESSAGING SYSTEM TEST SUITE")
    print("="*70)

    tests = [
        ("Trigger Installation", test_trigger_installation),
        ("Table Existence", test_table_existence),
        ("Listener Connection", test_listener_connection),
        ("Message Notification", test_message_notification),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"[ERROR] Test '{test_name}' crashed: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n[SUCCESS] All tests passed! Real-time messaging system is ready.")
        return 0
    else:
        print("\n[FAILURE] Some tests failed. Please check the output above.")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nTest suite crashed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
