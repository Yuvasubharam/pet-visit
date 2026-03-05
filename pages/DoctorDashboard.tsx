import React, { useState, useEffect } from 'react';
import { doctorAuthService, doctorConsultationService, doctorAnalyticsService } from '../services/doctorApi';
import { supabase } from '../lib/supabase';
import type { Doctor, Booking } from '../types';

interface DoctorDashboardProps {
  onProfileSetup: () => void;
  onAvailability: () => void;
  onFeeManagement: () => void;
  onConsultations: () => void;
  onLogout: () => void;
  onManageOrders: () => void;
  onManageProducts: () => void;
  doctorId: string | null;
}

interface ProductProfitStats {
  totalProfit: number;
  totalOrders: number;
  totalSalesValue: number;
  totalPurchaseValue: number;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  onProfileSetup,
  onAvailability,
  onFeeManagement,
  onConsultations,
  onLogout,
  onManageOrders,
  onManageProducts,
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
  const [productProfits, setProductProfits] = useState<ProductProfitStats>({
    totalProfit: 0,
    totalOrders: 0,
    totalSalesValue: 0,
    totalPurchaseValue: 0
  });

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
      try {
        const doctorProfile = await doctorAuthService.getDoctorById(doctorId);
        console.log('[DoctorDashboard] Doctor profile loaded:', doctorProfile);
        setDoctor(doctorProfile);
      } catch (profileError: any) {
        // PGRST116 means no rows found - this is expected for new doctors who haven't set up profile
        if (profileError?.code === 'PGRST116') {
          console.log('[DoctorDashboard] No doctor profile found - new doctor needs to complete setup');
          setDoctor(null);
        } else {
          console.error('[DoctorDashboard] Error loading doctor profile:', profileError);
        }
      }

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

