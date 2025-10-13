# CRM System - Complete Guide

A minimalistic Customer Relationship Management (CRM) system with Sales, Marketing, and Service modules. Designed with Zerodha's clean, simple principles for maximum productivity.

## 🎯 Overview

The CRM system provides complete customer lifecycle management:
- **Sales Module**: Contacts, deals, pipeline management
- **Marketing Module**: Campaigns, email automation, analytics
- **Service Module**: Tickets, support tracking, satisfaction ratings

## 🏗️ Architecture

### Database Schema

**12 Core Tables:**
1. **crm_contacts** - Leads and customers with qualification tracking
2. **crm_companies** - Organizations and business entities
3. **crm_deals** - Sales opportunities with pipeline stages
4. **crm_activities** - All customer interactions (calls, emails, meetings)
5. **crm_tasks** - To-dos and action items
6. **crm_notes** - Internal notes and documentation
7. **crm_campaigns** - Marketing campaigns
8. **crm_campaign_members** - Campaign recipients and tracking
9. **crm_tickets** - Customer service requests
10. **crm_ticket_comments** - Ticket conversations
11. **crm_products** - Products and services catalog
12. **crm_email_templates** - Reusable email templates

### Key Features

#### Contacts Management
```typescript
interface Contact {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  contact_type: 'lead' | 'customer' | 'partner' | 'vendor';
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'customer' | 'inactive';
  lead_score: number; // 0-100
  source: 'website' | 'referral' | 'cold_call' | 'email_campaign' | 'social_media' | 'event';
  company_id?: string;
  owner_id: string;
}
```

**Contact Types:**
- `lead`: Potential customers
- `customer`: Paying customers
- `partner`: Business partners
- `vendor`: Suppliers and vendors

**Lead Stages:**
- `new`: Just entered system
- `contacted`: Initial contact made
- `qualified`: Meets buying criteria
- `unqualified`: Not a good fit
- `customer`: Converted to customer
- `inactive`: No longer engaged

#### Sales Pipeline
```typescript
interface Deal {
  name: string;
  contact_id: string;
  amount: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number; // Win probability %
  expected_close_date: date;
  owner_id: string;
}
```

**Pipeline Stages:**
1. **Prospecting** (10% probability) - Initial contact
2. **Qualification** (25% probability) - Qualifying the opportunity
3. **Proposal** (50% probability) - Proposal sent
4. **Negotiation** (75% probability) - Negotiating terms
5. **Closed Won** (100% probability) - Deal won
6. **Closed Lost** (0% probability) - Deal lost

#### Marketing Campaigns
```typescript
interface Campaign {
  name: string;
  campaign_type: 'email' | 'sms' | 'social_media' | 'webinar' | 'event' | 'content' | 'paid_ads';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date: date;
  end_date: date;
  budget: number;
  target_leads: number;
}
```

**Campaign Tracking:**
- Total sent
- Delivered
- Opened (open rate)
- Clicked (click-through rate)
- Leads generated
- Conversions

