# Azure PostgreSQL Deployment Guide

## Quick Start

### Step 1: Prerequisites
Ensure your Azure PostgreSQL instance has the pgcrypto extension:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Step 2: Run Migration
Execute the entire migration file in your Azure PostgreSQL database:
```
database/azure-postgresql-migration.sql
```

**Method 1: Azure Portal**
- Open Query Editor in Azure Portal
- Copy and paste the entire migration file
- Click Execute

**Method 2: psql Command Line**
```bash
psql -h your-server.postgres.database.azure.com \
     -U your-admin-user \
     -d your-database \
     -f database/azure-postgresql-migration.sql
```

**Method 3: pgAdmin**
- Connect to your Azure PostgreSQL server
- Right-click database
- Select "Query Tool"
- Open and execute the migration file

### Step 3: Verify Installation
```sql
-- Check auth schema exists
SELECT schema_name FROM information_schema.schemata
WHERE schema_name = 'auth';

-- Check auth.users table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'auth' AND table_name = 'users';

-- Check auth.uid() function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'auth' AND routine_name = 'uid';
```

All three should return results if the migration was successful.

## Application Integration

### Setting User Context
Before executing queries that use RLS policies, your application must set the current user:

**In your backend (Node.js/Express example):**
```javascript
// After user authentication
app.use((req, res, next) => {
    if (req.user) {
        // Execute SET command to establish user context
        db.query(`SET app.current_user_id = '${req.user.id}'`);
    }
    next();
});
```

**In your backend (Python/FastAPI example):**
```python
@app.middleware("http")
async def set_user_context(request: Request, call_next):
    user_id = get_current_user_id(request)  # Your auth logic
    if user_id:
        async with db.connection() as conn:
            await conn.execute(f"SET app.current_user_id = '{user_id}'")
    return await call_next(request)
```

### Using auth.uid() in RLS Policies
After setting the context, your RLS policies will work with `auth.uid()`:

```sql
-- Example: Users can only see their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profile_select ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_profile_update ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());
```

### Using auth.users Table
Insert user records when they sign up:

```sql
INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
VALUES (
    'user@example.com',
    'hashed_password_here',
    '{"role": "student", "name": "John Doe"}'::jsonb
);
```

## Migration Features

### What Gets Created
- **auth schema**: Dedicated authentication schema
- **auth.users table**: User authentication records with all Supabase-compatible fields
- **auth.uid() function**: Session-based user identification
- **70+ application tables**: Complete CRM, tutoring, learning, and messaging systems
- **RLS policies**: Row-level security for all tables
- **Triggers**: Automatic timestamp updates, stats calculations
- **Views**: Aggregated data views (sales, coaching, messaging stats)
- **Indexes**: Performance optimization for common queries

### Automatic Cleanup
The migration file includes automatic cleanup that will:
- Drop existing triggers (if any)
- Drop RLS policies (if any)
- Drop indexes (if any)

This means it's safe to re-run the migration on existing databases.

## Data Types & Compatibility

### PostgreSQL Extensions Required
- **pgcrypto**: For `gen_random_uuid()` function

### JSON Support
The migration uses JSONB (not TEXT JSON):
```sql
-- This is used throughout for flexible metadata
raw_user_meta_data JSONB DEFAULT '{}'::jsonb
```

### UUID Support
All primary keys use UUID type:
```sql
-- Direct support in PostgreSQL 13+
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

## Troubleshooting

### Error: "extension pgcrypto does not exist"
**Solution**: Create the extension first
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: "permission denied for schema auth"
**Solution**: Ensure your user has sufficient permissions
```sql
GRANT USAGE ON SCHEMA auth TO your_user;
GRANT SELECT ON auth.users TO your_user;
```

### auth.uid() returns NULL
**Solution**: Make sure your application is setting the session variable
```sql
SET app.current_user_id = 'user-uuid-here';
```

### RLS policies blocking all queries
**Solution**: Verify user context is set before each query
```sql
-- Check current setting
SHOW app.current_user_id;

-- Set it if empty
SET app.current_user_id = 'correct-uuid';
```

## Performance Considerations

### Connection Pooling
Since `SET` commands are session-specific, use connection pooling:
- Each connection gets its own context
- Reusing connections maintains the context

### Index Strategy
The migration creates ~125 indexes optimized for:
- User lookups (email-based)
- Time-based queries (created_at, updated_at)
- Foreign key traversal
- Relationship queries

### Query Planning
Example optimized query:
```sql
-- This uses indexes and respects RLS
SELECT * FROM tutoring_sessions
WHERE user_id = auth.uid()  -- RLS filters by this
  AND session_date > NOW() - INTERVAL '7 days'
ORDER BY session_date DESC;
```

## Migration Statistics

- **Total lines**: 4,348
- **Total tables**: 61
- **Schemas**: 8 (auth, public, and application schemas)
- **Triggers**: 37
- **Indexes**: 125+
- **Views**: 15+
- **Functions**: 28
- **Estimated execution**: 30-90 seconds

## File Locations

- **Source migration**: `database/CONSOLIDATED_MIGRATIONS_FINAL.sql`
- **Azure version**: `database/azure-postgresql-migration.sql`
- **This guide**: `AZURE_POSTGRESQL_DEPLOYMENT_GUIDE.md`
- **Summary**: `AZURE_MIGRATION_SUMMARY.md`

## Security Notes

### Password Handling
The `encrypted_password` field in `auth.users` should store:
- Bcrypt hashed passwords (recommended)
- Argon2 hashed passwords
- Any modern password hashing algorithm

Never store plaintext passwords.

### Session Variables
The app.current_user_id session variable:
- Is connection-specific (not visible across connections)
- Should be set immediately after authentication
- Is used by RLS policies for data isolation

### RLS Policies
All tables have RLS enabled with policies that:
- Restrict access based on user ID
- Prevent cross-tenant data exposure
- Are enforced at the database level (cannot be bypassed by application code)

## Support & Documentation

For more information:
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- UUID type: https://www.postgresql.org/docs/current/datatype-uuid.html
- JSONB type: https://www.postgresql.org/docs/current/datatype-json.html
- Azure PostgreSQL: https://learn.microsoft.com/en-us/azure/postgresql/

---

**Version**: 2.5 (Azure PostgreSQL Edition)
**Last Updated**: November 8, 2024
