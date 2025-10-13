-- =====================================================
-- DROP ALL TRIGGERS - Comprehensive Cleanup
-- =====================================================
-- Run this BEFORE running CONSOLIDATED_MIGRATIONS_FINAL.sql
-- if you're getting "trigger already exists" errors
--
-- This will drop all existing triggers so they can be recreated
-- with the latest version from the migration script
-- =====================================================

-- Authentication & Roles triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS roles_updated_at_trigger ON roles;

-- Tutoring System triggers
DROP TRIGGER IF EXISTS update_tutor_profiles_updated_at ON tutor_profiles;
DROP TRIGGER IF EXISTS update_tutoring_sessions_updated_at ON tutoring_sessions;
DROP TRIGGER IF EXISTS update_tutor_stats_after_review ON session_reviews;
DROP TRIGGER IF EXISTS update_tutor_stats_after_session ON tutoring_sessions;

-- Learning Resources triggers
DROP TRIGGER IF EXISTS update_resource_progress_before_update ON student_resource_progress;
DROP TRIGGER IF EXISTS update_learning_resources_updated_at ON learning_resources;
DROP TRIGGER IF EXISTS update_student_resource_progress_updated_at ON student_resource_progress;
DROP TRIGGER IF EXISTS update_student_chapter_progress_updated_at ON student_chapter_progress;

-- Flashcards triggers
DROP TRIGGER IF EXISTS update_flashcard_set_stats_trigger ON flashcard_reviews;
DROP TRIGGER IF EXISTS update_flashcard_accuracy_trigger ON flashcard_reviews;
DROP TRIGGER IF EXISTS update_student_notes_updated_at ON student_notes;
DROP TRIGGER IF EXISTS update_flashcard_sets_updated_at ON flashcard_sets;

-- Email Marketing triggers
DROP TRIGGER IF EXISTS update_email_subscribers_updated_at ON email_subscribers;

-- AI Coaching triggers
DROP TRIGGER IF EXISTS update_weak_area_status_trigger ON student_weak_areas;
DROP TRIGGER IF EXISTS update_weak_areas_updated_at ON student_weak_areas;
DROP TRIGGER IF EXISTS update_repetition_schedule_updated_at ON repetition_schedule;
DROP TRIGGER IF EXISTS update_coaching_config_updated_at ON ai_coaching_config;

-- Messaging System triggers
DROP TRIGGER IF EXISTS update_channel_member_count_on_insert ON channel_members;
DROP TRIGGER IF EXISTS update_channel_member_count_on_delete ON channel_members;
DROP TRIGGER IF EXISTS update_channel_message_stats_on_insert ON messages;
DROP TRIGGER IF EXISTS update_unread_counts_on_message ON messages;
DROP TRIGGER IF EXISTS update_reaction_count_on_add ON message_reactions;
DROP TRIGGER IF EXISTS update_reaction_count_on_remove ON message_reactions;
DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;

-- CRM System triggers
DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts;
DROP TRIGGER IF EXISTS update_crm_companies_updated_at ON crm_companies;
DROP TRIGGER IF EXISTS update_crm_deals_updated_at ON crm_deals;
DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON crm_activities;
DROP TRIGGER IF EXISTS update_crm_tasks_updated_at ON crm_tasks;
DROP TRIGGER IF EXISTS update_crm_tickets_updated_at ON crm_tickets;
DROP TRIGGER IF EXISTS update_crm_campaigns_updated_at ON crm_campaigns;
DROP TRIGGER IF EXISTS update_contact_activity_trigger ON crm_activities;
DROP TRIGGER IF EXISTS update_deal_status_trigger ON crm_deals;
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON crm_campaign_members;

-- =====================================================
-- DONE - All triggers dropped successfully
-- =====================================================
-- Now you can run CONSOLIDATED_MIGRATIONS_FINAL.sql
-- without any "trigger already exists" errors
-- =====================================================
