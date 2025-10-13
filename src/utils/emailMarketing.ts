import { supabase } from './supabase';

/**
 * Email Marketing Utility Functions
 * Simple utilities for managing email subscribers and marketing preferences
 */

export interface EmailSubscriber {
  id?: string;
  user_id?: string;
  email: string;
  name?: string;
  subscribed: boolean;
  consent_date?: string;
  unsubscribe_date?: string;
  source?: 'registration' | 'profile' | 'landing_page' | 'manual';
  preferences?: {
    course_updates?: boolean;
    tournament_notifications?: boolean;
    weekly_digest?: boolean;
    promotional_offers?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export const emailMarketingAPI = {
  /**
   * Subscribe a user to marketing emails
   */
  async subscribe(email: string, name?: string, userId?: string, source: string = 'manual'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('email_subscribers').upsert({
        user_id: userId,
        email: email.toLowerCase().trim(),
        name: name,
        subscribed: true,
        consent_date: new Date().toISOString(),
        source: source,
        preferences: {
          course_updates: true,
          tournament_notifications: true,
          weekly_digest: true,
          promotional_offers: true
        }
      }, {
        onConflict: 'email'
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error subscribing user:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Unsubscribe a user from marketing emails
   */
  async unsubscribe(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('email_subscribers')
        .update({
          subscribed: false,
          unsubscribe_date: new Date().toISOString()
        })
        .eq('email', email.toLowerCase().trim());

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error unsubscribing user:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update email preferences for a user
   */
  async updatePreferences(
    email: string,
    preferences: {
      course_updates?: boolean;
      tournament_notifications?: boolean;
      weekly_digest?: boolean;
      promotional_offers?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('email_subscribers')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase().trim());

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get subscriber information
   */
  async getSubscriber(email: string): Promise<EmailSubscriber | null> {
    try {
      const { data, error } = await supabase
        .from('email_subscribers')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching subscriber:', error);
      return null;
    }
  },

  /**
   * Get subscriber by user ID
   */
  async getSubscriberByUserId(userId: string): Promise<EmailSubscriber | null> {
    try {
      const { data, error } = await supabase
        .from('email_subscribers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching subscriber by user ID:', error);
      return null;
    }
  },

  /**
   * Get all active subscribers (Admin only)
   */
  async getAllSubscribers(filters?: {
    subscribed?: boolean;
    source?: string;
  }): Promise<EmailSubscriber[]> {
    try {
      let query = supabase
        .from('email_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.subscribed !== undefined) {
        query = query.eq('subscribed', filters.subscribed);
      }

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all subscribers:', error);
      return [];
    }
  },

  /**
   * Get subscriber count
   */
  async getSubscriberCount(): Promise<{ total: number; active: number }> {
    try {
      const { count: totalCount, error: totalError } = await supabase
        .from('email_subscribers')
        .select('*', { count: 'exact', head: true });

      const { count: activeCount, error: activeError } = await supabase
        .from('email_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);

      if (totalError || activeError) throw totalError || activeError;

      return {
        total: totalCount || 0,
        active: activeCount || 0
      };
    } catch (error: any) {
      console.error('Error getting subscriber count:', error);
      return { total: 0, active: 0 };
    }
  },

  /**
   * Export subscribers to CSV format (for admin use)
   */
  async exportSubscribersCSV(subscribed: boolean = true): Promise<string> {
    try {
      const subscribers = await this.getAllSubscribers({ subscribed });

      if (subscribers.length === 0) {
        return 'email,name,subscribed,consent_date,source\n';
      }

      const headers = 'email,name,subscribed,consent_date,source,course_updates,tournament_notifications,weekly_digest,promotional_offers\n';
      const rows = subscribers.map(sub => {
        const prefs = sub.preferences || {};
        return `${sub.email},"${sub.name || ''}",${sub.subscribed},${sub.consent_date || ''},${sub.source || ''},${prefs.course_updates || false},${prefs.tournament_notifications || false},${prefs.weekly_digest || false},${prefs.promotional_offers || false}`;
      }).join('\n');

      return headers + rows;
    } catch (error: any) {
      console.error('Error exporting subscribers:', error);
      return 'email,name,subscribed,consent_date,source\n';
    }
  },

  /**
   * Batch import subscribers (for admin use)
   */
  async batchImport(subscribers: { email: string; name?: string }[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const sub of subscribers) {
      const result = await this.subscribe(sub.email, sub.name, undefined, 'manual');
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }
};

export default emailMarketingAPI;
