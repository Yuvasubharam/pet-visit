# 🚀 Quick Start - Video Calls (3 Steps)

## Step 1: Run Database Migration (2 min)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/VIDEO_CALLS_SETUP.sql`
4. Click **Run**

✅ Done! All tables created.

---

## Step 2: Update App.tsx (10 min)

Add these changes to your main App.tsx:

```typescript
// Add to your component props interface
interface DoctorConsultationsProps {
  // ... existing props
  onJoinCall: (booking: Booking) => void;  // ADD THIS
}

interface BookingsOverviewProps {
  // ... existing props
  onJoinCall: () => void;  // UPDATE THIS (remove booking param)
}

// In your main component
const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

// Handler
const handleJoinCall = (booking: Booking) => {
  setActiveBooking(booking);
  setCurrentView('live-consultation');
};

// Update DoctorConsultations component
<DoctorConsultations
  onJoinCall={handleJoinCall}
  // ... other props
/>

// Update BookingsOverview component
<BookingsOverview
  onJoinCall={() => activeBooking && setCurrentView('live-consultation')}
  // ... other props
/>

// Add LiveConsultation view
{currentView === 'live-consultation' && activeBooking && (
  <LiveConsultation
    onEnd={() => setCurrentView('home')}
    bookingId={activeBooking.id}
    userId={user?.id || ''}
    doctorId={activeBooking.doctor_id || ''}
    userType={userType}  // 'doctor' or 'customer' based on logged in user
    doctorName="Dr. Name"  // Get from booking data
  />
)}
```

---

## Step 3: Add to types.ts (1 min)

```typescript
export type AppView =
  | 'splash'
  | 'onboarding'
  // ... existing views
  | 'live-consultation'  // ADD THIS
  | 'waiting-room';      // ADD THIS (optional)
```

---

## ✅ That's It!

Your video calling is now live!

### Test It:
1. Create an "online" consultation booking
2. Doctor: Click "Join Call" button
3. Customer: Click "Join Consultation" button
4. Both should connect via video!

---

## 📱 Optional: Add Waiting Room

```typescript
{currentView === 'waiting-room' && activeBooking && (
  <WaitingRoom
    onBack={() => setCurrentView('home')}
    onJoin={() => setCurrentView('live-consultation')}
    booking={activeBooking}
    userId={user?.id || ''}
    userType={userType}
  />
)}
```

---

## 🔔 Optional: Add Notification Badge

```typescript
import CallNotificationBadge from './components/CallNotificationBadge';

// In your header
<CallNotificationBadge userId={user?.id || ''} />
```

---

## 📚 Need More Details?

See `AGORA_IMPLEMENTATION_COMPLETE.md` for full documentation.

---

## 🎉 You're Live!

Video calls are now fully functional in your app!
