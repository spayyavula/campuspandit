-- Fix: Add INSERT and UPDATE policies for CRM tables
-- Users were unable to create/update CRM records because policies were missing

-- =====================================================
-- CONTACTS - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert contacts"
    ON crm_contacts FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Note: UPDATE policy already exists in schema

-- =====================================================
-- COMPANIES - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert companies"
    ON crm_companies FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their companies"
    ON crm_companies FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- DEALS - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert deals"
    ON crm_deals FOR INSERT
    WITH CHECK (auth.uid() = created_by OR auth.uid() = owner_id);

CREATE POLICY "Users can update their deals"
    ON crm_deals FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- ACTIVITIES - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert activities"
    ON crm_activities FOR INSERT
    WITH CHECK (auth.uid() = created_by OR auth.uid() = owner_id);

CREATE POLICY "Users can update their activities"
    ON crm_activities FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- TASKS - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert tasks"
    ON crm_tasks FOR INSERT
    WITH CHECK (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can update their tasks"
    ON crm_tasks FOR UPDATE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- =====================================================
-- TICKETS - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert tickets"
    ON crm_tickets FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their tickets"
    ON crm_tickets FOR UPDATE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- =====================================================
-- NOTES - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert notes"
    ON crm_notes FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their notes"
    ON crm_notes FOR UPDATE
    USING (auth.uid() = created_by);

-- =====================================================
-- CAMPAIGNS - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert campaigns"
    ON crm_campaigns FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their campaigns"
    ON crm_campaigns FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- =====================================================
-- PRODUCTS - INSERT & UPDATE POLICIES
-- =====================================================

CREATE POLICY "Users can insert products"
    ON crm_products FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their products"
    ON crm_products FOR UPDATE
    USING (auth.uid() = created_by);

-- =====================================================
-- CAMPAIGN MEMBERS - ALL POLICIES
-- =====================================================

ALTER TABLE crm_campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign members"
    ON crm_campaign_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_members.campaign_id
            AND (crm_campaigns.owner_id = auth.uid() OR crm_campaigns.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can insert campaign members"
    ON crm_campaign_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_members.campaign_id
            AND (crm_campaigns.owner_id = auth.uid() OR crm_campaigns.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can update campaign members"
    ON crm_campaign_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_members.campaign_id
            AND (crm_campaigns.owner_id = auth.uid() OR crm_campaigns.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can delete campaign members"
    ON crm_campaign_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_members.campaign_id
            AND (crm_campaigns.owner_id = auth.uid() OR crm_campaigns.created_by = auth.uid())
        )
    );

-- =====================================================
-- TICKET COMMENTS - ALL POLICIES
-- =====================================================

ALTER TABLE crm_ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ticket comments"
    ON crm_ticket_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM crm_tickets
            WHERE crm_tickets.id = crm_ticket_comments.ticket_id
            AND (crm_tickets.assigned_to = auth.uid() OR crm_tickets.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can insert ticket comments"
    ON crm_ticket_comments FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM crm_tickets
            WHERE crm_tickets.id = crm_ticket_comments.ticket_id
            AND (crm_tickets.assigned_to = auth.uid() OR crm_tickets.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can update their ticket comments"
    ON crm_ticket_comments FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their ticket comments"
    ON crm_ticket_comments FOR DELETE
    USING (auth.uid() = created_by);

-- =====================================================
-- EMAIL TEMPLATES - ALL POLICIES
-- =====================================================

ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email templates"
    ON crm_email_templates FOR SELECT
    USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Users can insert email templates"
    ON crm_email_templates FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their email templates"
    ON crm_email_templates FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their email templates"
    ON crm_email_templates FOR DELETE
    USING (auth.uid() = created_by);
