# Messaging System - Slack-like Chat

A real-time messaging system inspired by Slack, designed with the same clean, minimalist principles as the rest of CampusPandit. Enables tutors and students to communicate effectively through channels and direct messages.

## 🎯 Overview

The messaging system provides:
- **Real-time chat** with instant message delivery
- **Channels** for group conversations (similar to Slack channels)
- **Direct messages** for 1-on-1 conversations
- **Threading** for organized discussions
- **Reactions** with emoji support
- **Typing indicators** to show who's currently typing
- **Read receipts** to track message status
- **File sharing** capabilities
- **Search** across channels and messages

## 🎨 Design Philosophy

Following Zerodha's minimalist approach:
- **Clean interface** with maximum white space
- **Clear visual hierarchy** - channels, messages, and actions are distinct
- **Subtle interactions** - hover states, smooth transitions
- **Mobile-responsive** - works perfectly on all devices
- **Keyboard shortcuts** - Enter to send, Shift+Enter for new line
- **Performance-first** - real-time updates without lag

## 🏗️ Architecture

### Database Schema

The system uses 9 interconnected tables:

1. **channels** - Group and direct message channels
2. **channel_members** - Members of each channel with roles and preferences
3. **messages** - Individual messages with threading support
4. **message_reactions** - Emoji reactions to messages
5. **direct_messages** - 1-on-1 conversation records
6. **typing_indicators** - Real-time typing status
7. **message_read_receipts** - Message read tracking
8. **channel_invitations** - Pending channel invites
9. **saved_messages** - Bookmarked messages

### Key Features

#### Channels
```typescript
interface Channel {
  name: string;
  channel_type: 'direct' | 'group' | 'tutor_student' | 'class' | 'subject';
  is_private: boolean;
  member_count: number;
  message_count: number;
  last_message_at: timestamp;
}
```

**Channel Types:**
- `direct`: 1-on-1 private conversations
- `group`: Multi-user channels (public or private)
- `tutor_student`: Channels for specific tutor-student pairs
- `class`: Channels for entire classes
- `subject`: Subject-specific discussion channels

#### Messages
```typescript
interface Message {
  content: string;
  message_type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'code' | 'system';
  parent_message_id?: string; // For threads
  mentioned_user_ids?: string[];
  is_edited: boolean;
  is_pinned: boolean;
  reaction_count: number;
}
```

**Message Features:**
- Text formatting
- File attachments
- Threading (replies to specific messages)
- User mentions (@user)
- Edit history
- Pin important messages
- Emoji reactions

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
psql -h your-supabase-host -U postgres -d postgres -f database/messaging_system_schema.sql
```

This creates:
- All 9 tables with relationships
- Indexes for performance
- Row Level Security policies
- Real-time subscriptions
- Automatic triggers (message counts, unread badges, etc.)

### Step 2: Enable Real-time in Supabase

1. Go to Database → Replication in Supabase dashboard
2. Enable real-time for these tables:
   - `messages`
   - `typing_indicators`
   - `message_reactions`
   - `channel_members`

### Step 3: Configure Supabase Client

Already configured in `src/utils/supabase.ts`. Real-time is enabled by default.

### Step 4: Add Route

Already added in `App.tsx`:
```typescript
<Route path="/messages" element={user ? <MessagingApp userId={user.id} /> : <Navigate to="/auth" />} />
```

### Step 5: Create Initial Channels

Channels can be created:
- Programmatically via API
- Through UI (click + button)
- Automatically when tutoring sessions are booked

## 📱 User Interface

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Messages              [+]                          │
│  [Search channels...]                               │
├─────────────────┬───────────────────────────────────┤
│                 │  # general-physics    [★] [⋮]     │
│ # general       │  ─────────────────────────────────│
│ # physics-help  │  👤 Alice                         │
│ # chemistry     │      Hello! Can someone help...   │
│ 🔒 tutor-room   │      10:30 AM                     │
│ 👤 Direct: Bob  │                                   │
│                 │  👤 Bob (You)                     │
│                 │      Sure! What's the...         │
│                 │      10:32 AM                     │
│                 │  ─────────────────────────────────│
│                 │  [📎] Type message... [😊] [Send] │
└─────────────────┴───────────────────────────────────┘
```

