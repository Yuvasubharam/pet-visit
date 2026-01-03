import React, { useState, useEffect } from 'react';
import { doctorAuthService, doctorConsultationService, doctorAnalyticsService } from '../services/doctorApi';
import type { Doctor, Booking } from '../types';

interface DoctorDashboardProps {
  onProfileSetup: () => void;
  onAvailability: () => void;
  onFeeManagement: () => void;
  onConsultations: () => void;
  doctorId: string | null;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  onProfileSetup,
  onAvailability,
  onFeeManagement,
  onConsultations,
  doctorId,
}) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [analytics, setAnalytics] = useState({
    total_consultations: 0,
    today_total: 0,
    today_completed: 0,
    today_upcoming: 0,
    today_cancelled: 0,
    week_total: 0,
    pending_requests: 0,
    total_earnings: 0,
    paid_earnings: 0,
    pending_earnings: 0,
    rating: 0
  });
  const [earningsGrowth, setEarningsGrowth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [doctorId]);

  const loadDashboardData = async () => {
    if (!doctorId) {
      console.log('[DoctorDashboard] No doctorId provided');
      return;
    }

    try {
      setLoading(true);
      console.log('[DoctorDashboard] Loading dashboard data for doctorId:', doctorId);

      // Load doctor profile
      const doctorProfile = await doctorAuthService.getDoctorById(doctorId);
      console.log('[DoctorDashboard] Doctor profile loaded:', doctorProfile);
      setDoctor(doctorProfile);

      // Load real-time analytics with error handling
      try {
        const analyticsData = await doctorAnalyticsService.getDoctorAnalytics(doctorId);
        console.log('[DoctorDashboard] Analytics data loaded:', analyticsData);
        setAnalytics({
          total_consultations: analyticsData.total_consultations || 0,
          today_total: analyticsData.today_total || 0,
          today_completed: analyticsData.today_completed || 0,
          today_upcoming: analyticsData.today_upcoming || 0,
          today_cancelled: analyticsData.today_cancelled || 0,
          week_total: analyticsData.week_total || 0,
          pending_requests: analyticsData.pending_requests || 0,
          total_earnings: analyticsData.total_earnings || 0,
          paid_earnings: analyticsData.paid_earnings || 0,
          pending_earnings: analyticsData.pending_earnings || 0,
          rating: analyticsData.rating || 0
        });
      } catch (analyticsError) {
        console.error('[DoctorDashboard] Analytics loading failed (non-critical):', analyticsError);
        // Continue with default analytics values
      }

      // Load earnings growth percentage with error handling
      try {
        const growth = await doctorAnalyticsService.getEarningsGrowth(doctorId);
        console.log('[DoctorDashboard] Earnings growth loaded:', growth);
        setEarningsGrowth(growth || 0);
      } catch (growthError) {
        console.error('[DoctorDashboard] Earnings growth loading failed (non-critical):', growthError);
        // Continue with default growth value
      }

      // Load all bookings for this doctor
      console.log('[DoctorDashboard] Fetching bookings for doctorId:', doctorId);
      const allBookings = await doctorConsultationService.getDoctorBookings(doctorId, {});
      console.log('[DoctorDashboard] All bookings received:', allBookings?.length, allBookings);

      // Filter upcoming bookings (assigned to this doctor and confirmed)
      const upcoming = allBookings.filter((b: Booking) =>
        b.doctor_id === doctorId &&
        b.status === 'upcoming'
      ).sort((a: Booking, b: Booking) => {
        // Sort by date and time
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
      console.log('[DoctorDashboard] Upcoming bookings:', upcoming.length, upcoming);
      setUpcomingBookings(upcoming);

      // Filter pending bookings (either unassigned OR assigned to this doctor but pending approval)
      const pending = allBookings.filter((b: Booking) =>
        (!b.doctor_id || (b.doctor_id === doctorId && b.status === 'pending'))
      ).sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
      console.log('[DoctorDashboard] Pending bookings:', pending.length, pending);
      setPendingBookings(pending);
    } catch (error) {
      console.error('[DoctorDashboard] Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    if (!doctorId) return;

    setProcessingBooking(bookingId);
    try {
      await doctorConsultationService.acceptBooking(bookingId, doctorId);
      // Reload dashboard data
      await loadDashboardData();
      alert('Booking accepted successfully!');
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    setProcessingBooking(bookingId);
    try {
      await doctorConsultationService.rejectBooking(bookingId);
      // Reload dashboard data
      await loadDashboardData();
      alert('Booking rejected');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-6 bg-background-light dark:bg-background-dark z-20">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-900">Welcome back,</span>
          <h1 className="text-2xl font-bold text-black dark:text-dark tracking-tight">
            {doctor?.full_name || 'Doctor'}
          </h1>
        </div>
        <button
          onClick={onProfileSetup}
          className="relative h-12 w-12 rounded-full ring-2 ring-white dark:ring-surface-dark shadow-md overflow-hidden hover:ring-primary transition-all cursor-pointer active:scale-95"
        >
          {doctor?.profile_photo_url ? (
            <img
              src={doctor.profile_photo_url}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pb-6 overflow-y-auto no-scrollbar space-y-6">
        {/* Analytics */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark">Analytics</h2>
            <button className="text-primary text-sm font-bold hover:opacity-80">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Today's Consultations */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[20px]">event_available</span>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-dark">
                {analytics.today_total}
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-900 font-medium mt-1">
                Today's Total
              </span>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                  {analytics.today_completed} Done
                </span>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                  {analytics.today_upcoming} Upcoming
                </span>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-dark">
                {analytics.week_total}
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-900 font-medium mt-1">
                This Week
              </span>
            </div>

            {/* Total Consultations */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[20px]">stethoscope</span>
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-dark">
                {analytics.total_consultations}
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-900 font-medium mt-1">
                All Time Total
              </span>
            </div>

            {/* Rating */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
              <div className="h-10 w-10 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[20px]">star</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-dark">
                  {analytics.rating ? analytics.rating.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-slate-700">/5</span>
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-900 font-medium mt-1">
                Patient Rating
              </span>
            </div>

            {/* Total Earnings */}
            <div className="col-span-2 bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex-1">
                <span className="text-xs text-slate-700 dark:text-slate-700 font-bold uppercase tracking-wider">
                  Total Earnings
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-dark">
                    ₹{analytics.total_earnings.toFixed(2)}
                  </span>
                  {earningsGrowth !== 0 && (
                    <span className={`${earningsGrowth >= 0 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                      {earningsGrowth >= 0 ? '+' : ''}{earningsGrowth.toFixed(1)}%
                    </span>
                  )}
                </div>
                {analytics.pending_earnings > 0 && (
                  <div className="mt-2 flex gap-2 text-[10px]">
                    <span className="text-slate-600 dark:text-slate-400">
                      Pending: ₹{analytics.pending_earnings.toFixed(2)}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-green-600 dark:text-green-400">
                      Paid: ₹{analytics.paid_earnings.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">payments</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pending Approvals Section - Show if there are pending bookings */}
        {pendingBookings.length > 0 ? (
          <section className="bg-gradient-to-br mb-6 pb-9 from-amber-500 to-orange-500 rounded-2xl py-3 pl-5 pr-3 shadow-lg shadow-amber-500/30 relative overflow-hidden text-white">

            <div className="relative z-10 ">
              <div className="flex items-start gap-4">

                {/* LEFT CONTENT */}
                <div className="flex-1 min-w-0 flex flex-col gap-2 pr-2">
                  <span className="inline-block w-fit py-1 px-3 rounded-full bg-white/20 text-[10px] font-bold backdrop-blur-sm">
                    PENDING APPROVAL
                  </span>

                </div>

              </div>
            </div>

            {/* GLOW DECORATION */}
            <div className="absolute -right-6 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </section>

        ) : (
          /* Upcoming Consultations - Show when no pending */
          <section className="bg-primary rounded-2xl pb-32 p-5 shadow-lg shadow-primary/20 relative overflow-hidden text-white">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="inline-block py-1 px-2 rounded bg-white/20 text-[10px] font-bold mb-2 backdrop-blur-sm">
                    UPCOMING CONSULTATIONS
                  </span>
                  {upcomingBookings.length > 0 ? (
                    <div>
                      <h3 className="text-xl font-bold">
                        {new Date(upcomingBookings[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {upcomingBookings[0].time}
                      </h3>
                      <p className="text-blue-100 text-sm mt-1">
                        {upcomingBookings[0].pets?.name || 'Pet'} • {upcomingBookings[0].booking_type} consultation
                      </p>
                      {upcomingBookings.length > 1 && (
                        <p className="text-blue-100 text-xs mt-1">
                          +{upcomingBookings.length - 1} more consultation{upcomingBookings.length - 1 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold">No upcoming consultations</h3>
                      <p className="text-blue-100 text-sm mt-1">Your schedule is clear</p>
                    </div>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined">calendar_clock</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </section>
        )}

        {/* Pending Approvals - Minimal Compact Cards */}
        {pendingBookings.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-dark">New Booking Request</h2>
              <span className="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                {pendingBookings.length}
              </span>
            </div>

            {/* Show all pending bookings - Minimal Design */}
            {pendingBookings.map((booking) => {
              const getBookingTypeIcon = (type: string) => {
                switch (type) {
                  case 'online': return 'videocam';
                  case 'clinic': return 'local_hospital';
                  case 'home': return 'home';
                  default: return 'event';
                }
              };

              return (
                <div key={booking.id} className="relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800 group">
                  {/* Main Content - Slides on hover */}
                  <div className="bg-white dark:bg-surface-dark p-3 shadow-sm transition-transform duration-300 ease-out group-hover:-translate-x-20">
                    {/* Row 1: Date, Time & Consultation Type */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-lg">
                          schedule
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-dark">
                          {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {booking.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-primary text-sm">
                          {getBookingTypeIcon(booking.booking_type)}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                          {booking.booking_type}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Pet Name, Breed & Owner */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        {booking.pets?.image ? (
                          <img
                            src={booking.pets.image}
                            alt={booking.pets.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-400 text-xl">pets</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-dark truncate">
                          {booking.pets?.name || 'Pet'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-900">
                          {booking.pets?.breed || booking.pets?.species || 'Unknown'} • {(booking as any).users?.name || 'Owner'}
                        </p>
                      </div>
                    </div>

                    {/* Row 3: Address (Only for home visits) */}
                    {booking.booking_type === 'home' && booking.addresses && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-orange-500 text-sm">location_on</span>
                        <p className="text-xs text-slate-700 dark:text-slate-900 truncate">
                          {booking.addresses.full_address || `${booking.addresses.street}, ${booking.addresses.city}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Revealed on hover (Vertical Stack) */}
                  <div className="absolute right-0 top-0 h-full flex flex-col items-center justify-center gap-2 pr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleAcceptBooking(booking.id)}
                      disabled={processingBooking === booking.id}
                      className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                      title="Accept"
                    >
                      {processingBooking === booking.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <span className="material-symbols-outlined text-2xl">check</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleRejectBooking(booking.id)}
                      disabled={processingBooking === booking.id}
                      className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                      title="Reject"
                    >
                      {processingBooking === booking.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <span className="material-symbols-outlined text-2xl">close</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-dark mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {/* Availability */}
            <button
              onClick={onAvailability}
              className="w-full bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-[#2C3E50] dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 group-hover:bg-white/10 relative transition-colors">
                <div className="h-full w-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-slate-600 group-hover:text-white transition-colors">event</span>
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-slate-900 dark:text-dark group-hover:text-white transition-colors">Availability & Slots</h3>
                <p className="text-xs text-slate-700 dark:text-slate-900 group-hover:text-slate-300 mt-0.5 transition-colors">Update your schedule</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-white pr-2 transition-colors">
                chevron_right
              </span>
            </button>

            {/* Fee Management */}
            <button
              onClick={() => {
                console.log('[DoctorDashboard] Fee Management button clicked');
                onFeeManagement();
              }}
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

            {/* Consultations */}
            <button
              onClick={onConsultations}
              className="w-full bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-[#2C3E50] dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 group-hover:bg-white/10 relative transition-colors">
                <div className="h-full w-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-slate-600 group-hover:text-white transition-colors">
                    medical_services
                  </span>
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-slate-900 dark:text-dark group-hover:text-white transition-colors">Consultations</h3>
                <p className="text-xs text-slate-700 dark:text-slate-900 group-hover:text-slate-300 mt-0.5 transition-colors">
                  Overview of patient visits
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-white pr-2 transition-colors">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
