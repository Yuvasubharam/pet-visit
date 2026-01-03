# Quick Start Guide - IMPORTANT

## ⚠️ Before Running the App

You're getting a 404 error because the database tables don't exist yet. Follow these steps:

### Step 1: Create Database Tables

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
6. Paste it into the SQL editor
7. Click **Run** or press Ctrl+Enter

This will create all the necessary tables (users, pets, addresses, etc.) with proper security policies.

### Step 2: Enable Google Authentication (Optional)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Client ID: `582168522710-3mht7ttrva6efgamappqtn2cm2pucjoo.apps.googleusercontent.com`
4. Get Client Secret from Google Cloud Console
5. Add redirect URI: `https://kfnsqbgwqltbltngwbdh.supabase.co/auth/v1/callback`
6. Save

### Step 3: Enable Phone Authentication (Optional)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Phone** provider
3. Configure your SMS provider (Twilio, etc.)
4. For testing, you can use Supabase's test phone numbers

### Step 4: Start the App

```bash
npm run dev
```

## Authentication Flow

1. **Onboarding** → Shows onboarding slides → "Login" button
2. **LoginWithOTP** → Choose phone OTP or Google sign-in
3. **First time users** → Go to Pet Selection
4. **Existing users** → Go to Home

## Troubleshooting

- **404 errors**: Run the migration SQL (Step 1)
- **Auth not working**: Enable providers in Supabase (Steps 2 & 3)
- **User profile not created**: Check RLS policies in migration SQL

## Files Changed

- `pages/Onboarding.tsx` - Now shows "Login" button instead of Google auth
- `pages/LoginWithOTP.tsx` - Complete rewrite with phone OTP + Google auth
- `App.tsx` - Smart routing for new vs existing users
- `services/api.ts` - Auth methods for phone and Google

## Next Steps

After successful setup, test the flow:
1. Complete onboarding
2. Click "Login"
3. Choose phone OTP or Google
4. New users → add pet
5. Existing users → go to home