#### Service Tickets
```typescript
interface Ticket {
  ticket_number: number; // Auto-generated
  subject: string;
  description: string;
  contact_id: string;
  category: 'bug' | 'feature_request' | 'question' | 'complaint' | 'feedback' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assigned_to?: string;
  satisfaction_rating?: number; // 1-5
}
```

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
psql -h your-supabase-host -U postgres -d postgres -f database/crm_schema.sql
```

This creates:
- All 12 tables with relationships
- Indexes for performance
- Row Level Security policies
- Triggers for automatic updates
- Views for analytics

### Step 2: Configure RLS Policies

The schema includes RLS policies that:
- Users can only see their own contacts/deals/tickets
- Admins can see everything
- Team members can see shared records

### Step 3: Add CRM Routes

Already configured in `App.tsx`:
```typescript
<Route path="/crm" element={<CRMDashboard userId={user.id} />} />
<Route path="/crm/contacts" element={<ContactsManager />} />
<Route path="/crm/deals" element={<DealsPipeline />} />
<Route path="/crm/tickets" element={<TicketsManager />} />
```

## 📊 User Interface

### CRM Dashboard

Clean, card-based layout showing:
- **Key Metrics**: Total contacts, active deals, pending tasks, open tickets
- **Quick Actions**: Add contact, create deal, log activity, create ticket
- **Sales Pipeline**: Visual funnel with deal counts and values
- **Recent Activity**: Timeline of latest interactions

### Contacts Manager

Features:
- **Table View**: Sortable, filterable contact list
- **Search**: Real-time search by name, email, or company
- **Filters**: Type (lead/customer/partner), Status, Source
- **Quick Actions**: Edit, Delete, Send Email, Log Call
- **Bulk Operations**: Export to CSV, Import from CSV

### Deals Pipeline (Kanban Board)

Drag-and-drop Kanban board:
- **4 Columns**: Prospecting, Qualification, Proposal, Negotiation
- **Deal Cards**: Show amount, contact, company, close date
- **Quick Move**: Buttons to move deals forward/backward
- **Stage Stats**: Total deals and value per stage

### Service Tickets

List view with:
- **Ticket Number**: Auto-generated unique ID
- **Priority Badges**: Color-coded (Low/Medium/High/Urgent)
- **Status Tracking**: Open → In Progress → Resolved → Closed
- **SLA Monitoring**: Automatic breach detection
- **Comments**: Internal notes and customer responses

## 🔌 API Usage

### Import

```typescript
import {
  // Contacts
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,

  // Companies
  getCompanies,
  createCompany,
  updateCompany,

  // Deals
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,

  // Activities
  getActivities,
  createActivity,
  updateActivity,

  // Tasks
  getTasks,
  createTask,
  updateTask,
  deleteTask,

  // Campaigns
  getCampaigns,
  createCampaign,
  updateCampaign,

  // Tickets
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  addTicketComment,

  // Analytics
  getDashboardStats,
  getSalesPipeline,
  getContactSummary,
  getTicketStats
} from './utils/crmAPI';
```

### Common Operations

#### Create a New Lead

```typescript
const lead = await createContact({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+91-9876543210',
  contact_type: 'lead',
  status: 'new',
  source: 'website',
  job_title: 'CTO',
  lead_score: 75
});
```

#### Create a Deal

```typescript
const deal = await createDeal({
  name: 'Enterprise Package - ABC Corp',
  contact_id: lead.id,
  amount: 500000, // ₹5,00,000
  stage: 'prospecting',
  probability: 10,
  expected_close_date: '2025-03-31',
  products: [
    { product_id: 'prod_123', quantity: 1, price: 500000 }
  ]
});
```

#### Log a Call Activity

```typescript
await createActivity({
  activity_type: 'call',
  subject: 'Discovery Call - ABC Corp',
  description: 'Discussed requirements and pain points',
  contact_id: lead.id,
  deal_id: deal.id,
  call_direction: 'outbound',
  call_outcome: 'connected',
  duration_minutes: 30,
  status: 'completed'
});
```

#### Create a Marketing Campaign

```typescript
const campaign = await createCampaign({
  name: 'Spring 2025 Promotion',
  campaign_type: 'email',
  status: 'draft',
  start_date: '2025-03-01',
  end_date: '2025-03-31',
  budget: 50000,
  target_leads: 1000,
  email_subject: 'Exclusive Spring Offer - 30% Off!',
  email_content: '<html>...</html>'
});
```

#### Create a Support Ticket

```typescript
const ticket = await createTicket({
  subject: 'Unable to login to dashboard',
  description: 'Customer reports error when trying to log in',
  contact_id: customer.id,
  category: 'bug',
  priority: 'high',
  status: 'open',
  source: 'email'
});

// Add a comment
await addTicketComment(ticket.id, 'Investigating the issue', true);
```

## 📈 Analytics & Reports

### Dashboard Stats

```typescript
const stats = await getDashboardStats(userId);
// Returns:
// {
//   total_contacts: 150,
//   total_deals: 25,
//   pending_tasks: 12,
//   open_tickets: 8,
//   total_revenue: 2500000,
//   deals_this_month: 5
// }
```

### Sales Pipeline Analytics

```typescript
const pipeline = await getSalesPipeline();
// Returns array of stages with:
// {
//   stage: 'prospecting',
//   deal_count: 10,
//   total_value: 1000000,
//   avg_deal_size: 100000,
//   avg_probability: 15
// }
```

### Contact Summary

```typescript
const summary = await getContactSummary();
// Returns breakdown by type and status:
// {
//   contact_type: 'lead',
//   status: 'new',
//   total_contacts: 50,
//   avg_lead_score: 65,
//   new_this_month: 12
// }
```

## 🎨 Customization

### Custom Fields

Add custom fields via JSONB columns:

```typescript
await updateContact(contactId, {
  custom_fields: {
    linkedin_profile: 'https://linkedin.com/in/johndoe',
    industry_specialization: 'EdTech',
    company_size_preference: '50-200',
    budget_range: '₹5L-₹10L'
  }
});
```

### Custom Tags

Organize with tags:

```typescript
await updateContact(contactId, {
  tags: ['hot-lead', 'decision-maker', 'enterprise']
});

