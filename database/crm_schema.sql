-- CRM System Schema - Minimalistic Design
-- Sales, Post-Sales/Service, and Marketing Modules
-- Following Zerodha's clean, simple approach

-- =====================================================
-- 1. CONTACTS (Leads & Customers)
-- =====================================================

-- =====================================================
-- 2. COMPANIES/ORGANIZATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    legal_name TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,

    -- Business Info
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    annual_revenue DECIMAL(15, 2),
    employee_count INTEGER,

    -- Status
    status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'customer', 'partner', 'inactive')),
    customer_since DATE,

    -- Address
    billing_street TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_postal_code TEXT,
    billing_country TEXT DEFAULT 'India',

    shipping_street TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_postal_code TEXT,
    shipping_country TEXT DEFAULT 'India',

    -- Social
    linkedin_url TEXT,
    twitter_handle TEXT,
    facebook_url TEXT,

    -- Assignment
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Parent Company
    parent_company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,

    -- Tax Info
    tax_id TEXT,
    gst_number TEXT,
    pan_number TEXT,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 1. CONTACTS (Leads & Customers)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    mobile TEXT,

    -- Contact Type
    contact_type TEXT DEFAULT 'lead' CHECK (contact_type IN ('lead', 'customer', 'partner', 'vendor')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'customer', 'inactive')),

    -- Company Info
    company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
    job_title TEXT,
    department TEXT,

    -- Lead Source
    source TEXT CHECK (source IN ('website', 'referral', 'cold_call', 'email_campaign', 'social_media', 'event', 'partner', 'other')),
    source_details TEXT,

    -- Qualification
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    qualification_notes TEXT,

    -- Assignment
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- Social & Web
    linkedin_url TEXT,
    twitter_handle TEXT,
    website TEXT,

    -- Address
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',

    -- Preferences
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'sms')),
    timezone TEXT DEFAULT 'Asia/Kolkata',
    language TEXT DEFAULT 'en',

    -- Marketing
    email_opted_in BOOLEAN DEFAULT true,
    sms_opted_in BOOLEAN DEFAULT false,
    whatsapp_opted_in BOOLEAN DEFAULT false,
    do_not_contact BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    last_contacted_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Search
    search_vector tsvector
);

-- =====================================================
-- 3. DEALS/OPPORTUNITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Financial
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    expected_revenue DECIMAL(15, 2),

    -- Pipeline
    stage TEXT DEFAULT 'prospecting' CHECK (stage IN (
        'prospecting',      -- Initial contact
        'qualification',    -- Qualifying the lead
        'proposal',         -- Proposal sent
        'negotiation',      -- Negotiating terms
        'closed_won',       -- Deal won
        'closed_lost'       -- Deal lost
    )),
    probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),

    -- Timeline
    expected_close_date DATE,
    actual_close_date DATE,
    closed_reason TEXT,

    -- Competition
    competitors TEXT[],

    -- Products/Services
    products JSONB DEFAULT '[]', -- Array of {product_id, quantity, price}

    -- Status
    is_closed BOOLEAN DEFAULT false,
    is_won BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    next_step TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 4. ACTIVITIES (Calls, Emails, Meetings)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Activity Type
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'call',
        'email',
        'meeting',
        'task',
        'note',
        'sms',
        'whatsapp',
        'linkedin_message'
    )),

    -- Basic Info
    subject TEXT NOT NULL,
    description TEXT,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),

    -- Call-specific
    call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
    call_outcome TEXT CHECK (call_outcome IN ('connected', 'no_answer', 'voicemail', 'busy', 'wrong_number')),

    -- Meeting-specific
    meeting_location TEXT,
    meeting_link TEXT,
    attendees TEXT[], -- Array of contact IDs or emails

    -- Email-specific
    email_thread_id TEXT,
    email_from TEXT,
    email_to TEXT[],
    email_cc TEXT[],
    email_opened BOOLEAN DEFAULT false,
    email_clicked BOOLEAN DEFAULT false,

    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_date DATE,

    -- Metadata
    tags TEXT[],
    attachments JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 5. TASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Priority & Status
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),

    -- Timeline
    due_date DATE,
    due_time TIME,
    completed_at TIMESTAMPTZ,

    -- Reminders
    remind_at TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[],

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 6. NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content
    title TEXT,
    content TEXT NOT NULL,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,

    -- Visibility
    is_pinned BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,

    -- Metadata
    tags TEXT[],
    attachments JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 7. MARKETING CAMPAIGNS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,

    -- Campaign Type
    campaign_type TEXT NOT NULL CHECK (campaign_type IN (
        'email',
        'sms',
        'social_media',
        'webinar',
        'event',
        'content',
        'paid_ads'
    )),

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),

    -- Timeline
    start_date DATE,
    end_date DATE,

    -- Budget
    budget DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',

    -- Target Audience
    target_segment TEXT,
    target_filters JSONB DEFAULT '{}',
    estimated_reach INTEGER,

    -- Goals
    primary_goal TEXT CHECK (primary_goal IN ('awareness', 'engagement', 'lead_generation', 'conversion', 'retention')),
    target_leads INTEGER,
    target_conversions INTEGER,

    -- Performance
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_leads INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,

    -- Email Campaign Specific
    email_subject TEXT,
    email_content TEXT,
    email_template_id UUID,

    -- Metadata
    tags TEXT[],
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 8. CAMPAIGN MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_campaign_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE NOT NULL,

    -- Status
    status TEXT DEFAULT 'added' CHECK (status IN (
        'added',
        'sent',
        'delivered',
        'opened',
        'clicked',
        'responded',
        'bounced',
        'unsubscribed'
    )),

    -- Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,

    -- Response
    response_type TEXT CHECK (response_type IN ('positive', 'negative', 'neutral')),
    response_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(campaign_id, contact_id)
);

