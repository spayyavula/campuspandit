-- =====================================================
-- Fix CRM Row Level Security Policies
-- Add missing INSERT, UPDATE, DELETE policies for all CRM tables
-- =====================================================

-- =====================================================
-- CRM CONTACTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can delete their contacts" ON crm_contacts;
CREATE POLICY "Users can delete their contacts"
    ON crm_contacts FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- CRM COMPANIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can create companies" ON crm_companies;
CREATE POLICY "Users can create companies"
    ON crm_companies FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their companies" ON crm_companies;
CREATE POLICY "Users can update their companies"
    ON crm_companies FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their companies" ON crm_companies;
CREATE POLICY "Users can delete their companies"
    ON crm_companies FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- CRM DEALS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can create deals" ON crm_deals;
CREATE POLICY "Users can create deals"
    ON crm_deals FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their deals" ON crm_deals;
CREATE POLICY "Users can update their deals"
    ON crm_deals FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their deals" ON crm_deals;
CREATE POLICY "Users can delete their deals"
    ON crm_deals FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- CRM ACTIVITIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can create activities" ON crm_activities;
CREATE POLICY "Users can create activities"
    ON crm_activities FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their activities" ON crm_activities;
CREATE POLICY "Users can update their activities"
    ON crm_activities FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their activities" ON crm_activities;
CREATE POLICY "Users can delete their activities"
    ON crm_activities FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- CRM TASKS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can create tasks" ON crm_tasks;
CREATE POLICY "Users can create tasks"
    ON crm_tasks FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their tasks" ON crm_tasks;
CREATE POLICY "Users can update their tasks"
    ON crm_tasks FOR UPDATE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their tasks" ON crm_tasks;
CREATE POLICY "Users can delete their tasks"
    ON crm_tasks FOR DELETE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- =====================================================
-- CRM NOTES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their notes" ON crm_notes;
CREATE POLICY "Users can view their notes"
    ON crm_notes FOR SELECT
    USING (auth.uid() = created_by OR is_private = false);

DROP POLICY IF EXISTS "Users can create notes" ON crm_notes;
CREATE POLICY "Users can create notes"
    ON crm_notes FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their notes" ON crm_notes;
CREATE POLICY "Users can update their notes"
    ON crm_notes FOR UPDATE
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their notes" ON crm_notes;
CREATE POLICY "Users can delete their notes"
    ON crm_notes FOR DELETE
    USING (auth.uid() = created_by);

-- =====================================================
-- CRM CAMPAIGNS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view campaigns" ON crm_campaigns;
CREATE POLICY "Users can view campaigns"
    ON crm_campaigns FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create campaigns" ON crm_campaigns;
CREATE POLICY "Users can create campaigns"
    ON crm_campaigns FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their campaigns" ON crm_campaigns;
CREATE POLICY "Users can update their campaigns"
    ON crm_campaigns FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their campaigns" ON crm_campaigns;
CREATE POLICY "Users can delete their campaigns"
    ON crm_campaigns FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- CRM CAMPAIGN MEMBERS POLICIES
-- =====================================================

ALTER TABLE crm_campaign_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view campaign members for their campaigns" ON crm_campaign_members;
CREATE POLICY "Users can view campaign members for their campaigns"
    ON crm_campaign_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_members.campaign_id
            AND (crm_campaigns.owner_id = auth.uid() OR crm_campaigns.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create campaign members for their campaigns" ON crm_campaign_members;
CREATE POLICY "Users can create campaign members for their campaigns"
    ON crm_campaign_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_members.campaign_id
            AND (crm_campaigns.owner_id = auth.uid() OR crm_campaigns.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update campaign members for their campaigns" ON crm_campaign_members;
CREATE POLICY "Users can update campaign members for their campaigns"
    ON crm_campaign_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_members.campaign_id
            AND (crm_campaigns.owner_id = auth.uid() OR crm_campaigns.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can delete campaign members for their campaigns" ON crm_campaign_members;
CREATE POLICY "Users can delete campaign members for their campaigns"
    ON crm_campaign_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_members.campaign_id
            AND (crm_campaigns.owner_id = auth.uid() OR crm_campaigns.created_by = auth.uid())
        )
    );

-- =====================================================
-- CRM TICKETS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can create tickets" ON crm_tickets;
CREATE POLICY "Users can create tickets"
    ON crm_tickets FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their tickets" ON crm_tickets;
CREATE POLICY "Users can update their tickets"
    ON crm_tickets FOR UPDATE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their tickets" ON crm_tickets;
CREATE POLICY "Users can delete their tickets"
    ON crm_tickets FOR DELETE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- =====================================================
-- CRM TICKET COMMENTS POLICIES
-- =====================================================

ALTER TABLE crm_ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ticket comments for their tickets" ON crm_ticket_comments;
CREATE POLICY "Users can view ticket comments for their tickets"
    ON crm_ticket_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM crm_tickets
            WHERE crm_tickets.id = crm_ticket_comments.ticket_id
            AND (crm_tickets.assigned_to = auth.uid() OR crm_tickets.created_by = auth.uid())
        )
        OR is_public = true
    );

DROP POLICY IF EXISTS "Users can create ticket comments for their tickets" ON crm_ticket_comments;
CREATE POLICY "Users can create ticket comments for their tickets"
    ON crm_ticket_comments FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM crm_tickets
            WHERE crm_tickets.id = crm_ticket_comments.ticket_id
            AND (crm_tickets.assigned_to = auth.uid() OR crm_tickets.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their ticket comments" ON crm_ticket_comments;
CREATE POLICY "Users can update their ticket comments"
    ON crm_ticket_comments FOR UPDATE
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their ticket comments" ON crm_ticket_comments;
CREATE POLICY "Users can delete their ticket comments"
    ON crm_ticket_comments FOR DELETE
    USING (auth.uid() = created_by);

-- =====================================================
-- CRM PRODUCTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view products" ON crm_products;
CREATE POLICY "Users can view products"
    ON crm_products FOR SELECT
    USING (is_active = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create products" ON crm_products;
CREATE POLICY "Users can create products"
    ON crm_products FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their products" ON crm_products;
CREATE POLICY "Users can update their products"
    ON crm_products FOR UPDATE
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their products" ON crm_products;
CREATE POLICY "Users can delete their products"
    ON crm_products FOR DELETE
    USING (auth.uid() = created_by);

-- =====================================================
-- CRM EMAIL TEMPLATES POLICIES
-- =====================================================

ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view active email templates" ON crm_email_templates;
CREATE POLICY "Users can view active email templates"
    ON crm_email_templates FOR SELECT
    USING (is_active = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create email templates" ON crm_email_templates;
CREATE POLICY "Users can create email templates"
    ON crm_email_templates FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their email templates" ON crm_email_templates;
CREATE POLICY "Users can update their email templates"
    ON crm_email_templates FOR UPDATE
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their email templates" ON crm_email_templates;
CREATE POLICY "Users can delete their email templates"
    ON crm_email_templates FOR DELETE
    USING (auth.uid() = created_by);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Policies created successfully
-- Users can now create, read, update, and delete CRM records they own
