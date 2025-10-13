# CampusPandit Database Migration Guide

## Quick Start - Choose Your Scenario

### Scenario 1: Fresh Database (No Tables Exist Yet) ✅ RECOMMENDED
**If you're setting up for the first time:**

```sql
-- Just run this one file in Supabase SQL Editor:
CONSOLIDATED_MIGRATIONS_FINAL.sql
```

That's it! ✅

---

### Scenario 2: Existing Database with Old Schema
**If you already have tables and want to start fresh:**

```sql
-- Step 1: Drop everything
00_DROP_ALL_TABLES.sql

-- Step 2: Run the full migration
CONSOLIDATED_MIGRATIONS_FINAL.sql
```

---

### Scenario 3: Update Existing Database (Keep Data)
**If you have data and get "trigger already exists" errors:**

```sql
-- Step 1: Drop only the triggers
DROP_ALL_TRIGGERS.sql

-- Step 2: Run the full migration
CONSOLIDATED_MIGRATIONS_FINAL.sql
```

---

## Troubleshooting

### ❌ Error: "trigger already exists"
→ Run `DROP_ALL_TRIGGERS.sql` first, then run the main migration

### ❌ Error: "table does not exist" (from DROP_ALL_TRIGGERS.sql)
→ Skip `DROP_ALL_TRIGGERS.sql` and run `CONSOLIDATED_MIGRATIONS_FINAL.sql` directly

### ❌ Error: "relation already exists"
→ Run `00_DROP_ALL_TABLES.sql` first, then run the main migration

---

## Migration Files Explained

| File | Purpose |
|------|---------|
| `CONSOLIDATED_MIGRATIONS_FINAL.sql` | **Main migration file** - Creates all tables, triggers, RLS policies (v2.4) |
| `00_DROP_ALL_TABLES.sql` | Drops all tables (use for fresh start) |
| `DROP_ALL_TRIGGERS.sql` | Drops all triggers only (use when updating) |
| `FIX_TRIGGER_EXISTS_ERROR.sql` | Legacy fix - use `DROP_ALL_TRIGGERS.sql` instead |
| `UPDATE_TO_v2.4_role_signup.sql` | Incremental update for role-based signup |

---

## What's in v2.4?

✅ Role-based signup (Student vs Tutor selection)
✅ 70+ tables across 8 schemas
✅ Complete authentication & authorization
✅ Tutoring system with bookings & reviews
✅ Learning resources with progress tracking
✅ Spaced repetition flashcards
✅ AI coaching & weak area detection
✅ Real-time messaging (Slack-like)
✅ Full CRM system (sales, service, marketing)
✅ Email marketing campaigns
✅ Service ticketing system

---

## Support

If you encounter issues:
1. Check the error message carefully
2. Refer to the troubleshooting section above
3. Make sure you're using the latest version from GitHub

---

**Last Updated:** v2.4 (October 2025)
