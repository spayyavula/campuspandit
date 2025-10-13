# CampusPandit Database Migrations

## Quick Start

Run **CONSOLIDATED_MIGRATIONS_FINAL.sql** in your Supabase SQL Editor. This file contains all schemas in the correct dependency order.

## What's Included

### v2.0 (Current) - WITH Roles & Auth
- **File:** `CONSOLIDATED_MIGRATIONS_FINAL.sql`
- **Lines:** 3,994
- **Size:** 141KB
- **Includes:** Authentication & Roles schema + all other schemas

### v1.0 (Old) - WITHOUT Roles
- **File:** `CONSOLIDATED_MIGRATIONS.sql`
- **Status:** ⚠️ Deprecated - Missing roles table
- **Note:** Will fail on RLS policies that check user roles

## Schema Execution Order

```
0. 00_auth_roles_schema.sql           ⭐ NEW - Run this first!
1. tutoring_system_schema.sql
2. learning_resources_schema.sql
3. notes_flashcards_schema.sql
4. email_marketing_schema.sql
5. ai_coaching_schema.sql
6. messaging_system_schema.sql
7. crm_schema.sql
```

## Key Features in v2.0

### Roles Table
Default roles created automatically:
- `student` - Regular student (auto-assigned to new users)
- `tutor` - Tutoring instructors
- `admin` - System administrators
- `content_creator` - Content management
- `moderator` - Community moderation
- `support` - Customer support staff

### Helper Functions
```sql
-- Check if user has a role
SELECT has_role(auth.uid(), 'admin');

-- Get all roles for a user
SELECT * FROM get_user_roles(auth.uid());

-- Assign a role to a user (admin only)
SELECT assign_role('user-uuid', 'tutor', auth.uid());

-- Remove a role from a user (admin only)
SELECT remove_role('user-uuid', 'tutor');
```

### Auto-Assignment
New users automatically get the `student` role upon signup via database trigger.

### Views
- `user_roles_view` - See all users and their roles
- `role_statistics` - See role distribution and counts

## Individual Schema Files

Each schema is also available separately in this directory if you need to run them individually or review specific table structures:

- `00_auth_roles_schema.sql` - Roles, permissions, user_roles
- `tutoring_system_schema.sql` - Tutor profiles, sessions, bookings
- `learning_resources_schema.sql` - Courses, modules, chapters, videos
- `notes_flashcards_schema.sql` - Flashcards, notes, study sessions
- `email_marketing_schema.sql` - Email campaigns, subscribers
- `ai_coaching_schema.sql` - AI coaching, weak areas, recommendations
- `messaging_system_schema.sql` - Channels, messages, reactions
- `crm_schema.sql` - Contacts, deals, tickets, tasks

## Migration Instructions

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy contents of `CONSOLIDATED_MIGRATIONS_FINAL.sql`
5. Run the query
6. Wait 30-90 seconds for completion

### Option 2: Supabase CLI
```bash
# Link your project first
supabase link --project-ref your-project-ref

# Push the migrations
supabase db push
```

### Option 3: psql (Direct Connection)
```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < CONSOLIDATED_MIGRATIONS_FINAL.sql
```

## Troubleshooting

### Error: "roles table does not exist"
- You're using the old `CONSOLIDATED_MIGRATIONS.sql` file
- Use `CONSOLIDATED_MIGRATIONS_FINAL.sql` instead

### Error: "Multiple GoTrueClient instances"
- This is a React.StrictMode warning (development only)
- Safe to ignore, won't occur in production

### Database 404 Errors
- Tables haven't been created yet
- Run `CONSOLIDATED_MIGRATIONS_FINAL.sql` to create all tables

### RLS Policy Errors
- Make sure you run the auth schema first
- The `has_role()` function must exist before other schemas

## Database Statistics

After running migrations, you'll have:
- **70+ tables** across 8 schemas
- **100+ indexes** for optimal query performance
- **50+ triggers** for data consistency
- **30+ views** for analytics and reporting
- **20+ functions** for business logic
- **All tables** with Row Level Security (RLS) enabled

## Support

For issues or questions:
1. Check the Supabase logs in your dashboard
2. Verify all schemas ran successfully
3. Review error messages in SQL Editor
4. Check that auth.users table exists (Supabase creates this automatically)

---

**Last Updated:** October 12, 2025
**Version:** 2.0
