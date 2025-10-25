/**
 * Real-Time Chat Service
 *
 * Handles all chat and messaging functionality with Supabase Realtime
 * Features: messaging, typing indicators, read receipts, online status
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Backend API URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000/api/v1';

// =====================================================
// Types
// =====================================================

export interface Conversation {
  id: string;
  student_id: string;
  tutor_id: string;
  subject?: string;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count: number;
  is_archived: boolean;
  other_user: {
    id: string;
    name: string;
    avatar_url?: string;
    is_online: boolean;
  };
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  is_read: boolean;
  read_at?: string;
  is_edited: boolean;
  edited_at?: string;
  reply_to_id?: string;
  sender_name: string;
  sender_avatar?: string;
  created_at: string;
}

export interface ConversationCreate {
  student_id: string;
  tutor_id: string;
  subject?: string;
  initial_message?: string;
}

export interface MessageCreate {
  conversation_id: string;
  receiver_id: string;
  content: string;
  reply_to_id?: string;
}

export interface UnreadCount {
  total_unread: number;
  by_conversation: Array<{
    conversation_id: string;
    unread_count: number;
  }>;
}

// =====================================================
// API Helper Functions
// =====================================================

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// =====================================================
// Conversation Functions
// =====================================================

/**
 * Create or get existing conversation
 *
 * @example
 * ```typescript
 * const conversation = await createConversation({
 *   student_id: studentId,
 *   tutor_id: tutorId,
 *   subject: 'Mathematics',
 *   initial_message: 'Hi! I have a question about calculus.'
 * });
 * ```
 */