-- =====================================================
-- 9. SERVICE TICKETS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ticket Number
    ticket_number SERIAL,

    -- Basic Info
    subject TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Relationships
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL NOT NULL,
    company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Classification
    category TEXT CHECK (category IN ('bug', 'feature_request', 'question', 'complaint', 'feedback', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open',
        'in_progress',
        'waiting_customer',
        'waiting_internal',
        'resolved',
        'closed',
        'cancelled'
    )),

    -- SLA
    sla_due_at TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT false,

    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ,

    -- Satisfaction
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    satisfaction_comment TEXT,

    -- Source
    source TEXT CHECK (source IN ('email', 'phone', 'chat', 'web_form', 'social_media', 'in_person')),

    -- Metadata
    tags TEXT[],
    attachments JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 10. TICKET COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_id UUID REFERENCES crm_tickets(id) ON DELETE CASCADE NOT NULL,

    -- Content
    comment TEXT NOT NULL,

    -- Type
    comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'internal_note', 'resolution')),
    is_public BOOLEAN DEFAULT true,

    -- Attachments
    attachments JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 11. PRODUCTS/SERVICES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    product_code TEXT UNIQUE,

    -- Type
    product_type TEXT CHECK (product_type IN ('product', 'service', 'subscription')),
    category TEXT,

    -- Pricing
    unit_price DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    cost_price DECIMAL(15, 2),

    -- Stock (for products)
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 12. EMAIL TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,

    -- Template
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,

    -- Category
    category TEXT CHECK (category IN ('sales', 'marketing', 'support', 'onboarding', 'general')),

    -- Variables
    variables TEXT[], -- e.g., ['{{first_name}}', '{{company_name}}']

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Usage
    usage_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Contacts
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_owner ON crm_contacts(owner_id);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_type ON crm_contacts(contact_type);
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_created ON crm_contacts(created_at DESC);

-- Companies
CREATE INDEX idx_crm_companies_name ON crm_companies(name);
CREATE INDEX idx_crm_companies_owner ON crm_companies(owner_id);
CREATE INDEX idx_crm_companies_status ON crm_companies(status);

-- Deals
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_crm_deals_close_date ON crm_deals(expected_close_date);
CREATE INDEX idx_crm_deals_amount ON crm_deals(amount DESC);

-- Activities
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_company ON crm_activities(company_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_owner ON crm_activities(owner_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at);

-- Tasks
CREATE INDEX idx_crm_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_due ON crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX idx_crm_tasks_priority ON crm_tasks(priority);

-- Tickets
CREATE INDEX idx_crm_tickets_number ON crm_tickets(ticket_number);
CREATE INDEX idx_crm_tickets_contact ON crm_tickets(contact_id);
CREATE INDEX idx_crm_tickets_assigned ON crm_tickets(assigned_to);
CREATE INDEX idx_crm_tickets_status ON crm_tickets(status);
CREATE INDEX idx_crm_tickets_priority ON crm_tickets(priority);
CREATE INDEX idx_crm_tickets_created ON crm_tickets(created_at DESC);

-- Campaigns
CREATE INDEX idx_crm_campaigns_status ON crm_campaigns(status);
CREATE INDEX idx_crm_campaigns_type ON crm_campaigns(campaign_type);
CREATE INDEX idx_crm_campaigns_dates ON crm_campaigns(start_date, end_date);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_companies_updated_at BEFORE UPDATE ON crm_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON crm_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON crm_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON crm_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_tickets_updated_at BEFORE UPDATE ON crm_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_campaigns_updated_at BEFORE UPDATE ON crm_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_activity_at on contacts when activity is created
CREATE OR REPLACE FUNCTION update_contact_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE crm_contacts
    SET last_activity_at = NOW()
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_activity_trigger
    AFTER INSERT ON crm_activities
    FOR EACH ROW
    WHEN (NEW.contact_id IS NOT NULL)
    EXECUTE FUNCTION update_contact_last_activity();

-- Update deal status when stage changes to closed
CREATE OR REPLACE FUNCTION update_deal_closed_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stage = 'closed_won' THEN
        NEW.is_closed = true;
        NEW.is_won = true;
        NEW.actual_close_date = CURRENT_DATE;
    ELSIF NEW.stage = 'closed_lost' THEN
        NEW.is_closed = true;
        NEW.is_won = false;
        NEW.actual_close_date = CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deal_status_trigger
    BEFORE UPDATE ON crm_deals
    FOR EACH ROW
    WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
    EXECUTE FUNCTION update_deal_closed_status();

-- Update campaign performance stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE crm_campaigns c
    SET
        total_sent = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND sent_at IS NOT NULL),
        total_delivered = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND delivered_at IS NOT NULL),
        total_opened = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
        total_clicked = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL),
        total_responded = (SELECT COUNT(*) FROM crm_campaign_members WHERE campaign_id = NEW.campaign_id AND responded_at IS NOT NULL)
    WHERE c.id = NEW.campaign_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
    AFTER INSERT OR UPDATE ON crm_campaign_members
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_stats();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_products ENABLE ROW LEVEL SECURITY;

