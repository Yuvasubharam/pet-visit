# Fix: Unable to Save Address to Backend

## Problem
Users cannot save addresses through the AddressForm component. The form submits but nothing is saved to the Supabase database.

## Root Cause
The `addresses` table in Supabase has **Row Level Security (RLS)** enabled, but the necessary INSERT policy is missing or incorrectly configured. This prevents authenticated users from inserting new address records.

## Solution

### Step 1: Apply RLS Policies in Supabase

1. Go to your Supabase Dashboard: https://kfnsqbgwqltbltngwbdh.supabase.co
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/fix_addresses_rls.sql`
5. Click **Run** to execute the SQL

Alternatively, you can copy this SQL directly:

```sql
-- Enable RLS on addresses table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;

-- Policy: Users can view their own addresses
CREATE POLICY "Users can view their own addresses"
ON public.addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own addresses
CREATE POLICY "Users can insert their own addresses"
ON public.addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
ON public.addresses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
ON public.addresses
FOR DELETE
USING (auth.uid() = user_id);
```

### Step 2: Verify RLS Policies

1. In Supabase Dashboard, go to **Authentication** → **Policies**
2. Find the `addresses` table
3. Verify that you see 4 policies:
   - "Users can view their own addresses" (SELECT)
   - "Users can insert their own addresses" (INSERT)
   - "Users can update their own addresses" (UPDATE)
   - "Users can delete their own addresses" (DELETE)

### Step 3: Test the Fix

1. Open your application
2. Navigate to the Cart or Checkout page
3. Click "Add Delivery Address"
4. Fill in the address form
5. Click "Save Address"
6. Check the browser console (F12 → Console) for detailed logs
7. You should see:
   - "Saving address:" with address data
   - "Address service: Adding address for user"
   - "Insert data to Supabase:" with the data being sent
   - "Address added successfully:" with the saved data
   - An alert saying "Address saved successfully!"

## Debugging

If the issue persists after applying the RLS policies, check the browser console for error messages. The enhanced error handling will show:

### Common Errors:

1. **"User not logged in"**: User needs to be authenticated first
2. **"new row violates row-level security policy"**: RLS policies not applied correctly
3. **"duplicate key value violates unique constraint"**: Trying to insert duplicate data
4. **Network errors**: Check internet connection and Supabase status

### Check User Authentication:

Open browser console and run:
```javascript
// Get current user
const { data: { user } } = await window.supabase.auth.getUser();
console.log('Current user:', user);
```

If `user` is `null`, the user needs to log in first.

### Manual Database Check:

1. Go to Supabase Dashboard → **Table Editor**
2. Select `addresses` table
3. Try manually inserting a row to confirm the table structure is correct
4. Check if RLS is enabled (there should be a shield icon next to the table name)

## What Was Fixed

### 1. Enhanced Error Handling in Cart.tsx and ShopCheckout.tsx
- Added user authentication validation
- Detailed error messages for users
- Success confirmation alerts
- Better error type checking

### 2. Enhanced Logging in services/api.ts
- Logs all address data before sending to Supabase
- Logs the exact insert data
- Captures and logs full error details
- Confirms successful saves

### 3. RLS Policies
- Proper INSERT policy allowing users to add their own addresses
- SELECT policy for viewing addresses
- UPDATE policy for editing addresses
- DELETE policy for removing addresses

## Files Modified

- `pages/Cart.tsx` - Enhanced handleSaveAddress with better error handling
- `pages/ShopCheckout.tsx` - Enhanced handleSaveAddress with better error handling
- `services/api.ts` - Added detailed logging to addAddress function
- `supabase/migrations/fix_addresses_rls.sql` - New RLS policies

## Testing Checklist

- [ ] RLS policies applied in Supabase
- [ ] User is logged in
- [ ] Address form submits without errors
- [ ] Success alert appears
- [ ] Address appears in the address dropdown
- [ ] Address is saved in Supabase database (check Table Editor)
- [ ] Console shows all debug logs without errors
