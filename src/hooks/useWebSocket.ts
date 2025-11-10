/**
 * WebSocket Hook for Real-Time Messaging
 * Replaces Supabase subscriptions with native WebSocket connection
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  event?: string;
  response?: any;
  timestamp?: string;
  channel_id?: string;
  user_id?: string;
  message_id?: string;
  content?: string;
  is_typing?: boolean;
  is_online?: boolean;
}

interface UseWebSocketOptions {
  userId: string;
  onMessage?: (message: WebSocketMessage) => void;
  onNewMessage?: (message: any) => void;
  onTyping?: (userId: string, channelId: string, isTyping: boolean) => void;
  onPresence?: (userId: string, isOnline: boolean) => void;
  onReadReceipt?: (userId: string, channelId: string, messageId: string) => void;
  onMessageUpdate?: (channelId: string, messageId: string, content: string) => void;
  onMessageDelete?: (channelId: string, messageId: string) => void;
  onConnection?: (status: 'connected' | 'disconnected' | 'error') => void;
}

export const useWebSocket = ({
  userId,
  onMessage,
  onNewMessage,
  onTyping,
  onPresence,
  onReadReceipt,
  onMessageUpdate,
  onMessageDelete,
  onConnection
}: UseWebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';
    // Replace https with wss, http with ws
    const wsUrl = baseUrl.replace(/^https/, 'wss').replace(/^http/, 'ws');
    return `${wsUrl}/ws/${userId}`;
  };

  const connect = useCallback(() => {
    try {
      const url = getWebSocketUrl();
      console.log('Connecting to WebSocket:', url);

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempt(0);
        onConnection?.('connected');

        // Start heartbeat
        heartbeatInterval.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          // Call general message handler
          onMessage?.(message);

          // Handle specific message types
          switch (message.type) {
            case 'connection':
              console.log('Connection confirmed:', message);
              break;

            case 'message':
              // New message received
              if (message.data && onNewMessage) {
                onNewMessage(message.data);
              }
              break;

            case 'typing':
              // Typing indicator
              if (message.user_id && message.channel_id !== undefined && message.is_typing !== undefined && onTyping) {
                onTyping(message.user_id, message.channel_id, message.is_typing);
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
              if (message.user_id && message.channel_id && message.message_id && onReadReceipt) {
                onReadReceipt(message.user_id, message.channel_id, message.message_id);
              }
              break;

            case 'message_updated':
              // Message edited
              if (message.channel_id && message.message_id && message.content && onMessageUpdate) {
                onMessageUpdate(message.channel_id, message.message_id, message.content);
              }
              break;

            case 'message_deleted':
              // Message deleted
              if (message.channel_id && message.message_id && onMessageDelete) {
                onMessageDelete(message.channel_id, message.message_id);
              }
              break;

            case 'ack':
              // Acknowledgment of sent event
              console.log('Event acknowledged:', message.event, message.response);
              break;

            case 'error':
              console.error('WebSocket error message:', message);
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onConnection?.('error');
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        onConnection?.('disconnected');

        // Clear heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        // Attempt to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
        console.log(`Reconnecting in ${delay}ms...`);

        reconnectTimeout.current = setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      onConnection?.('error');
    }
  }, [userId, reconnectAttempt, onMessage, onNewMessage, onTyping, onPresence, onReadReceipt, onMessageUpdate, onMessageDelete, onConnection]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
  }, []);

  const send = useCallback((type: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data
      };
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
      return false;
    }
  }, []);

  // WebSocket actions
  const sendMessage = useCallback((channelId: string, content: string) => {
    return send('new_message', { channel_id: channelId, content });
  }, [send]);

  const sendTyping = useCallback((channelId: string, isTyping: boolean = true) => {
    return send('typing', { channel_id: channelId, is_typing: isTyping });
  }, [send]);

  const sendReadReceipt = useCallback((channelId: string, messageId: string) => {
    return send('read_receipt', { channel_id: channelId, message_id: messageId });
  }, [send]);

  const joinChannel = useCallback((channelId: string) => {
    return send('join_channel', { channel_id: channelId });
  }, [send]);

  const leaveChannel = useCallback((channelId: string) => {
    return send('leave_channel', { channel_id: channelId });
  }, [send]);

  const sendReaction = useCallback((channelId: string, messageId: string, emoji: string) => {
    return send('message_reaction', { channel_id: channelId, message_id: messageId, emoji });
  }, [send]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    send,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    joinChannel,
    leaveChannel,
    sendReaction,
    reconnect: connect,
    disconnect
  };
};