-- Users can view contacts they own or their team's contacts
CREATE POLICY "Users can view their contacts"
    ON crm_contacts FOR SELECT
    USING (
        auth.uid() = owner_id
        OR auth.uid() = created_by
    );

CREATE POLICY "Users can create contacts"
    ON crm_contacts FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their contacts"
    ON crm_contacts FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- Similar policies for other tables
CREATE POLICY "Users can view their companies"
    ON crm_companies FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can view their deals"
    ON crm_deals FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can view their activities"
    ON crm_activities FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = created_by);

CREATE POLICY "Users can view their tasks"
    ON crm_tasks FOR SELECT
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

CREATE POLICY "Users can view their tickets"
    ON crm_tickets FOR SELECT
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- Admin policies
CREATE POLICY "Admins can manage all CRM data"
    ON crm_contacts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Contact Summary View
CREATE OR REPLACE VIEW crm_contact_summary AS
SELECT
    contact_type,
    status,
    COUNT(*) as total_contacts,
    AVG(lead_score) as avg_lead_score,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
FROM crm_contacts
GROUP BY contact_type, status;

-- Deal Pipeline View
CREATE OR REPLACE VIEW crm_deal_pipeline AS
SELECT
    stage,
    COUNT(*) as deal_count,
    SUM(amount) as total_value,
    AVG(amount) as avg_deal_size,
    AVG(probability) as avg_probability
FROM crm_deals
WHERE NOT is_closed
GROUP BY stage
ORDER BY
    CASE stage
        WHEN 'prospecting' THEN 1
        WHEN 'qualification' THEN 2
        WHEN 'proposal' THEN 3
        WHEN 'negotiation' THEN 4
    END;

-- Sales Performance View
CREATE OR REPLACE VIEW crm_sales_performance AS
SELECT
    owner_id,
    COUNT(*) as total_deals,
    COUNT(*) FILTER (WHERE is_won = true) as won_deals,
    SUM(amount) FILTER (WHERE is_won = true) as total_revenue,
    AVG(amount) FILTER (WHERE is_won = true) as avg_deal_size,
    ROUND(COUNT(*) FILTER (WHERE is_won = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as win_rate
FROM crm_deals
WHERE is_closed = true
GROUP BY owner_id;

-- Ticket Stats View
CREATE OR REPLACE VIEW crm_ticket_stats AS
SELECT
    status,
    priority,
    COUNT(*) as ticket_count,
    AVG(satisfaction_rating) as avg_satisfaction,
    COUNT(*) FILTER (WHERE sla_breached = true) as sla_breaches
FROM crm_tickets
GROUP BY status, priority;

-- Comments
COMMENT ON TABLE crm_contacts IS 'Leads and customer contacts with full profile information';
COMMENT ON TABLE crm_companies IS 'Organizations and companies in the CRM';
COMMENT ON TABLE crm_deals IS 'Sales opportunities and deals pipeline';
COMMENT ON TABLE crm_activities IS 'All customer interactions - calls, emails, meetings';
COMMENT ON TABLE crm_tasks IS 'Tasks and to-dos for sales and service teams';
COMMENT ON TABLE crm_campaigns IS 'Marketing campaigns for lead generation and nurturing';
COMMENT ON TABLE crm_tickets IS 'Customer service and support tickets';
COMMENT ON TABLE crm_products IS 'Products and services catalog';
