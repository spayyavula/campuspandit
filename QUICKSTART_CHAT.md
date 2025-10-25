# 🚀 Quick Start: Real-Time Chat System

Get chat up and running in 5 minutes!

---

## Step 1: Run Database Migration (2 minutes)

### Option A: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the sidebar
4. Click "New Query"
5. Copy the entire contents of:
   ```
   supabase/migrations/20251024130000_create_chat_system.sql
   ```
6. Paste into the editor
7. Click "Run" (bottom right)
8. Wait for "Success. No rows returned"

### Option B: Command Line

```bash
psql your_database_url < supabase/migrations/20251024130000_create_chat_system.sql
```

---

## Step 2: Verify Migration (1 minute)

In Supabase SQL Editor, run:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('conversations', 'messages', 'typing_indicators', 'user_online_status');
```

Should return 4 rows.

---

## Step 3: Test Backend API (1 minute)

Visit: `http://localhost:8000/docs`

Try the **GET /chat/health** endpoint:

```bash
curl http://localhost:8000/api/v1/chat/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "Chat & Messaging",
  "version": "1.0.0"
}
```

---

## Step 4: Add Chat to Your App (1 minute)

### Full Chat Interface

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

### Or Use Individual Functions

```typescript
import { createConversation, sendMessage } from './services/chat';

// Create conversation
const { conversation_id } = await createConversation({
  student_id: 'student-uuid',
  tutor_id: 'tutor-uuid',
  subject: 'Mathematics',
  initial_message: 'Hi! I need help.'
});

// Send message
await sendMessage({
  conversation_id: conversation_id,
  receiver_id: 'tutor-uuid',
  content: 'When are you available?'
});
```

---

## Step 5: Test Real-Time Features

1. **Open two browser windows**
   - Window 1: Student logged in
   - Window 2: Tutor logged in

2. **Create a conversation** in Window 1
   ```typescript
   const conv = await createConversation({
     student_id: studentId,
     tutor_id: tutorId,
     initial_message: 'Hello!'
   });
   ```

3. **Send messages** from both windows
   - Messages should appear instantly
   - Typing indicators should show
   - Read receipts should update

4. **Check online status**
   - Green dot should show when online
   - Last seen should update when offline

---

## What You Just Built

✅ **Real-time messaging** - Messages appear instantly
✅ **Typing indicators** - See when someone is typing
✅ **Read receipts** - Know when messages are read
✅ **Online status** - See who's online
✅ **Conversation list** - All chats in one place
✅ **Message history** - Persistent storage
✅ **Unread counts** - Badge notifications

---

## Common Issues

### "Table does not exist"
- Migration didn't run successfully
- Re-run the migration SQL
- Check for errors in Supabase logs

### "Messages not appearing in real-time"
- Check Realtime is enabled:
  ```sql
  SELECT * FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
  AND tablename = 'messages';
  ```
- If empty, run:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  ```

### "CORS error"
- Check `backend/.env` has your frontend URL in `ALLOWED_ORIGINS`
- Example: `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173`

### "Typing indicators not working"
- They auto-expire after 5 seconds (by design)
- Check typing_indicators table exists
- Verify Realtime is enabled for the table

---

## Next Steps

1. **Customize UI** - Edit `ChatInterface.tsx` colors and layout
2. **Add file upload** - Implement image/file sharing
3. **Add notifications** - Email/SMS for missed messages
4. **Add emojis** - Emoji picker in message input
5. **Add voice messages** - Record and send audio

---

## Testing Checklist

- [ ] Migration ran successfully
- [ ] Can create conversation via API
- [ ] Can send message via API
- [ ] ChatInterface component renders
- [ ] Messages appear in real-time
- [ ] Typing indicator works
- [ ] Read receipts update
- [ ] Online status shows correctly
- [ ] Unread count updates

---

## Files Created

```
supabase/migrations/
└── 20251024130000_create_chat_system.sql    # Database schema

backend/app/api/v1/endpoints/
└── chat.py                                   # API endpoints

src/services/
└── chat.ts                                   # Frontend service

src/components/chat/
└── ChatInterface.tsx                         # UI component

Documentation/
├── CHAT_SYSTEM_GUIDE.md                      # Full guide
└── QUICKSTART_CHAT.md                        # This file
```

---

## API Endpoints

```
POST   /chat/conversations          - Create conversation
GET    /chat/conversations          - List conversations
GET    /chat/messages/{conv_id}     - Get messages
POST   /chat/messages               - Send message
PATCH  /chat/messages/{id}/read     - Mark as read
GET    /chat/unread-count           - Get unread count
POST   /chat/typing/{conv_id}       - Set typing indicator
POST   /chat/online-status          - Update online status
```

Full docs: `http://localhost:8000/docs`

---

## Example Code

### Start a Chat

```typescript
import { createConversation } from './services/chat';

const startChat = async (tutorId: string) => {
  const { conversation_id } = await createConversation({
    student_id: currentUserId,
    tutor_id: tutorId,
    subject: 'Mathematics',
    initial_message: 'Hi! Are you available?'
  });

  // Redirect to chat
  navigate(`/chat?id=${conversation_id}`);
};
```

### Show Unread Badge

```typescript
import { getUnreadCount } from './services/chat';

function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getUnreadCount().then(data => setCount(data.total_unread));
  }, []);

  return count > 0 ? <span>{count}</span> : null;
}
```

### Real-time Updates

```typescript
import { ChatRealtimeService } from './services/chat';

const chatService = new ChatRealtimeService();

// Subscribe to new messages
chatService.subscribeToMessages(conversationId, (message) => {
  console.log('New message:', message);
  updateUI(message);
});

// Cleanup
chatService.unsubscribeAll();
```

---

## Support

- **Full Documentation**: `CHAT_SYSTEM_GUIDE.md`
- **API Reference**: `http://localhost:8000/docs`
- **Troubleshooting**: See CHAT_SYSTEM_GUIDE.md

---

**🎉 You're all set!**

Your real-time chat system is ready. Students and tutors can now communicate instantly!

Happy chatting! 💬