await updateDeal(dealId, {
  tags: ['q1-target', 'upsell-opportunity']
});
```

### Email Templates

Create reusable templates:

```typescript
const template = await supabase.from('crm_email_templates').insert({
  name: 'Welcome Email',
  category: 'onboarding',
  subject: 'Welcome to {{company_name}}!',
  body_html: `
    <p>Hi {{first_name}},</p>
    <p>Welcome to {{company_name}}! We're excited to have you on board.</p>
  `,
  variables: ['first_name', 'company_name']
});
```

## 🔔 Automation & Workflows

### Auto-Assignment Rules

Assign contacts based on criteria:

```sql
-- Trigger to auto-assign leads from specific sources
CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source = 'website' THEN
    NEW.owner_id = (SELECT id FROM users WHERE role = 'sales' ORDER BY RANDOM() LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### SLA Management

Automatic SLA tracking:

```typescript
// Tickets automatically get SLA due date based on priority
// High priority: 4 hours
// Medium priority: 24 hours
// Low priority: 72 hours

// Trigger sets sla_breached = true when due date passes
```

### Lead Scoring

Automatic lead scoring based on:
- Activity frequency (calls, emails, meetings)
- Engagement level (email opens, clicks)
- Company size and industry
- Budget fit
- Decision-making authority

```typescript
// Lead score updates automatically via triggers
// Score range: 0-100
// 80+: Hot lead
// 60-79: Warm lead
// 40-59: Medium lead
// <40: Cold lead
```

## 🔐 Security & Privacy

### Row Level Security

```sql
-- Users can only see their own records
CREATE POLICY "Users can view their contacts"
  ON crm_contacts FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- Admins can see everything
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
```

### Data Privacy

- Email opt-in/opt-out tracking
- Do-not-contact flags
- GDPR compliance fields
- Data retention policies
- Audit logs for all changes

## 📱 Mobile-Responsive

All CRM components are fully responsive:
- **Mobile**: Stacked layout, touch-friendly buttons
- **Tablet**: 2-column grid
- **Desktop**: Full multi-column layout

## 🧪 Testing

### Sample Data Creation

```typescript
// Create test contacts
for (let i = 0; i < 10; i++) {
  await createContact({
    first_name: `Test${i}`,
    last_name: `User${i}`,
    email: `test${i}@example.com`,
    contact_type: 'lead',
    status: 'new',
    source: 'website'
  });
}

// Create test deals
const contacts = await getContacts();
for (const contact of contacts.slice(0, 5)) {
  await createDeal({
    name: `Deal - ${contact.first_name}`,
    contact_id: contact.id,
    amount: Math.floor(Math.random() * 1000000),
    stage: 'prospecting'
  });
}
```

## 🐛 Troubleshooting

### Common Issues

**1. Contacts not showing**
- Check RLS policies
- Verify user has owner_id or created_by matching their ID
- Check if user has admin role

**2. Dashboard stats not updating**
- Verify triggers are enabled
- Check database views are created
- Run manual stats query to debug

**3. Email templates not working**
- Check variables match template placeholders
- Verify HTML is properly escaped
- Test with plain text version first

## 🚀 Future Enhancements

### Planned Features

- [ ] **Email Integration** - Gmail, Outlook sync
- [ ] **Calendar Sync** - Google Calendar, Outlook Calendar
- [ ] **WhatsApp Integration** - Send messages directly
- [ ] **AI Lead Scoring** - Machine learning-based scoring
- [ ] **Sales Forecasting** - Revenue predictions
- [ ] **Team Collaboration** - Shared notes, mentions
- [ ] **Mobile Apps** - Native iOS and Android
- [ ] **Custom Dashboards** - Drag-and-drop widgets
- [ ] **Advanced Reports** - Custom report builder
- [ ] **Workflow Automation** - Visual workflow builder
- [ ] **VoIP Integration** - Click-to-call
- [ ] **Live Chat** - Embedded chat widget
- [ ] **Knowledge Base** - Self-service portal
- [ ] **Contract Management** - Document signing
- [ ] **Inventory Tracking** - Product stock management

## 📖 Examples

### Complete Sales Flow

```typescript
// 1. Lead comes from website
const lead = await createContact({
  first_name: 'Sarah',
  last_name: 'Johnson',
  email: 'sarah@techstartup.com',
  phone: '+91-9876543210',
  contact_type: 'lead',
  status: 'new',
  source: 'website',
  job_title: 'CEO',
  company_id: companyId
});

// 2. Sales rep makes first call
await createActivity({
  activity_type: 'call',
  subject: 'Discovery Call',
  contact_id: lead.id,
  call_direction: 'outbound',
  call_outcome: 'connected',
  status: 'completed'
});

// 3. Lead is qualified, create deal
await updateContact(lead.id, { status: 'qualified', lead_score: 85 });

const deal = await createDeal({
  name: 'Enterprise Plan - TechStartup Inc',
  contact_id: lead.id,
  company_id: companyId,
  amount: 1000000,
  stage: 'qualification',
  probability: 25,
  expected_close_date: '2025-06-30'
});

// 4. Send proposal
await updateDeal(deal.id, { stage: 'proposal', probability: 50 });

// 5. Win the deal!
await updateDeal(deal.id, { stage: 'closed_won', probability: 100 });
await updateContact(lead.id, { contact_type: 'customer', status: 'customer' });

// 6. Customer opens support ticket
const ticket = await createTicket({
  subject: 'Need help with onboarding',
  description: 'Would like a walkthrough of the dashboard',
  contact_id: lead.id,
  category: 'question',
  priority: 'medium',
  status: 'open'
});
```

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Design Philosophy**: Minimalistic, inspired by Zerodha
**Built with**: React, TypeScript, Supabase, TailwindCSS
