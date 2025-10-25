/**
 * Complete Chat Interface Component
 *
 * Full-featured chat system with:
 * - Conversation list
 * - Message thread
 * - Real-time updates
 * - Typing indicators
 * - Read receipts
 * - Online status
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  setTypingIndicator,
  updateOnlineStatus,
  ChatRealtimeService,
  formatMessageTime,
  debounce,
  type Conversation,
  type Message,
} from '../../services/chat';

// =====================================================
// Main Chat Interface
// =====================================================

export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime service
  const realtimeService = useRef(new ChatRealtimeService());

  useEffect(() => {
    if (!user) return;

    // Set user online
    updateOnlineStatus(true);

    // Load conversations
    loadConversations();

    // Cleanup on unmount
    return () => {
      updateOnlineStatus(false);
      realtimeService.current.unsubscribeAll();
    };
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await getConversations();
      setConversations(convs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    try {
      // Load messages
      const msgs = await getMessages(conversation.id);
      setMessages(msgs.reverse()); // Reverse to show oldest first

      // Mark as read
      await markConversationRead(conversation.id);

      // Subscribe to realtime updates
      realtimeService.current.subscribeToMessages(conversation.id, (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        // Mark as read if receiver
        if (newMessage.receiver_id === user?.id) {
          markConversationRead(conversation.id);
        }
      });

      realtimeService.current.subscribeToMessageUpdates(conversation.id, (updatedMessage) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Conversation List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm">Start chatting with a tutor!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedConversation?.id === conv.id}
                onClick={() => selectConversation(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={async (content) => {
              const receiverId =
                selectedConversation.student_id === user?.id
                  ? selectedConversation.tutor_id
                  : selectedConversation.student_id;

              await sendMessage({
                conversation_id: selectedConversation.id,
                receiver_id: receiverId,
                content,
              });
            }}
            realtimeService={realtimeService.current}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

// =====================================================
// Conversation Item
// =====================================================

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          <img
            src={
              conversation.other_user.avatar_url ||
              `https://ui-avatars.com/api/?name=${conversation.other_user.name}`
            }
            alt={conversation.other_user.name}
            className="w-12 h-12 rounded-full"
          />
          {conversation.other_user.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {conversation.other_user.name}
            </h3>
            {conversation.last_message_at && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatMessageTime(conversation.last_message_at)}
              </span>
            )}
          </div>

          {conversation.subject && (
            <p className="text-xs text-gray-500 mb-1">{conversation.subject}</p>
          )}

          {conversation.last_message_preview && (
            <p className="text-sm text-gray-600 truncate">
              {conversation.last_message_preview}
            </p>
          )}
        </div>

        {/* Unread Badge */}
        {conversation.unread_count > 0 && (
          <div className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// Chat Window
// =====================================================

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  realtimeService: ChatRealtimeService;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  realtimeService,
}) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to typing indicators
  useEffect(() => {
    realtimeService.subscribeToTyping(conversation.id, (userId, isTyping) => {
      if (userId !== user?.id) {
        setOtherUserTyping(isTyping);
        // Auto-hide after 5 seconds
        if (isTyping) {
          setTimeout(() => setOtherUserTyping(false), 5000);
        }
      }
    });
  }, [conversation.id, user?.id, realtimeService]);

  // Debounced typing indicator
  const sendTypingIndicator = useRef(
    debounce(() => setTypingIndicator(conversation.id), 300)
  ).current;

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(inputValue.trim());
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <img
          src={
            conversation.other_user.avatar_url ||
            `https://ui-avatars.com/api/?name=${conversation.other_user.name}`
          }
          alt={conversation.other_user.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{conversation.other_user.name}</h3>
          {conversation.other_user.is_online ? (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              Online
            </p>
          ) : (
            <p className="text-sm text-gray-500">Offline</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === user?.id}
          />
        ))}

        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
            <span>{conversation.other_user.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              sendTypingIndicator();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              inputValue.trim() && !sending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </>
  );
};

// =====================================================
// Message Bubble
// =====================================================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name (for received messages) */}
        {!isOwn && (
          <span className="text-xs text-gray-500 mb-1">{message.sender_name}</span>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Attachment preview */}
          {message.attachment_url && (
            <div className="mt-2">
              {message.attachment_type?.startsWith('image/') ? (
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name}
                  className="max-w-full rounded-lg"
                />
              ) : (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm underline"
                >
                  📎 {message.attachment_name}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Timestamp and status */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">
            {formatMessageTime(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
          {isOwn && (
            <span className="text-xs text-gray-500">
              {message.is_read ? '✓✓ Read' : '✓ Sent'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
