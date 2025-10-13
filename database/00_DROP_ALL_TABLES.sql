-- =====================================================
-- DROP ALL TABLES - CLEAN SLATE
-- =====================================================
-- Run this FIRST to drop all existing tables
-- This ensures no partial/corrupted tables exist
-- =====================================================

-- Drop CRM tables
DROP TABLE IF EXISTS crm_task_assignments CASCADE;
DROP TABLE IF EXISTS crm_tasks CASCADE;
DROP TABLE IF EXISTS crm_ticket_comments CASCADE;
DROP TABLE IF EXISTS crm_tickets CASCADE;
DROP TABLE IF EXISTS crm_deal_activities CASCADE;
DROP TABLE IF EXISTS crm_deals CASCADE;
DROP TABLE IF EXISTS crm_contact_interactions CASCADE;
DROP TABLE IF EXISTS crm_contacts CASCADE;

-- Drop messaging tables
DROP TABLE IF EXISTS saved_messages CASCADE;
DROP TABLE IF EXISTS channel_invitations CASCADE;
DROP TABLE IF EXISTS message_read_receipts CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS channels CASCADE;

-- Drop AI coaching tables
DROP TABLE IF EXISTS coaching_recommendations CASCADE;
DROP TABLE IF EXISTS student_performance_analytics CASCADE;
DROP TABLE IF EXISTS ai_coaching_sessions CASCADE;
DROP TABLE IF EXISTS repetition_schedule CASCADE;
DROP TABLE IF EXISTS student_weak_areas CASCADE;

-- Drop email marketing tables
DROP TABLE IF EXISTS email_campaign_recipients CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS email_subscribers CASCADE;

-- Drop notes/flashcards tables
DROP TABLE IF EXISTS notebooklm_integration CASCADE;
DROP TABLE IF EXISTS note_templates CASCADE;
DROP TABLE IF EXISTS flashcard_reviews CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS flashcard_sets CASCADE;
DROP TABLE IF EXISTS student_notes CASCADE;

-- Drop learning resources tables
DROP TABLE IF EXISTS resource_mcqs CASCADE;
DROP TABLE IF EXISTS student_chapter_progress CASCADE;
DROP TABLE IF EXISTS resource_videos CASCADE;
DROP TABLE IF EXISTS resource_chapters CASCADE;
DROP TABLE IF EXISTS learning_resources CASCADE;

-- Drop tutoring tables
DROP TABLE IF EXISTS session_feedback CASCADE;
DROP TABLE IF EXISTS session_materials CASCADE;
DROP TABLE IF EXISTS tutoring_sessions CASCADE;
DROP TABLE IF EXISTS tutor_availability CASCADE;
DROP TABLE IF EXISTS tutor_profiles CASCADE;

-- Drop roles/permissions tables
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Drop views
DROP VIEW IF EXISTS user_roles_view CASCADE;
DROP VIEW IF EXISTS role_statistics CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS has_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS has_any_role(UUID, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS get_user_roles(UUID) CASCADE;
DROP FUNCTION IF EXISTS assign_role(UUID, TEXT, UUID, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS remove_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_assign_student_role() CASCADE;
DROP FUNCTION IF EXISTS update_roles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'All tables, views, and functions dropped successfully!';
    RAISE NOTICE 'You can now run CONSOLIDATED_MIGRATIONS_FINAL.sql';
END $$;
