# 💬 Real-Time Chat & Messaging System

Complete guide to implementing and using the chat system in CampusPandit.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [Database Schema](#database-schema)
5. [Backend API](#backend-api)
6. [Frontend Integration](#frontend-integration)
7. [Realtime Features](#realtime-features)
8. [Usage Examples](#usage-examples)
9. [Customization](#customization)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The chat system enables real-time communication between students and tutors with features like typing indicators, read receipts, and online status tracking.

### Technology Stack

- **Backend**: FastAPI (Python)
- **Database**: Supabase PostgreSQL with Realtime
- **Frontend**: React + TypeScript
- **Real-time**: Supabase Realtime (WebSockets)

---

## Features

✅ **Real-Time Messaging** - Instant message delivery via WebSockets
✅ **Typing Indicators** - See when the other person is typing
✅ **Read Receipts** - Know when messages are read
✅ **Online Status** - See who's online
✅ **Message History** - Persistent message storage
✅ **Unread Counts** - Badge counts for unread messages
✅ **Message Editing** - Edit messages within 15 minutes
✅ **Message Deletion** - Soft delete messages
✅ **File Sharing** - Send images and files (ready for implementation)
✅ **Conversation Archiving** - Archive old conversations
✅ **Responsive Design** - Works on desktop and mobile

---

## Quick Start

### 1. Run Database Migration

**Option A: Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project → SQL Editor
3. Copy contents of `supabase/migrations/20251024130000_create_chat_system.sql`
4. Paste and click "Run"

**Option B: Command Line**
```bash
psql your_database_url < supabase/migrations/20251024130000_create_chat_system.sql
```

### 2. Verify Migration

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('conversations', 'messages', 'typing_indicators', 'user_online_status');

-- Should return 4 rows
```

### 3. Enable Realtime

Already done in migration, but verify:

```sql
-- Check realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'conversations', 'typing_indicators');
```

### 4. Use the Chat Component

```tsx
import ChatInterface from './components/chat/ChatInterface';

function App() {
  return (
    <div className="h-screen">
      <ChatInterface />
    </div>
  );
}
```

### 5. Test It Out

1. Create a conversation between two users
2. Send messages
3. See real-time updates
4. Try typing indicators

---

## Database Schema

### Tables Overview

```
conversations
├── id (UUID, PK)
├── student_id (UUID, FK → users)
├── tutor_id (UUID, FK → users)
├── subject (VARCHAR)
├── last_message_at (TIMESTAMP)
├── last_message_preview (TEXT)
└── is_archived_by_{student|tutor} (BOOLEAN)

messages
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── sender_id (UUID, FK → users)
├── receiver_id (UUID, FK → users)
├── content (TEXT)
├── message_type (VARCHAR) - text, image, file, system
├── attachment_url (TEXT)
├── is_read (BOOLEAN)
├── read_at (TIMESTAMP)
├── is_edited (BOOLEAN)
└── created_at (TIMESTAMP)

typing_indicators
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── user_id (UUID, FK → users)
└── expires_at (TIMESTAMP) - Auto-expires in 5s

user_online_status
├── user_id (UUID, PK, FK → users)
├── is_online (BOOLEAN)
└── last_seen_at (TIMESTAMP)
```

### Key Features

- **Row Level Security (RLS)**: Users can only see their own conversations and messages
- **Indexes**: Optimized for quick lookups (GIN, B-tree)
- **Triggers**: Auto-update conversation metadata when messages are sent
- **Functions**: Helper functions for unread counts, conversation creation
- **Realtime**: Enabled for instant updates

---

## Backend API

### Base URL

```
http://localhost:8000/api/v1/chat
```

### API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.

### Key Endpoints

#### **POST /chat/conversations**

Create or get existing conversation.

**Request:**
```json
{
  "student_id": "uuid",
  "tutor_id": "uuid",
  "subject": "Mathematics",
  "initial_message": "Hi! I have a question about calculus."
}
```

**Response:**
```json
{
  "status": "success",
  "conversation_id": "uuid",
  "message": "Conversation created successfully"
}
```

#### **GET /chat/conversations**

Get all conversations for current user.

**Query Params:**
- `archived` (boolean) - Show archived conversations
- `limit` (int) - Max results (default: 50)
- `offset` (int) - Pagination offset

**Response:**
```json
[
  {
    "id": "uuid",
    "student_id": "uuid",
    "tutor_id": "uuid",
    "subject": "Mathematics",
    "last_message_preview": "Thanks for the help!",
    "last_message_at": "2025-10-24T12:00:00Z",
    "unread_count": 2,
    "is_archived": false,
    "other_user": {
      "id": "uuid",
      "name": "John Smith",
      "avatar_url": "https://...",
      "is_online": true
    },
    "created_at": "2025-10-24T10:00:00Z"
  }
]
```

#### **POST /chat/messages**

Send a new message.

**Request:**
```json
{
  "conversation_id": "uuid",
  "receiver_id": "uuid",
  "content": "When is our next session?",
  "reply_to_id": "uuid"  // Optional
}
```

**Response:**
```json
{
  "status": "success",
  "message_id": "uuid",
  "created_at": "2025-10-24T12:00:00Z"
}
```

#### **GET /chat/messages/{conversation_id}**

Get messages for a conversation.

**Query Params:**
- `limit` (int) - Max messages (default: 50)
- `offset` (int) - Pagination offset
- `before_message_id` (uuid) - Cursor-based pagination

**Response:**
```json
[
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "content": "Hello! How can I help?",
    "message_type": "text",
    "is_read": true,
    "read_at": "2025-10-24T12:05:00Z",
    "is_edited": false,
    "sender_name": "John Smith",
    "sender_avatar": "https://...",
    "created_at": "2025-10-24T12:00:00Z"
  }
]
```

#### **PATCH /chat/messages/conversation/{conversation_id}/read-all**

Mark all messages in a conversation as read.

#### **GET /chat/unread-count**

Get total unread message count.

**Response:**
```json
{
  "total_unread": 5,
  "by_conversation": [
    {
      "conversation_id": "uuid",
      "unread_count": 3
    },
    {
      "conversation_id": "uuid",
      "unread_count": 2
    }
  ]
}
```

#### **POST /chat/typing/{conversation_id}**

Set typing indicator (auto-expires in 5 seconds).

#### **POST /chat/online-status**

Update user online status.

**Request:**
```json
{
  "is_online": true
}
```

---

## Frontend Integration

### Install Service

The chat service is in `src/services/chat.ts`.

### Basic Usage

```typescript
import {
  createConversation,
  sendMessage,
  getMessages,
  getConversations,
  ChatRealtimeService,
} from './services/chat';

// Create a conversation
const { conversation_id } = await createConversation({
  student_id: studentId,
  tutor_id: tutorId,
  subject: 'Mathematics',
  initial_message: 'Hi! I need help with calculus.'
});

// Send a message
await sendMessage({
  conversation_id: conversation_id,
  receiver_id: tutorId,
  content: 'When are you available?'
});

// Get messages
const messages = await getMessages(conversation_id);

// Get all conversations
const conversations = await getConversations();
```

### Realtime Subscription

```typescript
// Initialize realtime service
const chatService = new ChatRealtimeService();

// Subscribe to new messages
chatService.subscribeToMessages(conversationId, (message) => {
  console.log('New message:', message);
  // Update UI
  setMessages(prev => [...prev, message]);
});

// Subscribe to typing indicators
chatService.subscribeToTyping(conversationId, (userId, isTyping) => {
  if (isTyping) {
    showTypingIndicator(userId);
  } else {
    hideTypingIndicator(userId);
  }
});

// Subscribe to online status
chatService.subscribeToOnlineStatus((userId, isOnline, lastSeen) => {
  updateUserStatus(userId, isOnline);
});

// Cleanup
chatService.unsubscribeAll();
```

---

## Realtime Features

### How Realtime Works

The system uses Supabase Realtime (PostgreSQL logical replication) for instant updates:

```
User A sends message
    ↓
Inserted into database
    ↓
PostgreSQL Realtime Publication
    ↓
Supabase Realtime Server (WebSocket)
    ↓
User B's browser receives update
    ↓
UI updates instantly
```

### Typing Indicators

```typescript
import { setTypingIndicator, debounce } from './services/chat';

// In your input component
const sendTyping = useRef(
  debounce(() => setTypingIndicator(conversationId), 300)
).current;

<textarea
  onChange={(e) => {
    setInput(e.target.value);
    sendTyping(); // Debounced
  }}
/>
```

### Read Receipts

```typescript
import { markConversationRead } from './services/chat';

// Mark as read when user opens conversation
useEffect(() => {
  if (selectedConversation) {
    markConversationRead(selectedConversation.id);
  }
}, [selectedConversation]);

// Or mark specific message
await markMessageRead(messageId);
```

### Online Status

```typescript
import { updateOnlineStatus, initializeOnlineStatus } from './services/chat';

// On app load
useEffect(() => {
  initializeOnlineStatus();
  // Automatically handles:
  // - Set online on load
  // - Set offline when tab hidden
  // - Set offline on page unload
}, []);

// Manual control
await updateOnlineStatus(true);  // Online
await updateOnlineStatus(false); // Offline
```

---

## Usage Examples

### Example 1: Simple Chat Widget

```tsx
import { useState, useEffect } from 'react';
import { getMessages, sendMessage, ChatRealtimeService } from './services/chat';

function SimpleChatWidget({ conversationId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatService = new ChatRealtimeService();

  useEffect(() => {
    // Load messages
    getMessages(conversationId).then(setMessages);

    // Subscribe to new messages
    chatService.subscribeToMessages(conversationId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => chatService.unsubscribeAll();
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim()) return;

    await sendMessage({
      conversation_id: conversationId,
      receiver_id: receiverId,
      content: input
    });

    setInput('');
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### Example 2: Unread Message Badge

```tsx
import { useState, useEffect } from 'react';
import { getUnreadCount } from './services/chat';

function UnreadBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial count
    getUnreadCount().then(data => {
      setUnreadCount(data.total_unread);
    });

    // Refresh every 30 seconds
    const interval = setInterval(async () => {
      const data = await getUnreadCount();
      setUnreadCount(data.total_unread);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0) return null;

  return (
    <span className="badge">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
```

### Example 3: Start Chat from Matching

```tsx
import { createConversation } from './services/chat';

function TutorMatchCard({ tutor, studentId }) {
  const startChat = async () => {
    const { conversation_id } = await createConversation({
      student_id: studentId,
      tutor_id: tutor.id,
      subject: tutor.subject,
      initial_message: `Hi ${tutor.name}! I'm interested in booking a session.`
    });

    // Redirect to chat
    window.location.href = `/chat?conversation=${conversation_id}`;
  };

  return (
    <div>
      <h3>{tutor.name}</h3>
      <button onClick={startChat}>💬 Message Tutor</button>
    </div>
  );
}
```

---

## Customization

### Custom Message Types

Add support for custom message types (polls, session invites, etc.):

```typescript
// Backend: Add to message_type enum
ALTER TYPE message_type ADD VALUE 'session_invite';

// Frontend: Handle custom rendering
function MessageBubble({ message }) {
  if (message.message_type === 'session_invite') {
    return <SessionInviteCard data={JSON.parse(message.content)} />;
  }

  return <div>{message.content}</div>;
}
```

### Custom Styling

The components use Tailwind CSS. Customize by editing class names:

```tsx
// Change message bubble colors
<div className={`rounded-lg px-4 py-2 ${
  isOwn
    ? 'bg-purple-600 text-white'  // Your messages
    : 'bg-gray-100 text-gray-900'  // Their messages
}`}>
```

### Add File Upload

```typescript
// In MessageInput component
const handleFileUpload = async (file: File) => {
  // 1. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(`${conversationId}/${file.name}`, file);

  if (error) throw error;

  // 2. Get public URL
  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(data.path);

  // 3. Send message with attachment
  await sendMessage({
    conversation_id: conversationId,
    receiver_id: receiverId,
    content: file.name,
    // Add attachment_url via API extension
  });
};
```

---

## Troubleshooting

### Messages Not Appearing in Real-Time

**Check Realtime is enabled:**

```sql
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'messages';
```

If not enabled:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

**Check browser console** for WebSocket errors.

### Typing Indicators Not Working

**Verify table exists:**

```sql
SELECT * FROM typing_indicators LIMIT 1;
```

**Check auto-expiration** is working (should delete after 5 seconds).

### High Unread Counts

Messages might not be marked as read. Ensure:

```typescript
// Call this when user views conversation
await markConversationRead(conversationId);
```

### Performance Issues

**Add pagination:**

```typescript
// Load messages in batches
const messages = await getMessages(conversationId, 50, 0);

// Load more on scroll
const olderMessages = await getMessages(conversationId, 50, 50);
```

**Optimize queries** with database indexes (already included in migration).

---

## Production Checklist

✅ **Database Migration** - Run migration in production database
✅ **Realtime Enabled** - Verify realtime tables are published
✅ **RLS Policies** - Test Row Level Security works correctly
✅ **CORS Settings** - Configure backend CORS for production domain
✅ **SSL/HTTPS** - Ensure WebSockets work over HTTPS
✅ **File Storage** - Set up Supabase Storage for attachments
✅ **Rate Limiting** - Add rate limits to prevent spam
✅ **Moderation** - Consider adding content moderation
✅ **Notifications** - Set up email/SMS notifications for missed messages
✅ **Monitoring** - Track message delivery rates and errors

---

## Next Steps

1. **Add Email Notifications** - Notify users of new messages via email
2. **Add Push Notifications** - Mobile push notifications
3. **Add File Sharing** - Complete file upload implementation
4. **Add Message Reactions** - Emoji reactions to messages
5. **Add Group Chats** - Support multi-user conversations
6. **Add Voice Messages** - Record and send voice messages
7. **Add Video Calls** - Integrate video calling (Twilio, Agora)

---

## API Reference

Full API documentation: `http://localhost:8000/docs`

Test endpoints: Use the interactive Swagger UI at `/docs`

---

**🎉 Your real-time chat system is ready!**

Students and tutors can now communicate instantly with typing indicators, read receipts, and online status.

Happy chatting! 💬
