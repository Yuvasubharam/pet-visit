# Doctor Fee Management Implementation Guide

## Overview
This guide walks you through implementing dynamic fee management for doctors, allowing them to set their own consultation fees for different types of services.

## What Has Been Created

### 1. Database Migration
**File:** `supabase/migrations/008_add_doctor_fees.sql`

Adds four fee columns to the `doctors` table:
- `fee_online_video` (default: ₹400)
- `fee_online_chat` (default: ₹250)
- `fee_home_visit` (default: ₹850)
- `fee_clinic_visit` (default: ₹500)

**Run this migration:**
```bash
# In Supabase SQL Editor, copy and paste the contents of 008_add_doctor_fees.sql
```

### 2. Updated Type Definitions
**File:** `types.ts`

Added new fields to the `Doctor` interface and new view type `'doctor-fee-management'`.

### 3. New Fee Management Page
**File:** `pages/DoctorFeeManagement.tsx`

A complete UI for doctors to manage their consultation fees with:
- Separate inputs for each consultation type
- Real-time fee calculation and average display
- Save functionality
- Beautiful modern UI matching your design system

## Step-by-Step Implementation

### Step 1: Run the Database Migration

1. Open Supabase SQL Editor
2. Copy the contents of `supabase/migrations/008_add_doctor_fees.sql`
3. Run it
4. Verify by checking the output - you should see the doctor with fee columns

### Step 2: Update App.tsx

Add the import at the top of App.tsx (around line 43):
```typescript
import DoctorFeeManagement from './pages/DoctorFeeManagement';
```

Add the route in the `renderView()` function (around line 585):
```typescript
case 'doctor-fee-management': return <DoctorFeeManagement onBack={() => setCurrentView('doctor-dashboard')} doctorId={doctorId} />;
```

### Step 3: Update DoctorDashboard.tsx

Add a new quick action button for Fee Management. Add this after the "Availability & Slots" button (around line 213):

```typescript
{/* Fee Management */}
<button
  onClick={() => (window as any).setCurrentView('doctor-fee-management')}
  className="w-full bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-[#2C3E50] dark:hover:bg-slate-800 transition-colors group"
>
  <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 group-hover:bg-white/10 relative transition-colors">
    <div className="h-full w-full flex items-center justify-center">
      <span className="material-symbols-outlined text-3xl text-slate-600 group-hover:text-white transition-colors">payments</span>
    </div>
  </div>
  <div className="flex-1 text-left">
    <h3 className="font-bold text-slate-900 dark:text-dark group-hover:text-white transition-colors">Fee Management</h3>
    <p className="text-xs text-slate-700 dark:text-slate-900 group-hover:text-slate-300 mt-0.5 transition-colors">
      Set consultation rates
    </p>
  </div>
  <span className="material-symbols-outlined text-slate-400 group-hover:text-white pr-2 transition-colors">
    chevron_right
  </span>
</button>
```

**BETTER APPROACH:** Update DoctorDashboard to accept an `onFeeManagement` prop:

In `DoctorDashboard.tsx` interface (line 5-10):
```typescript
interface DoctorDashboardProps {
  onProfileSetup: () => void;
  onAvailability: () => void;
  onFeeManagement: () => void;  // ADD THIS
  onConsultations: () => void;
  doctorId: string | null;
}
```

Then in App.tsx line 582, update the DoctorDashboard call:
```typescript
case 'doctor-dashboard': return <DoctorDashboard
  doctorId={doctorId}
  onProfileSetup={() => setCurrentView('doctor-profile-setup')}
  onAvailability={() => setCurrentView('doctor-availability')}
  onFeeManagement={() => setCurrentView('doctor-fee-management')}  // ADD THIS
  onConsultations={() => setCurrentView('doctor-consultations')}
/>;
```

Then in DoctorDashboard.tsx, add the button using `onFeeManagement` prop instead of window hack.

### Step 4: Update HomeConsultBooking.tsx

Make the fees dynamic based on the selected doctor. Update the cost display section (around line 630-640):

```typescript
{/* Sticky Bottom Bar */}
<div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
  <div className="flex items-center justify-between mb-4">
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Estimated Cost</span>
      <span className="text-3xl font-black text-primary tracking-tighter leading-none">
        ₹{doctors.length > 0 && doctors[selectedDoc]
          ? visitType === 'home'
            ? (doctors[selectedDoc].fee_home_visit || 850).toFixed(2)
            : (doctors[selectedDoc].fee_clinic_visit || 500).toFixed(2)
          : visitType === 'home' ? '850.00' : '500.00'
        }
      </span>
    </div>
    <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/5 px-4 py-2 rounded-full font-black uppercase tracking-widest">
      <span className="material-symbols-outlined text-sm font-black">info</span>
      {visitType === 'home' ? 'Includes Travel' : 'Clinic Base Fee'}
    </div>
  </div>
  ...
</div>
```

