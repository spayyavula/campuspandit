import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';

// Get auth token from localStorage (Supabase auth format)
const getAuthToken = () => {
  const authData = localStorage.getItem('campuspandit-auth-storage');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    // Supabase stores auth in format: { access_token, refresh_token, ... }
    // or nested as { session: { access_token, ... } }
    return parsed?.access_token || parsed?.session?.access_token || null;
  } catch {
    return null;
  }
};

// Create axios instance with auth
const api = axios.create({
  baseURL: `${API_BASE_URL}/crm`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  company?: Company;
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
  contact?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  company?: {
    name: string;
  };
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
  contact?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  deal?: {
    name: string;
  };
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
  contact?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  deal?: {
    name: string;
  };
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
  contact: {
    first_name: string;
    last_name: string;
    email: string;
  };
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  comment: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
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
    const params = new URLSearchParams();
    if (filters?.contact_type) params.append('contact_type', filters.contact_type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.owner_id) params.append('owner_id', filters.owner_id);
    if (filters?.search) params.append('search', filters.search);

    const { data } = await api.get<Contact[]>('/contacts', { params });
    return data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

export async function getContact(id: string) {
  try {
    const { data } = await api.get<Contact>(`/contacts/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching contact:', error);
    throw error;
  }
}

export async function createContact(contact: Partial<Contact>) {
  try {
    const { data } = await api.post<Contact>('/contacts', contact);
    return data;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
}

export async function updateContact(id: string, updates: Partial<Contact>) {
  try {
    const { data } = await api.patch<Contact>(`/contacts/${id}`, updates);
    return data;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
}

export async function deleteContact(id: string) {
  try {
    await api.delete(`/contacts/${id}`);
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
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.owner_id) params.append('owner_id', filters.owner_id);
    if (filters?.search) params.append('search', filters.search);

    const { data } = await api.get<Company[]>('/companies', { params });
    return data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

export async function createCompany(company: Partial<Company>) {
  try {
    const { data } = await api.post<Company>('/companies', company);
    return data;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  try {
    const { data } = await api.patch<Company>(`/companies/${id}`, updates);
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
    const params = new URLSearchParams();
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.owner_id) params.append('owner_id', filters.owner_id);
    if (filters?.is_closed !== undefined) params.append('is_closed', String(filters.is_closed));

    const { data } = await api.get<Deal[]>('/deals', { params });
    return data;
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}

export async function getDeal(id: string) {
  try {
    const { data } = await api.get<Deal>(`/deals/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
}

export async function createDeal(deal: Partial<Deal>) {
  try {
    const { data } = await api.post<Deal>('/deals', deal);
    return data;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
}

export async function updateDeal(id: string, updates: Partial<Deal>) {
  try {
    const { data } = await api.patch<Deal>(`/deals/${id}`, updates);
    return data;
  } catch (error) {
    console.error('Error updating deal:', error);
    throw error;
  }
}

export async function deleteDeal(id: string) {
  try {
    await api.delete(`/deals/${id}`);
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
    const params = new URLSearchParams();
    if (filters?.contact_id) params.append('contact_id', filters.contact_id);
    if (filters?.deal_id) params.append('deal_id', filters.deal_id);
    if (filters?.activity_type) params.append('activity_type', filters.activity_type);
    if (filters?.owner_id) params.append('owner_id', filters.owner_id);

    const { data} = await api.get<Activity[]>('/activities', { params });
    return data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
}

export async function createActivity(activity: Partial<Activity>) {
  try {
    const { data } = await api.post<Activity>('/activities', activity);
    return data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

export async function updateActivity(id: string, updates: Partial<Activity>) {
  try {
    const { data } = await api.patch<Activity>(`/activities/${id}`, updates);
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
    const params = new URLSearchParams();
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.due_date) params.append('due_date', filters.due_date);

    const { data } = await api.get<Task[]>('/tasks', { params });
    return data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function createTask(task: Partial<Task>) {
  try {
    const { data } = await api.post<Task>('/tasks', task);
    return data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTask(id: string, updates: Partial<Task>) {
  try {
    const { data } = await api.patch<Task>(`/tasks/${id}`, updates);
    return data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(id: string) {
  try {
    await api.delete(`/tasks/${id}`);
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
    const params = new URLSearchParams();
    if (filters?.campaign_type) params.append('campaign_type', filters.campaign_type);
    if (filters?.status) params.append('status', filters.status);

    const { data } = await api.get<Campaign[]>('/campaigns', { params });
    return data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

export async function createCampaign(campaign: Partial<Campaign>) {
  try {
    const { data } = await api.post<Campaign>('/campaigns', campaign);
    return data;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
  try {
    const { data } = await api.patch<Campaign>(`/campaigns/${id}`, updates);
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
    const params = new URLSearchParams();
    if (filters?.contact_id) params.append('contact_id', filters.contact_id);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const { data } = await api.get<Ticket[]>('/tickets', { params });
    return data;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}

export async function getTicket(id: string) {
  try {
    const { data } = await api.get<Ticket>(`/tickets/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
}

export async function createTicket(ticket: Partial<Ticket>) {
  try {
    const { data } = await api.post<Ticket>('/tickets', ticket);
    return data;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

export async function updateTicket(id: string, updates: Partial<Ticket>) {
  try {
    const { data } = await api.patch<Ticket>(`/tickets/${id}`, updates);
    return data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
}

export async function addTicketComment(ticketId: string, comment: string, isPublic: boolean = true) {
  try {
    const { data } = await api.post<TicketComment>(`/tickets/${ticketId}/comments`, {
      comment,
      is_public: isPublic,
    });
    return data;
  } catch (error) {
    console.error('Error adding ticket comment:', error);
    throw error;
  }
}

// =====================================================
// ANALYTICS & REPORTS
// =====================================================

export interface DashboardStats {
  total_contacts: number;
  total_deals: number;
  pending_tasks: number;
  open_tickets: number;
  total_revenue: number;
  deals_this_month: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  total_value: number;
}

export interface ContactSummary {
  contact_type: string;
  count: number;
}

export interface TicketStats {
  status: string;
  count: number;
}

export async function getDashboardStats(userId?: string) {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);

    const { data } = await api.get<DashboardStats>('/dashboard/stats', { params });
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

export async function getSalesPipeline() {
  try {
    const { data } = await api.get<PipelineStage[]>('/deal-pipeline');
    return data;
  } catch (error) {
    console.error('Error fetching sales pipeline:', error);
    throw error;
  }
}

export async function getContactSummary() {
  try {
    const { data } = await api.get<ContactSummary[]>('/contact-summary');
    return data;
  } catch (error) {
    console.error('Error fetching contact summary:', error);
    throw error;
  }
}

export async function getTicketStats() {
  try {
    const { data } = await api.get<TicketStats[]>('/ticket-stats');
    return data;
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    throw error;
  }
}
