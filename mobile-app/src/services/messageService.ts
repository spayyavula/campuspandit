/**
 * Message Service
 * Handles all message and conversation related API calls
 */

import axios from 'axios';
import { ENV } from '../config/env';

const API_URL = ENV.API_URL;

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithDetails extends Conversation {
  recipientName: string;
  recipientPhoto: string;
  recipientRole: 'student' | 'tutor';
  isOnline: boolean;
}

/**
 * Get all conversations for the current user
 */
export const getConversations = async (
  userId: string,
  authToken: string
): Promise<ConversationWithDetails[]> => {
  try {
    const response = await axios.get(`${API_URL}/messages/conversations`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: {
        userId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Get messages for a specific conversation
 */
export const getMessages = async (
  conversationId: string,
  authToken: string,
  limit = 50,
  offset = 0
): Promise<Message[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/messages/conversations/${conversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          limit,
          offset,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Send a new message
 */
export const sendMessage = async (
  conversationId: string,
  content: string,
  authToken: string
): Promise<Message> => {
  try {
    const response = await axios.post(
      `${API_URL}/messages/conversations/${conversationId}/messages`,
      {
        content,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  recipientId: string,
  authToken: string
): Promise<Conversation> => {
  try {
    const response = await axios.post(
      `${API_URL}/messages/conversations`,
      {
        recipientId,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  messageIds: string[],
  authToken: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_URL}/messages/conversations/${conversationId}/read`,
      {
        messageIds,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Search conversations by name or content
 */
export const searchConversations = async (
  query: string,
  authToken: string
): Promise<ConversationWithDetails[]> => {
  try {
    const response = await axios.get(`${API_URL}/messages/search`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: {
        query,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching conversations:', error);
    throw error;
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (
  userId: string,
  authToken: string
): Promise<number> => {
  try {
    const response = await axios.get(`${API_URL}/messages/unread-count`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: {
        userId,
      },
    });
    return response.data.count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (
  conversationId: string,
  authToken: string
): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/messages/conversations/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Check if user is typing (for real-time features)
 */
export const sendTypingIndicator = async (
  conversationId: string,
  isTyping: boolean,
  authToken: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_URL}/messages/conversations/${conversationId}/typing`,
      {
        isTyping,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
  } catch (error) {
    console.error('Error sending typing indicator:', error);
    // Don't throw error for typing indicators
  }
};