      // Load product profit stats (based on sale price - purchase price)
      await loadProductProfitStats(doctorId);
    } catch (error) {
      console.error('[DoctorDashboard] Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductProfitStats = async (doctorId: string) => {
    try {
      // Fetch order items for this doctor's products with price info
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          unit_price,
          total_price,
          shop_products!inner(
            id,
            seller_id,
            purchase_price,
            price
          )
        `)
        .eq('shop_products.seller_id', doctorId);

      if (error) {
        console.error('Error loading product profit stats:', error);
        return;
      }

      let totalSalesValue = 0;
      let totalPurchaseValue = 0;
      let totalOrders = new Set();

      (orderItems || []).forEach((item: any) => {
        const salePrice = item.unit_price || item.shop_products?.price || 0;
        const purchasePrice = item.shop_products?.purchase_price || 0;
        const quantity = item.quantity || 1;

        totalSalesValue += salePrice * quantity;
        totalPurchaseValue += purchasePrice * quantity;
        if (item.order_id) totalOrders.add(item.order_id);
      });

      const totalProfit = totalSalesValue - totalPurchaseValue;

      setProductProfits({
        totalProfit,
        totalOrders: totalOrders.size || orderItems?.length || 0,
        totalSalesValue,
        totalPurchaseValue
      });
    } catch (error) {
      console.error('Error loading product profit stats:', error);
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

  // Handle Pending Approval
  if (doctor?.approval === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-white dark:bg-background-dark max-w-md mx-auto shadow-xl">
        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-amber-500 text-5xl">pending_actions</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-dark mb-2">Approval Pending</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Welcome, <span className="font-bold text-primary">Dr. {doctor.full_name}</span>. Your registration is currently under review. Our admin team will verify your credentials and approve your account soon.
        </p>
        <div className="w-full bg-slate-50 dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8 text-left">
          <h3 className="text-sm font-bold text-slate-900 dark:text-dark mb-2">Verification Steps:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
              Registration Received
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-amber-500 text-sm">hourglass_empty</span>
              Credential Verification (In Progress)
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-slate-300 text-sm">radio_button_unchecked</span>
              Final Approval & Dashboard Access
            </li>
          </ul>
        </div>
        <button 
          onClick={onLogout}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-slate-200"
        >
          Logout
        </button>
      </div>
    );
  }

  // Handle Rejected Application
  if (doctor?.approval === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-white dark:bg-background-dark max-w-md mx-auto shadow-xl">
        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-red-500 text-5xl">cancel</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-dark mb-2">Application Rejected</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          {doctor.rejection_reason || 'Unfortunately, your application was not approved at this time. Please contact our support team for more details.'}
        </p>
        <div className="w-full p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 mb-8">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            If you believe this was an error, please reach out to support@petvisit.com
          </p>
        </div>
        <button 
          onClick={onLogout}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform"
        >
          Logout
        </button>
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
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-700 dark:text-slate-700 font-bold uppercase tracking-wider">
                    Total Earnings
                  </span>
                  <div className="group relative">
                    <span className="material-symbols-outlined text-[14px] text-slate-400 cursor-help">info</span>
                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      Amount shown is net after platform fee deduction.
                    </div>
                  </div>
                </div>
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

        {/* Store Product Profit Section */}
        {doctor?.approval === 'approved' && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark">Product Sales Profit</h2>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 shadow-lg text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">trending_up</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-medium opacity-80">Total Profit Earned</p>
                      <div className="group/info relative">
                        <span className="material-symbols-outlined text-[14px] text-white/60 cursor-help">info</span>
                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50">
                          Profit = Sale Price - Purchase Price for all sold products.
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-black">₹{productProfits.totalProfit.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-[10px] font-medium opacity-80">Sales Value</p>
                  <p className="text-sm font-black">₹{productProfits.totalSalesValue.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium opacity-80">Cost Value</p>
                  <p className="text-sm font-black">₹{productProfits.totalPurchaseValue.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium opacity-80">Orders</p>
                  <p className="text-sm font-black">{productProfits.totalOrders}</p>
                </div>
              </div>
            </div>

            {/* Margin Rate Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 text-xl">percent</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-dark">Profit Margin</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">On product sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-600">
                    {productProfits.totalSalesValue > 0
                      ? ((productProfits.totalProfit / productProfits.totalSalesValue) * 100).toFixed(1)
                      : 0}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Avg margin</p>
                </div>
              </div>
            </div>
          </section>
        )}

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

            {/* Store Management (Only if approved) */}
            {doctor?.approval === 'approved' && (
              <>
                <button
                  onClick={onManageOrders}
                  className="w-full bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-orange-500 transition-colors group"
                >
                  <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-orange-50 group-hover:bg-white/10 relative transition-colors">
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-orange-600 group-hover:text-white transition-colors">shopping_bag</span>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-slate-900 dark:text-dark group-hover:text-white transition-colors">Order Management</h3>
                    <p className="text-xs text-slate-700 dark:text-slate-900 group-hover:text-orange-100 mt-0.5 transition-colors">Manage product orders</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-white pr-2 transition-colors">
                    chevron_right
                  </span>
                </button>

                <button
                  onClick={onManageProducts}
                  className="w-full bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-blue-500 transition-colors group"
                >
                  <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-blue-50 group-hover:bg-white/10 relative transition-colors">
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-blue-600 group-hover:text-white transition-colors">inventory_2</span>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-slate-900 dark:text-dark group-hover:text-white transition-colors">Store Management</h3>
                    <p className="text-xs text-slate-700 dark:text-slate-900 group-hover:text-blue-100 mt-0.5 transition-colors">Manage shop inventory</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-white pr-2 transition-colors">
                    chevron_right
                  </span>
                </button>
              </>
            )}

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 flex items-center gap-4 hover:bg-red-500 dark:hover:bg-red-600 transition-colors group"
            >
              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-red-50 group-hover:bg-white/10 relative transition-colors">
                <div className="h-full w-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-red-500 group-hover:text-white transition-colors">logout</span>
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-slate-900 dark:text-dark group-hover:text-white transition-colors">Logout</h3>
                <p className="text-xs text-slate-700 dark:text-slate-900 group-hover:text-red-100 mt-0.5 transition-colors">Sign out of your account</p>
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
