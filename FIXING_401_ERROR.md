# Fixing Supabase 401 Authentication Error

## Problem
You're seeing this error in the console:
```
kfnsqbgwqltbltngwbdh.supabase.co/rest/v1/users:1
Failed to load resource: the server responded with a status of 401 ()
```

This means Supabase is rejecting your API requests due to authentication/authorization issues.

---

## Solution: Follow These Steps

### **Step 1: Update Your Supabase Anon Key**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `kfnsqbgwqltbltngwbdh`
3. Navigate to **Settings** → **API**
4. Find the **Project API keys** section
5. Copy the **`anon` `public`** key (NOT the service_role key)
   - It should be very long (200+ characters)
   - It should start with `eyJ...`
6. Update your `.env` file:

```env
VITE_SUPABASE_URL=https://kfnsqbgwqltbltngwbdh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_FULL_KEY_HERE...
```

**Current Key Issue:**
Your current key `sb_publishable_zqFshtXMaaQ3r8U7oL_uCw_YYOKq0HI` is too short and appears to be truncated.

### **Step 2: Set Up Row Level Security (RLS) Policies**

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the entire contents of `SUPABASE_RLS_POLICIES.sql`
5. Click **Run** to execute the SQL

This will:
- Enable RLS on all tables
- Allow authenticated users to access their own data
- Allow public read access to products, doctors, etc.
- Prevent users from accessing other users' data

### **Step 3: Restart Your Development Server**

After updating the `.env` file:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### **Step 4: Clear Browser Cache**

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

Or:
- Open Application/Storage tab
- Clear all site data
- Refresh the page

---

## Quick Fix (Alternative)

If you don't want to set up RLS policies right now, you can temporarily disable RLS:

⚠️ **WARNING: This is NOT recommended for production!**

```sql
-- In Supabase SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
```

**This will allow anyone with your anon key to read/write all data - use only for testing!**

---

## Verify It's Working

1. Open your app in the browser
2. Open DevTools Console (F12)
3. Try to register or login
4. Check the Network tab for requests to Supabase
5. You should see `200 OK` responses instead of `401`

---

## Common Issues

### **Issue 1: Still getting 401 after updating key**
**Solution:** Make sure you:
- Restarted the dev server
- Cleared browser cache
- Used the **anon/public** key, not the service_role key

### **Issue 2: "Missing Supabase environment variables" error**
**Solution:**
- Make sure your `.env` file is in the project root
- Variable names must start with `VITE_` for Vite apps
- Restart the dev server after changes

### **Issue 3: RLS policies error "policy already exists"**
**Solution:**
```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can read own profile" ON users;
-- Then recreate them
```

### **Issue 4: Can't read products or doctors**
**Solution:** Make sure these tables have public read policies:
```sql
CREATE POLICY "Anyone can read products"
ON products FOR SELECT
TO authenticated, anon
USING (true);
```

---

## Testing Account Merging

After fixing the 401 error, test the account merging:

1. **Register with email:**
   - Email: `test@example.com`
   - Password: `password123`
   - ✅ Should succeed

2. **Logout**

3. **Sign in with Google:**
   - Use `test@example.com`
   - ✅ Should merge accounts
   - ✅ Should see all your previous data

4. **Try registering again with same email:**
   - ✅ Should show error: "An account with this email already exists"

---

## Need More Help?

Check the browser console for specific error messages:
1. Press F12
2. Go to Console tab
3. Look for red error messages
4. Share the full error message if you need help

Check Supabase logs:
1. Go to Supabase Dashboard
2. Click **Logs** → **API Logs**
3. See what requests are failing and why
