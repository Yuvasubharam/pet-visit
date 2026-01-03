# HTTPS Setup for OTPless Testing

OTPless requires HTTPS to function properly. Here are several methods to test your integration:

## Method 1: Using ngrok (Recommended for Local Testing)

### Step 1: Install ngrok
Download from: https://ngrok.com/download

Or using package managers:
```bash
# Windows (using Chocolatey)
choco install ngrok

# macOS (using Homebrew)
brew install ngrok

# Linux (using snap)
snap install ngrok
```

### Step 2: Start Your Dev Server
```bash
npm run dev
```
Note the port (e.g., 3001)

### Step 3: Create HTTPS Tunnel
```bash
ngrok http 3001
```

### Step 4: Use the HTTPS URL
ngrok will provide URLs like:
- `https://abc123.ngrok.io` ← Use this URL to access your app

### Step 5: Configure OTPless Dashboard
1. Go to https://otpless.com/dashboard
2. Navigate to Settings → Redirect URLs
3. Add your ngrok URL: `https://abc123.ngrok.io`

## Method 2: Using Cloudflare Tunnel

### Step 1: Install Cloudflare Tunnel
```bash
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### Step 2: Start Tunnel
```bash
cloudflared tunnel --url http://localhost:3001
```

### Step 3: Use the Provided HTTPS URL
Cloudflare will provide a URL like `https://random-name.trycloudflare.com`

## Method 3: Using localhost.run

### No Installation Required
```bash
# Start your dev server first
npm run dev

# In another terminal, run:
ssh -R 80:localhost:3001 localhost.run
```

This will provide an HTTPS URL you can use.

## Method 4: Deploy to Vercel (For Testing/Production)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Deploy
```bash
vercel
```

### Step 3: Use the Provided HTTPS URL
Vercel will provide a production HTTPS URL automatically.

## Checking HTTPS Status

### In Browser Console
Open your browser's developer console (F12) and check for:
- ✅ Green padlock in address bar
- ✅ URL starts with `https://`
- ❌ Any mixed content warnings
- ❌ Certificate errors

### OTPless Widget Debug
If the widget still doesn't load:

1. Check browser console for errors
2. Verify the script is loaded:
```javascript
console.log(document.getElementById('otpless-sdk'));
```

3. Check if the div exists:
```javascript
console.log(document.getElementById('otpless-login-page'));
```

4. Verify callback is defined:
```javascript
console.log(typeof window.otpless);
```

## Common Issues

### Issue: Widget Stuck on Loading

**Causes:**
- Not using HTTPS
- App ID is incorrect
- Network/firewall blocking OTPless CDN
- Ad blockers interfering

**Solutions:**
1. Ensure you're using HTTPS (see methods above)
2. Verify App ID in `index.html` matches your dashboard
3. Try disabling ad blockers
4. Check browser console for errors

### Issue: CORS Errors

**Solution:**
Configure allowed origins in OTPless dashboard:
1. Dashboard → Settings → CORS Origins
2. Add your ngrok/testing URL

### Issue: Callback Not Firing

**Solution:**
1. Ensure `window.otpless` is defined before widget loads
2. Check console for authentication errors
3. Verify user completed authentication flow

## Testing Checklist

- [ ] Application is running on HTTPS
- [ ] OTPless SDK script loads without errors
- [ ] `div#otpless-login-page` exists in DOM
- [ ] Widget appears after loading spinner
- [ ] Can select authentication method
- [ ] Callback fires on successful auth
- [ ] User data is stored in localStorage
- [ ] Redirects to home page after auth

## Production Deployment

For production, ensure:

1. **Domain SSL Certificate**: Use Let's Encrypt, Cloudflare, or your hosting provider
2. **Update OTPless Dashboard**: Add production domain to allowed URLs
3. **Environment Variables**: Keep credentials secure
4. **Test All Auth Methods**: SMS, WhatsApp, Email, Social logins

## Support

If issues persist:
- OTPless Docs: https://otpless.com/docs
- OTPless Support: support@otpless.com
- Check browser console for specific error messages
