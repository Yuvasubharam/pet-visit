import React, { useState, useEffect } from 'react';
import { Doctor } from '../types';
import { adminDoctorService } from '../services/adminApi';

interface Props {
  onBack: () => void;
  currentAdminId: string;
}

type ApprovalFilter = 'all' | 'pending' | 'approved' | 'rejected';

const DoctorManagement: React.FC<Props> = ({ onBack, currentAdminId }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, approvalFilter]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await adminDoctorService.getAllDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
      alert('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    // Filter by approval status
    if (approvalFilter !== 'all') {
      filtered = filtered.filter(d => d.approval === approvalFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        d =>
          d.full_name?.toLowerCase().includes(query) ||
          d.email?.toLowerCase().includes(query) ||
          d.specialization?.toLowerCase().includes(query)
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleApprove = async (doctorId: string) => {
    if (!confirm('Are you sure you want to approve this doctor?')) return;

    try {
      setActionLoading(doctorId);
      await adminDoctorService.approveDoctor(doctorId, currentAdminId);
      await loadDoctors();
      alert('Doctor approved successfully');
    } catch (error) {
      console.error('Error approving doctor:', error);
      alert('Failed to approve doctor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (doctorId: string) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(doctorId);
      await adminDoctorService.rejectDoctor(doctorId, reason, currentAdminId);
      await loadDoctors();
      alert('Doctor application rejected');
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      alert('Failed to reject doctor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (doctorId: string) => {
    const reason = prompt('Please enter the reason for suspension:');
    if (!reason) return;

    try {
      setActionLoading(doctorId);
      await adminDoctorService.suspendDoctor(doctorId, reason, currentAdminId);
      await loadDoctors();
      alert('Doctor suspended successfully');
    } catch (error) {
      console.error('Error suspending doctor:', error);
      alert('Failed to suspend doctor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (doctorId: string) => {
    if (!confirm('Are you sure you want to activate this doctor?')) return;

    try {
      setActionLoading(doctorId);
      await adminDoctorService.activateDoctor(doctorId, currentAdminId);
      await loadDoctors();
      alert('Doctor activated successfully');
    } catch (error) {
      console.error('Error activating doctor:', error);
      alert('Failed to activate doctor');
    } finally {
      setActionLoading(null);
    }
  };

  const getApprovalBadge = (approval?: string, isActive?: boolean) => {
    if (approval === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-500">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-500"></span>
          Pending
        </span>
      );
    }

    if (approval === 'approved' && isActive) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
          Active
        </span>
      );
    }

    if (approval === 'rejected' || !isActive) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
          Inactive
        </span>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-background-light dark:bg-background-dark px-4 pt-12 pb-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-slate-900 dark:text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 light:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark">Doctor Management</h1>
        </div>
        <button className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-[#013d63] transition-colors">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="px-4 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          </div>
          <input
            className="w-full appearance-none rounded-xl bg-white dark:bg-surface-dark border-0 py-3 pl-10 pr-10 text-slate-900 dark:text-white font-medium shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary placeholder:text-slate-400 transition-all outline-none"
            placeholder="Search doctors..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setApprovalFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-colors ${approvalFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setApprovalFilter('approved')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${approvalFilter === 'approved'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setApprovalFilter('pending')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${approvalFilter === 'pending'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setApprovalFilter('rejected')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${approvalFilter === 'rejected'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'
              }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Doctors List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 space-y-4">
        {filteredDoctors.map((doctor) => {
          const isLoading = actionLoading === doctor.id;

          return (
            <div
              key={doctor.id}
              className={`bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 ${!doctor.is_active ? 'opacity-75' : ''
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-3">
                  {doctor.profile_photo_url ? (
                    <img
                      alt={doctor.full_name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-slate-700"
                      src={doctor.profile_photo_url}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-gray-100 dark:ring-slate-700">
                      {doctor.full_name?.charAt(0).toUpperCase() || 'D'}
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{doctor.full_name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{doctor.specialization}</p>
                  </div>
                </div>

                {getApprovalBadge(doctor.approval, doctor.is_active)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                  <span className="truncate">{doctor.phone}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                  <span className="truncate">{doctor.email}</span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-100 dark:border-slate-700 pt-3 mt-1">
                {doctor.approval === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(doctor.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white bg-primary hover:bg-[#013d63] text-sm font-semibold transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      {isLoading ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(doctor.id)}
                      disabled={isLoading}
                      className="w-10 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </>
                )}

                {doctor.approval === 'approved' && doctor.is_active && (
                  <>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-primary bg-blue-50 hover:bg-blue-100 dark:bg-primary/10 dark:hover:bg-primary/20 text-sm font-semibold transition-colors">
                      <span className="material-symbols-outlined text-[18px]">edit_document</span>
                      Manage
                    </button>
                    <button
                      onClick={() => handleSuspend(doctor.id)}
                      disabled={isLoading}
                      className="w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </>
                )}

                {doctor.approval === 'approved' && !doctor.is_active && (
                  <>
                    <button
                      onClick={() => handleActivate(doctor.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      {isLoading ? 'Processing...' : 'Activate'}
                    </button>
                    <button className="w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </>
                )}

                {doctor.approval === 'rejected' && (
                  <>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-semibold transition-colors">
                      <span className="material-symbols-outlined text-[18px]">history</span>
                      View History
                    </button>
                    <button className="w-10 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">medical_services</span>
            <p className="text-slate-500 dark:text-slate-400">No doctors found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;
