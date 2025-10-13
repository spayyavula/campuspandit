import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  notifications_enabled: boolean;
  notification_level: 'all' | 'mentions' | 'none';
  is_muted: boolean;
  is_starred: boolean;
  last_read_at: string;
  unread_count: number;
  joined_at: string;
  last_viewed_at: string;
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
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// =====================================================
// CHANNEL OPERATIONS
// =====================================================

/**
 * Get all channels for the current user
 */
export async function getUserChannels(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_channels_with_unread')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
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
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('channels')
      .insert({
        ...channel,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as owner
    await addChannelMember(data.id, user.id, 'owner');

    return data;
  } catch (error) {
    console.error('Error creating channel:', error);
    throw error;
  }
}

/**
 * Get or create direct message channel between two users
 */
export async function getOrCreateDirectMessage(otherUserId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [user1Id, user2Id] = [user.id, otherUserId].sort();

    // Check if DM already exists
    const { data: existingDM } = await supabase
      .from('direct_messages')
      .select('channel_id')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .single();

    if (existingDM) {
      const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('id', existingDM.channel_id)
        .single();
      return channel;
    }

    // Create new DM channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        name: `DM: ${user1Id}-${user2Id}`,
        channel_type: 'direct',
        is_private: true,
        created_by: user.id
      })
      .select()
      .single();

    if (channelError) throw channelError;

    // Add both users as members
    await Promise.all([
      addChannelMember(channel.id, user1Id, 'owner'),
      addChannelMember(channel.id, user2Id, 'owner')
    ]);

    // Create DM record
    await supabase
      .from('direct_messages')
      .insert({
        channel_id: channel.id,
        user1_id,
        user2_id
      });

    return channel;
  } catch (error) {
    console.error('Error creating DM:', error);
    throw error;
  }
}

/**
 * Update channel
 */
export async function updateChannel(channelId: string, updates: Partial<Channel>) {
  try {
    const { data, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', channelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating channel:', error);
    throw error;
  }
}

/**
 * Archive channel
 */
export async function archiveChannel(channelId: string) {
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
) {
  try {
    const { data, error } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channelId,
        user_id: userId,
        role
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding channel member:', error);
    throw error;
  }
}

/**
 * Remove member from channel
 */
export async function removeChannelMember(channelId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing channel member:', error);
    throw error;
  }
}

/**
 * Get channel members
 */
export async function getChannelMembers(channelId: string) {
  try {
    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        *,
        user:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('channel_id', channelId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching channel members:', error);
    throw error;
  }
}

/**
 * Mark channel as read
 */
export async function markChannelAsRead(channelId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('channel_members')
      .update({
        last_read_at: new Date().toISOString(),
        unread_count: 0,
        last_viewed_at: new Date().toISOString()
      })
      .eq('channel_id', channelId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking channel as read:', error);
    throw error;
  }
}

/**
 * Toggle channel star
 */
export async function toggleChannelStar(channelId: string, isStarred: boolean) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('channel_members')
      .update({ is_starred: isStarred })
      .eq('channel_id', channelId)
      .eq('user_id', user.id);

    if (error) throw error;
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
export async function getChannelMessages(channelId: string, limit: number = 50, before?: string) {
  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        user:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .is('parent_message_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reverse() || [];
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
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Extract mentions from content (e.g., @userId)
    const mentionRegex = /@([a-f0-9-]{36})/g;
    const mentions = Array.from(message.content.matchAll(mentionRegex), m => m[1]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...message,
        user_id: user.id,
        mentioned_user_ids: mentions.length > 0 ? mentions : null,
        message_type: message.message_type || 'text'
      })
      .select(`
        *,
        user:auth.users(id, email, raw_user_meta_data)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Update message
 */
export async function updateMessage(messageId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
}

/**
 * Delete message
 */
export async function deleteMessage(messageId: string) {
  try {
    const { error } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Get thread replies
 */
export async function getThreadReplies(parentMessageId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('parent_message_id', parentMessageId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
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
export async function addReaction(messageId: string, emoji: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}

/**
 * Remove reaction from message
 */
export async function removeReaction(messageId: string, emoji: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
}

/**
 * Get reactions for a message
 */
export async function getMessageReactions(messageId: string) {
  try {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reactions:', error);
    throw error;
  }
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to new messages in a channel
 */
export function subscribeToChannelMessages(
  channelId: string,
  callback: (message: Message) => void
): RealtimeChannel {
  return supabase
    .channel(`messages:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      },
      async (payload) => {
        // Fetch user data for the message
        const { data: userData } = await supabase
          .from('auth.users')
          .select('id, email, raw_user_meta_data')
          .eq('id', payload.new.user_id)
          .single();

        callback({
          ...payload.new as Message,
          user: userData
        });
      }
    )
    .subscribe();
}

/**
 * Subscribe to message updates
 */
export function subscribeToMessageUpdates(
  channelId: string,
  callback: (message: Message) => void
): RealtimeChannel {
  return supabase
    .channel(`message-updates:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
}

/**
 * Subscribe to typing indicators
 */
export function subscribeToTypingIndicators(
  channelId: string,
  callback: (indicator: { user_id: string; started_typing_at: string }) => void
): RealtimeChannel {
  return supabase
    .channel(`typing:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'typing_indicators',
        filter: `channel_id=eq.${channelId}`
      },
      (payload) => {
        callback(payload.new as any);
      }
    )
    .subscribe();
}

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(channelId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('typing_indicators')
      .upsert({
        channel_id: channelId,
        user_id: user.id,
        expires_at: new Date(Date.now() + 10000).toISOString()
      });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeChannel(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
