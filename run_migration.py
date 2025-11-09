#!/usr/bin/env python3
"""
Simple script to run the PostgreSQL migration
"""
import asyncio
import asyncpg
import sys

async def run_migration():
    try:
        # Read the migration file
        with open("database/azure-postgresql-migration.sql", "r", encoding="utf-8") as f:
            migration_sql = f.read()

        print("Connecting to database...")
        # Connect to the database (password: @ -> %40, ! -> %21)
        conn = await asyncpg.connect(
            host="campuspandit-db.postgres.database.azure.com",
            port=5432,
            user="dbadmin",
            password="@Sree870709!",
            database="campuspandit",
            ssl="require"
        )

        print("Running migration...")
        # Execute the migration
        await conn.execute(migration_sql)

        print("[SUCCESS] Migration completed successfully!")

        # Close the connection
        await conn.close()

        return 0
    except Exception as e:
        print(f"[FAILED] Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(run_migration())
    sys.exit(exit_code)
