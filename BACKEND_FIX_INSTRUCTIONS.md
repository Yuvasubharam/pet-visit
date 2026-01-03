# Complete Fix for Grooming Store Registration Error

## The Problem

You're getting this error:
```
Error: insert or update on table "grooming_stores" violates foreign key constraint "grooming_stores_user_id_fkey"
Details: Key is not present in table "users"
```

This happens because:
1. The foreign key constraint is pointing to `public.users` instead of `auth.users`
2. RLS policies are blocking the insert when email confirmation is enabled

## The Solution

### Step 1: Run the SQL Fix

Open your **Supabase SQL Editor** and run this file:
📄 **FINAL_COMPLETE_FIX.sql**

This will:
- ✅ Fix the foreign key to point to `auth.users`
- ✅ Update RLS policies to allow signup even when email confirmation is required
- ✅ Verify the setup is correct

### Step 2: Test the Registration

After running the SQL:
1. Go to your Grooming Store registration page
2. Try registering with a new email
3. It should now work!

## What Changed

### Before:
- FK pointed to wrong table (`public.users`)
- RLS policy was too restrictive for signups with email confirmation

### After:
- FK correctly points to `auth.users`
- RLS policy allows inserts during signup process
- Store owners can still only update/delete their own stores

## Verification

After running the SQL, you should see output like:
```
status: "Setup Complete!"
fk_references: "auth.users"
rls_status: "RLS Enabled: true"
policy_count: "Policy Count: 5"
```

## If It Still Doesn't Work

Check your Supabase settings:
1. Go to **Authentication** → **Settings**
2. Check if "Enable email confirmations" is ON
3. If it is, the fix above handles it
4. If issues persist, check the browser console for new error messages

## Clean Up Orphaned Accounts

If you created test accounts that failed (like `yuvasubharam@gmail.com`), you can clean them up:

```sql
-- Find orphaned auth users (users without grooming store profiles)
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.grooming_stores gs ON au.id = gs.user_id
WHERE gs.id IS NULL
AND au.raw_user_meta_data->>'user_type' = 'grooming_store';

-- Delete them if needed (be careful!)
-- DELETE FROM auth.users WHERE id = 'user-id-here';
```
