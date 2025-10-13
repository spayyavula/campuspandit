import { supabase } from './supabase';

// =====================================================
// TYPES
// =====================================================

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  contact_type: 'lead' | 'customer' | 'partner' | 'vendor';
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'customer' | 'inactive';
  company_id?: string;
  job_title?: string;
  source?: string;
  lead_score?: number;
  owner_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  company_size?: string;
  status: 'prospect' | 'customer' | 'partner' | 'inactive';
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  name: string;
  contact_id: string;
  company_id?: string;
  owner_id: string;
  amount: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expected_close_date?: string;
  is_closed: boolean;
  is_won: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'sms' | 'whatsapp';
  subject: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  owner_id: string;
  scheduled_at?: string;
  completed_at?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  contact_id?: string;
  deal_id?: string;
  assigned_to: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: 'email' | 'sms' | 'social_media' | 'webinar' | 'event' | 'content' | 'paid_ads';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  description: string;
  contact_id: string;
  assigned_to?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'waiting_internal' | 'resolved' | 'closed' | 'cancelled';
  satisfaction_rating?: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CONTACTS API
// =====================================================

export async function getContacts(filters?: {
  contact_type?: string;
  status?: string;
  owner_id?: string;
  search?: string;
}) {
  try {
    let query = supabase.from('crm_contacts').select('*');

    if (filters?.contact_type) {
      query = query.eq('contact_type', filters.contact_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

export async function getContact(id: string) {
  try {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*, company:crm_companies(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching contact:', error);
    throw error;
  }
}

export async function createContact(contact: Partial<Contact>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('crm_contacts')
      .insert({
        ...contact,
        created_by: user.id,
        owner_id: contact.owner_id || user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
}

export async function updateContact(id: string, updates: Partial<Contact>) {
  try {
    const { data, error } = await supabase
      .from('crm_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
}

export async function deleteContact(id: string) {
  try {
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
}

// =====================================================
// COMPANIES API
// =====================================================

export async function getCompanies(filters?: {
  status?: string;
  owner_id?: string;
  search?: string;
}) {
  try {
    let query = supabase.from('crm_companies').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

export async function createCompany(company: Partial<Company>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        ...company,
        created_by: user.id,
        owner_id: company.owner_id || user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  try {
    const { data, error } = await supabase
      .from('crm_companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
}

// =====================================================
// DEALS API
// =====================================================

export async function getDeals(filters?: {
  stage?: string;
  owner_id?: string;
  is_closed?: boolean;
}) {
  try {
    let query = supabase
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(first_name, last_name, email),
        company:crm_companies(name)
      `);

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.is_closed !== undefined) {
      query = query.eq('is_closed', filters.is_closed);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}

export async function getDeal(id: string) {
  try {
    const { data, error } = await supabase
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(*),
        company:crm_companies(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
}

export async function createDeal(deal: Partial<Deal>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('crm_deals')
      .insert({
        ...deal,
        created_by: user.id,
        owner_id: deal.owner_id || user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
}

export async function updateDeal(id: string, updates: Partial<Deal>) {
  try {
    const { data, error } = await supabase
      .from('crm_deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating deal:', error);
    throw error;
  }
}

export async function deleteDeal(id: string) {
  try {
    const { error } = await supabase
      .from('crm_deals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
}

// =====================================================
// ACTIVITIES API
// =====================================================

export async function getActivities(filters?: {
  contact_id?: string;
  deal_id?: string;
  activity_type?: string;
  owner_id?: string;
}) {
  try {
    let query = supabase
      .from('crm_activities')
      .select(`
        *,
        contact:crm_contacts(first_name, last_name),
        deal:crm_deals(name)
      `);

    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }
    if (filters?.deal_id) {
      query = query.eq('deal_id', filters.deal_id);
    }
    if (filters?.activity_type) {
      query = query.eq('activity_type', filters.activity_type);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
}

export async function createActivity(activity: Partial<Activity>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        ...activity,
        created_by: user.id,
        owner_id: activity.owner_id || user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

export async function updateActivity(id: string, updates: Partial<Activity>) {
  try {
    const { data, error } = await supabase
      .from('crm_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
}

// =====================================================
// TASKS API
// =====================================================

export async function getTasks(filters?: {
  assigned_to?: string;
  status?: string;
  priority?: string;
  due_date?: string;
}) {
  try {
    let query = supabase
      .from('crm_tasks')
      .select(`
        *,
        contact:crm_contacts(first_name, last_name),
        deal:crm_deals(name)
      `);

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.due_date) {
      query = query.eq('due_date', filters.due_date);
    }

    const { data, error } = await query.order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function createTask(task: Partial<Task>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        ...task,
        created_by: user.id,
        assigned_to: task.assigned_to || user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTask(id: string, updates: Partial<Task>) {
  try {
    const { data, error } = await supabase
      .from('crm_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(id: string) {
  try {
    const { error } = await supabase
      .from('crm_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// =====================================================
// CAMPAIGNS API
// =====================================================

export async function getCampaigns(filters?: {
  campaign_type?: string;
  status?: string;
}) {
  try {
    let query = supabase.from('crm_campaigns').select('*');

    if (filters?.campaign_type) {
      query = query.eq('campaign_type', filters.campaign_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

export async function createCampaign(campaign: Partial<Campaign>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('crm_campaigns')
      .insert({
        ...campaign,
        created_by: user.id,
        owner_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
  try {
    const { data, error } = await supabase
      .from('crm_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

// =====================================================
// TICKETS API
// =====================================================

export async function getTickets(filters?: {
  contact_id?: string;
  assigned_to?: string;
  status?: string;
  priority?: string;
}) {
  try {
    let query = supabase
      .from('crm_tickets')
      .select(`
        *,
        contact:crm_contacts(first_name, last_name, email)
      `);

    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}

export async function getTicket(id: string) {
  try {
    const { data, error } = await supabase
      .from('crm_tickets')
      .select(`
        *,
        contact:crm_contacts(*),
        comments:crm_ticket_comments(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
}

export async function createTicket(ticket: Partial<Ticket>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('crm_tickets')
      .insert({
        ...ticket,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

export async function updateTicket(id: string, updates: Partial<Ticket>) {
  try {
    const { data, error } = await supabase
      .from('crm_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
}

export async function addTicketComment(ticketId: string, comment: string, isPublic: boolean = true) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('crm_ticket_comments')
      .insert({
        ticket_id: ticketId,
        comment,
        is_public: isPublic,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding ticket comment:', error);
    throw error;
  }
}

// =====================================================
// ANALYTICS & REPORTS
// =====================================================

export async function getDashboardStats(userId?: string) {
  try {
    const { data, error } = await supabase.rpc('get_crm_dashboard_stats', {
      user_id: userId
    });

    if (error) {
      // Fallback to individual queries if RPC doesn't exist
      const [contactsRes, dealsRes, tasksRes, ticketsRes] = await Promise.all([
        supabase.from('crm_contacts').select('count', { count: 'exact', head: true }),
        supabase.from('crm_deals').select('count, amount', { count: 'exact' }).eq('is_closed', false),
        supabase.from('crm_tasks').select('count', { count: 'exact', head: true }).eq('status', 'todo'),
        supabase.from('crm_tickets').select('count', { count: 'exact', head: true }).eq('status', 'open')
      ]);

      return {
        total_contacts: contactsRes.count || 0,
        total_deals: dealsRes.count || 0,
        pending_tasks: tasksRes.count || 0,
        open_tickets: ticketsRes.count || 0
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

export async function getSalesPipeline() {
  try {
    const { data, error } = await supabase
      .from('crm_deal_pipeline')
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching sales pipeline:', error);
    throw error;
  }
}

export async function getContactSummary() {
  try {
    const { data, error } = await supabase
      .from('crm_contact_summary')
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching contact summary:', error);
    throw error;
  }
}

export async function getTicketStats() {
  try {
    const { data, error } = await supabase
      .from('crm_ticket_stats')
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    throw error;
  }
}
