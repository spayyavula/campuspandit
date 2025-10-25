# 🎯 START HERE - CampusPandit Quick Launch

## ⚡ Fastest Way to Get Started

### Step 1: Run the Startup Script

**Windows:**
```bash
start-dev.bat
```

**Mac/Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Step 2: Scan QR Code

1. Install **Expo Go** app on your phone (App Store or Google Play)
2. Look for the QR code in your terminal
3. Scan it with Expo Go
4. App loads on your phone!

---

## ✅ What Just Happened?

The script automatically:
1. ✅ Created Python virtual environment
2. ✅ Installed backend dependencies
3. ✅ Started backend API server at http://192.168.1.47:8000
4. ✅ Installed mobile app dependencies
5. ✅ Started Expo development server
6. ✅ Generated QR code for your phone

---

## 📱 Testing the Setup

### Check Backend is Running
Open in browser: **http://192.168.1.47:8000/docs**

You should see interactive API documentation.

### Check Mobile App
- QR code should appear in terminal
- Scan with Expo Go app
- App loads on your phone

---

## 🛑 Stopping the Services

- Press `Ctrl+C` in mobile app terminal
- Close the "Backend" window (Windows) or it stops automatically (Mac/Linux)

---

## 📚 Documentation

- **Detailed Setup:** [QUICK_START.md](QUICK_START.md)
- **Backend Guide:** [START_BACKEND.md](START_BACKEND.md)
- **Mobile App:** [MOBILE_APP_SETUP.md](MOBILE_APP_SETUP.md)
- **Expo Upgrade:** [mobile-app/UPGRADE_SUMMARY.md](mobile-app/UPGRADE_SUMMARY.md)

---

## 🆘 Common Issues

### Issue: "Command not found"
**Solution:** Make sure you're in the `campuspandit` root directory
```bash
cd D:\downloads\campuspandit\campuspandit
```

### Issue: Port 8000 already in use
**Solution:** Kill the process using port 8000
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill
```

### Issue: Mobile app shows connection error
**Solution:**
1. Check backend is running: http://192.168.1.47:8000/docs
2. Ensure phone is on same WiFi
3. Check firewall allows port 8000

### Issue: Metro bundler cache errors
**Solution:**
```bash
cd mobile-app
# Windows
clear-cache.bat
# Mac/Linux
./clear-cache.sh
```

---

## 🎯 What's Next?

1. **Explore the API:** http://192.168.1.47:8000/docs
2. **Test the mobile app** on your phone
3. **Make code changes** - both services auto-reload
4. **Read the documentation** for advanced features

---

## 📦 Project Overview

### Backend (Python FastAPI)
- Location: `backend/`
- Port: 8000
- API Docs: http://192.168.1.47:8000/docs
- Features: Authentication, AI matching, chat, payments

### Mobile App (React Native Expo)
- Location: `mobile-app/`
- SDK: Expo 54
- React Native: 0.76
- Features: Real-time chat, scheduling, payments, AI matching

### Database (Supabase)
- PostgreSQL database
- Real-time subscriptions
- Authentication
- File storage

---

## 🔥 Recent Updates

### Expo 54 Upgrade (October 2024)
- ✅ Upgraded from Expo 49 to 54
- ✅ React Native 0.72 → 0.76
- ✅ New React Native Architecture enabled
- ✅ All dependencies updated
- ✅ Cache cleared and tested

See [mobile-app/UPGRADE_SUMMARY.md](mobile-app/UPGRADE_SUMMARY.md) for details.

---

## 🚀 Ready to Start?

Run the startup script and you're good to go!

```bash
# Windows
start-dev.bat

# Mac/Linux
./start-dev.sh
```

**That's it! Happy coding! 🎉**
