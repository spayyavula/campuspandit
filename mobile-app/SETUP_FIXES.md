# Mobile App Setup - Issues Fixed

## Issues Resolved

### 1. ✅ Package Version Incompatibility

**Problem:**
```
Some dependencies are incompatible with the installed expo version:
  react-native@0.72.6 - expected version: 0.72.10
```

**Solution:**
- Installed correct versions using `npm install --legacy-peer-deps`
- Created `.npmrc` file with `legacy-peer-deps=true` to prevent future issues
- Updated React Native to 0.72.10

### 2. ✅ Android SDK Warnings (Not Critical)

**Problem:**
```
Failed to resolve the Android SDK path.
Error: 'adb' is not recognized...
```

**Solution:**
- **These warnings are SAFE TO IGNORE** if you're using your phone with Expo Go
- Android SDK is only needed if you want to run Android emulator
- Physical phone with Expo Go is easier and recommended

### 3. ✅ Metro Bundler Started Successfully

**Status:** Running on http://localhost:8081

---

## Current Setup

### What's Working:
✅ All dependencies installed correctly
✅ React Native 0.72.10 (compatible with Expo SDK 49)
✅ Metro bundler running successfully
✅ Ready to run on your phone with Expo Go

### Files Created/Modified:
- `.npmrc` - Ensures npm uses legacy-peer-deps for compatibility
- `package.json` - All packages at correct versions

---

## How to Run Your App

### Option 1: Physical Phone (RECOMMENDED - 2 minutes)

1. **Install Expo Go on your phone:**
   - iOS: App Store → Search "Expo Go"
   - Android: Google Play → Search "Expo Go"

2. **Scan QR code:**
   - Metro bundler is already running
   - Look in your terminal for a QR code
   - Scan it with:
     - **iOS**: Open Camera app → Point at QR code
     - **Android**: Open Expo Go app → Tap "Scan QR Code"

3. **App loads on your phone!**

### Option 2: Emulator (If you really want it)

#### Android Emulator Setup:
```bash
# 1. Install Android Studio
# Download from: https://developer.android.com/studio

# 2. Set environment variable
# Add to your system environment variables:
ANDROID_HOME=C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk

# Add to PATH:
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator

# 3. Create virtual device in AVD Manager

# 4. Run
npm run android
```

#### iOS Simulator (Mac only):
```bash
# 1. Install Xcode from App Store

# 2. Install command line tools
xcode-select --install

# 3. Run
npm run ios
```

---

## Current Status

### Metro Bundler:
```
✅ Running on http://localhost:8081
✅ Ready to accept connections
✅ Logs will appear below when you connect
```

### What to Do Next:

**If Metro bundler is still running in background:**
- Just scan the QR code with Expo Go app
- Your app will load immediately

**If you closed the terminal:**
```bash
cd mobile-app
npm start
```

Then scan the QR code.

---

## Troubleshooting

### "Cannot connect to Metro"
```bash
# Restart Metro with cache cleared
cd mobile-app
npm start -- --reset-cache
```

### "Network error" on phone
- Make sure phone and computer are on the same WiFi
- Try using tunnel mode:
```bash
npm start -- --tunnel
```

### "Module not found"
```bash
# Clear cache and reinstall
cd mobile-app
rm -rf node_modules
npm install
npm start -- --reset-cache
```

---

## Environment Configuration

Before running the app, update `src/config/env.ts` with your backend URL:

```typescript
export const ENV = {
  // Backend API
  API_URL: __DEV__
    ? 'http://YOUR_COMPUTER_IP:8000/api/v1'  // Get your IP: ipconfig
    : 'https://api.campuspandit.com/api/v1',

  // Supabase (if using)
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
};
```

**Finding your computer IP:**
```bash
# Windows
ipconfig
# Look for "IPv4 Address" under your WiFi adapter

# Mac/Linux
ifconfig
# Look for "inet" under en0
```

---

## Next Steps

1. **Configure Environment** - Update `src/config/env.ts` with backend URL
2. **Install Expo Go** - On your phone (2 minutes)
3. **Scan QR Code** - From the terminal where Metro is running
4. **Start Building** - App loads, you can start coding!

---

## Summary

**Everything is fixed and working!**

- ✅ Dependencies: Compatible versions installed
- ✅ Metro Bundler: Running successfully
- ✅ Android SDK: Not needed (using phone)
- ✅ Ready to go: Just scan QR code with Expo Go

**Your mobile app is ready to run! 🚀**

No simulator needed - just use your phone with Expo Go for the easiest development experience.
