import React, { useState, useEffect } from 'react';
import { UserWithDetails } from '../types';
import { adminCustomerService, adminActivityLogService } from '../services/adminApi';

interface Props {
  onBack: () => void;
  userId: string;
  currentAdminId: string;
}

const UserDetails: React.FC<Props> = ({ onBack, userId, currentAdminId }) => {
  const [user, setUser] = useState<UserWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: ''
  });

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        status: user.status || ''
      });
    }
  }, [user]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const data = await adminCustomerService.getCustomerDetails(userId);
      setUser(data);
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setActionLoading(true);
      await adminCustomerService.updateCustomer(userId, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        status: editForm.status as any
      });
      await loadUserDetails();
      setIsEditing(false);
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.')) return;

    try {
      setActionLoading(true);
      await adminCustomerService.deleteCustomer(userId, currentAdminId);
      alert('User deleted successfully');
      onBack();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!user) return;

    const reason = prompt('Please enter the reason for suspension:');
    if (!reason) return;

    try {
      setActionLoading(true);
      await adminCustomerService.suspendCustomer(userId, reason, currentAdminId);
      await loadUserDetails();
      alert('User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateUser = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to activate this user?')) return;

    try {
      setActionLoading(true);
      await adminCustomerService.activateCustomer(userId, currentAdminId);
      await loadUserDetails();
      alert('User activated successfully');
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Failed to activate user');
    } finally {
      setActionLoading(false);
    }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
        <p className="text-slate-500 mb-4">User not found</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-20">
        <button
          onClick={onBack}
          className="text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          User Details
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">{isEditing ? 'close' : 'edit'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {isEditing ? (
          /* Edit Mode */
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="pt-4 flex gap-3">
              <button
                onClick={handleUpdateUser}
                disabled={actionLoading}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            {/* Profile Section */}
            <div className="px-4 py-4">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-4">
              {user.profile_photo ? (
                <div
                  className="w-full h-full rounded-full bg-cover bg-center border-4 border-white dark:border-surface-dark shadow-md"
                  style={{ backgroundImage: `url('${user.profile_photo}')` }}
                ></div>
              ) : (
                <div className="w-full h-full rounded-full border-4 border-white dark:border-surface-dark shadow-md bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{user.name || 'Unnamed User'}</h1>

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(user.status)}`}>
                {user.status?.toUpperCase() || 'UNKNOWN'}
              </span>
              {user.status === 'active' && (
                <button
                  onClick={handleSuspendUser}
                  disabled={actionLoading}
                  className="text-red-600 hover:text-red-700 text-xs font-semibold underline disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
              {user.status === 'suspended' && (
                <button
                  onClick={handleActivateUser}
                  disabled={actionLoading}
                  className="text-green-600 hover:text-green-700 text-xs font-semibold underline disabled:opacity-50"
                >
                  Activate
                </button>
              )}
            </div>

            {/* Suspension Info */}
            {user.status === 'suspended' && user.suspension_reason && (
              <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Suspension Reason:</p>
                <p className="text-sm text-red-600 dark:text-red-300">{user.suspension_reason}</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Suspended on {formatDateTime(user.suspended_at)}
                </p>
              </div>
            )}

            {/* Contact Info */}
            <div className="w-full bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-6">
              <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mr-3">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Email</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user.email || 'No email'}</p>
                </div>
              </div>

              <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mr-3">
                  <span className="material-symbols-outlined text-lg">call</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Phone</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user.phone || 'No phone'}</p>
                </div>
              </div>

              <div className="flex items-center p-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mr-3">
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Registration Date</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Pets */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Registered Pets ({user.pets?.length || 0})
            </h3>
          </div>

          {user.pets && user.pets.length > 0 ? (
            <div className="flex flex-col gap-3">
              {user.pets.map((pet) => (
                <div
                  key={pet.id}
                  className="flex items-center p-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="relative w-16 h-16 shrink-0">
                    {pet.image ? (
                      <div
                        className="w-full h-full rounded-xl bg-cover bg-center"
                        style={{ backgroundImage: `url('${pet.image}')` }}
                      ></div>
                    ) : (
                      <div className="relative w-16 h-16 shrink-0 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 dark:text-orange-400">
                        <span className="material-symbols-outlined text-3xl">pets</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 ml-3">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{pet.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {pet.breed || pet.species} • {pet.age ? `${pet.age} yrs` : 'Age unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">pets</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No pets registered</p>
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="px-4 py-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Bookings ({user.bookings?.length || 0})
            </h3>
          </div>

          {user.bookings && user.bookings.length > 0 ? (
            <div className="space-y-3">
              {user.bookings.slice(0, 5).map((booking) => {
                const statusColors: Record<string, string> = {
                  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                };

                return (
                  <div
                    key={booking.id}
                    className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">
                          <span className="material-symbols-outlined text-lg block">
                            {booking.service_type === 'grooming' ? 'shower' : 'local_hospital'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                            {booking.service_type || 'Service'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">#{booking.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${statusColors[booking.status] || statusColors.pending}`}>
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700/50 mt-2">
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                        {formatDateTime(booking.created_at)}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{booking.total_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">event_busy</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No bookings found</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-6">
          {user.status === 'active' ? (
            <button
              onClick={handleSuspendUser}
              disabled={actionLoading}
              className="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Suspend User Account'}
            </button>
          ) : (
            <>
              <button
                onClick={handleActivateUser}
                disabled={actionLoading}
                className="w-full py-3 rounded-xl border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50 mb-3"
              >
                {actionLoading ? 'Processing...' : 'Activate User Account'}
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-semibold bg-white dark:bg-surface-dark hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Delete User Permanently'}
              </button>
            </>
          )}
        </div>
      </>
    )}
  </div>
</div>
);
};

export default UserDetails;
