# Fix 401 Unauthorized Error

## The Problem
Your Edge Function is returning **401 Unauthorized** because it requires authentication by default.

## Solution: Disable JWT Verification

You need to configure the Edge Function to allow **anonymous access** (no authentication required).

### Option 1: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/kfnsqbgwqltbltngwbdh/functions
2. Click on your `generate-agora-token` function
3. Look for **Settings** or **Configuration**
4. Find **"Verify JWT"** toggle
5. **DISABLE** JWT verification (turn it OFF)
6. Save changes

### Option 2: Get Correct Anon Key

Your current anon key might be wrong. Get the correct one:

1. Go to: https://supabase.com/dashboard/project/kfnsqbgwqltbltngwbdh/settings/api
2. Look for **Project API keys**
3. Copy the **`anon`** **`public`** key (not the service_role key!)
4. Update your `.env` file:

```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The key should start with `eyJ` (it's a JWT token), not `sb_publishable_`.

### Option 3: Make Function Truly Public

If you want the function to work without ANY authentication, you can deploy it with the `--no-verify-jwt` flag:

```bash
supabase functions deploy generate-agora-token --no-verify-jwt
```

But since you're using the dashboard, use **Option 1** or **Option 2**.

## Recommended: Option 2 (Get Correct Anon Key)

This is the most secure approach. The token generation endpoint will still be protected by Supabase's anon key, but it will work properly.

**After you update the anon key:**
1. Restart your dev server (`npm run dev` or refresh)
2. Try joining the call again
3. Should work! ✅
