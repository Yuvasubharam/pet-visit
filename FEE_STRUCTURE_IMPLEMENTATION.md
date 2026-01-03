# Fee Structure Implementation Guide

## Overview

This document describes the complete fee structure implementation for the pet consultation booking system, including proper separation of service fees, platform fees, and doctor commissions.

---

## Fee Structure Breakdown

### 1. **Service Fee** (Doctor's Fee)
- The base consultation/service fee charged to the user
- This amount goes to the doctor (before commission)
- Examples:
  - Online Video Consultation: ₹400
  - Online Chat Consultation: ₹250
  - Home Visit: ₹850
  - Clinic Visit: ₹500

### 2. **Platform Fee** (Tax & Handling - 5%)
- Platform's margin charged to the user
- Fixed at 5% of the service fee
- Stored as platform income
- Calculation: `platformFee = serviceFee × 0.05`

### 3. **Doctor Commission** (0-5% variable)
- Commission deducted from doctor's earnings
- Variable percentage (0-5%) per doctor
- Configurable in `doctors.commission_percentage` column
- Calculation: `doctorCommission = serviceFee × (commission_percentage / 100)`

### 4. **Total Calculations**

```
User Pays:
  Total Amount = Service Fee + Platform Fee
  Total Amount = Service Fee × 1.05

Doctor Receives:
  Net Amount = Service Fee - Doctor Commission
  Net Amount = Service Fee × (1 - commission_percentage / 100)

Platform Receives:
  Platform Income = Platform Fee + Doctor Commission
```

---

## Database Schema

### Tables Created/Updated

