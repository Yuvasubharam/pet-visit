import React, { useState, useEffect } from 'react';
import { UserWithDetails } from '../types';
import { adminCustomerService, adminActivityLogService } from '../services/adminApi';

interface Props {
  user: UserWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  currentAdminId: string;
}

const UserDetailModal: React.FC<Props> = ({ user, isOpen, onClose, onSave, currentAdminId }) => {
  const [formData, setFormData] = useState<Partial<UserWithDetails>>({});
  const [loading, setLoading] = useState(false);
  const [showSuspendReason, setShowSuspendReason] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await adminCustomerService.updateCustomer(user.id, formData);
      
      // Log activity
      await adminActivityLogService.logActivity({
        admin_id: currentAdminId,
        action: 'edit_customer_details',
        target_type: 'user',
        target_id: user.id,
        details: formData,
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!user) return;
    
    try {
      setActionInProgress('role');
      await adminCustomerService.changeUserRole(user.id, newRole, currentAdminId);
      onSave();
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change user role');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSuspend = async () => {
    if (!user || !suspendReason.trim()) {
      alert('Please provide a suspension reason');
      return;
    }

    try {
      setActionInProgress('suspend');
      await adminCustomerService.suspendCustomer(user.id, suspendReason, currentAdminId);
      setSuspendReason('');
      setShowSuspendReason(false);
      onSave();
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleActivate = async () => {
    if (!user) return;

    try {
      setActionInProgress('activate');
      await adminCustomerService.activateCustomer(user.id, currentAdminId);
      onSave();
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Failed to activate user');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!confirm(`Are you sure you want to PERMANENTLY delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionInProgress('delete');
      await adminCustomerService.deleteCustomer(user.id, currentAdminId);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isOpen || !user) return null;

  const userRole = (user as any).role || 'user';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.status}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Status & Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                disabled
                value={user.status}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                <option value={user.status}>{user.status}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Role
              </label>
              <select
                value={userRole}
                onChange={(e) => handleChangeRole(e.target.value)}
                disabled={actionInProgress !== null}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="doctor">Doctor</option>
                <option value="grooming_store">Grooming Store</option>
                <option value="store_manager">Store Manager</option>
              </select>
            </div>
          </div>

          {/* Suspension Details */}
          {user.status === 'suspended' && user.suspension_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Suspension Reason</p>
              <p className="text-sm text-red-600 dark:text-red-300">{user.suspension_reason}</p>
              {user.suspended_at && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                  Suspended on {new Date(user.suspended_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Account Actions */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Account Actions</p>
            <div className="space-y-2">
              {user.status === 'suspended' ? (
                <button
                  onClick={handleActivate}
                  disabled={actionInProgress !== null}
                  className="w-full px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg font-semibold hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                >
                  {actionInProgress === 'activate' ? 'Activating...' : 'Activate Account'}
                </button>
              ) : (
                <div>
                  {!showSuspendReason ? (
                    <button
                      onClick={() => setShowSuspendReason(true)}
                      disabled={actionInProgress !== null}
                      className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg font-semibold hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors disabled:opacity-50"
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        placeholder="Enter suspension reason..."
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSuspend}
                          disabled={actionInProgress !== null || !suspendReason.trim()}
                          className="flex-1 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                        >
                          {actionInProgress === 'suspend' ? 'Suspending...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => {
                            setShowSuspendReason(false);
                            setSuspendReason('');
                          }}
                          disabled={actionInProgress !== null}
                          className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleDelete}
                disabled={actionInProgress !== null}
                className="w-full px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                {actionInProgress === 'delete' ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3 bg-slate-50 dark:bg-slate-900/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
