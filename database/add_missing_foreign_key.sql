-- Add ALL missing foreign keys for crm_activities table
-- Run this to fix the PostgREST relationship errors

-- =====================================================
-- CRM_ACTIVITIES FOREIGN KEYS
-- =====================================================

-- Drop constraints if they exist (in case they're malformed)
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_contact_id_fkey;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_company_id_fkey;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_deal_id_fkey;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_owner_id_fkey;
ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_created_by_fkey;

-- Add the foreign key constraints
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

-- Verify they were added
SELECT
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage
WHERE table_name = 'crm_activities'
    AND constraint_name LIKE '%fkey%'
ORDER BY constraint_name;
