# Doctor Consultation Portal - Implementation Guide

## Overview

This document outlines the complete implementation of the Doctor Consultation Portal for the Pet Visit application. The doctor portal allows veterinarians to manage their availability, view consultations, handle patient bookings, and provide medical care through the platform.

## Features Implemented

### 1. Doctor Authentication & Profile Management
- **Doctor Login**: Secure email/password authentication
- **Profile Setup**: Complete profile management with photo upload and credentials
- **Profile Information**: Name, specialization, contact details, clinic address

### 2. Availability Management
- **Schedule Management**: Create and manage time slots for different service types (clinic, home, online)
- **Slot Types**: Support for three consultation types:
  - Clinic visits
  - Home visits
  - Online video consultations
- **Capacity Management**: Set maximum number of pets per time slot
- **Calendar View**: Visual calendar interface for managing weekly schedules

### 3. Consultation Management
- **Booking Overview**: View all upcoming, completed, and cancelled consultations
- **Filtering**: Filter consultations by type (all, clinic, online, home)
- **Real-time Updates**: See current booking status and patient information
- **Consultation Details**: Access complete patient and booking information

### 4. Patient Care Features
- **Medical Notes**: Add and update medical notes for each consultation
- **Prescription Upload**: Upload and manage prescription documents
- **Status Management**: Update consultation status (upcoming, completed, cancelled)
- **Patient Records**: View complete pet information and owner details

### 5. Analytics Dashboard
- **Key Metrics Display**:
  - Total consultations count
  - Patient rating (0-5 stars)
  - Total earnings
  - Today's consultation stats
- **Quick Actions**: Easy access to profile, availability, and consultations

## Database Schema

### Tables Created

#### 1. `doctors`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- full_name: TEXT
- email: TEXT (Unique)
- phone: TEXT
- specialization: TEXT
- clinic_address: TEXT
- profile_photo_url: TEXT
- credentials_url: TEXT
- is_verified: BOOLEAN
- is_active: BOOLEAN
- rating: DECIMAL
- total_consultations: INTEGER
- total_earnings: DECIMAL
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 2. `doctor_availability`
```sql
- id: UUID (Primary Key)
- doctor_id: UUID (Foreign Key to doctors)
- date: TEXT
- start_time: TEXT
- end_time: TEXT
- slot_type: TEXT (clinic/home/online)
- capacity: INTEGER
- booked_count: INTEGER
- is_active: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 3. `doctor_earnings`
```sql
- id: UUID (Primary Key)
- doctor_id: UUID (Foreign Key to doctors)
- booking_id: UUID (Foreign Key to bookings)
- amount: DECIMAL
- commission: DECIMAL
- net_amount: DECIMAL
- status: TEXT (pending/paid/cancelled)
- paid_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

#### 4. `doctor_reviews`
```sql
- id: UUID (Primary Key)
- doctor_id: UUID (Foreign Key to doctors)
- user_id: UUID (Foreign Key to users)
- booking_id: UUID (Foreign Key to bookings)
- rating: INTEGER (1-5)
- review_text: TEXT
- created_at: TIMESTAMPTZ
```

### Extended `bookings` Table
Added the following columns:
- `doctor_id`: UUID (Foreign Key to doctors)
- `consultation_duration_minutes`: INTEGER
- `call_link`: TEXT
- `prescription_url`: TEXT
- `medical_notes`: TEXT

## File Structure

### Services
```
services/
└── doctorApi.ts          # All doctor-related API services
    ├── doctorAuthService          # Authentication & profile
    ├── doctorAvailabilityService  # Slot management
    ├── doctorConsultationService  # Booking management
    ├── doctorEarningsService      # Financial tracking
    └── doctorReviewService        # Review management
```

### Pages
```
pages/
├── DoctorLogin.tsx                 # Doctor login page
├── DoctorDashboard.tsx             # Main dashboard with analytics
├── DoctorProfileSetup.tsx          # Profile management
├── DoctorAvailability.tsx          # Schedule management
├── DoctorConsultations.tsx         # Consultation list
└── DoctorConsultationDetails.tsx   # Individual consultation details
```

