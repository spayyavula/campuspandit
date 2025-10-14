-- Comprehensive fix for ALL missing foreign keys in CRM tables
-- This script will drop and recreate all foreign key constraints
-- Safe to run multiple times

-- =====================================================
-- 1. CRM_COMPANIES
-- =====================================================

ALTER TABLE crm_companies DROP CONSTRAINT IF EXISTS crm_companies_owner_id_fkey;
ALTER TABLE crm_companies DROP CONSTRAINT IF EXISTS crm_companies_parent_company_id_fkey;
ALTER TABLE crm_companies DROP CONSTRAINT IF EXISTS crm_companies_created_by_fkey;

ALTER TABLE crm_companies
ADD CONSTRAINT crm_companies_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE crm_companies
ADD CONSTRAINT crm_companies_parent_company_id_fkey
FOREIGN KEY (parent_company_id) REFERENCES crm_companies(id) ON DELETE SET NULL;

ALTER TABLE crm_companies
ADD CONSTRAINT crm_companies_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 2. CRM_CONTACTS
-- =====================================================

ALTER TABLE crm_contacts DROP CONSTRAINT IF EXISTS crm_contacts_company_id_fkey;
ALTER TABLE crm_contacts DROP CONSTRAINT IF EXISTS crm_contacts_owner_id_fkey;
ALTER TABLE crm_contacts DROP CONSTRAINT IF EXISTS crm_contacts_created_by_fkey;

ALTER TABLE crm_contacts
ADD CONSTRAINT crm_contacts_company_id_fkey
FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE SET NULL;

ALTER TABLE crm_contacts
ADD CONSTRAINT crm_contacts_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE crm_contacts
ADD CONSTRAINT crm_contacts_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 3. CRM_DEALS
-- =====================================================

ALTER TABLE crm_deals DROP CONSTRAINT IF EXISTS crm_deals_contact_id_fkey;
ALTER TABLE crm_deals DROP CONSTRAINT IF EXISTS crm_deals_company_id_fkey;
ALTER TABLE crm_deals DROP CONSTRAINT IF EXISTS crm_deals_owner_id_fkey;
ALTER TABLE crm_deals DROP CONSTRAINT IF EXISTS crm_deals_created_by_fkey;

ALTER TABLE crm_deals
ADD CONSTRAINT crm_deals_contact_id_fkey
FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE;

ALTER TABLE crm_deals
ADD CONSTRAINT crm_deals_company_id_fkey
FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE CASCADE;

ALTER TABLE crm_deals
ADD CONSTRAINT crm_deals_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE crm_deals
ADD CONSTRAINT crm_deals_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 4. CRM_ACTIVITIES
-- =====================================================

ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_contact_id_fkey;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_company_id_fkey;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_deal_id_fkey;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_owner_id_fkey;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_created_by_fkey;

ALTER TABLE crm_activities
ADD CONSTRAINT crm_activities_contact_id_fkey
FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE;

ALTER TABLE crm_activities
ADD CONSTRAINT crm_activities_company_id_fkey
FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE CASCADE;

ALTER TABLE crm_activities
ADD CONSTRAINT crm_activities_deal_id_fkey
FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE CASCADE;

ALTER TABLE crm_activities
ADD CONSTRAINT crm_activities_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE crm_activities
ADD CONSTRAINT crm_activities_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 5. CRM_TASKS
-- =====================================================

ALTER TABLE crm_tasks DROP CONSTRAINT IF EXISTS crm_tasks_contact_id_fkey;
ALTER TABLE crm_tasks DROP CONSTRAINT IF EXISTS crm_tasks_company_id_fkey;
ALTER TABLE crm_tasks DROP CONSTRAINT IF EXISTS crm_tasks_deal_id_fkey;
ALTER TABLE crm_tasks DROP CONSTRAINT IF EXISTS crm_tasks_assigned_to_fkey;
ALTER TABLE crm_tasks DROP CONSTRAINT IF EXISTS crm_tasks_created_by_fkey;

ALTER TABLE crm_tasks
ADD CONSTRAINT crm_tasks_contact_id_fkey
FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE;

ALTER TABLE crm_tasks
ADD CONSTRAINT crm_tasks_company_id_fkey
FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE CASCADE;

ALTER TABLE crm_tasks
ADD CONSTRAINT crm_tasks_deal_id_fkey
FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE CASCADE;

ALTER TABLE crm_tasks
ADD CONSTRAINT crm_tasks_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE crm_tasks
ADD CONSTRAINT crm_tasks_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 6. CRM_NOTES
-- =====================================================

