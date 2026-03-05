import React, { useState, useEffect } from 'react';
import { adminAnalyticsService, adminProductService } from '../services/adminApi';
import { AdminDashboardStats } from '../types';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  adminId: string | null;
  onCustomerManagement: () => void;
  onDoctorManagement: () => void;
  onShopManagement: () => void;
  onAdminUsers: () => void;
  onSellerApprovals: () => void;
  onOrderManagement: () => void;
  onSettlementManagement: () => void;
  onMarginManagement: () => void;
  onNotifications: () => void;
  onLogout: () => void;
}

interface ConsolidatedEarnings {
  totalProductMargin: number;
  totalPlatformFees: number;
  totalDeliveryFees: number;
  consolidatedTotal: number;
  productCount: number;
  orderCount: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminId,
  onCustomerManagement,
  onDoctorManagement,
  onShopManagement,
  onAdminUsers,
  onSellerApprovals,
  onOrderManagement,
  onSettlementManagement,
  onMarginManagement,
  onNotifications,
  onLogout,
}) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [productStats, setProductStats] = useState<{
    total: number;
    outOfStock: number;
    lowStock: number;
  } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<{ full_name: string; profile_photo?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [consolidatedEarnings, setConsolidatedEarnings] = useState<ConsolidatedEarnings>({
    totalProductMargin: 0,
    totalPlatformFees: 0,
    totalDeliveryFees: 0,
    consolidatedTotal: 0,
    productCount: 0,
    orderCount: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [adminId]);

  const loadConsolidatedEarnings = async () => {
    try {
      // Load order items with product pricing info to calculate admin margin
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          unit_price,
          total_price,
          order_id,
          admin_margin_amount,
          shop_products(
            id,
            purchase_price,
            price
          )
        `);

      if (orderItemsError) {
        console.error('Error loading order items:', orderItemsError);
      }

      // Calculate total product margin (sale price - purchase price)
      let totalProductMargin = 0;
      let productCount = 0;
      const orderIds = new Set();

      (orderItems || []).forEach((item: any) => {
        const salePrice = item.unit_price || item.shop_products?.price || 0;
        const purchasePrice = item.shop_products?.purchase_price || 0;
        const quantity = item.quantity || 1;

        // If admin_margin_amount is stored, use it; otherwise calculate
        if (item.admin_margin_amount) {
          totalProductMargin += item.admin_margin_amount;
        } else {
          totalProductMargin += (salePrice - purchasePrice) * quantity;
        }

        productCount += quantity;
        if (item.order_id) orderIds.add(item.order_id);
      });

      // Load platform fees from doctor earnings
      const { data: doctorEarnings } = await supabase
        .from('doctor_earnings')
        .select('platform_commission');

      let totalDoctorFees = 0;
      (doctorEarnings || []).forEach((e: any) => {
        totalDoctorFees += e.platform_commission || 0;
      });

      // Load platform fees from grooming earnings
      const { data: groomingEarnings } = await supabase
        .from('grooming_store_earnings')
        .select('platform_commission');

      let totalGroomingFees = 0;
      (groomingEarnings || []).forEach((e: any) => {
        totalGroomingFees += e.platform_commission || 0;
      });

      // Load delivery fees from orders
      const { data: orders } = await supabase
        .from('orders')
        .select('delivery_fee');

      let totalDeliveryFees = 0;
      (orders || []).forEach((o: any) => {
        totalDeliveryFees += o.delivery_fee || 0;
      });

      const totalPlatformFees = totalDoctorFees + totalGroomingFees;
      const consolidatedTotal = totalProductMargin + totalPlatformFees + totalDeliveryFees;

      setConsolidatedEarnings({
        totalProductMargin,
        totalPlatformFees,
        totalDeliveryFees,
        consolidatedTotal,
        productCount,
        orderCount: orderIds.size
      });
    } catch (error) {
      console.error('Error loading consolidated earnings:', error);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // Load admin profile immediately
      if (adminId) {
        try {
          const { data: profile } = await supabase
            .from('admin_users')
            .select('full_name, profile_photo')
            .eq('user_id', adminId)
            .single();

          if (profile) {
            setAdminProfile(profile);
          }
        } catch (err) {
          console.error('Error loading admin profile:', err);
        }
      }

      // Load all stats in parallel with timeout
      await Promise.all([
        Promise.race([
          adminAnalyticsService.getDashboardStats(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000)
          )
        ]).then(setStats).catch(err => {
          console.error('Dashboard stats error:', err);
          setStats(null);
        }),

        Promise.race([
          adminProductService.getProductStats(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000)
          )
        ]).then(prodStats => {
          setProductStats({
            total: prodStats?.total || 0,
            outOfStock: prodStats?.outOfStock || 0,
            lowStock: prodStats?.lowStock || 0,
          });
        }).catch(err => {
          console.error('Product stats error:', err);
          setProductStats(null);
        }),

        Promise.race([
          supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000)
          )
        ]).then(result => {
          setPendingOrders(result?.count || 0);
        }).catch(err => {
          console.error('Orders count error:', err);
          setPendingOrders(0);
        }),

        // Load consolidated earnings
        loadConsolidatedEarnings()
      ]);

    } catch (error) {
      console.error('Error in loadDashboardData:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 100000) {
      return (num / 100000).toFixed(1) + 'L';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString('en-IN');
  };

  const formatCurrency = (num: number) => {
    if (num >= 100000) {
      return '₹' + (num / 100000).toFixed(1) + 'L';
    }
    if (num >= 1000) {
      return '₹' + (num / 1000).toFixed(1) + 'k';
    }
    return '₹' + num.toLocaleString('en-IN');
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="flex flex-col h-full bg-background-light">
      {/* Header */}
      <div className="flex items-center bg-background-light p-4 pb-2 justify-between sticky top-0 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-slate-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Admin Dashboard
        </h2>
        <div className="size-10 rounded-full overflow-hidden border-2 border-slate-200">
          {adminProfile?.profile_photo ? (
            <img
              src={adminProfile.profile_photo}
              alt="Admin"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">
              {adminProfile?.full_name?.charAt(0) || 'A'}
            </div>
          )}
        </div>
      </div>

      {/* Menu Drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-40 p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Menu</h3>
              <button onClick={() => setMenuOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { setMenuOpen(false); onCustomerManagement(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary">manage_accounts</span>
                <span>Customer Management</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDoctorManagement(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary">medical_services</span>
                <span>Doctor Management</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onShopManagement(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary">storefront</span>
                <span>Shop Management</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onAdminUsers(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                <span>Admin Users</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onOrderManagement(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary">shopping_cart</span>
                <span>Order Management</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onSettlementManagement(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary">payments</span>
                <span>Settlement & Fees</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onMarginManagement(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary">percent</span>
                <span>Margin Management</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onNotifications(); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-primary">notifications_active</span>
                <span>Notifications Center</span>
              </button>
              <hr className="my-4" />
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-3"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {/* Overview Header */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-slate-500 text-sm font-medium">Overview</p>
          <h1 className="text-2xl font-bold text-slate-900">Furora Care Statistics</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 px-4 pt-2">
              {/* Total Users */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                  </div>
                  {stats?.userStats && stats.userStats.newThisWeek > 0 && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">trending_up</span>
                      {calculateGrowth(stats.userStats.newThisWeek, stats.userStats.newThisMonth - stats.userStats.newThisWeek)}%
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-2xl font-bold text-slate-900">
                    {formatNumber(stats?.userStats?.total || 0)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Total Users</span>
                </div>
              </div>

              {/* Active Consults */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                  </div>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-slate-900">
                    {stats?.bookingStats?.upcoming || 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Active Consults</span>
                </div>
              </div>

              {/* Pending Orders */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="bg-orange-50 text-orange-600 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  </div>
                  {pendingOrders > 0 && (
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      Action
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-2xl font-bold text-slate-900">{pendingOrders}</span>
                  <span className="text-xs text-slate-500 font-medium">Pending Orders</span>
                </div>
              </div>

              {/* Active Doctors */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="bg-purple-50 text-purple-600 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">medical_services</span>
                  </div>
                  {stats?.doctorStats?.pendingApproval && stats.doctorStats.pendingApproval > 0 && (
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                      {stats.doctorStats.pendingApproval} pending
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-2xl font-bold text-slate-900">
                    {stats?.doctorStats?.active || 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Active Doctors</span>
                </div>
              </div>
            </div>

            {/* Revenue Section */}
            <div className="px-4 pt-6">
              <h2 className="text-slate-900 text-[18px] font-bold leading-tight pb-3">Revenue Overview</h2>
              <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-4 text-white">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-white/70 text-xs mb-1">Today</p>
                    <p className="text-xl font-bold">{formatCurrency(stats?.revenueStats?.today || 0)}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs mb-1">This Week</p>
                    <p className="text-xl font-bold">{formatCurrency(stats?.revenueStats?.thisWeek || 0)}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs mb-1">This Month</p>
                    <p className="text-xl font-bold">{formatCurrency(stats?.revenueStats?.thisMonth || 0)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/70 text-xs mb-1">Platform Fee (This Month)</p>
                  <p className="text-lg font-bold">{formatCurrency(stats?.revenueStats?.platformFeeThisMonth || 0)}</p>
                </div>
              </div>
            </div>

            {/* Management Section */}
            <div className="px-4 pt-8">
              <h2 className="text-slate-900 text-[18px] font-bold leading-tight pb-4">Management</h2>
              <div className="flex flex-col gap-3">
                {/* Customer Management */}
                <button
                  onClick={onCustomerManagement}
                  className="flex items-center w-full p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all hover:border-primary/50 group"
                >
                  <div className="bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors p-3 rounded-full mr-4">
                    <span className="material-symbols-outlined block">manage_accounts</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-slate-900 font-bold text-base">Customer Management</h3>
                    <p className="text-slate-500 text-xs mt-0.5">View profiles, history & support</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
                </button>

                {/* Doctor Management */}
                <button
                  onClick={onDoctorManagement}
                  className="flex items-center w-full p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all hover:border-primary/50 group"
                >
                  <div className="bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors p-3 rounded-full mr-4">
                    <span className="material-symbols-outlined block">medical_services</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-slate-900 font-bold text-base">Doctor Management</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Approve doctors & manage consultations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats?.doctorStats?.pendingApproval && stats.doctorStats.pendingApproval > 0 && (
                      <span className="bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {stats.doctorStats.pendingApproval}
                      </span>
                    )}
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
                  </div>
                </button>

                {/* Shop Management */}
                <button
                  onClick={onShopManagement}
                  className="flex items-center w-full p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all hover:border-primary/50 group"
                >
                  <div className="bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors p-3 rounded-full mr-4">
                    <span className="material-symbols-outlined block">storefront</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-slate-900 font-bold text-base">Shop Management</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Inventory, products & pricing</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {productStats && productStats.outOfStock > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {productStats.outOfStock}
                      </span>
                    )}
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
                  </div>
                </button>

                {/* Admin Users */}
                <button
                  onClick={onAdminUsers}
                  className="flex items-center w-full p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all hover:border-primary/50 group"
                >
                  <div className="bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors p-3 rounded-full mr-4">
                    <span className="material-symbols-outlined block">admin_panel_settings</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-slate-900 font-bold text-base">Admin Users</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Manage admin access & roles</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
                </button>

                {/* Seller Approvals */}
                <button
                  onClick={onSellerApprovals}
                  className="flex items-center w-full p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all hover:border-primary/50 group"
                >
                  <div className="bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors p-3 rounded-full mr-4">
                    <span className="material-symbols-outlined block">how_to_reg</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-slate-900 font-bold text-base">Seller Approvals</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Approve stores & managers</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
                </button>

                {/* Order Management */}
                <button
                  onClick={onOrderManagement}
                  className="flex items-center w-full p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all hover:border-primary/50 group"
                >
                  <div className="bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors p-3 rounded-full mr-4">
                    <span className="material-symbols-outlined block">assignment</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-slate-900 font-bold text-base">Order Management</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Manage and track all orders</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
                </button>

                {/* Settlement Management */}
                <button
                  onClick={onSettlementManagement}
                  className="flex items-center w-full p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all hover:border-primary/50 group"
                >
                  <div className="bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors p-3 rounded-full mr-4">
                    <span className="material-symbols-outlined block">payments</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-slate-900 font-bold text-base">Settlement & Fees</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Track platform fees & payouts</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              </div>
            </div>

            {/* System Notification */}
            {(productStats?.lowStock || 0) > 0 && (
              <div className="px-4 pt-8 pb-4">
                <div className="bg-primary rounded-xl p-4 flex items-start gap-3 shadow-lg shadow-primary/20">
                  <div className="bg-white/20 p-2 rounded-lg shrink-0">
                    <span className="material-symbols-outlined text-white">notifications_active</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Low Stock Alert</h4>
                    <p className="text-white/80 text-xs mt-1 leading-relaxed">
                      {productStats?.lowStock} products are running low on stock. Check Shop Management to restock.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
