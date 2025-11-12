/**
 * Server-Sent Events (SSE) Hook for Real-Time Messaging
 * Replaces WebSocket with SSE for server → client communication
 * Client → server uses regular HTTP requests
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface SSEMessage {
  type: string;
  data?: any;
  timestamp?: string;
  channel_id?: string;
  user_id?: string;
  message_id?: string;
  content?: string;
  is_typing?: boolean;
  is_online?: boolean;
}

interface UseSSEOptions {
  userId: string;
  onMessage?: (message: SSEMessage) => void;
  onNewMessage?: (message: any) => void;
  onTyping?: (userId: string, channelId: string, isTyping: boolean) => void;
  onPresence?: (userId: string, isOnline: boolean) => void;
  onReadReceipt?: (userId: string, channelId: string, messageId: string) => void;
  onMessageUpdate?: (channelId: string, messageId: string, content: string) => void;
  onMessageDelete?: (channelId: string, messageId: string) => void;
  onConnection?: (status: 'connected' | 'disconnected' | 'error') => void;
}

export const useSSE = ({
  userId,
  onMessage,
  onNewMessage,
  onTyping,
  onPresence,
  onReadReceipt,
  onMessageUpdate,
  onMessageDelete,
  onConnection
}: UseSSEOptions) => {
  const eventSource = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const getSSEUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';
    return `${baseUrl}/sse/${userId}`;
  };

  const connect = useCallback(() => {
    try {
      const url = getSSEUrl();
      console.log('Connecting to SSE:', url);

      eventSource.current = new EventSource(url);

      eventSource.current.onopen = () => {
        console.log('SSE connected');
        setIsConnected(true);
        setReconnectAttempt(0);
        onConnection?.('connected');
      };

      eventSource.current.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          console.log('SSE message received:', message);

          // Call general message handler
          onMessage?.(message);

          // Handle specific message types
          switch (message.type) {
            case 'connection':
              console.log('Connection confirmed:', message);
              break;

            case 'new_message':
              // New message received
              if (message.data && onNewMessage) {
                onNewMessage(message.data);
              }
              break;

            case 'typing':
              // Typing indicator
              if (message.data?.user_id && message.data?.channel_id !== undefined && message.data?.is_typing !== undefined && onTyping) {
                onTyping(message.data.user_id, message.data.channel_id, message.data.is_typing);
              }
              break;

            case 'presence':
              // User online/offline status
              if (message.user_id && message.is_online !== undefined && onPresence) {
                onPresence(message.user_id, message.is_online);
              }
              break;

            case 'read_receipt':
              // Message read receipt
              if (message.data?.user_id && message.data?.channel_id && message.data?.message_id && onReadReceipt) {
                onReadReceipt(message.data.user_id, message.data.channel_id, message.data.message_id);
              }
              break;

            case 'message_updated':
              // Message edited
              if (message.data?.channel_id && message.data?.id && message.data?.content && onMessageUpdate) {
                onMessageUpdate(message.data.channel_id, message.data.id, message.data.content);
              }
              break;

            case 'message_deleted':
              // Message deleted
              if (message.data?.channel_id && message.data?.id && onMessageDelete) {
                onMessageDelete(message.data.channel_id, message.data.id);
              }
              break;

            case 'message_reaction':
              // New reaction added
              console.log('Message reaction:', message.data);
              break;

            case 'reaction_removed':
              // Reaction removed
              console.log('Reaction removed:', message.data);
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.current.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        onConnection?.('error');

        // EventSource automatically reconnects, but we can handle manual reconnection with backoff
        if (eventSource.current?.readyState === EventSource.CLOSED) {
          onConnection?.('disconnected');

          // Attempt to reconnect with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
          console.log(`SSE reconnecting in ${delay}ms...`);

          reconnectTimeout.current = setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      onConnection?.('error');
    }
  }, [userId, reconnectAttempt, onMessage, onNewMessage, onTyping, onPresence, onReadReceipt, onMessageUpdate, onMessageDelete, onConnection]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (eventSource.current) {
      eventSource.current.close();
      eventSource.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    reconnect: connect,
    disconnect
  };
};
