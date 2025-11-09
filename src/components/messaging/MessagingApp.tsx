import React, { useState, useEffect, useRef } from 'react';
import {
  Hash,
  Lock,
  Users,
  Plus,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Search,
  X,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  Star,
  Bell,
  BellOff,
  Edit2,
  Trash2,
  Menu
} from 'lucide-react';
import {
  getUserChannels,
  getChannelMessages,
  sendMessage,
  subscribeToChannelMessages,
  subscribeToMessageUpdates,
  markChannelAsRead,
  toggleChannelStar,
  sendTypingIndicator,
  addReaction,
  updateMessage,
  deleteMessage,
  Channel,
  Message
} from '../../utils/messagingAPI';
import { Button, Card } from '../ui';

interface MessagingAppProps {
  userId: string;
}

const MessagingApp: React.FC<MessagingAppProps> = ({ userId }) => {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
  const [creating, setCreating] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load channels on mount
  useEffect(() => {
    loadChannels();
  }, [userId]);

  // Load messages when channel selected
  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      markChannelAsRead(selectedChannel.id);
    }
  }, [selectedChannel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to real-time messages (INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!selectedChannel) return;

    // Subscribe to new messages (INSERT)
    const insertSubscription = subscribeToChannelMessages(selectedChannel.id, (message) => {
      // Only add message if it doesn't already exist (avoid duplicates)
      setMessages(prev => {
        const messageExists = prev.some(m => m.id === message.id);
        if (messageExists) {
          return prev;
        }
        return [...prev, message];
      });

      if (message.user_id !== userId) {
        markChannelAsRead(selectedChannel.id);
      }
    });

    // Subscribe to message updates (EDIT)
    const updateSubscription = subscribeToMessageUpdates(selectedChannel.id, (updatedMessage) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === updatedMessage.id
            ? { ...msg, content: updatedMessage.content, is_edited: true, edited_at: updatedMessage.edited_at }
            : msg
        )
      );
    });

    // Subscribe to message deletions
    const deleteSubscription = supabase
      .channel(`message-deletes:${selectedChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${selectedChannel.id}`
        },
        (payload) => {
          // Check if message was deleted (is_deleted = true)
          if (payload.new.is_deleted) {
            setMessages(prev => prev.filter(msg => msg.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      insertSubscription.unsubscribe();
      updateSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
    };
  }, [selectedChannel, userId]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await getUserChannels(userId);
      setChannels(data || []);
      if (data && data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const data = await getChannelMessages(channelId);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || sending) return;

    try {
      setSending(true);
      const sentMessage = await sendMessage({
        channel_id: selectedChannel.id,
        content: newMessage.trim()
      });

      // Immediately add the message to the UI (optimistic update)
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
      }

      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
    // Send typing indicator
    if (selectedChannel && e.target.value) {
      sendTypingIndicator(selectedChannel.id);
    }
  };

  const handleToggleStar = async (channelId: string, currentlyStarred: boolean) => {
    try {
      await toggleChannelStar(channelId, !currentlyStarred);
      await loadChannels();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    setTimeout(() => {
      editTextareaRef.current?.focus();
    }, 0);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) return;

    try {
      await updateMessage(messageId, editingContent.trim());

      // Update the message in local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: editingContent.trim(), is_edited: true }
            : msg
        )
      );

      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(messageId);

      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || creating) return;

    try {
      setCreating(true);

      // Use the backend API
      await createChannel({
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || undefined,
        channel_type: 'group',
        is_private: newChannelType === 'private'
      });

      // Reset form and close modal
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('public');
      setShowCreateChannel(false);

      // Reload channels
      await loadChannels();
    } catch (error: any) {
      console.error('Error creating channel:', error);
      alert(`Failed to create channel: ${error?.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getChannelIcon = (channel: any) => {
    if (channel.is_private) return <Lock className="w-4 h-4" />;
    if (channel.channel_type === 'direct') return <Users className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white relative">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary-500 text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Channel Sidebar */}
      <div className={`${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:relative z-40 w-80 border-r border-neutral-200 flex flex-col bg-white transition-transform duration-300 h-full`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Messages</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateChannel(true)}
                className="p-2 hover:bg-primary-100 rounded-lg transition-colors group"
                title="Create new channel"
              >
                <Plus className="w-5 h-5 text-neutral-600 group-hover:text-primary-600" />
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-sm">
              No channels found
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannel(channel);
                    setShowSidebar(false); // Close sidebar on mobile when channel selected
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedChannel?.id === channel.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={channel.is_starred ? 'text-secondary-500' : 'text-neutral-400'}>
                        {getChannelIcon(channel)}
                      </span>
                      <span className={`font-medium truncate ${
                        selectedChannel?.id === channel.id ? 'text-primary-700' : 'text-neutral-900'
                      }`}>
                        {channel.name}
                      </span>
                    </div>
                    {channel.unread_count > 0 && (
                      <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-semibold rounded-full">
                        {channel.unread_count > 99 ? '99+' : channel.unread_count}
                      </span>
                    )}
                  </div>
                  {channel.last_message_at && (
                    <div className="text-xs text-neutral-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {formatTime(channel.last_message_at)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h3 className="text-xl font-semibold text-neutral-900">Create New Channel</h3>
              <button
                onClick={() => setShowCreateChannel(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Channel Name */}
              <div>
                <label htmlFor="channelName" className="block text-sm font-medium text-neutral-700 mb-1">
                  Channel Name *
                </label>
                <input
                  id="channelName"
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g., general, announcements"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Channel Description */}
              <div>
                <label htmlFor="channelDescription" className="block text-sm font-medium text-neutral-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="channelDescription"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="What's this channel about?"
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Channel Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="channelType"
                      value="public"
                      checked={newChannelType === 'public'}
                      onChange={(e) => setNewChannelType(e.target.value as 'public' | 'private')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        <span className="font-medium text-neutral-900">Public</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Anyone can join and see the channel
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="channelType"
                      value="private"
                      checked={newChannelType === 'private'}
                      onChange={(e) => setNewChannelType(e.target.value as 'public' | 'private')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span className="font-medium text-neutral-900">Private</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Only invited members can access
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
              <button
                onClick={() => setShowCreateChannel(false)}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors text-sm font-medium"
                disabled={creating}
              >
                Cancel
              </button>
              <Button
                variant="primary"
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim() || creating}
                loading={creating}
              >
                {creating ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {getChannelIcon(selectedChannel)}
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">{selectedChannel.name}</h3>
                </div>
                {selectedChannel.description && (
                  <span className="hidden sm:inline text-sm text-neutral-500">• {selectedChannel.description}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStar(selectedChannel.id, channels.find(c => c.id === selectedChannel.id)?.is_starred)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <Star className={`w-5 h-5 ${channels.find(c => c.id === selectedChannel.id)?.is_starred ? 'fill-secondary-500 text-secondary-500' : 'text-neutral-400'}`} />
                </button>
                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-neutral-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Be the first to send a message!</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const showDate = index === 0 ||
                    new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString();
                  const isOwn = message.user_id === userId;

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <div className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full">
                            {new Date(message.created_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      )}

                      <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} group`}>
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {message.user?.email?.[0].toUpperCase() || 'U'}
                        </div>

                        {/* Message Content */}
                        <div className={`flex-1 max-w-2xl ${isOwn ? 'flex flex-col items-end' : ''}`}>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-medium text-neutral-900 text-sm">
                              {message.user?.raw_user_meta_data?.name || message.user?.email || 'User'}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {formatTime(message.created_at)}
                            </span>
                            {message.is_edited && (
                              <span className="text-xs text-neutral-400">(edited)</span>
                            )}
                          </div>

                          {editingMessageId === message.id ? (
                            // Edit Mode
                            <div className="w-full">
                              <textarea
                                ref={editTextareaRef}
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit(message.id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                rows={3}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleSaveEdit(message.id)}
                                  className="px-3 py-1 bg-primary-500 text-white text-xs rounded hover:bg-primary-600 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 bg-neutral-200 text-neutral-700 text-xs rounded hover:bg-neutral-300 transition-colors"
                                >
                                  Cancel
                                </button>
                                <span className="text-xs text-neutral-500 self-center ml-2">
                                  Press Enter to save, Esc to cancel
                                </span>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div className="relative">
                              <div className={`p-3 rounded-lg ${
                                isOwn
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-neutral-100 text-neutral-900'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              </div>

                              {/* Edit/Delete buttons (only for own messages) */}
                              {isOwn && (
                                <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-1`}>
                                  <button
                                    onClick={() => handleStartEdit(message.id, message.content)}
                                    className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                                    title="Edit message"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Reactions */}
                          {message.reaction_count > 0 && (
                            <div className="flex gap-1 mt-1">
                              <button className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-xs flex items-center gap-1 transition-colors">
                                <span>👍</span>
                                <span className="text-neutral-600">{message.reaction_count}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-3 sm:p-4 border-t border-neutral-200">
              <div className="flex items-end gap-2 sm:gap-3">
                {/* Attachments */}
                <button className="hidden sm:block p-2 hover:bg-neutral-100 rounded-lg transition-colors self-end mb-2">
                  <Paperclip className="w-5 h-5 text-neutral-600" />
                </button>

                {/* Text Input */}
                <div className="flex-1 border border-neutral-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message #${selectedChannel.name}`}
                    className="w-full px-4 py-3 resize-none focus:outline-none max-h-[200px] text-sm"
                    rows={1}
                  />
                </div>

                {/* Emoji */}
                <button className="hidden sm:block p-2 hover:bg-neutral-100 rounded-lg transition-colors self-end mb-2">
                  <Smile className="w-5 h-5 text-neutral-600" />
                </button>

                {/* Send */}
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  loading={sending}
                  className="self-end"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>

              <div className="mt-2 text-xs text-neutral-500 flex items-center gap-4">
                <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
              <p className="text-lg font-medium text-neutral-700 mb-2">Select a channel</p>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingApp;