### Components

**1. Channel Sidebar** (`w-80`)
- Search bar
- Channel list with:
  - Channel icon (# for public, 🔒 for private, 👤 for DM)
  - Channel name
  - Unread count badge
  - Last message time
  - Star indicator

**2. Chat Header**
- Channel name and description
- Star button (bookmark channel)
- Settings menu
- Member count

**3. Message Thread**
- Messages with user avatars
- Date separators
- Own messages aligned right (blue background)
- Other messages aligned left (gray background)
- Timestamps
- Edit indicators
- Reactions

**4. Message Composer**
- Auto-expanding textarea
- Attachment button
- Emoji picker button
- Send button
- Keyboard shortcuts hint

## 🔌 API Usage

### Import

```typescript
import {
  getUserChannels,
  createChannel,
  sendMessage,
  getChannelMessages,
  subscribeToChannelMessages,
  addReaction,
  markChannelAsRead
} from './utils/messagingAPI';
```

### Common Operations

#### Get User's Channels

```typescript
const channels = await getUserChannels(userId);
// Returns array of channels with unread counts
```

#### Create a Channel

```typescript
const channel = await createChannel({
  name: 'physics-study-group',
  description: 'Study group for physics topics',
  channel_type: 'group',
  is_private: false,
  subject: 'physics'
});
```

#### Send a Message

```typescript
await sendMessage({
  channel_id: channelId,
  content: 'Hello everyone! 👋',
  message_type: 'text'
});
```

#### Send with User Mention

```typescript
await sendMessage({
  channel_id: channelId,
  content: '@userId Can you help with this problem?'
});
// System automatically extracts mentioned user IDs
```

#### Get Channel Messages

```typescript
const messages = await getChannelMessages(channelId, 50);
// Returns last 50 messages with user info
```

#### Subscribe to Real-time Messages

```typescript
const subscription = subscribeToChannelMessages(channelId, (newMessage) => {
  console.log('New message received:', newMessage);
  // Update UI with new message
});

// Cleanup when component unmounts
return () => subscription.unsubscribe();
```

#### Mark Channel as Read

```typescript
await markChannelAsRead(channelId);
// Resets unread count to 0
```

#### Add Reaction

```typescript
await addReaction(messageId, '👍');
```

#### Create Direct Message

```typescript
const dmChannel = await getOrCreateDirectMessage(otherUserId);
// Creates new DM if doesn't exist, returns existing if it does
```

## 🎯 Use Cases

### 1. Tutor-Student Communication

```typescript
// When a tutoring session is booked
const session = await bookTutoringSession(tutorId, studentId);

// Automatically create channel
const channel = await createChannel({
  name: `Session: ${session.subject}`,
  channel_type: 'tutor_student',
  is_private: true,
  tutor_id: tutorId,
  subject: session.subject
});

// Add both parties
await addChannelMember(channel.id, tutorId, 'owner');
await addChannelMember(channel.id, studentId, 'member');
```

### 2. Subject Discussion Channels

```typescript
// Create public channels for each subject
const subjects = ['physics', 'mathematics', 'chemistry'];

for (const subject of subjects) {
  await createChannel({
    name: subject,
    description: `General discussion about ${subject}`,
    channel_type: 'subject',
    is_private: false,
    subject: subject
  });
}
```

### 3. Class Channels

```typescript
// Create channel for a specific class/grade
await createChannel({
  name: 'grade-12-physics',
  description: 'Grade 12 Physics students',
  channel_type: 'class',
  is_private: false,
  subject: 'physics'
});
```

### 4. Direct Messages

```typescript
// Student wants to message tutor directly
const dmChannel = await getOrCreateDirectMessage(tutorUserId);

// Send message
await sendMessage({
  channel_id: dmChannel.id,
  content: 'Hi! I have a question about yesterday\'s session.'
});
```

## 🔔 Notification Preferences

Members can customize notifications per channel:

```typescript
// Update notification preferences
await supabase
  .from('channel_members')
  .update({
    notifications_enabled: true,
    notification_level: 'mentions' // 'all', 'mentions', 'none'
  })
  .eq('channel_id', channelId)
  .eq('user_id', userId);
```

**Notification Levels:**
- `all`: Notify for every message
- `mentions`: Only when @mentioned
- `none`: No notifications

## ⌨️ Keyboard Shortcuts

The messaging UI supports keyboard shortcuts:

- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Cmd/Ctrl + K**: Quick channel search (future)
- **↑**: Edit last message (future)
- **Esc**: Close thread/modal (future)

## 📊 Performance Optimizations

### Message Pagination

```typescript
// Load messages in batches
let messages = await getChannelMessages(channelId, 50);

// Load older messages
const olderMessages = await getChannelMessages(
  channelId,
  50,
  messages[0].created_at // before this timestamp
);
```

### Lazy Loading

- Messages load 50 at a time
- Channels load all (typically < 100)
- Reactions load on demand
- Typing indicators auto-expire after 10 seconds

### Real-time Subscriptions

- Subscribe only to active channel
- Unsubscribe when switching channels
- Auto-cleanup on component unmount

### Database Indexes

All critical queries are indexed:
- `messages(channel_id, created_at)` for message history
- `channel_members(user_id, unread_count)` for unread badges
- `messages(parent_message_id)` for threads

## 🔒 Security & Privacy

### Row Level Security

- Users can only view channels they're members of
- Users can only send messages to their channels
- Private channels are completely hidden from non-members
- Users can only edit/delete their own messages

### Privacy Features

- Private channels (invite-only)
- Direct messages (1-on-1, private by default)
- Ability to leave channels
- Ability to mute channels
- No message history for users who join later (future)

## 🧪 Testing

### Create Test Data

```typescript
// Create test channels
const testChannels = [
  { name: 'general', channel_type: 'group', is_private: false },
  { name: 'physics-help', channel_type: 'subject', is_private: false, subject: 'physics' },
  { name: 'private-study', channel_type: 'group', is_private: true }
];

for (const ch of testChannels) {
  const channel = await createChannel(ch);
  await addChannelMember(channel.id, userId, 'owner');
}

// Send test messages
for (let i = 0; i < 10; i++) {
  await sendMessage({
    channel_id: channelId,
    content: `Test message ${i + 1}`
  });
}
```

## 🐛 Troubleshooting

### Messages not appearing in real-time

**Check:**
1. Real-time is enabled in Supabase for `messages` table
2. Subscription is active (check browser console)
3. User has permissions to view channel
4. Channel ID is correct

**Solution:**
```typescript
// Check subscription status
const subscription = subscribeToChannelMessages(channelId, callback);
console.log('Subscription state:', subscription.state);
// Should be 'subscribed'
```

### Unread counts not updating

**Check:**
1. `markChannelAsRead()` is called when viewing channel
2. Database triggers are working
3. User is a member of the channel

**Solution:**
```typescript
// Manually reset unread count
await markChannelAsRead(channelId);
await loadChannels(); // Refresh channel list
```

### Typing indicators not showing

**Check:**
1. Real-time enabled for `typing_indicators`
2. Expired indicators are cleaned up (auto after 10s)

**Solution:**
```typescript
// Send typing indicator
await sendTypingIndicator(channelId);

// Subscribe to typing
subscribeToTypingIndicators(channelId, (indicator) => {
  console.log('User typing:', indicator.user_id);
});
```

## 🚀 Future Enhancements

### Planned Features

- [ ] **Message search** across all channels
- [ ] **Threads UI** - dedicated panel for thread discussions
- [ ] **Rich text editor** - bold, italic, code blocks
- [ ] **File uploads** - image, document, video sharing
- [ ] **Voice messages** - record and send audio
- [ ] **Video calls** - integrated video conferencing
- [ ] **Screen sharing** - for tutoring sessions
- [ ] **Message reactions** - extended emoji picker
- [ ] **Pinned messages** - pin important messages at top
- [ ] **Channel topics** - set channel topic/description
- [ ] **User status** - online, away, busy, offline
- [ ] **Message forwarding** - share messages between channels
- [ ] **Polls** - create polls in channels
- [ ] **Reminders** - set reminders for messages
- [ ] **Custom emojis** - upload custom emoji packs
- [ ] **Message scheduling** - send messages at specific time
- [ ] **Email notifications** - notify via email for @mentions
- [ ] **Mobile apps** - native iOS and Android apps

### Advanced Features

- **Smart notifications** - AI-powered notification prioritization
- **Message summaries** - AI-generated channel summaries
- **Translation** - Auto-translate messages to user's language
- **Voice-to-text** - Transcribe voice messages
- **Smart replies** - AI-suggested quick replies
- **Sentiment analysis** - Detect urgent or important messages

## 📖 Examples

### Complete Chat Implementation

```typescript
import MessagingApp from './components/messaging/MessagingApp';

function App() {
  const { user } = useAuth();

  return (
    <div>
      <MessagingApp userId={user.id} />
    </div>
  );
}
```

### Create Channel with Members

```typescript
async function createStudyGroup(name: string, memberIds: string[]) {
  // Create channel
  const channel = await createChannel({
    name,
    description: `Study group for ${name}`,
    channel_type: 'group',
    is_private: false
  });

  // Add all members
  for (const memberId of memberIds) {
    await addChannelMember(channel.id, memberId, 'member');
  }

  // Send welcome message
  await sendMessage({
    channel_id: channel.id,
    content: `Welcome to ${name}! 🎉`,
    message_type: 'system'
  });

  return channel;
}
```

### Send Message with File

```typescript
async function sendFileMessage(channelId: string, file: File) {
  // Upload file to storage
  const { data, error } = await supabase.storage
    .from('message-attachments')
    .upload(`${channelId}/${file.name}`, file);

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('message-attachments')
    .getPublicUrl(data.path);

  // Send message with file
  await sendMessage({
    channel_id: channelId,
    content: `Shared a file: ${file.name}`,
    message_type: 'file',
    file_url: urlData.publicUrl,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size
  });
}
```

## 🎨 Customization

### Custom Channel Icons

```typescript
const getChannelIcon = (channel) => {
  switch (channel.channel_type) {
    case 'direct': return <MessageCircle />;
    case 'tutor_student': return <GraduationCap />;
    case 'class': return <Users />;
    case 'subject': return <BookOpen />;
    default: return <Hash />;
  }
};
```

### Custom Message Styling

```typescript
const getMessageStyle = (message, isOwn) => {
  if (message.message_type === 'system') {
    return 'bg-neutral-100 text-neutral-600 text-center';
  }
  return isOwn
    ? 'bg-primary-500 text-white'
    : 'bg-neutral-100 text-neutral-900';
};
```

## 📞 Support

### Resources
- Database Schema: `database/messaging_system_schema.sql`
- API Functions: `src/utils/messagingAPI.ts`
- UI Component: `src/components/messaging/MessagingApp.tsx`
- Supabase Real-time Docs: https://supabase.com/docs/guides/realtime

### Common Issues

1. **Can't see messages**: Check RLS policies and channel membership
2. **Real-time not working**: Enable real-time replication in Supabase
3. **Slow performance**: Ensure indexes are created from schema file
4. **Messages not sending**: Check network and authentication

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Design**: Inspired by Slack, styled with Zerodha aesthetics
**Built with**: React, TypeScript, Supabase, TailwindCSS
