import React, { useState, useEffect } from 'react';
import { UserWithDetails } from '../types';
import { adminCustomerService } from '../services/adminApi';
import UserDetailModal from '../components/UserDetailModal';

interface Props {
  onBack: () => void;
  onCustomerSelect: (userId: string) => void;
  onAdminUsers?: () => void;
  onDoctors?: () => void;
  onShopProducts?: () => void;
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'pending';
type RoleFilter = 'all' | 'user' | 'doctor' | 'grooming_store' | 'store_manager';

const CustomerManagement: React.FC<Props> = ({ onBack, onCustomerSelect, onAdminUsers, onDoctors, onShopProducts }) => {
  const [customers, setCustomers] = useState<UserWithDetails[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    newToday: 0,
    doctors: 0,
    users: 0,
    stores: 0
  });

  useEffect(() => {
    // Get current admin ID from session storage
    const adminId = sessionStorage.getItem('adminId') || localStorage.getItem('adminId') || '';
    setCurrentAdminId(adminId);
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery, statusFilter, roleFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await adminCustomerService.getAllCustomers();
      console.log('Loaded customers:', data);
      setCustomers(data);
      
      // Calculate stats from data
      const today = new Date().toISOString().split('T')[0];
      setStats({
        total: data.length,
        newToday: data.filter(c => c.created_at?.startsWith(today)).length,
        doctors: data.filter(c => (c as any).role === 'doctor').length,
        users: data.filter(c => (c as any).role === 'user').length,
        stores: data.filter(c => (c as any).role === 'grooming_store' || (c as any).role === 'store_manager').length
      });
    } catch (error) {
      console.error('Error loading customers:', error);
      alert(`Error loading customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(c => (c as any).role === roleFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleOpenDetailModal = (customer: UserWithDetails) => {
    setSelectedUser(customer);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const handleModalSave = () => {
    loadCustomers();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'grooming_store':
      case 'store_manager':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'user':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getOnlineStatus = (createdAt?: string) => {
    if (!createdAt) return 'offline';
    const hoursDiff = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursDiff < 1) return 'online';
    if (hoursDiff < 24) return 'recent';
    return 'offline';
  };

  const getOnlineIndicatorClass = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'recent':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-20">
        <button
          onClick={onBack}
          className="text-slate-900 dark:text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 light:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-dark text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
          User Management
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="px-4 pb-4 pt-2">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20 flex flex-col justify-between h-24">
            <div className="flex justify-between items-start">
              <span className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Total Users</span>
              <span className="material-symbols-outlined text-blue-200 text-lg">group</span>
            </div>
            <span className="text-3xl font-bold">{stats.total.toLocaleString()}</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between h-24 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide">New Today</span>
              <span className="material-symbols-outlined text-green-500 text-lg">trending_up</span>
            </div>
            <span className="text-3xl font-bold text-slate-900 dark:text-dark">+{stats.newToday}</span>
          </div>
        </div>
        
        {/* Role Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded-xl text-center">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">{stats.users}</p>
            <p className="text-[10px] text-slate-500">Customers</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 p-2 rounded-xl text-center">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">{stats.doctors}</p>
            <p className="text-[10px] text-slate-500">Doctors</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/10 p-2 rounded-xl text-center">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">{stats.stores}</p>
            <p className="text-[10px] text-slate-500">Stores</p>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Users
          </button>
          {onDoctors && (
            <button
              onClick={onDoctors}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium whitespace-nowrap border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">medical_services</span>
              Doctor Profiles
            </button>
          )}
          {onShopProducts && (
            <button
              onClick={onShopProducts}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium whitespace-nowrap border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              Shop Products
            </button>
          )}
          {onAdminUsers && (
            <button
              onClick={onAdminUsers}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium whitespace-nowrap border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              Admin Management
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="px-4 pb-4 sticky top-14 z-10 bg-background-light dark:bg-background-dark">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <input
              className="block w-full rounded-xl border-0 py-3 pl-10 pr-3 text-slate-900 dark:text-white bg-white dark:bg-surface-dark shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="Search by name, email, phone..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-surface-dark shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        {/* Role Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm transition-colors ${roleFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
          >
            All Roles
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${roleFilter === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
          >
            Customers
          </button>
          <button
            onClick={() => setRoleFilter('doctor')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${roleFilter === 'doctor'
              ? 'bg-purple-600 text-white'
              : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
          >
            Doctors
          </button>
          <button
            onClick={() => setRoleFilter('grooming_store')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${roleFilter === 'grooming_store'
              ? 'bg-orange-600 text-white'
              : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
          >
            Stores
          </button>
        </div>
        
        {/* Status Filters */}
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === 'all'
              ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            All Status
          </button>
          {['active', 'pending', 'suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as StatusFilter)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === status
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Users ({filteredCustomers.length})
        </h3>

        <div className="flex flex-col gap-3">
          {filteredCustomers.map((customer) => {
            const onlineStatus = getOnlineStatus(customer.created_at);
            const userRole = (customer as any).role || 'user';
            const cardClass =
              customer.status === 'suspended'
                ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:shadow-md';

            return (
              <div
                key={customer.id}
                className={`flex items-center p-3 rounded-2xl border shadow-sm transition-shadow group ${cardClass}`}
              >
                <div className="relative w-14 h-14 shrink-0">
                  {customer.profile_photo ? (
                    <div
                      className="w-full h-full rounded-full bg-cover bg-center cursor-pointer"
                      style={{ backgroundImage: `url('${customer.profile_photo}')` }}
                      onClick={() => handleOpenDetailModal(customer)}
                    ></div>
                  ) : (
                    <div
                      className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => handleOpenDetailModal(customer)}
                    >
                      {customer.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getOnlineIndicatorClass(onlineStatus)} border-2 border-white dark:border-surface-dark rounded-full`}></div>
                </div>

                <div className="flex-1 min-w-0 ml-3 mr-2 cursor-pointer" onClick={() => handleOpenDetailModal(customer)}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{customer.name || 'Unnamed User'}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${getRoleBadgeClass(userRole)}`}>
                      {userRole}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${getStatusBadgeClass(customer.status)}`}>
                      {customer.status || 'UNKNOWN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{customer.email || 'No email'}</p>
                </div>

                <button
                  onClick={() => handleOpenDetailModal(customer)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">person_search</span>
              <p className="text-slate-500 dark:text-slate-400">No users found matching filters</p>
            </div>
          )}
        </div>
      </div>

      <UserDetailModal
        user={selectedUser}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onSave={handleModalSave}
        currentAdminId={currentAdminId}
      />
    </div>
  );
};

export default CustomerManagement;
