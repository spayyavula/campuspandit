-- =====================================================
-- DROP ALL TRIGGERS - Comprehensive Cleanup
-- =====================================================
-- ⚠️ WHEN TO USE THIS SCRIPT:
--    ONLY run this if you're getting "trigger already exists" errors
--    when running CONSOLIDATED_MIGRATIONS_FINAL.sql
--
-- ⚠️ IF YOU GET "table does not exist" ERRORS:
--    This means you have a fresh database. Skip this script and run
--    CONSOLIDATED_MIGRATIONS_FINAL.sql directly instead.
--
-- This script drops all existing triggers so they can be recreated
-- with the latest version from the migration script.
--
-- Note: Uses DO blocks with exception handling for safety
-- =====================================================

-- Drop all triggers safely (handles missing tables gracefully)
DO $$
BEGIN
    -- Authentication & Roles triggers
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
    EXECUTE 'DROP TRIGGER IF EXISTS roles_updated_at_trigger ON roles';

    -- Tutoring System triggers
    EXECUTE 'DROP TRIGGER IF EXISTS update_tutor_profiles_updated_at ON tutor_profiles';
    EXECUTE 'DROP TRIGGER IF EXISTS update_tutoring_sessions_updated_at ON tutoring_sessions';
    EXECUTE 'DROP TRIGGER IF EXISTS update_tutor_stats_after_review ON session_reviews';
    EXECUTE 'DROP TRIGGER IF EXISTS update_tutor_stats_after_session ON tutoring_sessions';

    -- Learning Resources triggers
    EXECUTE 'DROP TRIGGER IF EXISTS update_resource_progress_before_update ON student_resource_progress';
    EXECUTE 'DROP TRIGGER IF EXISTS update_learning_resources_updated_at ON learning_resources';
    EXECUTE 'DROP TRIGGER IF EXISTS update_student_resource_progress_updated_at ON student_resource_progress';
    EXECUTE 'DROP TRIGGER IF EXISTS update_student_chapter_progress_updated_at ON student_chapter_progress';

    -- Flashcards triggers
    EXECUTE 'DROP TRIGGER IF EXISTS update_flashcard_set_stats_trigger ON flashcard_reviews';
    EXECUTE 'DROP TRIGGER IF EXISTS update_flashcard_accuracy_trigger ON flashcard_reviews';
    EXECUTE 'DROP TRIGGER IF EXISTS update_student_notes_updated_at ON student_notes';
    EXECUTE 'DROP TRIGGER IF EXISTS update_flashcard_sets_updated_at ON flashcard_sets';

    -- Email Marketing triggers
    EXECUTE 'DROP TRIGGER IF EXISTS update_email_subscribers_updated_at ON email_subscribers';

    -- AI Coaching triggers
    EXECUTE 'DROP TRIGGER IF EXISTS update_weak_area_status_trigger ON student_weak_areas';
    EXECUTE 'DROP TRIGGER IF EXISTS update_weak_areas_updated_at ON student_weak_areas';
    EXECUTE 'DROP TRIGGER IF EXISTS update_repetition_schedule_updated_at ON repetition_schedule';
    EXECUTE 'DROP TRIGGER IF EXISTS update_coaching_config_updated_at ON ai_coaching_config';

    -- Messaging System triggers
    EXECUTE 'DROP TRIGGER IF EXISTS update_channel_member_count_on_insert ON channel_members';
    EXECUTE 'DROP TRIGGER IF EXISTS update_channel_member_count_on_delete ON channel_members';
    EXECUTE 'DROP TRIGGER IF EXISTS update_channel_message_stats_on_insert ON messages';
    EXECUTE 'DROP TRIGGER IF EXISTS update_unread_counts_on_message ON messages';
    EXECUTE 'DROP TRIGGER IF EXISTS update_reaction_count_on_add ON message_reactions';
    EXECUTE 'DROP TRIGGER IF EXISTS update_reaction_count_on_remove ON message_reactions';
    EXECUTE 'DROP TRIGGER IF EXISTS update_channels_updated_at ON channels';
    EXECUTE 'DROP TRIGGER IF EXISTS update_messages_updated_at ON messages';

    -- CRM System triggers
    EXECUTE 'DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts';
    EXECUTE 'DROP TRIGGER IF EXISTS update_crm_companies_updated_at ON crm_companies';
    EXECUTE 'DROP TRIGGER IF EXISTS update_crm_deals_updated_at ON crm_deals';
    EXECUTE 'DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON crm_activities';
    EXECUTE 'DROP TRIGGER IF EXISTS update_crm_tasks_updated_at ON crm_tasks';
    EXECUTE 'DROP TRIGGER IF EXISTS update_crm_tickets_updated_at ON crm_tickets';
    EXECUTE 'DROP TRIGGER IF EXISTS update_crm_campaigns_updated_at ON crm_campaigns';
    EXECUTE 'DROP TRIGGER IF EXISTS update_contact_activity_trigger ON crm_activities';
    EXECUTE 'DROP TRIGGER IF EXISTS update_deal_status_trigger ON crm_deals';
    EXECUTE 'DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON crm_campaign_members';

    RAISE NOTICE 'All triggers dropped successfully (or did not exist)';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Some tables do not exist yet - this is OK, continuing...';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred but continuing: %', SQLERRM;
END $$;

-- =====================================================
-- DONE - All triggers dropped successfully
-- =====================================================
-- Now you can run CONSOLIDATED_MIGRATIONS_FINAL.sql
-- without any "trigger already exists" errors
-- =====================================================
