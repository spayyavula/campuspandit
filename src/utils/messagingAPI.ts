// =====================================================
// TYPES
// =====================================================

export interface Channel {
  id: string;
  name: string;
  description?: string;
  channel_type: 'direct' | 'group' | 'tutor_student' | 'class' | 'subject';
  is_private: boolean;
  is_archived: boolean;
  created_by?: string;
  tutor_id?: string;
  subject?: string;
  topic?: string;
  member_count: number;
  message_count: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  my_membership?: ChannelMember;
}

export interface ChannelMember {
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  notifications_enabled: boolean;
  notification_level: 'all' | 'mentions' | 'none';
  is_muted: boolean;
  is_starred: boolean;
  last_read_at: string;
  unread_count: number;
  joined_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'code' | 'system';
  parent_message_id?: string;
  thread_reply_count: number;
  thread_last_reply_at?: string;
  mentioned_user_ids?: string[];
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  is_pinned: boolean;
  reaction_count: number;
  created_at: string;
  updated_at: string;
  reactions?: MessageReaction[];
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface MessageReaction {
  emoji: string;
  user_id: string;
  created_at: string;
}

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io';
const API_VERSION = '/api/v1';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}${API_VERSION}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token is invalid or expired
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Redirect to login page
      window.location.href = '/auth';

      throw new Error('Session expired. Please log in again.');
    }

    const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(errorData.detail || `API request failed: ${response.statusText}`);
  }

  return response.json();
}

// =====================================================
// CHANNEL OPERATIONS
// =====================================================

/**
 * Get all channels for the current user
 */
export async function getUserChannels(userId?: string): Promise<Channel[]> {
  try {
    return await apiRequest<Channel[]>('/channels/');
  } catch (error) {
    console.error('Error fetching user channels:', error);
    throw error;
  }
}

/**
 * Create a new channel
 */
export async function createChannel(channel: {
  name: string;
  description?: string;
  channel_type: string;
  is_private?: boolean;
  subject?: string;
  topic?: string;
  tutor_id?: string;
  member_ids?: string[];
}): Promise<Channel> {
  try {
    return await apiRequest<Channel>('/channels/', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    throw error;
  }
}

/**
 * Get or create direct message channel between two users
 */
export async function getOrCreateDirectMessage(otherUserId: string): Promise<Channel> {
  try {
    return await apiRequest<Channel>('/channels/direct', {
      method: 'POST',
      body: JSON.stringify({ user_id: otherUserId }),
    });
  } catch (error) {
    console.error('Error creating DM:', error);
    throw error;
  }
}

/**
 * Update channel
 */
export async function updateChannel(channelId: string, updates: Partial<Channel>): Promise<Channel> {
  try {
    return await apiRequest<Channel>(`/channels/${channelId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Error updating channel:', error);
    throw error;
  }
}

/**
 * Archive channel
 */
export async function archiveChannel(channelId: string): Promise<Channel> {
  return updateChannel(channelId, { is_archived: true });
}

// =====================================================
// CHANNEL MEMBER OPERATIONS
// =====================================================

/**
 * Add member to channel
 */
export async function addChannelMember(
  channelId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' | 'guest' = 'member'
): Promise<void> {
  try {
    await apiRequest(`/channels/${channelId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        user_ids: [userId],
        role,
      }),
    });
  } catch (error) {
    console.error('Error adding channel member:', error);
    throw error;
  }
}

/**
 * Remove member from channel
 */