Also update the `handleConfirmBooking` function (around line 298-304):

```typescript
const selectedDoctor = doctors[selectedDoc];

const bookingData: BookingData = {
  type: 'consultation',
  petId: selectedPet,
  petName,
  bookingType: visitType,
  date: dateStr,
  time: selectedTime,
  addressId: visitType === 'home' ? selectedAddress?.id : undefined,
  address: visitType === 'home' ? selectedAddress || undefined : undefined,
  doctorName: selectedDoctor?.full_name || selectedDoctor?.email || 'Doctor',
  notes: `${visitType === 'home' ? 'Home visit' : 'Clinic visit'} consultation`,
  amount: visitType === 'home'
    ? (selectedDoctor?.fee_home_visit || 850)
    : (selectedDoctor?.fee_clinic_visit || 500),
  serviceName: visitType === 'home' ? 'Home Visit Consultation' : 'Clinic Visit Consultation',
};
```

### Step 5: Update OnlineConsultBooking.tsx

Update the price display for video/chat selection (around line 286 and 304):

```typescript
{/* Video Call - around line 286 */}
<p className="font-black text-primary text-lg tracking-tighter leading-none">
  ₹{doctors.length > 0 && doctors[selectedDoc]
    ? (doctors[selectedDoc].fee_online_video || 400).toFixed(2)
    : '400.00'
  }
</p>

{/* Text Chat - around line 304 */}
<p className="font-black text-primary text-lg tracking-tighter leading-none">
  ₹{doctors.length > 0 && doctors[selectedDoc]
    ? (doctors[selectedDoc].fee_online_chat || 250).toFixed(2)
    : '250.00'
  }
</p>
```

Update the bottom bar (around line 354):

```typescript
<span className="text-3xl font-black text-primary tracking-tighter leading-none">
  ₹{doctors.length > 0 && doctors[selectedDoc]
    ? selectedMethod === 'video'
      ? (doctors[selectedDoc].fee_online_video || 400).toFixed(2)
      : (doctors[selectedDoc].fee_online_chat || 250).toFixed(2)
    : selectedMethod === 'video' ? '400.00' : '250.00'
  }
</span>
```

And in `handleConfirmBooking` (around line 173):

```typescript
const selectedDoctor = doctors[selectedDoc];

const bookingData: BookingData = {
  type: 'consultation',
  petId: selectedPet,
  petName,
  bookingType: 'online',
  date: dateStr,
  time: selectedTime,
  doctorName: selectedDoctor?.full_name || selectedDoctor?.email || 'Doctor',
  doctorId: selectedDoctor?.id,
  notes: `${selectedMethod === 'video' ? 'Video' : 'Chat'} consultation`,
  amount: selectedMethod === 'video'
    ? (selectedDoctor?.fee_online_video || 400)
    : (selectedDoctor?.fee_online_chat || 250),
  serviceName: `Online ${selectedMethod === 'video' ? 'Video' : 'Chat'} Consultation`,
};
```

## Testing Checklist

After implementing all changes:

- [ ] Run the SQL migration
- [ ] Verify fees appear in database
- [ ] Doctor can navigate to Fee Management from dashboard
- [ ] Doctor can update fees and save successfully
- [ ] Online booking page shows correct fees (video/chat)
- [ ] Home visit booking shows correct fee
- [ ] Clinic visit booking shows correct fee
- [ ] Fees update when selecting different doctors
- [ ] Booking confirmation uses correct fee amount

## Default Fees

If a doctor hasn't set custom fees, the system uses these defaults:
- Online Video: ₹400
- Online Chat: ₹250
- Home Visit: ₹850
- Clinic Visit: ₹500

## Benefits

1. **Doctor Autonomy**: Doctors can set their own rates
2. **Market Flexibility**: Different specialists can charge different rates
3. **Transparency**: Patients see exact fees before booking
4. **Revenue Optimization**: Doctors can adjust based on demand
5. **Professional Growth**: Higher-rated doctors can charge premium fees

## Next Steps

Consider adding:
1. Fee history/analytics for doctors
2. Suggested pricing based on specialization
3. Promotional pricing / discounts
4. Package deals (e.g., 5 consultations for ₹XYZ)
5. Dynamic pricing based on time of day/urgency