### Database Migrations
```
supabase/migrations/
└── 004_doctor_consultations.sql   # Complete schema migration
```

### Type Definitions
```typescript
// types.ts - Added interfaces:
- Doctor
- DoctorAvailability
- DoctorEarning
- DoctorReview

// Updated AppView type to include:
- doctor-login
- doctor-dashboard
- doctor-profile-setup
- doctor-availability
- doctor-consultations
- doctor-consultation-details
```

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply the doctor consultation migration
supabase db reset  # For development
# OR
supabase migration up  # For production
```

### 2. Create Storage Buckets

Create the following storage buckets in Supabase:
- `doctor-photos` - For doctor profile pictures
- `doctor-credentials` - For medical licenses and certificates
- `prescriptions` - For prescription documents

Enable public access for `doctor-photos` and `prescriptions`.

### 3. Set Up Row Level Security (RLS)

The migration file includes comprehensive RLS policies:
- Doctors can only view/edit their own data
- Patients can view active, verified doctors
- Proper access control for bookings and earnings

### 4. Configure Authentication

Ensure email/password authentication is enabled in Supabase Auth settings.

## Usage Guide

### For Developers

#### Accessing the Doctor Portal

1. **From Onboarding**: Users will see a "Doctor Login" button on the final onboarding slide
2. **Direct Navigation**: Navigate to the `doctor-login` view

#### Creating a Doctor Account

```typescript
import { doctorAuthService } from './services/doctorApi';

// Sign up a new doctor
await doctorAuthService.signUpDoctor(
  'doctor@example.com',
  'securePassword',
  {
    full_name: 'Dr. Jane Smith',
    phone: '+1234567890',
    specialization: 'Veterinary Surgeon',
    clinic_address: '123 Pet Lane, Animal City'
  }
);
```

#### Managing Availability

```typescript
import { doctorAvailabilityService } from './services/doctorApi';

// Create a new time slot
await doctorAvailabilityService.createAvailabilitySlot({
  doctor_id: doctorId,
  date: '2025-01-15',
  start_time: '09:00',
  end_time: '10:00',
  slot_type: 'clinic',
  capacity: 3,
  booked_count: 0,
  is_active: true
});
```

#### Handling Consultations

```typescript
import { doctorConsultationService } from './services/doctorApi';

// Get today's consultations
const bookings = await doctorConsultationService.getDoctorBookings(
  doctorId,
  { date: '2025-01-15' }
);

// Update consultation status
await doctorConsultationService.updateBookingStatus(
  bookingId,
  'completed'
);