export async function removeChannelMember(channelId: string, userId: string): Promise<void> {
  try {
    await apiRequest(`/channels/${channelId}/members/${userId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error removing channel member:', error);
    throw error;
  }
}

/**
 * Get channel members
 */
export async function getChannelMembers(channelId: string): Promise<ChannelMember[]> {
  try {
    const channel = await apiRequest<Channel>(`/channels/${channelId}`);
    return channel.my_membership ? [channel.my_membership] : [];
  } catch (error) {
    console.error('Error fetching channel members:', error);
    throw error;
  }
}

/**
 * Mark channel as read
 */
export async function markChannelAsRead(channelId: string, messageId?: string): Promise<void> {
  try {
    await apiRequest(`/channels/${channelId}/read`, {
      method: 'POST',
      body: JSON.stringify({ message_id: messageId }),
    });
  } catch (error) {
    console.error('Error marking channel as read:', error);
    throw error;
  }
}

/**
 * Toggle channel star
 */
export async function toggleChannelStar(channelId: string, isStarred: boolean): Promise<void> {
  try {
    await apiRequest(`/channels/${channelId}/members/me`, {
      method: 'PATCH',
      body: JSON.stringify({ is_starred: isStarred }),
    });
  } catch (error) {
    console.error('Error toggling star:', error);
    throw error;
  }
}

// =====================================================
// MESSAGE OPERATIONS
// =====================================================

/**
 * Get messages for a channel
 */
export async function getChannelMessages(
  channelId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (before) {
      params.append('before', before);
    }

    return await apiRequest<Message[]>(`/channels/${channelId}/messages?${params}`);
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Send a message
 */
export async function sendMessage(message: {
  channel_id: string;
  content: string;
  message_type?: string;
  parent_message_id?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}): Promise<Message> {
  try {
    return await apiRequest<Message>(`/channels/${message.channel_id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: message.content,
        message_type: message.message_type || 'text',
        parent_message_id: message.parent_message_id,
        file_url: message.file_url,
        file_name: message.file_name,
        file_type: message.file_type,
        file_size: message.file_size,
      }),
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Update message
 */
export async function updateMessage(messageId: string, content: string, channelId?: string): Promise<Message> {
  try {
    if (!channelId) {
      throw new Error('Channel ID is required to update message');
    }

    return await apiRequest<Message>(`/channels/${channelId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
}

/**
 * Delete message
 */
export async function deleteMessage(messageId: string, channelId?: string): Promise<void> {
  try {
    if (!channelId) {
      throw new Error('Channel ID is required to delete message');
    }

    await apiRequest(`/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Get thread replies
 */
export async function getThreadReplies(parentMessageId: string, channelId?: string): Promise<Message[]> {
  try {
    if (!channelId) {
      throw new Error('Channel ID is required to fetch thread replies');
    }

    const params = new URLSearchParams({
      parent_id: parentMessageId,
    });

    return await apiRequest<Message[]>(`/channels/${channelId}/messages?${params}`);
  } catch (error) {
    console.error('Error fetching thread replies:', error);
    throw error;
  }
}

// =====================================================
// REACTION OPERATIONS
// =====================================================

/**
 * Add reaction to message
 */
export async function addReaction(messageId: string, emoji: string, channelId?: string): Promise<void> {
  try {
    if (!channelId) {
      throw new Error('Channel ID is required to add reaction');
    }

    await apiRequest(`/channels/${channelId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

/**
 * Remove reaction from message
 */
export async function removeReaction(messageId: string, emoji: string, channelId?: string): Promise<void> {
  try {
    if (!channelId) {
      throw new Error('Channel ID is required to remove reaction');
    }

    await apiRequest(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
}

/**
 * Get reactions for a message
 */
export async function getMessageReactions(messageId: string, channelId?: string): Promise<MessageReaction[]> {
  try {
    if (!channelId) {
      throw new Error('Channel ID is required to fetch reactions');
    }

    const message = await apiRequest<Message>(`/channels/${channelId}/messages/${messageId}`);
    return message.reactions || [];
  } catch (error) {
    console.error('Error fetching reactions:', error);
    throw error;
  }
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS (PLACEHOLDER - WebSocket TBD)
// =====================================================

/**
 * Subscribe to new messages in a channel
 * NOTE: Real-time subscriptions will be implemented with WebSockets in future
 */
export function subscribeToChannelMessages(
  channelId: string,
  callback: (message: Message) => void
): { unsubscribe: () => void } {
  console.warn('Real-time subscriptions not yet implemented. Use polling for now.');

  // Return a dummy unsubscribe function
  return {
    unsubscribe: () => {
      console.log('Unsubscribed from channel messages');
    }
  };
}

/**
 * Subscribe to message updates
 * NOTE: Real-time subscriptions will be implemented with WebSockets in future
 */
export function subscribeToMessageUpdates(
  channelId: string,
  callback: (message: Message) => void
): { unsubscribe: () => void } {
  console.warn('Real-time message updates not yet implemented. Use polling for now.');

  return {
    unsubscribe: () => {
      console.log('Unsubscribed from message updates');
    }
  };
}

/**
 * Subscribe to typing indicators
 * NOTE: Real-time subscriptions will be implemented with WebSockets in future
 */
export function subscribeToTypingIndicators(
  channelId: string,
  callback: (indicator: { user_id: string; started_typing_at: string }) => void
): { unsubscribe: () => void } {
  console.warn('Typing indicators not yet implemented. Use polling for now.');

  return {
    unsubscribe: () => {
      console.log('Unsubscribed from typing indicators');
    }
  };
}

/**
 * Send typing indicator
 * NOTE: Will be implemented with WebSockets in future
 */
export async function sendTypingIndicator(channelId: string): Promise<void> {
  // Placeholder - will implement with WebSockets
  console.log('Typing indicator sent for channel:', channelId);
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeChannel(channel: { unsubscribe: () => void }): void {
  channel.unsubscribe();
}
