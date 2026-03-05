# Google Authentication Setup Guide

This guide explains how to configure Google OAuth authentication for the Furora Care application.

## Overview

The app now supports Google Sign-In alongside phone OTP authentication. Users can sign in with their Google account from:
- Onboarding page (last slide)
- Login page
- LoginWithOTP page

## Configuration

### 1. Environment Variables

Already configured in `.env`:

```env
VITE_GOOGLE_CLIENT_ID=582168522710-3mht7ttrva6efgamappqtn2cm2pucjoo.apps.googleusercontent.com
```

### 2. Supabase Dashboard Setup

You need to enable Google authentication in your Supabase dashboard:

#### Step 1: Go to Authentication Settings

1. Open your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Providers**

#### Step 2: Enable Google Provider

1. Find **Google** in the provider list
2. Toggle it to **Enabled**
3. Configure the following settings:

**Client ID:**
```
582168522710-3mht7ttrva6efgamappqtn2cm2pucjoo.apps.googleusercontent.com
```

**Client Secret:**
You'll need to get this from Google Cloud Console (see below)

**Authorized Redirect URIs:**
```
https://kfnsqbgwqltbltngwbdh.supabase.co/auth/v1/callback
```

#### Step 3: Save Configuration

Click **Save** to apply the changes.

## Google Cloud Console Setup

If you need to configure the OAuth consent screen or get the client secret:

### 1. Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in the required information:
   - App name: Furora Care
   - User support email: your email
   - Developer contact email: your email
4. Add scopes (optional, default scopes work for basic auth):
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

### 3. Create OAuth Credentials (If Needed)

If you need to create new credentials:

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Web application**
4. Configure:
   - Name: Furora Care Web App
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     https://kfnsqbgwqltbltngwbdh.supabase.co/auth/v1/callback
     ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### 4. Update Supabase with Client Secret

Go back to Supabase Dashboard → Authentication → Providers → Google and paste the Client Secret.

## How It Works

### Authentication Flow

1. **User clicks "Sign in with Google"**
   - The app calls `authService.signInWithGoogle()`
   - Supabase redirects to Google's OAuth page

2. **User authorizes the app**
   - Google redirects back to Supabase callback URL
   - Supabase creates/updates the user session

3. **App detects authentication**
   - `App.tsx` listens for auth state changes
   - When session is detected, `loadUserData()` is called

4. **User profile creation**
   - If user profile doesn't exist, it's created automatically
   - User's name and email are extracted from Google metadata
   - User is redirected to the home page

### Code Implementation

#### Auth Service ([services/api.ts](services/api.ts:6-20))

```typescript
async signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}
```

#### User Profile Auto-Creation ([App.tsx](App.tsx:85-103))

When a Google user signs in for the first time:

```typescript
// Profile doesn't exist, create it from Google auth data
if (currentUser) {
  const userName = currentUser.user_metadata?.full_name ||
                   currentUser.user_metadata?.name ||
                   currentUser.email?.split('@')[0] ||
                   'User';

  profile = await authService.createOrUpdateUserProfile(uid, {
    name: userName,
    email: currentUser.email,
    phone: currentUser.phone || '',
  });
}
```

## UI Components

### Google Sign-In Button

The Google sign-in button appears on three pages:

1. **Onboarding** ([pages/Onboarding.tsx](pages/Onboarding.tsx:124-141))
   - Shows on the last onboarding slide
   - Labeled "Continue with Google"

2. **Login** ([pages/Login.tsx](pages/Login.tsx:169-187))
   - Below the phone OTP form
   - Labeled "Sign in with Google"

3. **LoginWithOTP** ([pages/LoginWithOTP.tsx](pages/LoginWithOTP.tsx:147-158))
   - Below the OTPless widget
   - Labeled "Sign in with Google"

## Testing

### Local Testing

For local development:

1. Add `http://localhost:3000` to authorized origins in Google Cloud Console
2. Start your dev server: `npm run dev`
3. Navigate to the onboarding or login page
4. Click "Sign in with Google"
5. Complete the Google authentication flow

### Production Testing

1. Deploy your app to a production URL
2. Add the production URL to authorized origins in Google Cloud Console
3. Update the redirect URI if needed
4. Test the complete authentication flow

## User Data Handling

### What Data is Stored

When a user signs in with Google, the following data is stored in the `users` table:

- `id`: Supabase Auth user ID (UUID)
- `name`: User's full name from Google
- `email`: User's email from Google
- `phone`: Empty string (can be updated later)
- `created_at`: Timestamp of account creation

### Accessing User Data

```typescript
// Get current authenticated user
const user = await authService.getCurrentUser();

// Get user profile from database
const profile = await authService.getUserProfile(user.id);
```

## Troubleshooting

### "Error 400: redirect_uri_mismatch"

**Problem:** The redirect URI in Google Cloud Console doesn't match Supabase's callback URL.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add the exact redirect URI: `https://kfnsqbgwqltbltngwbdh.supabase.co/auth/v1/callback`

### "Google sign-in button not working"

**Problem:** Google provider not enabled in Supabase.

**Solution:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Enter Client ID and Client Secret
4. Save changes

### "User profile not created"

**Problem:** User signs in but has no profile data.

**Solution:**
1. Check browser console for errors
2. Verify the `users` table exists in Supabase
3. Ensure RLS policies allow INSERT on users table
4. Check that the user ID matches between auth.users and public.users

### "Popup blocked"

**Problem:** Browser blocks Google OAuth popup.

**Solution:**
- Allow popups for your domain in browser settings
- Alternatively, use redirect flow instead of popup (already configured)

## Security Considerations

### Client ID vs Client Secret

- **Client ID**: Public, safe to expose in frontend code
- **Client Secret**: Private, stored only in Supabase backend

### Redirect URI

- Always use HTTPS in production
- Only add trusted domains to authorized origins
- The redirect URI points to Supabase, not your app directly

### User Data

- User emails are verified by Google
- Profile data is stored securely in Supabase
- RLS policies ensure users can only access their own data

## Next Steps

1. **Customize OAuth consent screen** with your app logo and branding
2. **Add additional scopes** if you need more user data
3. **Implement account linking** to connect Google and phone auth
4. **Add social login analytics** to track authentication methods
5. **Configure session management** for better UX

## Support

For issues with:
- Google OAuth setup: [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- Supabase integration: [Supabase Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- Application code: Check the `services/api.ts` file for auth methods
