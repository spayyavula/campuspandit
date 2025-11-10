#!/usr/bin/env python3
"""
Add missing columns to channel_messages table
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine


async def add_missing_columns():
    """Add is_pinned and reaction_count columns if they don't exist"""

    sql = """
    ALTER TABLE channel_messages
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS reaction_count INTEGER DEFAULT 0;
    """

    async with engine.begin() as conn:
        await conn.execute(text(sql))
        print("[SUCCESS] Successfully added missing columns to channel_messages table")
        print("   - is_pinned (BOOLEAN, default FALSE)")
        print("   - reaction_count (INTEGER, default 0)")


if __name__ == "__main__":
    print("Running database migration: Add missing columns to channel_messages")
    print("=" * 70)

    try:
        asyncio.run(add_missing_columns())
        print("\n[SUCCESS] Migration completed successfully!")
    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        sys.exit(1)
