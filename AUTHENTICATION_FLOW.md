# Authentication Flow - Complete Guide

## Overview

The Pet Visit app now has a complete authentication system with smart user routing:
- **New users** → Pet Selection page
- **Existing users** → Home page
- **Multiple auth methods**: Phone OTP + Google Sign-In

## Authentication Flow Diagram

```
Splash (3s)
   ↓
Onboarding (3 slides)
   ↓
Last Slide:
   - "Get Started" button → Continues to...
   - "Already have an account? Login" button → LoginWithOTP
   ↓
LoginWithOTP Page:
   - Phone + OTP authentication
   - OR Google Sign-In button
   ↓
After successful authentication:
   ├─ New User (no profile or no pets) → Pet Selection
   └─ Existing User (has profile + pets) → Home
```

## Pages Restructured

### 1. Onboarding ([pages/Onboarding.tsx](pages/Onboarding.tsx))

**Changes:**
- ✅ Removed Google sign-in button
- ✅ Added "Already have an account? Login" button on last slide
- ✅ Simplified flow - just onboarding slides + login button

**User Journey:**
1. User sees 3 onboarding slides
2. On last slide: "Get Started" (continues) or "Login" (goes to LoginWithOTP)
3. Skip button only shows on first 2 slides

### 2. LoginWithOTP ([pages/LoginWithOTP.tsx](pages/LoginWithOTP.tsx))

**Complete rewrite with:**
- ✅ **Phone OTP Authentication**
  - Name + phone number input
  - OTP verification step
  - Resend OTP functionality
  - Change number option

- ✅ **Google Sign-In**
  - Below phone form with "Or continue with" divider
  - Full Google branding
  - Redirects to Google OAuth

**Features:**
- Two-step process: Phone → OTP
- Real-time validation
- Loading states
- Error handling
- Clean, modern UI

### 3. App.tsx ([App.tsx](App.tsx))

**Smart Routing Logic:**

```typescript
// After authentication succeeds:
if (isNewUser || !hasPets) {
  // New user or no pets → Pet Selection
  setCurrentView('pet-selection');
} else {
  // Existing user with pets → Home
  setCurrentView('home');
}
```

**Features:**
- Auto-creates user profile from Google metadata
- Loads user pets and addresses
- Detects new vs existing users
- Routes accordingly

## User Flows

### Flow 1: New User with Phone OTP

```
1. Onboarding → Click "Get Started" → LoginWithOTP
2. Enter name + phone number → Click "Send OTP"
3. Enter OTP → Click "Verify OTP"
4. ✅ Authenticated → Redirected to Pet Selection (new user)
5. Add pet → Home page
```

### Flow 2: New User with Google

```
1. Onboarding → Click "Already have an account? Login"
2. LoginWithOTP → Click "Sign in with Google"
3. Google OAuth → Authorize
4. ✅ Authenticated → Profile auto-created
5. Redirected to Pet Selection (new user)
6. Add pet → Home page
```

### Flow 3: Existing User Login

```
1. Onboarding → Click "Already have an account? Login"
2. LoginWithOTP → Choose phone OTP or Google
3. Complete authentication
4. ✅ System checks: user has profile + pets
5. Redirected directly to Home page
```

### Flow 4: Existing User (No Pets)

```
1. User logs in (has profile but no pets)
2. ✅ System detects no pets
3. Redirected to Pet Selection
4. User must add at least one pet
5. Then can access Home
```

## Database Requirements

### Before Running the App

**YOU MUST RUN THIS SQL IN SUPABASE:**

Go to: Supabase Dashboard → SQL Editor → New Query

Copy and run: `supabase/migrations/001_initial_schema.sql`

This creates:
- ✅ `users` table
- ✅ `pets` table
- ✅ `addresses` table
- ✅ `bookings` table
- ✅ `products` table
- ✅ `orders` & `order_items` tables
- ✅ `cart_items` table
- ✅ RLS policies for security

### Why This is Required

The error you saw:
```
Could not find the table 'public.users' in the schema cache
```

Means the tables don't exist yet. Running the migration fixes this.

## Authentication Setup

### Phone OTP (Supabase)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Phone** provider
3. Configure SMS provider (Twilio, etc.)
4. For testing: use Supabase test phone numbers

### Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Google** provider
3. Add credentials:
   - **Client ID**: `582168522710-3mht7ttrva6efgamappqtn2cm2pucjoo.apps.googleusercontent.com`
   - **Client Secret**: (Get from Google Cloud Console)
   - **Redirect URI**: `https://kfnsqbgwqltbltngwbdh.supabase.co/auth/v1/callback`
4. Save

## File Structure

```
pages/
├── Onboarding.tsx          # Onboarding slides + login button
├── LoginWithOTP.tsx        # Phone OTP + Google sign-in
├── PetSelection.tsx        # For new users
└── Home.tsx                # For existing users

services/
└── api.ts                  # Auth methods (phone, Google, user profile)

lib/
└── supabase.ts             # Supabase client config

supabase/migrations/
└── 001_initial_schema.sql  # Database tables (RUN THIS FIRST!)

App.tsx                     # Main routing logic
```

## Testing the Flow

### 1. First Time Setup

```bash
# 1. Run database migration in Supabase
# 2. Enable auth providers in Supabase
# 3. Start app
npm run dev
```

### 2. Test New User (Phone)

1. Complete onboarding
2. Click "Already have an account? Login"
3. Enter test phone: `+91XXXXXXXXXX`
4. Enter name
5. Receive OTP (via configured SMS provider)
6. Enter OTP
7. Should redirect to **Pet Selection**
8. Add a pet
9. Should go to **Home**

### 3. Test New User (Google)

1. Complete onboarding
2. Click "Already have an account? Login"
3. Click "Sign in with Google"
4. Complete Google OAuth
5. Should redirect to **Pet Selection**
6. Add a pet
7. Should go to **Home**

### 4. Test Existing User

1. Log in again with same credentials
2. Should skip Pet Selection
3. Should go directly to **Home**

## Troubleshooting

### "404 - Could not find table"
- **Cause**: Migration SQL not run
- **Fix**: Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor

### "Auth provider not enabled"
- **Cause**: Phone or Google provider not configured
- **Fix**: Enable in Supabase Dashboard → Authentication → Providers

### "Invalid OTP"
- **Cause**: SMS provider not configured
- **Fix**: Set up Twilio/MessageBird in Supabase or use test numbers

### User stuck in Pet Selection loop
- **Cause**: User has no pets in database
- **Fix**: User must add at least one pet to proceed

### Google sign-in not working
- **Cause**: Missing client secret or wrong redirect URI
- **Fix**: Double-check Google Cloud Console settings

## Key Features

✅ **Dual Authentication**: Phone OTP + Google OAuth
✅ **Smart Routing**: Auto-detects new vs existing users
✅ **User Profiles**: Auto-created from auth metadata
✅ **Pet Requirement**: New users must add pets
✅ **Session Management**: Persistent login via Supabase
✅ **Security**: Row Level Security (RLS) policies
✅ **Error Handling**: Clear error messages for users

## Next Steps

After successful authentication:
1. Users can manage pets
2. Book appointments
3. Shop for products
4. View orders
5. Manage addresses

All backend operations use Supabase with proper auth checks.