ALTER TABLE crm_notes DROP CONSTRAINT IF EXISTS crm_notes_contact_id_fkey;
ALTER TABLE crm_notes DROP CONSTRAINT IF EXISTS crm_notes_company_id_fkey;
ALTER TABLE crm_notes DROP CONSTRAINT IF EXISTS crm_notes_deal_id_fkey;
ALTER TABLE crm_notes DROP CONSTRAINT IF EXISTS crm_notes_created_by_fkey;

ALTER TABLE crm_notes
ADD CONSTRAINT crm_notes_contact_id_fkey
FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE;

ALTER TABLE crm_notes
ADD CONSTRAINT crm_notes_company_id_fkey
FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE CASCADE;

ALTER TABLE crm_notes
ADD CONSTRAINT crm_notes_deal_id_fkey
FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE CASCADE;

ALTER TABLE crm_notes
ADD CONSTRAINT crm_notes_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 7. CRM_CAMPAIGNS
-- =====================================================

ALTER TABLE crm_campaigns DROP CONSTRAINT IF EXISTS crm_campaigns_owner_id_fkey;
ALTER TABLE crm_campaigns DROP CONSTRAINT IF EXISTS crm_campaigns_created_by_fkey;

ALTER TABLE crm_campaigns
ADD CONSTRAINT crm_campaigns_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE crm_campaigns
ADD CONSTRAINT crm_campaigns_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 8. CRM_CAMPAIGN_MEMBERS
-- =====================================================

ALTER TABLE crm_campaign_members DROP CONSTRAINT IF EXISTS crm_campaign_members_campaign_id_fkey;
ALTER TABLE crm_campaign_members DROP CONSTRAINT IF EXISTS crm_campaign_members_contact_id_fkey;

ALTER TABLE crm_campaign_members
ADD CONSTRAINT crm_campaign_members_campaign_id_fkey
FOREIGN KEY (campaign_id) REFERENCES crm_campaigns(id) ON DELETE CASCADE;

ALTER TABLE crm_campaign_members
ADD CONSTRAINT crm_campaign_members_contact_id_fkey
FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE;

-- =====================================================
-- 9. CRM_TICKETS
-- =====================================================

ALTER TABLE crm_tickets DROP CONSTRAINT IF EXISTS crm_tickets_contact_id_fkey;
ALTER TABLE crm_tickets DROP CONSTRAINT IF EXISTS crm_tickets_company_id_fkey;
ALTER TABLE crm_tickets DROP CONSTRAINT IF EXISTS crm_tickets_assigned_to_fkey;
ALTER TABLE crm_tickets DROP CONSTRAINT IF EXISTS crm_tickets_resolved_by_fkey;
ALTER TABLE crm_tickets DROP CONSTRAINT IF EXISTS crm_tickets_created_by_fkey;

ALTER TABLE crm_tickets
ADD CONSTRAINT crm_tickets_contact_id_fkey
FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL;

ALTER TABLE crm_tickets
ADD CONSTRAINT crm_tickets_company_id_fkey
FOREIGN KEY (company_id) REFERENCES crm_companies(id) ON DELETE SET NULL;

ALTER TABLE crm_tickets
ADD CONSTRAINT crm_tickets_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE crm_tickets
ADD CONSTRAINT crm_tickets_resolved_by_fkey
FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE crm_tickets
ADD CONSTRAINT crm_tickets_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 10. CRM_TICKET_COMMENTS
-- =====================================================

ALTER TABLE crm_ticket_comments DROP CONSTRAINT IF EXISTS crm_ticket_comments_ticket_id_fkey;
ALTER TABLE crm_ticket_comments DROP CONSTRAINT IF EXISTS crm_ticket_comments_created_by_fkey;

ALTER TABLE crm_ticket_comments
ADD CONSTRAINT crm_ticket_comments_ticket_id_fkey
FOREIGN KEY (ticket_id) REFERENCES crm_tickets(id) ON DELETE CASCADE;

ALTER TABLE crm_ticket_comments
ADD CONSTRAINT crm_ticket_comments_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 11. CRM_PRODUCTS
-- =====================================================

ALTER TABLE crm_products DROP CONSTRAINT IF EXISTS crm_products_created_by_fkey;

ALTER TABLE crm_products
ADD CONSTRAINT crm_products_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- 12. CRM_EMAIL_TEMPLATES
-- =====================================================

ALTER TABLE crm_email_templates DROP CONSTRAINT IF EXISTS crm_email_templates_created_by_fkey;

ALTER TABLE crm_email_templates
ADD CONSTRAINT crm_email_templates_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =====================================================
-- VERIFICATION - Check all foreign keys
-- =====================================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name LIKE 'crm_%'
ORDER BY tc.table_name, kcu.column_name;
