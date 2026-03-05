import React, { useState, useEffect } from 'react';
import { groomingStoreAuthService, groomingStoreBookingService, groomingStoreEarningsService } from '../services/groomingStoreApi';
import { supabase } from '../lib/supabase';

interface GroomingStoreDashboardProps {
  storeId: string | null;
  onBookings: () => void;
  onPackages: () => void;
  onStoreSettings: () => void;
  onManageOrders: () => void;
  onManageProducts: () => void;
  onLogout: () => void;
}

interface ProductProfitStats {
  totalProfit: number;
  totalOrders: number;
  totalSalesValue: number;
  totalPurchaseValue: number;
}

const GroomingStoreDashboard: React.FC<GroomingStoreDashboardProps> = ({
  storeId,
  onBookings,
  onPackages,
  onStoreSettings,
  onManageOrders,
  onManageProducts,
  onLogout,
}) => {
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productProfits, setProductProfits] = useState<ProductProfitStats>({
    totalProfit: 0,
    totalOrders: 0,
    totalSalesValue: 0,
    totalPurchaseValue: 0
  });

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

      // Load product profit stats (based on sale price - purchase price)
      await loadProductProfitStats(storeId);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductProfitStats = async (storeId: string) => {
    try {
      // Fetch order items for this store's products with price info
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
        .eq('shop_products.seller_id', storeId);

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

  // Handle Pending Approval
  if (storeProfile?.approval_status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-white max-w-md mx-auto shadow-xl">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-amber-500 text-5xl">pending_actions</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Store Pending Approval</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Welcome, <span className="font-bold text-primary">{storeProfile.store_name}</span>. Your grooming store registration is currently under review. Our admin team will verify your details and approve your account soon.
        </p>
        <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 text-left">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Onboarding Status:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-xs text-slate-600">
              <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
              Registration Submitted
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-600">
              <span className="material-symbols-outlined text-amber-500 text-sm">hourglass_empty</span>
              Admin Review (In Progress)
            </li>
            <li className="flex items-center gap-2 text-xs text-slate-600">
              <span className="material-symbols-outlined text-slate-300 text-sm">radio_button_unchecked</span>
              Marketplace Activation
            </li>
          </ul>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-slate-200"
        >
          Logout
        </button>
      </div>
    );
  }

  // Handle Rejected Application
  if (storeProfile?.approval_status === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-white max-w-md mx-auto shadow-xl">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-red-500 text-5xl">cancel</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Registration Rejected</h1>
        <p className="text-slate-500 mb-4 leading-relaxed">
          {storeProfile.rejection_reason || 'Unfortunately, your grooming store application was not approved at this time. Please contact our support team for more details.'}
        </p>
        <div className="w-full p-4 bg-red-50 rounded-xl border border-red-100 mb-8">
          <p className="text-xs text-red-600 font-medium">
            For appeals, please contact support@petvisit.com
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform"
        >
          Logout
        </button>
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
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium opacity-80">Total Earnings</p>
                    <div className="group/info relative">
                      <span className="material-symbols-outlined text-[14px] text-white/60 cursor-help">info</span>
                      <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50">
                        Amount shown is net after platform fee deduction.
                      </div>
                    </div>
                  </div>
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

          {/* Platform Fee Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-xl">receipt_long</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Platform Fee</p>
                  <p className="text-xs text-slate-500">Deducted from earnings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-amber-600">{storeProfile?.platform_fee_percentage || storeProfile?.margin_percentage || 0}%</p>
                <p className="text-[10px] text-slate-400 font-medium">Per booking</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">info</span>
                <p>This percentage is deducted from each booking amount. The remaining amount is credited to your earnings.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Store Product Profit Section */}
        {storeProfile?.approval_status === 'approved' && (
          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Product Sales Profit</h2>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 shadow-lg text-white">
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
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 text-xl">percent</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Profit Margin</p>
                    <p className="text-xs text-slate-500">On product sales</p>
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

            {/* Store Management (Only if approved) */}
            {storeProfile?.approval_status === 'approved' && (
              <>
                <button
                  onClick={onManageOrders}
                  className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <span className="material-symbols-outlined text-orange-600 text-xl">shopping_bag</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-900">Order Management</p>
                      <p className="text-xs text-slate-500 mt-0.5">Manage product orders</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-orange-600 transition-colors">
                    chevron_right
                  </span>
                </button>

                <button
                  onClick={onManageProducts}
                  className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <span className="material-symbols-outlined text-blue-600 text-xl">inventory_2</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-900">Store Products</p>
                      <p className="text-xs text-slate-500 mt-0.5">Manage shop inventory</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 transition-colors">
                    chevron_right
                  </span>
                </button>
              </>
            )}
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
