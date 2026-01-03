# 🚀 Deploy Agora Token Server (Production)

## Overview

This guide will help you deploy the Agora token generation Edge Function to Supabase for **production-ready** video calls with proper security.

---

## 📋 Prerequisites

1. ✅ Supabase CLI installed
2. ✅ Supabase project created
3. ✅ Agora App ID and Certificate

---

## 🔧 Step 1: Install Supabase CLI

If you haven't already:

### Windows:
```powershell
npm install -g supabase
```

### macOS/Linux:
```bash
brew install supabase/tap/supabase
```

---

## 🔐 Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

---

## 📤 Step 3: Link Your Project

```bash
cd "c:\Users\dimpl\Downloads\pet-visit (1)"
supabase link --project-ref kfnsqbgwqltbltngwbdh
```

When prompted, enter your database password.

---

## 🚀 Step 4: Deploy the Edge Function

```bash
supabase functions deploy generate-agora-token
```

This will:
- ✅ Package your function
- ✅ Upload to Supabase
- ✅ Deploy as an Edge Function
- ✅ Return the function URL

---

## ✅ Step 5: Test the Deployment

After deployment, test the function:

```bash
curl -X POST \
  https://kfnsqbgwqltbltngwbdh.supabase.co/functions/v1/generate-agora-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"channelName":"test-channel","uid":12345,"role":"publisher"}'
```

**Expected Response:**
```json
{
  "token": "006...long token string...",
  "appId": "4644112ab7454526badea7d34c7a1d59",
  "channelName": "test-channel",
  "uid": 12345,
  "expiresIn": 3600
}
```

---

## 🧪 Step 6: Test in Your App

1. Make sure your `.env` file has:
   ```
   VITE_SUPABASE_URL=https://kfnsqbgwqltbltngwbdh.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_zqFshtXMaaQ3r8U7oL_uCw_YYOKq0HI
   VITE_AGORA_APP_ID=4644112ab7454526badea7d34c7a1d59
   ```

2. Refresh your app

3. Click "Join Call"

4. ✅ Should generate token and connect!

---

## 📊 What Happens Now

### Previous Flow (Testing Mode - Insecure):
```
App → Agora (no token) → ❌ Rejected
```

### New Flow (Production - Secure):
```
App → Supabase Edge Function
      ↓
Edge Function generates token with certificate
      ↓
App → Agora (with token) → ✅ Connected!
```

---

## 🔍 Monitoring & Debugging

### View Function Logs:
```bash
supabase functions logs generate-agora-token
```

### Check Function Status:
```bash
supabase functions list
```

### Redeploy After Changes:
```bash
supabase functions deploy generate-agora-token
```

---

## ⚠️ Security Notes

### ✅ What's Secure:
- Token generation happens on server (Edge Function)
- App Certificate is never exposed to client
- Tokens expire after 1 hour
- Each user gets a unique token
- CORS is properly configured

### ❌ What to Avoid:
- Never put App Certificate in client code
- Never hardcode tokens
- Never share tokens between users
- Never disable token expiration

---

## 🔧 Troubleshooting

### Error: "Supabase CLI not found"
Install Supabase CLI:
```bash
npm install -g supabase
```

### Error: "Failed to link project"
Make sure you're using the correct project ref:
```bash
supabase link --project-ref kfnsqbgwqltbltngwbdh
```

### Error: "Function deployment failed"
Check your function syntax:
```bash
cd supabase/functions/generate-agora-token
cat index.ts
```

### Error: "Token generation failed: 404"
Function not deployed yet. Run:
```bash
supabase functions deploy generate-agora-token
```

### Error: "CORS error"
CORS headers are already configured in the function. Make sure you deployed the latest version.

---

## 📝 Alternative: Deploy Without Supabase CLI

If you can't install Supabase CLI, you can:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. Click on your project: `kfnsqbgwqltbltngwbdh`
3. Go to **Edge Functions** in sidebar
4. Click **"Create Function"**
5. Name: `generate-agora-token`
6. Copy-paste the code from `supabase/functions/generate-agora-token/index.ts`
7. Click **"Deploy"**

---

## 🎯 Verification Checklist

After deployment:

- [ ] Function shows as "Active" in Supabase Dashboard
- [ ] Test curl command returns valid token
- [ ] App connects to Agora without errors
- [ ] No "CAN_NOT_GET_GATEWAY_SERVER" error
- [ ] Video call works between doctor and patient
- [ ] Browser console shows "[Agora] Token generated successfully"
- [ ] Browser console shows "[Agora] Joined channel successfully"

---

## 🎉 Success!

Once deployed, your video call system will:

✅ Generate tokens securely on the server
✅ Use production-level authentication
✅ Support unlimited concurrent calls
✅ Scale automatically with Supabase Edge Functions
✅ Be production-ready!

---

## 📚 Additional Resources

- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Agora Token Authentication**: https://docs.agora.io/en/video-calling/develop/authentication-workflow
- **Agora Token Builder**: https://www.npmjs.com/package/agora-token

---

## 🔄 Next Steps

1. Deploy the Edge Function
2. Test token generation
3. Test video calls
4. Monitor function logs
5. Deploy to production! 🚀
