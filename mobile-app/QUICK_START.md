# 🚀 Quick Start Guide - CampusPandit Mobile App

## ✅ Setup Complete!

Your mobile app is configured and Metro bundler is running!

---

## 📱 How to Run the App RIGHT NOW

### Step 1: Look at Your Terminal

In your terminal window, you should see:

```
Metro waiting on exp://192.168.1.47:8081

█████████████████████████████████
█████████████████████████████████
████ ▄▄▄▄▄ █▀█ █▄▀▀▄█ ▄▄▄▄▄ ████
████ █   █ █▀▀▀█ █▀▀█ █   █ ████
████ █▄▄▄█ █▀ █▀ ▀ ▀█ █▄▄▄█ ████
████▄▄▄▄▄▄▄█▄█ █▄█▄█▄█▄▄▄▄▄▄████
█████▄▄▄ ▄▄ ▄ ▀▀ ▀█▄▀▀▄▄██  ████
████ ▄▄▄▄▄▄▄█▀██ ▀▀▀▀▄▄▄▄▀▀█████
[QR CODE DISPLAYED HERE]

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Scan the QR code above with Expo Go (Android) or Camera app (iOS)
```

**This QR code is your connection to the app!**

### Step 2: Install Expo Go on Your Phone

**Android:**
- Open Google Play Store
- Search "Expo Go"
- Install

**iOS:**
- Open App Store
- Search "Expo Go"
- Install

### Step 3: Scan the QR Code

**Android:**
1. Open **Expo Go** app
2. Tap **"Scan QR Code"** button
3. Point camera at QR code in terminal
4. Wait 3-5 seconds
5. App loads! 🎉

**iOS:**
1. Open **Camera** app (not Expo Go)
2. Point at QR code in terminal
3. Tap notification "Open in Expo Go"
4. App loads! 🎉

---

## 🔧 Configuration

### ✅ Already Configured:

**API URL:** `http://192.168.1.47:8000/api/v1`
- This is your computer's IP address
- Your phone will connect to FastAPI backend on this IP

**Requirements:**
- ✅ Phone and computer on **same WiFi network**
- ✅ FastAPI backend running on port 8000
- ✅ Metro bundler running (it is!)

---

## 🏃 Running the Backend

Before scanning QR code, make sure your FastAPI backend is running:

```bash
# In a NEW terminal (don't close Metro bundler!)
cd D:\downloads\campuspandit\campuspandit

# Option 1: Development mode
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# Option 2: Using Docker
docker-compose up backend
```

**Test backend is running:**
Open browser: http://192.168.1.47:8000/docs

---

## 📋 What's Been Set Up

### ✅ Fixed Issues:
1. Package version incompatibilities → Fixed
2. Missing assets (icon/splash) → Removed from config
3. Android SDK warnings → Not needed (using phone)
4. Metro bundler → Running on http://localhost:8081
5. API URL → Configured with your IP: 192.168.1.47
6. env.ts file → Created with correct settings

### ✅ Files Created:
- `mobile-app/src/config/env.ts` - Environment configuration
- `mobile-app/.npmrc` - NPM configuration
- `mobile-app/app.json` - Simplified Expo config
- `mobile-app/SETUP_FIXES.md` - Detailed troubleshooting
- `mobile-app/QUICK_START.md` - This file

---

## 🎯 Next Steps After App Loads

### 1. Test the App

The app will load on your phone. You should see:
- **Login Screen** (if not authenticated)
- Or **Main App** (if already logged in)

### 2. Create Test User

If you need to test login:

```sql
-- In your PostgreSQL/Supabase database
INSERT INTO users (email, password_hash, role, full_name)
VALUES (
  'student@test.com',
  'hashed_password',  -- Use proper password hashing!
  'student',
  'Test Student'
);
```

Or use Supabase Auth:
```bash
# Visit your Supabase project
# Authentication → Users → Add User
# Email: student@test.com
# Password: test123
```

### 3. Start Building!

The mobile app includes:
- ✅ Authentication screens
- ✅ Chat interface
- ✅ Tutor matching
- ✅ Profile management
- ✅ Navigation setup

All connected to your FastAPI backend!

---

## 🐛 Troubleshooting

### "Cannot connect to Metro"

**Solution:** Restart Metro bundler:
```bash
cd mobile-app
npm start -- --reset-cache
```

### "Network request failed" on phone

**Causes:**
1. Phone not on same WiFi
2. Backend not running
3. Firewall blocking port 8000

**Solutions:**
```bash
# 1. Check same WiFi
# 2. Start backend:
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Allow port in Windows Firewall:
# Control Panel → Firewall → Advanced → Inbound Rules → New Rule
# Port 8000, Allow connection
```

### "Unable to resolve module"

**Solution:**
```bash
cd mobile-app
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Phone can't scan QR code

**Alternative method:**
```bash
# In terminal where Metro is running, press:
# 'w' - Opens in web browser (test connectivity)

# Or manually enter URL in Expo Go:
# exp://192.168.1.47:8081
```

---

## 📱 Development Workflow

### Daily Workflow:

1. **Start Backend:**
   ```bash
   cd D:\downloads\campuspandit\campuspandit
   uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Mobile App:**
   ```bash
   cd mobile-app
   npm start
   ```

3. **Scan QR code** with Expo Go

4. **Start coding!**
   - Edit files in `mobile-app/src/`
   - App reloads automatically
   - Shake phone for dev menu

### Hot Reload:
- Save file → App reloads instantly
- No need to rebuild or restart

### Dev Menu (Shake Phone):
- Reload app
- Debug JS remotely
- Show performance monitor
- Toggle element inspector

---

## 🎨 File Structure

```
mobile-app/
├── App.tsx                    # Entry point ← You are here
├── src/
│   ├── config/
│   │   ├── env.ts            # API URL & config ← Update Supabase keys here
│   │   └── supabase.ts       # Supabase client
│   ├── services/
│   │   ├── api.ts            # Backend API calls
│   │   ├── chat.ts           # Chat service
│   │   └── matching.ts       # Matching service
│   ├── navigation/
│   │   └── AppNavigator.tsx  # App navigation
│   └── screens/
│       ├── auth/             # Login, signup screens
│       ├── chat/             # Chat screens
│       └── matching/         # Tutor matching screens
```

---

## 🚀 Ready to Go!

**Your app is ready!** Just:

1. ✅ Metro bundler is running
2. ✅ API URL is configured
3. ✅ Scan QR code with Expo Go
4. ✅ Start building!

**Have fun building CampusPandit! 🎉**

---

## 📚 Additional Resources

- **Complete Setup:** `SETUP_FIXES.md`
- **Mobile App Docs:** `README.md`
- **Troubleshooting:** `MOBILE_APP_SETUP.md`
- **Backend API:** http://192.168.1.47:8000/docs

---

**Questions? Check the docs or the setup guides in the mobile-app directory!**
