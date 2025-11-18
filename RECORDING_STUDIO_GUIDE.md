# Recording Studio - Udemy-Style Video Recording ✅

## Overview

The Recording Studio feature allows tutors and instructors to **record videos directly in their browser**, just like Udemy! No need for external recording software or complicated setups.

---

## Features

### Recording Modes

1. **Webcam Recording** 📹
   - Record yourself teaching face-to-camera
   - Perfect for lectures and introductions
   - High-quality 720p video

2. **Screen Recording** 🖥️
   - Record your screen for tutorials
   - Capture presentations, coding, demonstrations
   - Perfect for technical content

3. **Picture-in-Picture** 🎬
   - Record screen + webcam simultaneously
   - Professional look with instructor visible
   - Best for comprehensive teaching

### Recording Controls

- ▶️ **Start** - Begin recording
- ⏸️ **Pause** - Temporarily pause recording
- ⏹️ **Stop** - End recording and preview
- 🗑️ **Discard** - Delete and start over
- ✅ **Use Recording** - Proceed to upload

### Features

✅ **Browser-Based** - No software installation needed
✅ **High Quality** - Up to 1080p screen, 720p webcam
✅ **Real-time Preview** - See what you're recording
✅ **Recording Timer** - Track recording duration
✅ **Pause/Resume** - Take breaks without restarting
✅ **Instant Playback** - Review before uploading
✅ **Seamless Upload** - Automatic integration with video library

---

## How to Use

### Step 1: Access Recording Studio

1. Navigate to `/library` (Video Library)
2. Click **"Record Session"** button (red button in header)
3. You'll be taken to the Recording Studio

### Step 2: Choose Recording Mode

**Webcam Mode:**
- Click the "Webcam" card
- Browser will ask for camera/microphone permission
- Allow access to continue
- You'll see yourself in the preview

**Screen Mode:**
- Click the "Screen" card
- Browser will ask which screen/window to share
- Select the screen/window you want to record
- Browser will also ask for microphone access

**Screen + Webcam Mode:**
- Click the "Screen + Webcam" card
- Browser will ask for both screen and camera access
- Grant both permissions
- Professional picture-in-picture recording

### Step 3: Test Your Setup

Before starting:
- ✅ Check your video preview
- ✅ Test your microphone
- ✅ Close unnecessary applications
- ✅ Ensure good lighting (for webcam)
- ✅ Prepare your content

### Step 4: Start Recording

1. Click **"Start Recording"** (red button)
2. Recording indicator appears (red dot + timer)
3. Teach your lesson!

**During Recording:**
- Click **"Pause"** to take a break
- Click **"Resume"** to continue
- Click **"Stop"** when finished

### Step 5: Review & Upload

After stopping:
1. Video player appears with your recording
2. Watch to make sure it's good
3. Choose:
   - **"Discard"** - Delete and record again
   - **"Use This Recording"** - Proceed to upload

### Step 6: Add Details

You'll be taken to the upload form:
1. Video preview will show your recording
2. Fill in:
   - Title (required)
   - Description
   - Subject (required)
   - Grade Level
   - Board (CBSE, ICSE, etc.)
   - Topics
   - Visibility settings
3. Click **"Upload Session"**

### Step 7: Done!

Your session is now uploaded and available in the video library!

---

## Technical Details

### Browser Compatibility

**Fully Supported:**
- ✅ Chrome 60+
- ✅ Edge 79+
- ✅ Firefox 55+
- ✅ Safari 14.1+

**Required APIs:**
- MediaRecorder API
- getUserMedia API (webcam)
- getDisplayMedia API (screen)

### Video Format

- **Format:** WebM (VP9 codec)
- **Webcam Quality:** 1280x720 (720p)
- **Screen Quality:** 1920x1080 (1080p)
- **Audio:** AAC/Opus codec
- **Frame Rate:** 30 fps

### File Size

Approximate file sizes:
- 1 minute webcam: ~5-10 MB
- 1 minute screen: ~10-20 MB
- 10 minute lecture: ~100-200 MB
- 1 hour tutorial: ~600MB - 1.2GB

### Upload Methods

1. **Cloudflare Stream** (Recommended)
   - High-quality streaming
   - Global CDN delivery
   - Automatic transcoding
   - Requires API credentials

2. **Backend Upload** (Fallback)
   - Upload to your server
   - Server uploads to cloud storage
   - Works without Cloudflare

---

## Cloudflare Stream Setup

To enable Cloudflare Stream uploads:

### 1. Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Create account
3. Navigate to Stream

### 2. Get API Credentials

1. In Cloudflare dashboard, go to Stream
2. Get your **Account ID**
3. Create an **API Token** with Stream permissions

### 3. Configure Environment

Add to `.env`:

```env
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id_here
VITE_CLOUDFLARE_API_TOKEN=your_api_token_here
```

### 4. Restart Application

```bash
npm run dev
```

Now recordings will upload to Cloudflare Stream automatically!

---

## Keyboard Shortcuts

- **Space** - Start/Stop recording (when focused)
- **P** - Pause/Resume (when focused)
- **Esc** - Cancel/Discard

---

## Tips for Great Recordings

### Before Recording

1. **Prepare Content**
   - Have notes ready
   - Practice your explanation
   - Know what you'll show

