import { supabase } from './supabase';

// User management API
export const userAPI = {
  // Get all users with profiles
  async getUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        user_sessions(
          is_active,
          last_login: created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Log the action
    await this.logAuditEvent('update', 'user', userId, null, updates);
    
    return data;
  },

  // Delete user
  async deleteUser(userId: string) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    
    // Log the action
    await this.logAuditEvent('delete', 'user', userId);
  },

  // Create new user
  async createUser(userData: {
    email: string;
    password: string;
    fullName: string;
    role: string;
  }) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        full_name: userData.fullName,
        role: userData.role
      }
    });

    if (error) throw error;
    
    // Log the action
    await this.logAuditEvent('create', 'user', data.user?.id, null, userData);
    
    return data;
  },

  // Log audit event
  async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any
  ) {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues
      });

    if (error) console.error('Error logging audit event:', error);
  }
};

// Role management API
export const roleAPI = {
  // Get all roles
  async getRoles() {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('role_name');

    if (error) throw error;
    return data;
  },

  // Update role permissions
  async updateRole(roleId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;
    
    // Log the action
    await userAPI.logAuditEvent('permission_change', 'role', roleId, null, updates);
    
    return data;
  },

  // Create new role
  async createRole(roleData: any) {
    const { data, error } = await supabase
      .from('user_roles')
      .insert(roleData)
      .select()
      .single();

    if (error) throw error;
    
    // Log the action
    await userAPI.logAuditEvent('create', 'role', data.id, null, roleData);
    
    return data;
  },

  // Delete role
  async deleteRole(roleId: string) {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;
    
    // Log the action
    await userAPI.logAuditEvent('delete', 'role', roleId);
  }
};

// Audit logs API
export const auditAPI = {
  // Get audit logs with filters
  async getAuditLogs(filters?: {
    action?: string;
    resourceType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user_profiles!audit_logs_user_id_fkey(
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

// System settings API
export const settingsAPI = {
  // Get all settings
  async getSettings() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('setting_key');

    if (error) throw error;
    return data;
  },

  // Update setting
  async updateSetting(settingKey: string, value: any) {
    const { data, error } = await supabase
      .from('system_settings')
      .update({ setting_value: value })
      .eq('setting_key', settingKey)
      .select()
      .single();

    if (error) throw error;
    
    // Log the action
    await userAPI.logAuditEvent('update', 'setting', settingKey, null, { value });
    
    return data;
  },

  // Create new setting
  async createSetting(settingData: any) {
    const { data, error } = await supabase
      .from('system_settings')
      .insert(settingData)
      .select()
      .single();

    if (error) throw error;
    
    // Log the action
    await userAPI.logAuditEvent('create', 'setting', data.setting_key, null, settingData);
    
    return data;
  }
};

// Analytics API
export const analyticsAPI = {
  // Get user statistics
  async getUserStats() {
    const { data: totalUsers, error: totalError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact' });

    const { data: activeUsers, error: activeError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    if (totalError || activeError) throw totalError || activeError;

    return {
      totalUsers: totalUsers?.length || 0,
      activeUsers: activeUsers?.length || 0
    };
  },

  // Get question statistics
  async getQuestionStats() {
    const { data, error } = await supabase
      .from('questions')
      .select('subject, is_published', { count: 'exact' });

    if (error) throw error;

    const stats = data?.reduce((acc: any, question: any) => {
      const subject = question.subject;
      if (!acc[subject]) {
        acc[subject] = { total: 0, published: 0 };
      }
      acc[subject].total++;
      if (question.is_published) {
        acc[subject].published++;
      }
      return acc;
    }, {});

    return stats || {};
  },

  // Get response statistics
  async getResponseStats() {
    const { data, error } = await supabase
      .from('student_responses')
      .select('id', { count: 'exact' });

    if (error) throw error;
    return data?.length || 0;
  }
};

export default {
  userAPI,
  roleAPI,
  auditAPI,
  settingsAPI,
  analyticsAPI
};