# Reschedule Navigation Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Actions                                 │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼────────┐        ┌──────▼──────────┐
            │ BookingsOverview│        │ BookingDetails  │
            │  (Lapsed Tab)   │        │  (Any Booking)  │
            └────────┬────────┘        └─────────┬───────┘
                     │                           │
                     │  Click "Reschedule"       │  Click "Reschedule"
                     │  Button                   │  Button
                     │                           │
                     └───────────┬───────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   onReschedule(booking) │
                    │   Handler in App.tsx    │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼────────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │ service_type =   │  │service_type =│  │service_type=│
    │ 'consultation'   │  │'consultation'│  │  'grooming' │
    └─────────┬────────┘  └──────┬──────┘  └──────┬──────┘
              │                  │                  │
    ┌─────────▼────────┐  ┌──────▼──────┐         │
    │ booking_type =   │  │booking_type=│         │
    │    'online'      │  │'home/clinic'│         │
    └─────────┬────────┘  └──────┬──────┘         │
              │                  │                  │
              │                  │                  │
    ┌─────────▼────────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │ Navigate to:     │  │Navigate to: │  │Navigate to: │
    │ online-consult-  │  │ home-consult│  │  grooming   │
    │    booking       │  │   -booking  │  │             │
    └──────────────────┘  └─────────────┘  └─────────────┘
```

## Booking Type Decision Tree

```
Booking Object
    │
    ├── service_type: 'consultation'
    │       │
    │       ├── booking_type: 'online'  ──────► online-consult-booking
    │       │
    │       ├── booking_type: 'home'   ──────► home-consult-booking
    │       │
    │       └── booking_type: 'clinic' ──────► home-consult-booking
    │
    └── service_type: 'grooming'
            │
            ├── booking_type: 'home'   ──────► grooming
            │
            └── booking_type: 'clinic' ──────► grooming
```

## Code Flow in App.tsx

```typescript
// In render() switch statement:

case 'bookings-overview':
    return (
        <BookingsOverview
            onReschedule={(booking) => {
                // Routing logic
                if (booking.service_type === 'consultation') {
                    if (booking.booking_type === 'online') {
                        setCurrentView('online-consult-booking');  // ← Route 1
                    } else {
                        setCurrentView('home-consult-booking');    // ← Route 2
                    }
                } else if (booking.service_type === 'grooming') {
                    setCurrentView('grooming');                    // ← Route 3
                }
            }}
            {...otherProps}
        />
    );

case 'booking-details':
    return (
        <BookingDetails
            onReschedule={(booking) => {
                // Same routing logic as above
                ...
            }}
            {...otherProps}
        />
    );
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                          App.tsx                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  State: currentView, selectedBooking, userPets, etc.     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│     ┌────────────────────────┼────────────────────────┐        │
│     │                        │                        │        │
│  ┌──▼──────────────┐  ┌─────▼─────────┐  ┌──────────▼──────┐ │
│  │BookingsOverview │  │BookingDetails │  │ OnlineConsult   │ │
│  │                 │  │               │  │ Booking Page    │ │
│  │ Props:          │  │ Props:        │  │                 │ │
│  │ - onReschedule  │  │ - onReschedule│  │                 │ │
│  │ - onDetailClick │  │ - booking     │  │                 │ │
│  │ - onJoinCall    │  │ - onBack      │  │                 │ │
│  └─────────────────┘  └───────────────┘  └─────────────────┘ │
│                                                                 │
│  User clicks "Reschedule" → onReschedule(booking) called →     │
│  App.tsx analyzes booking → setCurrentView() to appropriate    │
│  booking page → User can create new booking                    │
└────────────────────────────────────────────────────────────────┘
```

## Lapsed Bookings Tab Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   DoctorConsultations.tsx                       │
└────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    loadData()         │
                    │  - Fetch all bookings │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Filter by activeTab  │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼─────┐          ┌─────▼──────┐         ┌─────▼──────┐
   │  Active  │          │   Lapsed   │         │ Completed  │
   │   Tab    │          │    Tab     │         │    Tab     │
   └────┬─────┘          └─────┬──────┘         └─────┬──────┘
        │                      │                       │
        │                      │                       │
   ┌────▼─────────────────┐   │               ┌───────▼────────┐
   │ Split bookings:      │   │               │ Show completed │
   │ - Lapsed (red)       │   │               │ consultations  │
   │ - Upcoming (normal)  │   │               └────────────────┘
   └──────────────────────┘   │
                               │
                    ┌──────────▼───────────┐
                    │ Show all lapsed      │
                    │ bookings with:       │
                    │ - Red styling        │
                    │ - "LAPSED" badge     │
                    │ - Reschedule button  │
                    └──────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                   App.tsx State                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  currentView: AppView                                        │
│    ├─ 'bookings-overview'      (Bookings list)             │
│    ├─ 'booking-details'        (Single booking)            │
│    ├─ 'online-consult-booking' (Online consultation form)  │
│    ├─ 'home-consult-booking'   (Home/clinic consult form)  │
│    └─ 'grooming'               (Grooming booking form)     │
│                                                              │
│  selectedBooking: Booking | null                            │
│    └─ Holds the booking object being viewed/rescheduled    │
│                                                              │
│  userPets: Pet[]                                            │
│    └─ User's pets for booking selection                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow for Reschedule

```
1. User Action
   └─► Click "Reschedule" button
        │
2. Event Handler
   └─► onReschedule(booking) callback triggered
        │
3. Type Analysis
   └─► Extract booking.service_type and booking.booking_type
        │
4. Navigation Decision
   └─► Match against routing matrix
        │
5. View Transition
   └─► setCurrentView('target-page')
        │
6. New Booking Form
   └─► User creates new booking (reschedule = new booking)
```

## Summary

- **Entry Points**: BookingsOverview (lapsed tab) OR BookingDetails (any booking)
- **Decision Factor**: `booking.service_type` + `booking.booking_type`
- **Navigation**: State-based routing via `setCurrentView()`
- **Outcomes**: 3 possible destination pages (online-consult, home-consult, grooming)