#### 1. `platform_settings`
Stores platform-wide configuration:
```sql
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Default settings:
- `platform_fee_percentage`: 0.05 (5%)
- `default_doctor_commission`: 0.15 (15%)

#### 2. `doctors` (Updated)
Added commission tracking:
```sql
ALTER TABLE doctors
ADD COLUMN commission_percentage DECIMAL(5, 2) DEFAULT 0.00;
```

#### 3. `bookings` (Updated)
Added fee breakdown columns:
```sql
ALTER TABLE bookings
ADD COLUMN service_fee DECIMAL(10, 2),
ADD COLUMN platform_fee DECIMAL(10, 2),
ADD COLUMN total_amount DECIMAL(10, 2);
```

#### 4. `platform_earnings`
Tracks all platform income:
```sql
CREATE TABLE platform_earnings (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),

  -- Fee breakdown
  service_fee DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  doctor_commission DECIMAL(10, 2) NOT NULL,
  total_platform_income DECIMAL(10, 2) NOT NULL,

  -- Doctor earnings breakdown
  doctor_gross_amount DECIMAL(10, 2) NOT NULL,
  doctor_commission_deducted DECIMAL(10, 2) NOT NULL,
  doctor_net_amount DECIMAL(10, 2) NOT NULL,

  -- Metadata
  commission_percentage DECIMAL(5, 2) NOT NULL,
  platform_fee_percentage DECIMAL(5, 2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `doctor_earnings` (Updated)
Added platform commission tracking:
```sql
ALTER TABLE doctor_earnings
ADD COLUMN platform_commission DECIMAL(10, 2) DEFAULT 0.00;
```

---

## Database Functions & Triggers

### 1. `calculate_booking_fees()` Function
Calculates all fees for a booking in one call:

```sql
SELECT * FROM calculate_booking_fees(500.00, doctor_id);

Returns:
  service_fee: 500.00
  platform_fee: 25.00 (5%)
  total_amount: 525.00
  doctor_gross: 500.00
  doctor_commission: 12.50 (2.5% example)
  doctor_net: 487.50
  platform_total: 37.50 (25.00 + 12.50)
  commission_percentage: 2.50
  platform_fee_percentage: 5.00
```

### 2. Auto-Calculate Fees Trigger
Automatically calculates fees when booking is created:

```sql
CREATE TRIGGER trigger_calculate_booking_fees
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_booking_fees();
```

### 3. Create Earnings on Complete Trigger
Creates earnings records when booking is completed:

```sql
CREATE TRIGGER trigger_create_earnings_on_complete
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_earnings_on_complete();
```

---

## Frontend Implementation

### Files Modified

#### 1. [types.ts](types.ts)

Updated `Booking` interface:
```typescript
export interface Booking {
  // ... existing fields
  payment_amount?: number;
  service_fee?: number; // Fee paid to doctor
  platform_fee?: number; // Platform's 5% margin
  total_amount?: number; // Total user pays
}
```

#### 2. [pages/Checkout.tsx](pages/Checkout.tsx)

Updated `BookingData` interface and display:
```typescript
interface BookingData {
  // ... existing fields
  amount: number; // Service fee (doctor's fee)
  serviceFee?: number; // Explicit service fee
  platformFee?: number; // Explicit platform fee (5%)
  totalAmount?: number; // Total to pay
}
```

**Fee Display:**
```tsx
<div className="space-y-4">
  <div className="flex justify-between items-center">
    <span>Service Fee (Doctor)</span>
    <span>₹{serviceFee.toFixed(2)}</span>
  </div>
  <div className="flex justify-between items-center">
    <span>Tax & Handling (Platform Fee)</span>
    <span>₹{platformFee.toFixed(2)}</span>
  </div>
  <div className="flex justify-between items-center">
    <span>Total Due</span>
    <span>₹{totalAmount.toFixed(2)}</span>
  </div>
</div>
```

#### 3. [pages/OnlineConsultBooking.tsx](pages/OnlineConsultBooking.tsx)

Calculate and pass fee structure:
```typescript
const handleConfirmBooking = () => {
  // Calculate fee structure
  const serviceFee = selectedMethod === 'video'
    ? (selectedDoctor?.fee_online_video || 400)
    : (selectedDoctor?.fee_online_chat || 250);
  const platformFee = serviceFee * 0.05; // 5% platform margin
  const totalAmount = serviceFee + platformFee;

  const bookingData: BookingData = {
    // ... other fields
    amount: serviceFee, // Doctor's service fee
    serviceFee: serviceFee, // Explicit service fee
    platformFee: platformFee, // Platform's 5% margin
    totalAmount: totalAmount, // Total to be paid by user
  };

  onProceedToCheckout(bookingData);
};
```

**Updated Display:**
```tsx
<span>Total Amount (incl. fees)</span>
<span>₹{(serviceFee * 1.05).toFixed(2)}</span>
```

#### 4. [pages/HomeConsultBooking.tsx](pages/HomeConsultBooking.tsx)

Same fee calculation structure as online booking:
```typescript
const handleConfirmBooking = () => {
  // Calculate fee structure
  const serviceFee = visitType === 'home'
    ? (selectedDoctor?.fee_home_visit || 850)
    : (selectedDoctor?.fee_clinic_visit || 500);
  const platformFee = serviceFee * 0.05; // 5% platform margin
  const totalAmount = serviceFee + platformFee;

  const bookingData: BookingData = {
    // ... other fields
    amount: serviceFee,
    serviceFee: serviceFee,
    platformFee: platformFee,
    totalAmount: totalAmount,
  };

  onProceedToCheckout(bookingData);
};
```

---

## Analytics Views

### 1. `doctor_analytics` View

Shows doctor earnings with commission breakdown:
```sql
SELECT
  d.id as doctor_id,
  d.full_name,
  d.commission_percentage,
  COALESCE(SUM(de.gross_amount), 0) as gross_earnings,
  COALESCE(SUM(de.platform_commission), 0) as total_commission_paid,
  COALESCE(SUM(de.net_amount), 0) as total_earnings,
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.status = 'paid'), 0) as paid_earnings,
  COALESCE(SUM(de.net_amount) FILTER (WHERE de.status = 'pending'), 0) as pending_earnings
FROM doctors d
LEFT JOIN doctor_earnings de ON de.doctor_id = d.id
GROUP BY d.id;
```

### 2. `platform_analytics` View

Shows platform income breakdown:
```sql
SELECT
  COALESCE(SUM(platform_fee), 0) as total_platform_fees,
  COALESCE(SUM(doctor_commission), 0) as total_doctor_commissions,
  COALESCE(SUM(total_platform_income), 0) as total_platform_income,
  COALESCE(SUM(service_fee), 0) as total_service_fees,
  COUNT(*) as total_bookings
FROM platform_earnings;
```

---

## User Flow Examples

### Example 1: Online Video Consultation

**User Journey:**
1. User selects online video consultation
2. Doctor's fee: ₹400
3. Platform calculates:
   - Service Fee: ₹400.00
   - Platform Fee (5%): ₹20.00
   - Total to Pay: ₹420.00

**Checkout Display:**
```
Service Fee (Doctor)              ₹400.00
Tax & Handling (Platform Fee)     ₹20.00
─────────────────────────────────────────
Total Due                         ₹420.00
```

**After Completion:**
- Platform receives: ₹20.00 (platform fee) + ₹10.00 (2.5% doctor commission) = ₹30.00
- Doctor receives: ₹400.00 - ₹10.00 (commission) = ₹390.00

### Example 2: Home Visit Consultation

**User Journey:**
1. User selects home visit consultation
2. Doctor's fee: ₹850
3. Platform calculates:
   - Service Fee: ₹850.00
   - Platform Fee (5%): ₹42.50
   - Total to Pay: ₹892.50

**Checkout Display:**
```
Service Fee (Doctor)              ₹850.00
Tax & Handling (Platform Fee)     ₹42.50
─────────────────────────────────────────
Total Due                         ₹892.50
```

**After Completion:**
- Platform receives: ₹42.50 (platform fee) + ₹21.25 (2.5% doctor commission) = ₹63.75
- Doctor receives: ₹850.00 - ₹21.25 (commission) = ₹828.75

---

## Configuration & Settings

### Update Platform Fee Percentage

```sql
UPDATE platform_settings
SET setting_value = '{"value": 0.07}'::jsonb
WHERE setting_key = 'platform_fee_percentage';
```

### Update Default Doctor Commission

```sql
UPDATE platform_settings
SET setting_value = '{"value": 0.20}'::jsonb
WHERE setting_key = 'default_doctor_commission';
```

### Set Individual Doctor Commission

```sql
UPDATE doctors
SET commission_percentage = 3.50
WHERE id = 'doctor-uuid-here';
```

---

## Testing Checklist

### Database Testing
- [ ] Platform settings table created with default values
- [ ] Doctors table has commission_percentage column
- [ ] Bookings table has service_fee, platform_fee, total_amount columns
- [ ] Platform earnings table created
- [ ] Doctor earnings table has platform_commission column
- [ ] calculate_booking_fees() function works correctly
- [ ] Triggers auto-calculate fees on booking insert/update
- [ ] Earnings records created on booking completion
- [ ] Analytics views return correct data

### Frontend Testing
- [ ] Booking pages show "Total Amount (incl. fees)"
- [ ] Checkout page shows fee breakdown correctly
- [ ] Service fee labeled as "Service Fee (Doctor)"
- [ ] Platform fee labeled as "Tax & Handling (Platform Fee)"
- [ ] Total amount calculated correctly
- [ ] Fee structure passed to checkout page
- [ ] Payment confirmation shows correct total

### Edge Cases
- [ ] Zero commission percentage (0%)
- [ ] Maximum commission percentage (5%)
- [ ] Missing doctor commission (uses default)
- [ ] Missing platform fee setting (uses default 5%)
- [ ] Large fee amounts (₹10,000+)
- [ ] Small fee amounts (₹50)

---

## Migration Instructions

### Step 1: Run Database Migration

Execute the SQL file:
```bash
psql -U your_username -d your_database -f FIX_FEE_STRUCTURE_AND_TABLES.sql
```

Or in Supabase SQL Editor:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste contents of `FIX_FEE_STRUCTURE_AND_TABLES.sql`
4. Click "Run"

### Step 2: Verify Database Changes

```sql
-- Check platform settings
SELECT * FROM platform_settings;

-- Check doctors have commission percentage
SELECT id, full_name, commission_percentage FROM doctors LIMIT 5;

-- Check booking columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('service_fee', 'platform_fee', 'total_amount');

-- Test fee calculation
SELECT * FROM calculate_booking_fees(500.00, NULL);
```

### Step 3: Deploy Frontend Changes

All TypeScript changes are already applied:
- [types.ts](types.ts) - Updated Booking interface
- [pages/Checkout.tsx](pages/Checkout.tsx) - Updated fee display
- [pages/OnlineConsultBooking.tsx](pages/OnlineConsultBooking.tsx) - Updated fee calculation
- [pages/HomeConsultBooking.tsx](pages/HomeConsultBooking.tsx) - Updated fee calculation

### Step 4: Test End-to-End

1. Create a new booking (online/home/clinic)
2. Verify fee calculation on booking page
3. Proceed to checkout
4. Verify fee breakdown display
5. Complete booking
6. Check database records created correctly

---

## Troubleshooting

### Issue: Fees not calculating automatically

**Solution:** Check if trigger is enabled:
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_calculate_booking_fees';
```

### Issue: Earnings not created on booking completion

**Solution:** Verify trigger exists:
```sql
SELECT tgname FROM pg_trigger
WHERE tgname = 'trigger_create_earnings_on_complete';
```

### Issue: Doctor commission showing as 0

**Solution:** Update doctor's commission percentage:
```sql
UPDATE doctors
SET commission_percentage = 2.50
WHERE commission_percentage IS NULL OR commission_percentage = 0;
```

---

## Summary

The fee structure implementation provides:

✅ **Clear separation of fees:**
   - Service Fee (doctor's earning)
   - Platform Fee (5% margin)
   - Doctor Commission (0-5% variable)

✅ **Transparent pricing:**
   - Users see exact breakdown
   - Doctors know their net earnings
   - Platform tracks all income

✅ **Flexible configuration:**
   - Platform fee percentage configurable
   - Doctor commission individually adjustable
   - Default settings for new doctors

✅ **Comprehensive tracking:**
   - All fees recorded in database
   - Analytics views for reporting
   - Audit trail for all transactions

✅ **Automated calculations:**
   - Database triggers auto-calculate fees
   - Frontend displays correct totals
   - No manual calculations needed

---

**Implementation Complete! ✨**

All tables linked, fee structure properly defined, and platform income separated from doctor earnings.