2. **Setup Environment**
   - Good lighting for webcam
   - Close unnecessary tabs/apps
   - Turn off notifications
   - Quiet environment

3. **Test Everything**
   - Check audio levels
   - Verify video quality
   - Test screen sharing

### During Recording

1. **Speak Clearly**
   - Project your voice
   - Speak at moderate pace
   - Pause between sections

2. **Use Pauses**
   - Pause feature is your friend
   - Take breaks when needed
   - Gather thoughts before continuing

3. **Engage Students**
   - Look at camera (webcam mode)
   - Use examples
   - Ask rhetorical questions

### After Recording

1. **Review Carefully**
   - Watch entire recording
   - Check audio quality
   - Verify screen content is visible

2. **Add Good Metadata**
   - Descriptive title
   - Clear description
   - Relevant topics
   - Accurate grade level

---

## Troubleshooting

### Camera/Microphone Not Working

**Problem:** "Permission denied" error

**Solution:**
1. Check browser permissions
2. Go to browser settings
3. Allow camera/microphone for your site
4. Refresh page

**Chrome:**
- Settings → Privacy & Security → Site Settings → Camera/Microphone

**Firefox:**
- Settings → Privacy & Security → Permissions

### Screen Sharing Not Working

**Problem:** Can't select screen

**Solution:**
1. Grant screen recording permission (Mac)
2. Allow screen sharing in browser
3. Try selecting "Entire Screen" instead of window

### Recording Stops Unexpectedly

**Possible Causes:**
- Browser tab minimized (some browsers)
- Computer went to sleep
- Low storage space

**Solutions:**
- Keep tab visible during recording
- Adjust power settings
- Free up disk space

### Video Quality Poor

**Webcam Quality:**
- Check camera settings
- Improve lighting
- Clean camera lens

**Screen Quality:**
- Record at higher resolution
- Reduce window clutter
- Use clear fonts/colors

### File Too Large

**Solutions:**
1. Record shorter segments
2. Use screen mode instead of both
3. Compress video after recording
4. Upload to Cloudflare (automatic optimization)

---

## Comparison with Udemy

| Feature | CampusPandit | Udemy |
|---------|-------------|-------|
| Browser Recording | ✅ Yes | ✅ Yes |
| Webcam | ✅ Yes | ✅ Yes |
| Screen Recording | ✅ Yes | ✅ Yes |
| Picture-in-Picture | ✅ Yes | ✅ Yes |
| Pause/Resume | ✅ Yes | ✅ Yes |
| Instant Preview | ✅ Yes | ✅ Yes |
| No Software Needed | ✅ Yes | ✅ Yes |
| Quality Options | 720p/1080p | 720p/1080p |

---

## Use Cases

### 1. Lecture Recording
- **Mode:** Webcam
- **Best For:** Traditional teaching, theory
- **Duration:** 10-30 minutes

### 2. Tutorial/Demo
- **Mode:** Screen
- **Best For:** Software, coding, step-by-step guides
- **Duration:** 5-60 minutes

### 3. Professional Course
- **Mode:** Screen + Webcam
- **Best For:** Comprehensive courses, paid content
- **Duration:** Any length

### 4. Quick Tips
- **Mode:** Webcam
- **Best For:** Short tips, announcements
- **Duration:** 1-5 minutes

---

## Routes

- `/library` - Video Library (entry point)
- `/library/record` - Recording Studio
- `/library/upload` - Upload page (auto-redirected from studio)
- `/library/:sessionId` - Watch uploaded session

---

## Backend Integration

The Recording Studio automatically integrates with the existing video library backend:

### API Flow

1. **Record video** → Browser MediaRecorder
2. **Stop recording** → Generate Blob
3. **Click "Use Recording"** → Navigate to upload
4. **Upload form** → Upload video (Cloudflare or backend)
5. **Submit** → POST `/api/v1/library/sessions`
6. **Success** → View at `/library/:sessionId`

### No Backend Changes Needed

The recording studio works with the existing video library API!

---

## Future Enhancements

Planned features:
- [ ] Video editing (trim, cut)
- [ ] Add captions during recording
- [ ] Virtual backgrounds
- [ ] Drawing tools (annotations)
- [ ] Multiple camera angles
- [ ] Teleprompter
- [ ] Auto-transcription
- [ ] Cloud backup while recording

---

## Support

### Browser Permissions

If having issues with permissions:
1. Check browser console for errors
2. Verify HTTPS connection (required for camera/mic)
3. Try different browser
4. Check OS permissions (Mac System Preferences)

### Best Browsers

Recommended order:
1. **Chrome** - Best compatibility
2. **Edge** - Excellent support
3. **Firefox** - Good support
4. **Safari** - Works but may have limitations

---

## Summary

The Recording Studio provides a **professional, Udemy-like recording experience** right in your browser:

✅ **3 Recording Modes** - Webcam, Screen, or Both
✅ **Easy Controls** - Start, Pause, Stop, Review
✅ **High Quality** - Up to 1080p recording
✅ **Seamless Integration** - Auto-connects to video library
✅ **No Software** - Works entirely in browser
✅ **Professional Results** - Create polished teaching videos

**Ready to record?** Click "Record Session" in the Video Library! 🎬
