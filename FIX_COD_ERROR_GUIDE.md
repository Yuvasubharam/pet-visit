# Fix: Doctor Consultation Status Update Error (400)

## Problem

When a doctor tries to mark a consultation as "completed" from the DoctorConsultationDetails page, a **400 error** occurs with the message:

```
Failed to load resource: the server responded with a status of 400 ()
Error updating status: Object
```

## Root Cause

The error occurs at **DoctorConsultationDetails.tsx:182** where the code tries to set:

```typescript
updates.payment_status = 'cod'; // Cash on Delivery
```

However, the database constraint on the `bookings` table only allows these values:
- `'pending'`
- `'paid'`
- `'failed'`

The value `'cod'` is **NOT** in the allowed list, causing the database to reject the update with a 400 error.

## Solution

Run the SQL migration to add `'cod'` as an allowed `payment_status` value.

### Steps to Fix

1. **Open your Supabase Dashboard** (or psql/SQL client)

2. **Navigate to SQL Editor**

3. **Run the migration file** `FIX_PAYMENT_STATUS_COD.sql`:

```sql
-- Drop the existing constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Add the new constraint with 'cod' included
ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'));

-- Also update the orders table if it has the same constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod'));
```

4. **Test the fix**:
   - Go to Doctor Dashboard
   - Open a consultation
   - Click "Mark Complete"
   - The status should update successfully without the 400 error

## What This Fix Does

- Allows bookings to have `payment_status = 'cod'` (Cash on Delivery)
- When a doctor marks a consultation as completed, if it wasn't pre-paid, it will be marked as COD
- The BookingDetails page already expects this value and displays "Cash on Delivery" for COD payments

## Files Affected

- **Database**: `bookings` table, `orders` table
- **Code**:
  - `pages/DoctorConsultationDetails.tsx:182` (sets payment_status to 'cod')
  - `pages/BookingDetails.tsx:1040, 1044` (displays COD status)

## Verification

After running the migration, you can verify it worked by checking:

```sql
-- Check the new constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND conname = 'bookings_payment_status_check';
```

You should see `'cod'` in the constraint definition.
