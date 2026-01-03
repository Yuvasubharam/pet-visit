import React, { useState, useEffect } from 'react';
import { groomingStoreAuthService, groomingStoreBookingService, groomingStoreEarningsService } from '../services/groomingStoreApi';

interface GroomingStoreDashboardProps {
  storeId: string | null;
  onBookings: () => void;
  onPackages: () => void;
  onStoreSettings: () => void;
  onLogout: () => void;
}

const GroomingStoreDashboard: React.FC<GroomingStoreDashboardProps> = ({
  storeId,
  onBookings,
  onPackages,
  onStoreSettings,
  onLogout,
}) => {
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      loadDashboardData();
    }
  }, [storeId]);

  const loadDashboardData = async () => {
    if (!storeId) return;

    try {
      setLoading(true);

      // Load store profile
      const user = await groomingStoreAuthService.getCurrentUser();
      if (user) {
        const profile = await groomingStoreAuthService.getGroomingStoreProfile(user.id);
        setStoreProfile(profile);
      }

      // Load booking stats
      const bookingStats = await groomingStoreBookingService.getBookingStats(storeId);
      setStats(bookingStats);

      // Load earnings stats
      const earningsStats = await groomingStoreEarningsService.getEarningsStats(storeId);
      setEarnings(earningsStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await groomingStoreAuthService.signOut();
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-primary tracking-tight">
                {storeProfile?.store_name || 'Grooming Store'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Store Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-slate-700">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        {/* Stats Overview */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Overview</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Total Bookings */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-xl">calendar_month</span>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{stats?.total || 0}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Total Bookings</p>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{stats?.completed || 0}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Completed</p>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-xl">pending</span>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{stats?.upcoming || 0}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Upcoming</p>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 text-xl">payments</span>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">₹{stats?.total_revenue?.toFixed(0) || 0}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Total Revenue</p>
            </div>
          </div>
        </section>

        {/* Earnings Summary */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Earnings</h2>

          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">account_balance_wallet</span>
                </div>
                <div>
                  <p className="text-xs font-medium opacity-80">Total Earnings</p>
                  <p className="text-2xl font-black">₹{earnings?.total_earnings?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs font-medium opacity-80">Pending</p>
                <p className="text-lg font-black">₹{earnings?.pending_earnings?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-xs font-medium opacity-80">Paid Out</p>
                <p className="text-lg font-black">₹{earnings?.paid_earnings?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Quick Actions</h2>

          <div className="space-y-3">
            <button
              onClick={onBookings}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-xl">event_note</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900">Manage Bookings</p>
                  <p className="text-xs text-slate-500 mt-0.5">View and manage all bookings</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>

            <button
              onClick={onPackages}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900">Manage Packages</p>
                  <p className="text-xs text-slate-500 mt-0.5">Edit grooming packages & pricing</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>

            <button
              onClick={onStoreSettings}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-xl">settings</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-900">Store Settings</p>
                  <p className="text-xs text-slate-500 mt-0.5">Update store information</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* Service Type Stats */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Service Breakdown</h2>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-xl">home</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Home Visits</p>
                    <p className="text-xs text-slate-500">Door-to-door service</p>
                  </div>
                </div>
                <p className="text-xl font-black text-slate-900">{stats?.home_visits || 0}</p>
              </div>

              <div className="border-t border-slate-100"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 text-xl">store</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Clinic Visits</p>
                    <p className="text-xs text-slate-500">In-store service</p>
                  </div>
                </div>
                <p className="text-xl font-black text-slate-900">{stats?.clinic_visits || 0}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GroomingStoreDashboard;