// Add medical notes
await doctorConsultationService.addMedicalNotes(
  bookingId,
  'Patient showed signs of improvement...'
);
```

### For End Users (Doctors)

#### First-Time Setup
1. Click "Doctor Login" on the onboarding screen
2. Sign in with your credentials
3. Complete your profile setup:
   - Upload profile photo
   - Add specialization
   - Enter clinic address
   - Upload credentials/certificates

#### Managing Your Schedule
1. Navigate to "Availability & Slots"
2. Select the service type (Clinic/Home/Online)
3. Choose dates from the calendar
4. Click "Quick Add" to create time slots
5. Set capacity for each slot
6. Save your availability

#### Viewing Consultations
1. Go to "Consultations" from the dashboard
2. Filter by type (All/Clinic/Online/Home)
3. Click on any consultation to view details
4. For online consultations, click "Join Call"

#### Managing Patient Records
1. Open a consultation from the list
2. Add medical notes in the text area
3. Upload prescriptions using the file upload
4. Mark consultation as completed when done

## API Reference

### Doctor Authentication Service

```typescript
doctorAuthService.signInWithEmail(email, password)
doctorAuthService.signUpDoctor(email, password, doctorData)
doctorAuthService.getDoctorProfile(userId)
doctorAuthService.getDoctorById(doctorId)
doctorAuthService.updateDoctorProfile(doctorId, updates)
doctorAuthService.uploadDoctorPhoto(doctorId, file)
doctorAuthService.uploadCredentials(doctorId, file)
doctorAuthService.getAllDoctors(filters?)
```

### Doctor Availability Service

```typescript
doctorAvailabilityService.createAvailabilitySlot(slotData)
doctorAvailabilityService.getDoctorAvailability(doctorId, filters?)
doctorAvailabilityService.getAvailableSlots(doctorId, date, slotType)
doctorAvailabilityService.updateAvailabilitySlot(slotId, updates)
doctorAvailabilityService.deleteAvailabilitySlot(slotId)
doctorAvailabilityService.bulkCreateAvailability(slots[])
```

### Doctor Consultation Service

```typescript
doctorConsultationService.getDoctorBookings(doctorId, filters?)
doctorConsultationService.getBookingDetails(bookingId)
doctorConsultationService.updateBookingStatus(bookingId, status)
doctorConsultationService.addMedicalNotes(bookingId, notes)
doctorConsultationService.uploadPrescription(bookingId, file)
doctorConsultationService.getTodayStats(doctorId)
```

### Doctor Earnings Service

```typescript
doctorEarningsService.getDoctorEarnings(doctorId, filters?)
doctorEarningsService.getTotalEarnings(doctorId)
```

### Doctor Review Service

```typescript
doctorReviewService.getDoctorReviews(doctorId)
doctorReviewService.createReview(reviewData)
doctorReviewService.updateReview(reviewId, updates)
doctorReviewService.deleteReview(reviewId)
```

## Security Features

### Row Level Security (RLS)
- Doctors can only access their own data
- Patients can only view verified, active doctors
- Bookings are protected with proper user/doctor access controls
- Earnings and reviews have appropriate access restrictions

### Authentication
- Secure email/password authentication
- Session management through Supabase Auth
- Protected routes requiring authentication

### Data Validation
- Input validation on all forms
- File type and size restrictions for uploads
- Proper error handling and user feedback

## Automated Features

### Database Triggers

1. **Update Doctor Stats**: Automatically increments `total_consultations` when a new booking is created
2. **Update Doctor Rating**: Recalculates average rating when reviews are added/updated
3. **Update Availability Count**: Automatically tracks booked slots vs capacity

## Future Enhancements

Potential areas for expansion:
1. **Video Call Integration**: Implement real-time video consultation
2. **Chat Feature**: Add messaging between doctors and patients
3. **Payment Integration**: Process payments for consultations
4. **Analytics Dashboard**: Advanced reporting and insights
5. **Multi-doctor Clinics**: Support for clinic management
6. **Prescription Templates**: Pre-defined prescription formats
7. **Appointment Reminders**: SMS/email notifications
8. **Calendar Sync**: Integration with Google Calendar, etc.

## Troubleshooting

### Common Issues

**Issue**: Doctor login fails
- **Solution**: Verify email/password authentication is enabled in Supabase
- Check that the doctor profile exists in the `doctors` table

**Issue**: Cannot upload photos
- **Solution**: Ensure storage buckets are created and have proper permissions
- Check file size limits (max 5MB)

**Issue**: Bookings not showing
- **Solution**: Verify `doctor_id` is properly set in bookings
- Check RLS policies are correctly configured

**Issue**: Availability slots not appearing
- **Solution**: Ensure `is_active` is set to true
- Check date format is correct (YYYY-MM-DD)

## Testing

### Manual Testing Checklist

- [ ] Doctor can sign up and login
- [ ] Profile setup works correctly
- [ ] Photo and credentials upload successfully
- [ ] Availability slots can be created
- [ ] Slots show up in calendar view
- [ ] Consultations appear in the list
- [ ] Filtering works correctly
- [ ] Medical notes can be saved
- [ ] Prescriptions can be uploaded
- [ ] Status updates work properly
- [ ] Dashboard shows correct statistics

### Test Data

Use the following SQL to create test data:

```sql
-- Create a test doctor
INSERT INTO doctors (user_id, full_name, email, phone, specialization, is_verified, is_active)
VALUES (
  'YOUR_AUTH_USER_ID',
  'Dr. Test Smith',
  'test@doctor.com',
  '+1234567890',
  'Veterinary Surgeon',
  true,
  true
);
```

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments in service files
3. Check Supabase logs for errors
4. Review browser console for client-side errors

## License

This implementation is part of the Pet Visit application.