export async function createConversation(
  data: ConversationCreate
): Promise<{ conversation_id: string; status: string }> {
  return apiRequest('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get all conversations for current user
 *
 * @example
 * ```typescript
 * const conversations = await getConversations(false, 50, 0);
 * ```
 */
export async function getConversations(
  archived: boolean = false,
  limit: number = 50,
  offset: number = 0
): Promise<Conversation[]> {
  return apiRequest(
    `/chat/conversations?archived=${archived}&limit=${limit}&offset=${offset}`
  );
}

/**
 * Get single conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation> {
  return apiRequest(`/chat/conversations/${conversationId}`);
}

/**
 * Archive or unarchive a conversation
 */
export async function archiveConversation(
  conversationId: string,
  archive: boolean = true
): Promise<{ status: string; archived: boolean }> {
  return apiRequest(`/chat/conversations/${conversationId}/archive?archive=${archive}`, {
    method: 'PATCH',
  });
}

// =====================================================
// Message Functions
// =====================================================

/**
 * Send a new message
 *
 * @example
 * ```typescript
 * await sendMessage({
 *   conversation_id: convId,
 *   receiver_id: tutorId,
 *   content: 'When is our next session?'
 * });
 * ```
 */
export async function sendMessage(
  data: MessageCreate
): Promise<{ message_id: string; status: string }> {
  return apiRequest('/chat/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get messages for a conversation
 *
 * @example
 * ```typescript
 * const messages = await getMessages(conversationId, 50, 0);
 * ```
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0,
  beforeMessageId?: string
): Promise<Message[]> {
  let url = `/chat/messages/${conversationId}?limit=${limit}&offset=${offset}`;
  if (beforeMessageId) {
    url += `&before_message_id=${beforeMessageId}`;
  }
  return apiRequest(url);
}

/**
 * Mark a message as read
 */
export async function markMessageRead(messageId: string): Promise<{ status: string }> {
  return apiRequest(`/chat/messages/${messageId}/read`, {
    method: 'PATCH',
  });
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationRead(
  conversationId: string
): Promise<{ status: string; messages_marked_read: number }> {
  return apiRequest(`/chat/messages/conversation/${conversationId}/read-all`, {
    method: 'PATCH',
  });
}

/**
 * Edit a message (within 15 minutes)
 */
export async function editMessage(
  messageId: string,
  content: string
): Promise<{ status: string; edited: boolean }> {
  return apiRequest(`/chat/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(messageId: string): Promise<{ status: string }> {
  return apiRequest(`/chat/messages/${messageId}`, {
    method: 'DELETE',
  });
}

// =====================================================
// Unread Count
// =====================================================

/**
 * Get unread message count
 *
 * @example
 * ```typescript
 * const { total_unread, by_conversation } = await getUnreadCount();
 * console.log(`You have ${total_unread} unread messages`);
 * ```
 */
export async function getUnreadCount(): Promise<UnreadCount> {
  return apiRequest('/chat/unread-count');
}

// =====================================================
// Typing Indicators
// =====================================================

/**
 * Set typing indicator (auto-expires in 5 seconds)
 *
 * @example
 * ```typescript
 * // Call this when user starts typing
 * await setTypingIndicator(conversationId);
 * ```
 */
export async function setTypingIndicator(
  conversationId: string
): Promise<{ status: string }> {
  return apiRequest(`/chat/typing/${conversationId}`, {
    method: 'POST',
  });
}

// =====================================================
// Online Status
// =====================================================

/**
 * Update online status
 */
export async function updateOnlineStatus(isOnline: boolean): Promise<{ status: string }> {
  return apiRequest('/chat/online-status', {
    method: 'POST',
    body: JSON.stringify({ is_online: isOnline }),
  });
}

/**
 * Get user online status
 */
export async function getOnlineStatus(userId: string): Promise<{
  is_online: boolean;
  last_seen_at?: string;
}> {
  return apiRequest(`/chat/online-status/${userId}`);
}

// =====================================================
// Realtime Subscriptions
// =====================================================

export class ChatRealtimeService {
  private messageChannel: RealtimeChannel | null = null;
  private typingChannel: RealtimeChannel | null = null;
  private onlineChannel: RealtimeChannel | null = null;

  /**
   * Subscribe to new messages in a conversation
   *
   * @example
   * ```typescript
   * const chatService = new ChatRealtimeService();
   * chatService.subscribeToMessages(conversationId, (message) => {
   *   console.log('New message:', message);
   *   // Update UI with new message
   * });
   * ```
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ): void {
    this.messageChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to message updates (edits, reads)
   */
  subscribeToMessageUpdates(
    conversationId: string,
    onUpdate: (message: Message) => void
  ): void {
    if (!this.messageChannel) {
      this.messageChannel = supabase.channel(`messages:${conversationId}`);
    }

    this.messageChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onUpdate(payload.new as Message);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to typing indicators
   *
   * @example
   * ```typescript
   * chatService.subscribeToTyping(conversationId, (userId, isTyping) => {
   *   if (isTyping) {
   *     showTypingIndicator(userId);
   *   } else {
   *     hideTypingIndicator(userId);
   *   }
   * });
   * ```
   */
  subscribeToTyping(
    conversationId: string,
    onTyping: (userId: string, isTyping: boolean) => void
  ): void {
    this.typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          onTyping(payload.new.user_id, true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          onTyping(payload.old.user_id, false);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to online status changes
   */
  subscribeToOnlineStatus(
    onStatusChange: (userId: string, isOnline: boolean, lastSeen?: string) => void
  ): void {
    this.onlineChannel = supabase
      .channel('online-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_online_status',
        },
        (payload: any) => {
          const data = payload.new || payload.old;
          onStatusChange(data.user_id, data.is_online, data.last_seen_at);
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    if (this.messageChannel) {
      supabase.removeChannel(this.messageChannel);
      this.messageChannel = null;
    }
    if (this.typingChannel) {
      supabase.removeChannel(this.typingChannel);
      this.typingChannel = null;
    }
    if (this.onlineChannel) {
      supabase.removeChannel(this.onlineChannel);
      this.onlineChannel = null;
    }
  }
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Format timestamp to readable format
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const grouped = new Map<string, Message[]>();

  messages.forEach((message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(message);
  });

  return grouped;
}

/**
 * Check if user is currently online
 */
export function isUserOnline(lastSeenAt?: string): boolean {
  if (!lastSeenAt) return false;

  const lastSeen = new Date(lastSeenAt);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();

  // Consider online if active within last 5 minutes
  return diffMs < 5 * 60 * 1000;
}

/**
 * Debounce function for typing indicators
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// =====================================================
// Hooks for React (Optional)
// =====================================================

/**
 * Set user online when app loads
 */
export async function initializeOnlineStatus(): Promise<void> {
  await updateOnlineStatus(true);

  // Update status on visibility change
  document.addEventListener('visibilitychange', () => {
    updateOnlineStatus(!document.hidden);
  });

  // Set offline on beforeunload
  window.addEventListener('beforeunload', () => {
    // Use sendBeacon for reliability
    const data = JSON.stringify({ is_online: false });
    navigator.sendBeacon(`${API_BASE_URL}/chat/online-status`, data);
  });
}

/**
 * Auto-mark messages as read when viewing conversation
 */
export async function autoMarkAsRead(conversationId: string): Promise<void> {
  try {
    await markConversationRead(conversationId);
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
  }
}

export default {
  // Conversations
  createConversation,
  getConversations,
  getConversation,
  archiveConversation,

  // Messages
  sendMessage,
  getMessages,
  markMessageRead,
  markConversationRead,
  editMessage,
  deleteMessage,

  // Counts
  getUnreadCount,

  // Typing
  setTypingIndicator,

  // Status
  updateOnlineStatus,
  getOnlineStatus,

  // Realtime
  ChatRealtimeService,

  // Utils
  formatMessageTime,
  groupMessagesByDate,
  isUserOnline,
  debounce,
  initializeOnlineStatus,
  autoMarkAsRead,
};
