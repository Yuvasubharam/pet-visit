import React, { useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { adminUserManagementService, adminActivityLogService } from '../services/adminApi';

interface Props {
  onBack: () => void;
  currentAdminId: string;
}

const AdminUsersManagement: React.FC<Props> = ({ onBack, currentAdminId }) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadAdminUsers();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [adminUsers, searchQuery]);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserManagementService.getAllAdminUsers();
      setAdminUsers(data);
    } catch (error) {
      console.error('Error loading admin users:', error);
      alert('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const filterAdmins = () => {
    let filtered = adminUsers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        admin =>
          admin.full_name?.toLowerCase().includes(query) ||
          admin.email?.toLowerCase().includes(query)
      );
    }

    setFilteredAdmins(filtered);
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    if (admin.id === currentAdminId) {
      alert('You cannot suspend yourself');
      return;
    }

    const action = admin.is_active ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${admin.full_name}?`)) return;

    try {
      await adminUserManagementService.toggleAdminUserStatus(admin.id, !admin.is_active);

      // Determine target type for logging
      let targetType: 'admin' | 'doctor' | 'grooming_store' = 'admin';
      if (admin.role === 'doctor') targetType = 'doctor';
      else if (admin.role === 'grooming_store') targetType = 'grooming_store';

      // Log activity
      await adminActivityLogService.logActivity({
        admin_id: currentAdminId,
        action: admin.is_active ? `suspend_${targetType}` : `activate_${targetType}`,
        target_type: targetType,
        target_id: admin.id,
      });

      // Reload
      loadAdminUsers();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert(`Failed to ${action} admin`);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.id === currentAdminId) {
      alert('You cannot delete yourself');
      return;
    }

    if (!confirm(`Are you sure you want to PERMANENTLY delete ${admin.full_name}? This will remove their admin access and account.`)) return;

    try {
      await adminUserManagementService.deleteAdminUser(admin.id);
      
      // Log activity
      await adminActivityLogService.logActivity({
        admin_id: currentAdminId,
        action: 'delete_admin',
        target_type: 'admin',
        target_id: admin.id,
      });

      alert('Admin deleted successfully');
      loadAdminUsers();
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 ring-1 ring-amber-500/20">
            <span className="material-symbols-outlined text-[12px] filled text-amber-500">stars</span>
            SUPER ADMIN
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            ADMIN
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600 border border-blue-200">
            MODERATOR
          </span>
        );
      case 'support':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600 border border-green-200">
            SUPPORT
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-600 border border-purple-200">
            DOCTOR
          </span>
        );
      case 'grooming_store':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 border border-orange-200">
            GROOMING STORE
          </span>
        );
      case 'store_manager':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-600 border border-cyan-200">
            STORE MANAGER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {role?.toUpperCase()}
          </span>
        );
    }
  };

  const getActivityStatus = (lastLogin?: string, isActive?: boolean) => {
    if (!isActive) {
      return { text: 'Access revoked', color: 'text-red-500', indicator: 'bg-red-500' };
    }

    if (!lastLogin) {
      return { text: 'Never logged in', color: 'text-slate-400', indicator: 'bg-slate-300' };
    }

    const hoursSinceLogin = (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60);

    if (hoursSinceLogin < 1) {
      return { text: 'Active now', color: 'text-slate-500', indicator: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' };
    } else if (hoursSinceLogin < 24) {
      return { text: `Active · ${Math.floor(hoursSinceLogin)}h ago`, color: 'text-slate-500', indicator: 'bg-emerald-500' };
    } else {
      const daysAgo = Math.floor(hoursSinceLogin / 24);
      return { text: `Offline · ${daysAgo}d ago`, color: 'text-slate-400', indicator: 'bg-slate-300' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background-light shadow-2xl border-x border-slate-100 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2 bg-background-light/95 backdrop-blur-md sticky top-0 z-20 border-b border-transparent">
        <div
          onClick={onBack}
          className="text-slate-800 flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-slate-200/50 cursor-pointer transition-colors ripple"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <h2 className="text-slate-900 text-lg font-extrabold leading-tight tracking-tight flex-1 text-center pr-2">
          Admin Users
        </h2>
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center rounded-xl h-10 w-10 bg-primary text-white hover:bg-[#013a5e] hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 shadow-md"
            title="Add New Admin"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 sticky top-[64px] z-10 bg-background-light/95 backdrop-blur-md">
        <label className="flex flex-col w-full">
          <div className="flex w-full flex-1 items-center rounded-xl h-12 bg-white border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <div className="text-slate-400 flex items-center justify-center pl-4">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 focus:outline-0 focus:ring-0 border-none bg-transparent placeholder:text-slate-400 px-3 text-base font-medium"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </label>
      </div>

      {/* Admin List */}
      <div className="flex-1 flex flex-col gap-4 p-4 pt-2">
        {filteredAdmins.map((admin) => {
          const activityStatus = getActivityStatus(admin.last_login, admin.is_active);
          const isSuperAdmin = admin.role === 'super_admin';
          const cardClass = admin.is_active
            ? 'bg-white'
            : 'bg-slate-50/50 opacity-95';

          return (
            <div key={admin.id} className={`flex flex-col gap-0 ${cardClass} rounded-2xl shadow-card border border-slate-100 overflow-hidden group`}>
              <div className="p-4 pb-3 relative">
                {isSuperAdmin && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/60 to-transparent rounded-bl-[60px] pointer-events-none"></div>
                )}

                <div className="flex justify-between items-start gap-3 relative z-10">
                  <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-primary/10">
                    {admin.profile_photo ? (
                      <img alt={admin.full_name} className="w-full h-full object-cover" src={admin.profile_photo} />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                        {admin.full_name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <p className="text-slate-900 text-base font-bold leading-tight">{admin.full_name}</p>
                      {getRoleBadge(admin.role)}
                    </div>
                    <p className="text-slate-500 text-sm font-medium">{admin.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-2 h-2 rounded-full ${activityStatus.indicator}`}></div>
                      <span className={`text-xs font-medium ${activityStatus.color}`}>{activityStatus.text}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-slate-50 mx-auto w-[90%]"></div>

              <div className="grid grid-cols-4 divide-x divide-slate-50 p-2">
                <button className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-primary/5 transition-colors group/btn">
                  <span className="material-symbols-outlined text-[20px] text-primary group-hover/btn:scale-110 transition-transform">
                    admin_panel_settings
                  </span>
                  <span className="text-[10px] font-semibold text-primary">Privs</span>
                </button>

                <button className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-primary/5 transition-colors group/btn">
                  <span className="material-symbols-outlined text-[20px] text-primary group-hover/btn:scale-110 transition-transform">
                    lock_reset
                  </span>
                  <span className="text-[10px] font-semibold text-primary">Reset</span>
                </button>

                {admin.is_active ? (
                  <button
                    onClick={() => handleToggleStatus(admin)}
                    disabled={admin.id === currentAdminId}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-red-50 transition-colors group/btn ${
                      admin.id === currentAdminId ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover/btn:text-red-600 transition-colors">
                      block
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 group-hover/btn:text-red-700">Suspend</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(admin)}
                    className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors group/btn"
                  >
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover/btn:scale-110 transition-transform">
                      check_circle
                    </span>
                    <span className="text-[10px] font-bold text-primary">Activate</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteAdmin(admin)}
                  disabled={admin.id === currentAdminId}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-red-50 transition-colors group/btn ${
                    admin.id === currentAdminId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover/btn:text-red-600 transition-colors">
                    delete
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 group-hover/btn:text-red-700">Delete</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">admin_panel_settings</span>
            <p className="text-slate-500">No admin users found</p>
          </div>
        )}

        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default AdminUsersManagement;
