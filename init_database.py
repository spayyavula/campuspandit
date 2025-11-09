#!/usr/bin/env python3
"""
Initialize Database Tables from SQLAlchemy Models
Creates all tables defined in the backend models for Azure PostgreSQL
"""

import asyncio
import sys
import os

# Add backend to path so we can import from app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def init_db():
    """Initialize database tables"""
    try:
        print("Importing database configuration...")
        from app.core.database import engine, Base

        print("Importing all models to register them with Base.metadata...")
        # Import all models so they are registered with Base.metadata
        from app.models.user import User, EmailVerificationToken, PasswordResetToken, UserSession
        from app.models.tutors import TutorProfile, StudentProfile, MatchingHistory, TutorReview
        from app.models.scheduling import (
            TutorAvailability, TutorTimeBlock, TutoringSession,
            ReminderPreferences, ReminderLog, NoShowHistory, SessionAnalytics
        )
        from app.models.messaging import (
            Channel, ChannelMember, ChannelMessage, MessageReaction,
            TypingIndicator, DirectMessage
        )

        print("\nRegistered tables:")
        for table_name in Base.metadata.tables.keys():
            print(f"  - {table_name}")

        print("\nConnecting to database and creating tables...")

        # Use run_sync to execute the synchronous create_all method
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        print("\n✅ SUCCESS! All tables created successfully!")
        print("\nCreated tables:")
        for table_name in sorted(Base.metadata.tables.keys()):
            print(f"  ✓ {table_name}")

        await engine.dispose()
        return 0

    except Exception as e:
        print(f"\n❌ FAILED! Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(init_db())
    sys.exit(exit_code)
