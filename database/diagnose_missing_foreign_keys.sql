-- Diagnostic script to identify missing foreign keys in CRM tables
-- Run this BEFORE fix_all_crm_foreign_keys.sql to see what's missing

-- =====================================================
-- 1. List all existing foreign keys on CRM tables
-- =====================================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name LIKE 'crm_%'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 2. Expected vs Actual Foreign Key Count
-- =====================================================

-- Expected counts (from schema design):
-- crm_companies: 3 FKs
-- crm_contacts: 3 FKs
-- crm_deals: 4 FKs
-- crm_activities: 5 FKs
-- crm_tasks: 5 FKs
-- crm_notes: 4 FKs
-- crm_campaigns: 2 FKs
-- crm_campaign_members: 2 FKs
-- crm_tickets: 5 FKs
-- crm_ticket_comments: 2 FKs
-- crm_products: 1 FK
-- crm_email_templates: 1 FK
-- TOTAL EXPECTED: 37 FKs

SELECT
    table_name,
    COUNT(*) as actual_fk_count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
    AND table_name LIKE 'crm_%'
GROUP BY table_name
ORDER BY table_name;

-- =====================================================
-- 3. Summary
-- =====================================================

SELECT
    'Total CRM Foreign Keys Found' AS description,
    COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
    AND table_name LIKE 'crm_%';

SELECT
    'Expected Total' AS description,
    37 as count;
