# 📱 CampusPandit Mobile App

**Cross-platform mobile app for iOS & Android built with React Native & Expo**

---

## 🎯 What Is This?

A complete mobile application for CampusPandit that connects to your existing FastAPI backend. Students can find tutors, chat in real-time, and book sessions - all from their mobile devices.

---

## ✨ Features

### 🔐 Authentication
- Email/password login
- User registration
- Biometric authentication (Face ID/Touch ID)
- Auto-login with secure token storage

### 💬 Real-Time Chat
- Instant messaging with tutors
- Typing indicators
- Read receipts
- Image sharing via camera
- Message history
- Unread message badges

### 🎯 AI-Powered Matching
- Swipe to discover tutors
- AI match scores & reasoning
- Advanced filters (subject, budget, rating)
- Tutor profiles with reviews
- One-tap to contact

### 📱 Mobile-Specific
- Push notifications for new messages
- Camera integration for photos
- Offline message queueing
- Deep linking to app content
- Native navigation & animations

---

## 🚀 Quick Start

### Install & Run (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# 3. Choose platform:
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app
```

### Configure Backend

Edit `src/config/env.ts`:

```typescript
export const ENV = {
  API_URL: 'http://localhost:8000/api/v1',  // Your backend
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
};
```

**That's it!** Your app is running! 🎉

---

## 📁 Project Structure

```
mobile-app/
├── App.tsx                        # Entry point
├── package.json                   # Dependencies
├── app.json                       # Expo config
│
├── src/
│   ├── config/
│   │   ├── env.ts                # Environment config
│   │   └── supabase.ts           # Supabase client
│   │
│   ├── services/
│   │   ├── api.ts                # Backend API
│   │   ├── chat.ts               # Chat service
│   │   ├── matching.ts           # Matching service
│   │   ├── auth.ts               # Authentication
│   │   └── notifications.ts      # Push notifications
│   │
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Main navigation
│   │   ├── AuthNavigator.tsx     # Auth screens
│   │   └── MainNavigator.tsx     # Main tabs
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ConversationsScreen.tsx
│   │   │   └── ChatScreen.tsx
│   │   │
│   │   ├── matching/
│   │   │   ├── FindTutorScreen.tsx
│   │   │   └── TutorProfileScreen.tsx
│   │   │
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   │
│   ├── components/
│   │   ├── TutorCard.tsx
│   │   ├── MessageBubble.tsx
│   │   └── common/
│   │
│   └── types/
│       ├── chat.ts
│       └── matching.ts
│
└── assets/
    ├── images/
    └── icons/
```

---

## 🛠️ Available Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
npm test           # Run tests
npm run lint       # Lint code
```

---

## 📦 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** | Development & build platform |
| **TypeScript** | Type-safe JavaScript |
| **React Navigation** | Native navigation |
| **Supabase** | Authentication & real-time |
| **React Native Paper** | Material Design components |
| **Gifted Chat** | Chat UI components |
| **Axios** | HTTP client for API calls |

---

## 🎨 Screenshots

### Authentication
```
┌─────────────────────┐
│   CampusPandit      │
│                     │
│   📧 Email          │
│   ┌───────────────┐ │
│   │student@...    │ │
│   └───────────────┘ │
│                     │
│   🔒 Password       │
│   ┌───────────────┐ │
│   │••••••••••    │ │
│   └───────────────┘ │
│                     │
│   [ Login  ]        │
│   Sign up           │
└─────────────────────┘
```

### Chat
```
┌─────────────────────┐
│  💬 Messages    ⚙️  │
├─────────────────────┤
│ 🟢 John Smith       │
│    When is our...   │
│    2m ago       [2] │
├─────────────────────┤
│ ⚪ Sarah Jones      │
│    Thank you for... │
│    5m ago           │
└─────────────────────┘
```

### Matching
```
┌─────────────────────┐
│  🎯 Find Tutor      │
├─────────────────────┤
│   ┌─────────────┐   │
│   │  📸 Photo   │   │
│   │             │   │
│   │ John Smith  │   │
│   │ ⭐ 4.9       │   │
│   │ $50/hr      │   │
│   │ 92% Match   │   │
│   └─────────────┘   │
│                     │
│   [ Contact ]       │
└─────────────────────┘
```

---

## 🔧 Development

### Add New Screen

1. Create screen file:
```bash
src/screens/YourScreen.tsx
```

2. Add to navigation:
```typescript
// src/navigation/AppNavigator.tsx
<Stack.Screen name="YourScreen" component={YourScreen} />
```

3. Navigate to it:
```typescript
navigation.navigate('YourScreen');
```

### Call Backend API

```typescript
import api from '../services/api';

const data = await api.get('/your-endpoint');
const result = await api.post('/your-endpoint', { data });
```

### Add Real-time Feature

```typescript
import { supabase } from '../config/supabase';

const subscription = supabase
  .channel('your-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'your_table',
  }, (payload) => {
    console.log('New data:', payload.new);
  })
  .subscribe();
```

---

## 🚢 Build & Deploy

### Development Build

```bash
# iOS
expo run:ios

# Android
expo run:android
```

### Production Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build both
eas build --platform all
```

### Submit to Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

---

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

### Test on Real Device

1. Install Expo Go:
   - iOS: App Store
   - Android: Google Play

2. Scan QR code from terminal

3. App loads on device

---

## 🐛 Common Issues & Fixes

### "Unable to resolve module"

```bash
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### "Network request failed"

Update API URL in `src/config/env.ts`:

```typescript
// For Android emulator
API_URL: 'http://10.0.2.2:8000/api/v1'

// For iOS simulator
API_URL: 'http://localhost:8000/api/v1'

// For physical device
API_URL: 'http://YOUR_COMPUTER_IP:8000/api/v1'
```

### "Supabase not configured"

Update `src/config/env.ts` with your Supabase credentials.

---

## 📚 Documentation

- **Full Implementation Guide**: `../MOBILE_APP_COMPLETE.md`
- **Setup Instructions**: `../MOBILE_APP_SETUP.md`
- **React Native Docs**: https://reactnative.dev/
- **Expo Docs**: https://docs.expo.dev/
- **Supabase Docs**: https://supabase.com/docs

---

## 🎯 Roadmap

- [x] Authentication
- [x] Real-time chat
- [x] AI matching
- [x] Push notifications
- [ ] Voice messages
- [ ] Video calls
- [ ] Offline mode improvements
- [ ] Dark mode
- [ ] Multi-language support

---

## 💡 Tips

### Hot Reload

Changes to `.tsx` files reload automatically. Shake device or press `Ctrl+M` (Android) / `Cmd+D` (iOS) for dev menu.

### Debug

```bash
# Open React Native debugger
Press 'd' in terminal

# View logs
Press 'l' in terminal
```

### Performance

- Use `memo()` for expensive components
- Use `FlatList` for long lists
- Enable Hermes for faster startup

---

## 🆘 Support

- **Issues**: Create GitHub issue
- **Questions**: Check documentation
- **Backend API**: See backend README

---

## 📄 License

Same as main CampusPandit project

---

**🎉 Your mobile app is ready!**

Run `npm start` and start building! 🚀
