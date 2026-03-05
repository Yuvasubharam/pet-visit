import React, { useState, useEffect } from 'react';
import { doctorConsultationService, doctorAuthService } from '../services/doctorApi';
import type { Booking } from '../types';

interface DoctorConsultationsProps {
  onBack: () => void;
  onDetailClick: (booking: Booking) => void;
  onJoinCall?: (booking: Booking) => void;
  doctorId: string | null;
}

const DoctorConsultations: React.FC<DoctorConsultationsProps> = ({ onBack, onDetailClick, onJoinCall, doctorId }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'lapsed' | 'completed'>('active');
  const [activeFilter, setActiveFilter] = useState<'all' | 'clinic' | 'online' | 'home'>('all');
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // Check if a booking is lapsed (scheduled time passed but not attended)
  const isBookingLapsed = (booking: Booking): boolean => {
    try {
      const now = new Date();

      // Convert time to 24-hour format if needed
      let timeStr = booking.time;
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const isPM = timeStr.includes('PM');
        const timeOnly = timeStr.replace(/\s*(AM|PM)/i, '').trim();
        const [hours, minutes] = timeOnly.split(':').map(Number);
        let hour24 = hours;

        if (isPM && hours !== 12) {
          hour24 = hours + 12;
        } else if (!isPM && hours === 12) {
          hour24 = 0;
        }

        timeStr = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }

      const appointmentDateTime = new Date(`${booking.date}T${timeStr}`);

      // Check if the date is valid
      if (isNaN(appointmentDateTime.getTime())) {
        console.error('[DoctorConsultations] Invalid appointment date/time:', booking.date, booking.time);
        return false;
      }

      // Booking is lapsed if:
      // 1. Status is still 'upcoming' or 'pending' (not completed or cancelled)
      // 2. The scheduled time has passed
      const isLapsed = (booking.status === 'upcoming' || booking.status === 'pending') &&
        appointmentDateTime < now;

      if (isLapsed) {
        console.log('[DoctorConsultations] Lapsed booking detected:', {
          id: booking.id,
          date: booking.date,
          time: booking.time,
          appointmentDateTime: appointmentDateTime.toISOString(),
          now: now.toISOString()
        });
      }

      return isLapsed;
    } catch (error) {
      console.error('[DoctorConsultations] Error checking if booking is lapsed:', error);
      return false;
    }
  };

  useEffect(() => {
    loadData();
  }, [doctorId]); // Only reload all data when doctorId changes

  // Filter bookings based on active tab and filter
  const filteredBookings = React.useMemo(() => {
    let filtered = [...allBookings];

    // Apply service type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(b => b.booking_type === activeFilter);
    }

    // Apply tab filter
    if (activeTab === 'completed') {
      return filtered.filter(b => b.status === 'completed');
    } else if (activeTab === 'lapsed') {
      return filtered.filter(b =>
        (b.status === 'pending' || b.status === 'upcoming') && isBookingLapsed(b)
      );
    } else {
      // Active tab
      return filtered.filter(b =>
        (b.status === 'pending' || b.status === 'upcoming') && !isBookingLapsed(b)
      );
    }
  }, [allBookings, activeTab, activeFilter]);

  // For the active tab, we also want to know if there are ANY lapsed bookings to show the section
  const lapsedBookingsCount = React.useMemo(() => {
    return allBookings.filter(b =>
      (b.status === 'pending' || b.status === 'upcoming') && isBookingLapsed(b)
    ).length;
  }, [allBookings]);

  const loadData = async () => {
    if (!doctorId) {
      console.log('[DoctorConsultations] No doctorId provided - doctorId is:', doctorId);
      console.log('[DoctorConsultations] This means you are not logged in as a doctor');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[DoctorConsultations] Loading data for doctorId:', doctorId);

      // Load doctor profile
      const profile = await doctorAuthService.getDoctorById(doctorId);
      console.log('[DoctorConsultations] Doctor profile loaded:', profile);
      setDoctorProfile(profile);

      // Load ALL bookings for this doctor (filtering will be done in useMemo)
      const data = await doctorConsultationService.getDoctorBookings(doctorId);
      console.log('[DoctorConsultations] Total bookings received:', data?.length, data);

      setAllBookings(data || []);
    } catch (error) {
      console.error('[DoctorConsultations] Error loading consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    if (!doctorId) return;

    try {
      await doctorConsultationService.acceptBooking(bookingId, doctorId);
      // Reload bookings after accepting
      await loadData();
    } catch (error) {
      console.error('[DoctorConsultations] Error accepting booking:', error);
      alert('Failed to accept booking. Please try again.');
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    try {
      await doctorConsultationService.rejectBooking(bookingId);
      // Reload bookings after rejecting
      await loadData();
    } catch (error) {
      console.error('[DoctorConsultations] Error rejecting booking:', error);
      alert('Failed to reject booking. Please try again.');
    }
  };

  const handleMarkAsCompleted = async (bookingId: string) => {
    if (!confirm('Mark this consultation as completed?')) return;

    try {
      await doctorConsultationService.completeBooking(bookingId);
      // Reload bookings after completing
      await loadData();
    } catch (error) {
      console.error('[DoctorConsultations] Error completing booking:', error);
      alert('Failed to mark booking as completed. Please try again.');
    }
  };

  const handleNotifyCustomerReschedule = async (bookingId: string, customerName: string, userId: string) => {
    if (!confirm(`Send reschedule notification to ${customerName}?`)) return;

    try {
      console.log('[DoctorConsultations] Sending reschedule notification for booking:', bookingId);

      // Create notification using the notification service
      const { notificationService } = await import('../services/api');
      await notificationService.createNotification({
        userId: userId,
        bookingId: bookingId,
        type: 'reschedule_request',
        title: 'Appointment Rescheduling Required',
        message: 'Your appointment time has lapsed. Please reschedule your consultation to a new date and time.',
      });

      alert(`Reschedule notification sent to ${customerName}. The customer will receive a notification in their app.`);

      // Optionally reload bookings
      await loadData();
    } catch (error) {
      console.error('[DoctorConsultations] Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'online':
        return 'blue';
      case 'clinic':
        return 'emerald';
      case 'home':
        return 'orange';
      default:
        return 'slate';
    }
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'online':
        return 'videocam';
      case 'clinic':
        return 'local_hospital';
      case 'home':
        return 'home_health';
      default:
        return 'event';
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-2 pt-8 z-20">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onBack}
            className="text-slate-900 dark:text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 light:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark tracking-tight">
              Consultations
            </h1>
            <p className="text-slate-500 dark:text-slate-900 text-sm mt-1">
              Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-sm text-primary dark:text-slate-900 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all">
            <span className="material-symbols-outlined">search</span>
          </button>
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-white dark:border-surface-dark">
            {doctorProfile?.profile_photo_url ? (
              <img
                src={doctorProfile.profile_photo_url}
                alt="Dr. Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-primary">person</span>
            )}
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="px-6 pt-2 pb-0">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'active'
              ? 'bg-white dark:bg-surface-dark text-primary shadow-md'
              : 'text-slate-600 dark:text-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('lapsed')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'lapsed'
              ? 'bg-white dark:bg-surface-dark text-red-600 shadow-md'
              : 'text-slate-600 dark:text-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            Lapsed
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'completed'
              ? 'bg-white dark:bg-surface-dark text-primary shadow-md'
              : 'text-slate-600 dark:text-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-4">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold ${activeFilter === 'all'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-800 border border-slate-100 dark:border-slate-700'
              }`}
          >
            All Visits
          </button>
          <button
            onClick={() => setActiveFilter('clinic')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${activeFilter === 'clinic'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-800 border border-slate-100 dark:border-slate-700'
              }`}
          >
            Clinic Visits
          </button>
          <button
            onClick={() => setActiveFilter('online')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${activeFilter === 'online'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-800 border border-slate-100 dark:border-slate-700'
              }`}
          >
            Online
          </button>
          <button
            onClick={() => setActiveFilter('home')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${activeFilter === 'home'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-800 border border-slate-100 dark:border-slate-700'
              }`}
          >
            Home
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-20 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading consultations...</p>
          </div>
        ) : filteredBookings.length === 0 && (activeTab !== 'active' || lapsedBookingsCount === 0) ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">
              event_busy
            </span>
            <p className="text-slate-600 dark:text-slate-400">No consultations found</p>
          </div>
        ) : (
          <>
            {/* Render bookings based on active tab */}
            {activeTab === 'lapsed' ? (
              <>
                {/* Lapsed Tab - Show all lapsed bookings */}
                <div className="flex items-center gap-2 pt-2 mb-4">
                  <span className="material-symbols-outlined text-red-500 text-xl">schedule</span>
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">Missed Appointments</h3>
                </div>
                {filteredBookings.map((booking) => {
                  const color = getBookingTypeColor(booking.booking_type);
                  const icon = getBookingTypeIcon(booking.booking_type);

                  return (
                    <div
                      key={booking.id}
                      className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 shadow-sm border-2 border-red-200 dark:border-red-800 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>

                      {/* Booking Type Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-sm">{icon}</span>
                          {booking.booking_type} Consultation
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md">
                            LAPSED
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                            {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {booking.time}
                          </span>
                        </div>
                      </div>

                      {/* Pet Info */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="size-14 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                          {booking.pets?.image ? (
                            <img
                              src={booking.pets.image}
                              alt={booking.pets.name || 'Pet'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400 text-3xl">pets</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-dark text-lg">
                            {booking.pets?.name || 'Pet Name Not Available'}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {booking.pets?.breed && booking.pets?.species
                              ? `${booking.pets.breed} (${booking.pets.species})`
                              : booking.pets?.breed || booking.pets?.species || 'Breed not specified'
                            }
                            {' • '}
                            {booking.pets?.age ? `${booking.pets.age} yrs` : 'Age unknown'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Owner: {(booking as any).users?.name || 'Name not available'}
                          </p>
                        </div>
                      </div>

                      {/* Action: Notify Customer to Reschedule */}
                      <button
                        onClick={() => handleNotifyCustomerReschedule(booking.id, (booking as any).users?.name || 'Customer', booking.user_id)}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">notifications_active</span>
                        <span>Notify Customer to Reschedule</span>
                      </button>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {/* Active/Completed Tabs */}
                {(() => {
                  const lapsedInThisFilter = allBookings.filter(b => 
                    (b.status === 'pending' || b.status === 'upcoming') && 
                    isBookingLapsed(b) &&
                    (activeFilter === 'all' || b.booking_type === activeFilter)
                  );
                  const activeInThisFilter = filteredBookings;

                  return (
                    <>
                      {/* Lapsed Bookings Section - Only show in active tab */}
                      {lapsedInThisFilter.length > 0 && activeTab === 'active' && (
                        <>
                          <div className="flex items-center gap-2 pt-2">
                            <span className="material-symbols-outlined text-red-500 text-xl">schedule</span>
                            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">Missed Appointments</h3>
                          </div>
                          {lapsedInThisFilter.map((booking) => {
                            const icon = getBookingTypeIcon(booking.booking_type);

                            return (
                              <div
                                key={booking.id}
                                className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 shadow-sm border-2 border-red-200 dark:border-red-800 relative overflow-hidden group"
                              >
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>

                                {/* Booking Type Badge */}
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm">{icon}</span>
                                    {booking.booking_type} Consultation
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md">
                                      LAPSED
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                                      {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {booking.time}
                                    </span>
                                  </div>
                                </div>

                                {/* Pet Info */}
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="size-14 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                                    {booking.pets?.image ? (
                                      <img
                                        src={booking.pets.image}
                                        alt={booking.pets.name || 'Pet'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <span className="material-symbols-outlined text-slate-400 text-3xl">pets</span>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-slate-900 dark:text-dark text-lg">
                                      {booking.pets?.name || 'Pet Name Not Available'}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      {booking.pets?.breed && booking.pets?.species
                                        ? `${booking.pets.breed} (${booking.pets.species})`
                                        : booking.pets?.breed || booking.pets?.species || 'Breed not specified'
                                      }
                                      {' • '}
                                      {booking.pets?.age ? `${booking.pets.age} yrs` : 'Age unknown'}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                      Owner: {(booking as any).users?.name || 'Name not available'}
                                    </p>
                                  </div>
                                </div>

                                {/* Action: Notify Customer to Reschedule */}
                                <button
                                  onClick={() => handleNotifyCustomerReschedule(booking.id, (booking as any).users?.name || 'Customer', booking.user_id)}
                                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-lg">notifications_active</span>
                                  <span>Notify Customer to Reschedule</span>
                                </button>
                              </div>
                            );
                          })}

                          {/* Separator if there are also active bookings */}
                          {activeInThisFilter.length > 0 && (
                            <div className="flex items-center gap-2 pt-4">
                              <span className="material-symbols-outlined text-primary text-xl">event_available</span>
                              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Upcoming Appointments</h3>
                            </div>
                          )}
                        </>
                      )}

                      {/* Active/Completed Bookings */}
                      {activeInThisFilter.map((booking) => {
                        const color = getBookingTypeColor(booking.booking_type);
                        const icon = getBookingTypeIcon(booking.booking_type);

                        return (
                          <div
                            key={booking.id}
                            className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group"
                          >
                            <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-400`}></div>

                            {/* Booking Type Badge */}
                            <div className="flex justify-between items-start mb-4">
                              <div
                                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-${color}-50 dark:bg-${color}-900/10 text-${color}-600 dark:text-${color}-500 text-xs font-bold uppercase tracking-wider`}
                              >
                                <span className="material-symbols-outlined text-sm">{icon}</span>
                                {booking.booking_type} Consultation
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-slate-900 dark:text-white text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                  {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                                  {booking.time}
                                </span>
                              </div>
                            </div>

                            {/* Pet Info */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="size-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                {booking.pets?.image ? (
                                  <img
                                    src={booking.pets.image}
                                    alt={booking.pets.name || 'Pet'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      console.error('[DoctorConsultations] Failed to load pet image:', booking.pets?.image);
                                    }}
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-slate-400 text-3xl">pets</span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 dark:text-dark text-lg">
                                  {booking.pets?.name || 'Pet Name Not Available'}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-900">
                                  {booking.pets?.breed && booking.pets?.species
                                    ? `${booking.pets.breed} (${booking.pets.species})`
                                    : booking.pets?.breed || booking.pets?.species || 'Breed not specified'
                                  }
                                  {' • '}
                                  {booking.pets?.age ? `${booking.pets.age} yrs` : 'Age unknown'}
                                </p>
                                <p className="text-xs text-slate-900 mt-0.5">
                                  Owner: {(booking as any).users?.name || 'Name not available'}
                                </p>
                                {(booking as any).users?.phone && (
                                  <p className="text-xs text-slate-900 mt-0.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">call</span>
                                    {(booking as any).users.phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Home Visit Address */}
                            {booking.booking_type === 'home' && booking.addresses && (
                              <div className="bg-slate-50 dark:bg-slate-800/90 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">
                                  location_on
                                </span>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                  {booking.addresses.full_address || `${booking.addresses.street}, ${booking.addresses.city}`}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            {booking.status === 'completed' ? (
                              // Completed consultation - Show Review button and View Details
                              <div className="flex flex-col gap-2 mt-2">
                                <div className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm">
                                      check_circle
                                    </span>
                                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                      Consultation Completed
                                    </span>
                                  </div>
                                  {booking.payment_amount && (
                                    <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                      ₹{booking.payment_amount}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => onDetailClick(booking)}
                                  className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-primary dark:text-sky-300 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 group"
                                >
                                  <span>View Details</span>
                                  <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                                    arrow_forward
                                  </span>
                                </button>
                              </div>
                            ) : !booking.doctor_id || booking.status === 'pending' ? (
                              // New booking or Pending approval - Show Accept/Reject buttons
                              <div className="flex gap-3 mt-2">
                                <button
                                  onClick={() => handleAcceptBooking(booking.id)}
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-lg">check_circle</span>
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleRejectBooking(booking.id)}
                                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-lg">cancel</span>
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : booking.booking_type === 'online' && booking.status === 'upcoming' ? (
                              // Accepted online booking - Show Join Call button
                              <div className="flex gap-3 mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('[DoctorConsultations] Joining call for booking:', booking.id);
                                    if (onJoinCall) {
                                      onJoinCall(booking);
                                    } else {
                                      alert('Join Call: Navigation handler not configured');
                                    }
                                  }}
                                  className="flex-1 bg-primary hover:bg-[#013d63] text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">videocam</span>
                                  <span>Join Call</span>
                                </button>
                                <button
                                  onClick={() => onDetailClick(booking)}
                                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                                >
                                  Details
                                </button>
                              </div>
                            ) : (
                              // Accepted booking - Show View Details button
                              <button
                                onClick={() => onDetailClick(booking)}
                                className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-primary dark:text-sky-300 py-3 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 group"
                              >
                                <span>View Details</span>
                                <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                                  arrow_forward
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorConsultations;
