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
  const reconnectAttempt = useRef(0);  // Changed to useRef to prevent infinite loop
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);  // Prevent concurrent connection attempts
  const callbacksRef = useRef({
    onMessage,
    onNewMessage,
    onTyping,
    onPresence,
    onReadReceipt,
    onMessageUpdate,
    onMessageDelete,
    onConnection
  });

  // Update callbacks ref when they change (without triggering reconnect)
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onNewMessage,
      onTyping,
      onPresence,
      onReadReceipt,
      onMessageUpdate,
      onMessageDelete,
      onConnection
    };
  }, [onMessage, onNewMessage, onTyping, onPresence, onReadReceipt, onMessageUpdate, onMessageDelete, onConnection]);

  const getSSEUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';
    return `${baseUrl}/sse/${userId}`;
  };

  const connect = useCallback(() => {
    // Prevent concurrent connection attempts
    if (isConnectingRef.current || eventSource.current?.readyState === EventSource.OPEN) {
      console.log('SSE: Already connected or connecting, skipping...');
      return;
    }

    try {
      isConnectingRef.current = true;
      const url = getSSEUrl();
      console.log('Connecting to SSE:', url);

      // Close any existing connection first
      if (eventSource.current) {
        eventSource.current.close();
        eventSource.current = null;
      }

      eventSource.current = new EventSource(url);

      eventSource.current.onopen = () => {
        console.log('SSE connected');
        setIsConnected(true);
        isConnectingRef.current = false;
        reconnectAttempt.current = 0;  // Reset reconnect attempt counter
        callbacksRef.current.onConnection?.('connected');
      };

      eventSource.current.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          console.log('SSE message received:', message);

          // Call general message handler
          callbacksRef.current.onMessage?.(message);

          // Handle specific message types
          switch (message.type) {
            case 'connection':
              console.log('Connection confirmed:', message);
              break;

            case 'new_message':
              // New message received
              if (message.data && callbacksRef.current.onNewMessage) {
                callbacksRef.current.onNewMessage(message.data);
              }
              break;

            case 'typing':
              // Typing indicator
              if (message.data?.user_id && message.data?.channel_id !== undefined && message.data?.is_typing !== undefined && callbacksRef.current.onTyping) {
                callbacksRef.current.onTyping(message.data.user_id, message.data.channel_id, message.data.is_typing);
              }
              break;

            case 'presence':
              // User online/offline status
              if (message.user_id && message.is_online !== undefined && callbacksRef.current.onPresence) {
                callbacksRef.current.onPresence(message.user_id, message.is_online);
              }
              break;

            case 'read_receipt':
              // Message read receipt
              if (message.data?.user_id && message.data?.channel_id && message.data?.message_id && callbacksRef.current.onReadReceipt) {
                callbacksRef.current.onReadReceipt(message.data.user_id, message.data.channel_id, message.data.message_id);
              }
              break;

            case 'message_updated':
              // Message edited
              if (message.data?.channel_id && message.data?.id && message.data?.content && callbacksRef.current.onMessageUpdate) {
                callbacksRef.current.onMessageUpdate(message.data.channel_id, message.data.id, message.data.content);
              }
              break;

            case 'message_deleted':
              // Message deleted
              if (message.data?.channel_id && message.data?.id && callbacksRef.current.onMessageDelete) {
                callbacksRef.current.onMessageDelete(message.data.channel_id, message.data.id);
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
        isConnectingRef.current = false;
        callbacksRef.current.onConnection?.('error');

        // EventSource automatically reconnects, but we can handle manual reconnection with backoff
        if (eventSource.current?.readyState === EventSource.CLOSED) {
          callbacksRef.current.onConnection?.('disconnected');

          // Clear any existing reconnect timeout
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
          }

          // Attempt to reconnect with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
          console.log(`SSE reconnecting in ${delay}ms (attempt ${reconnectAttempt.current + 1})...`);

          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempt.current += 1;  // Increment reconnect attempt
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      isConnectingRef.current = false;
      callbacksRef.current.onConnection?.('error');
    }
  }, [userId]);  // Only depend on userId

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
  // Only connect once when component mounts
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);  // Only reconnect if userId changes

  return {
    isConnected,
    reconnect: connect,
    disconnect
  };
};
