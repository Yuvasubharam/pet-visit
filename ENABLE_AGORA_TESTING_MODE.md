# 🔧 Enable Agora Testing Mode (Required!)

## The Problem

You're seeing this error:
```
AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: dynamic use static key
```

**What this means**: Your Agora project requires token authentication, but we're not providing a token (test mode).

---

## ✅ The Solution: Enable Testing Mode in Agora Console

Testing mode allows you to join calls **without tokens** - perfect for development and testing!

---

## 🚀 Step-by-Step Instructions

### Step 1: Go to Agora Console
1. Visit: https://console.agora.io/
2. Login with your Agora account

### Step 2: Select Your Project
1. You should see your project dashboard
2. Find your project with App ID: `4644112ab7454526badea7d34c7a1d59`
3. Click on the project name

### Step 3: Enable Testing Mode
1. In the left sidebar, click **"Config"** or **"Project Management"**
2. Look for **"Primary Certificate"** or **"App Certificate"** section
3. Find the toggle or option that says:
   - **"Enable App Certificate"** or
   - **"Primary Certificate: Enabled"**
4. **IMPORTANT**: You need to **DISABLE** the App Certificate for testing mode

**Option A: If App Certificate is Enabled**
- Click the toggle to **DISABLE** it
- Confirm the action
- ✅ Testing mode is now enabled!

**Option B: If you see "Testing Mode"**
- Click on **"Enable Testing Mode"** button
- ✅ Done!

### Step 4: Save Changes
- Click **"Save"** if there's a save button
- Wait for confirmation

---

## 🧪 Test After Enabling

1. **Refresh your app** in the browser
2. Click **"Join Call"** again
3. Grant camera/microphone permissions
4. ✅ Should connect successfully!

---

## 📸 Visual Guide

Look for these sections in Agora Console:

```
┌─────────────────────────────────────────────┐
│  Project: Your Project Name                 │
│  App ID: 4644112ab7454526badea7d34c7a1d59  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ Primary Certificate                   │  │
│  │                                        │  │
│  │ ○ Enabled  (❌ Turn this OFF)        │  │
│  │ ● Disabled (✅ Should be this)       │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  OR                                          │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ Testing Mode                          │  │
│  │                                        │  │
│  │ [Enable Testing Mode] (✅ Click this) │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### For Development/Testing:
- ✅ **Testing mode is perfect**
- ✅ No token server needed
- ✅ Quick to set up
- ⚠️ **Less secure** (anyone with your App ID can join)

### For Production:
- 🔒 You'll need to implement token authentication
- 🔒 More secure (only authorized users can join)
- 🔒 Requires backend token server

---

## 🎯 Alternative: Implement Token Server (Production)

If you can't enable testing mode or want production-ready security:

### Option 1: Quick Backend Implementation

Create a simple Express server:

```javascript
// server.js
const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
const APP_ID = '4644112ab7454526badea7d34c7a1d59';
const APP_CERTIFICATE = 'your-app-certificate-from-agora'; // Get from Agora Console

app.get('/token', (req, res) => {
  const { channel, uid, role } = req.query;

  const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTime + expirationTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channel,
    uid || 0,
    role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
    privilegeExpiredTs
  );

  res.json({ token });
});

app.listen(3001, () => console.log('Token server running on port 3001'));
```

Then update `agoraService.ts`:

```typescript
async generateToken(channelName: string, uid: string, role: 'publisher' | 'subscriber' = 'publisher'): Promise<string> {
  try {
    const response = await fetch(`http://localhost:3001/token?channel=${channelName}&uid=${uid}&role=${role}`);
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error generating token:', error);
    return '';
  }
}
```

---

## 🔍 Troubleshooting

### Still getting "CAN_NOT_GET_GATEWAY_SERVER"?
1. **Clear browser cache** and refresh
2. **Check Agora Console** - make sure testing mode is ON
3. **Wait 1-2 minutes** after enabling testing mode
4. **Try different browser** (Chrome/Edge recommended)

### Getting "INVALID_OPERATION: Client already in connecting/connected state"?
1. This happens when you navigate back and forth
2. **Solution**: Refresh the page completely
3. OR: Add proper cleanup in component unmount

### Camera/Microphone not working?
1. **Grant permissions** when browser asks
2. Check **browser permissions** settings
3. Make sure camera is **not in use** by another app
4. Try **HTTPS** (required on mobile)

---

## ✅ Success Checklist

After enabling testing mode:

- [ ] Agora Console shows "Testing Mode: Enabled" OR "App Certificate: Disabled"
- [ ] Refreshed the app in browser
- [ ] Clicked "Join Call" button
- [ ] Granted camera/microphone permissions
- [ ] No "CAN_NOT_GET_GATEWAY_SERVER" error
- [ ] Video call connects successfully
- [ ] Can see local video
- [ ] Remote user can join and both see each other

---

## 📚 Related Documentation

- **Agora Testing Mode**: https://docs.agora.io/en/video-calling/get-started/authentication-workflow#test-mode
- **Token Authentication**: https://docs.agora.io/en/video-calling/get-started/authentication-workflow#token-authentication
- **Build Token**: https://docs.agora.io/en/video-calling/develop/authentication-workflow

---

## 🎉 Once Testing Mode is Enabled

Your video calls will work perfectly! Here's what happens:

1. ✅ Doctor clicks "Join Call"
2. ✅ Agora connects without token (testing mode)
3. ✅ Local camera/mic activated
4. ✅ Customer clicks "Join Consultation"
5. ✅ Both connect to same channel
6. ✅ Video streaming works!

---

**Remember**: Testing mode is for **development only**. For production, implement proper token authentication!

**Questions?** Check the Agora docs or reach out for help!
