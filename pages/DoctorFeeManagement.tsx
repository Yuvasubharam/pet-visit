import React, { useState, useEffect } from 'react';
import { doctorAuthService } from '../services/doctorApi';
import type { Doctor } from '../types';

interface DoctorFeeManagementProps {
  onBack: () => void;
  doctorId: string;
}

const DoctorFeeManagement: React.FC<DoctorFeeManagementProps> = ({ onBack, doctorId }) => {
  console.log('[DoctorFeeManagement] Component rendered with doctorId:', doctorId);

  const [fees, setFees] = useState({
    fee_online_video: 400,
    fee_online_chat: 250,
    fee_home_visit: 850,
    fee_clinic_visit: 500,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    console.log('[DoctorFeeManagement] Loading fees for doctorId:', doctorId);
    loadDoctorFees();
  }, [doctorId]);

  const loadDoctorFees = async () => {
    try {
      setLoading(true);
      const doctorData = await doctorAuthService.getDoctorById(doctorId);
      console.log('[DoctorFeeManagement] Loaded doctor data:', doctorData);

      if (!doctorData) {
        throw new Error('Doctor data not found');
      }

      setDoctor(doctorData as Doctor);

      // Convert string values to numbers
      const loadedFees = {
        fee_online_video: Number((doctorData as Doctor).fee_online_video) || 400,
        fee_online_chat: Number((doctorData as Doctor).fee_online_chat) || 250,
        fee_home_visit: Number((doctorData as Doctor).fee_home_visit) || 850,
        fee_clinic_visit: Number((doctorData as Doctor).fee_clinic_visit) || 500,
      };
      console.log('[DoctorFeeManagement] Loaded fees:', loadedFees);
      setFees(loadedFees);
    } catch (error) {
      console.error('Error loading doctor fees:', error);
      alert('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFees = async () => {
    try {
      setSaving(true);
      console.log('[DoctorFeeManagement] Saving fees:', fees);
      await doctorAuthService.updateDoctorProfile(doctorId, fees);
      console.log('[DoctorFeeManagement] Fees saved successfully');
      alert('Fees updated successfully!');
      // Reload the fees to confirm they were saved
      await loadDoctorFees();
    } catch (error) {
      console.error('Error saving fees:', error);
      alert('Failed to save fees');
    } finally {
      setSaving(false);
    }
  };

  const handleFeeChange = (type: keyof typeof fees, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFees(prev => ({ ...prev, [type]: numValue }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading fees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      <div className="sticky top-0 z-50 flex items-center bg-white/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-100">
        <div
          onClick={onBack}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-gray-900">arrow_back</span>
        </div>
        <h2 className="text-primary text-xl font-extrabold tracking-tight flex-1 text-center font-display">
          Fee Management
        </h2>
        <div className="size-10"></div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-6 pb-40 overflow-y-auto no-scrollbar space-y-6">
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">payments</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Consultation Fees</h3>
              <p className="text-xs text-slate-600">Set your consultation rates for different services</p>
            </div>
          </div>
        </div>

        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">videocam</span>
            Online Consultations
          </h3>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-xl">video_camera_front</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Video Call</h4>
                    <p className="text-xs text-slate-500">Live video consultation</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">₹</span>
                <input
                  type="number"
                  value={fees.fee_online_video}
                  onChange={(e) => handleFeeChange('fee_online_video', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="400"
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 text-xl">chat</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Text Chat</h4>
                    <p className="text-xs text-slate-500">Text-based consultation</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">₹</span>
                <input
                  type="number"
                  value={fees.fee_online_chat}
                  onChange={(e) => handleFeeChange('fee_online_chat', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="250"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_hospital</span>
            In-Person Consultations
          </h3>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 text-xl">home_health</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Home Visit</h4>
                    <p className="text-xs text-slate-500">Visit patient's home</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">₹</span>
                <input
                  type="number"
                  value={fees.fee_home_visit}
                  onChange={(e) => handleFeeChange('fee_home_visit', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="850"
                />
              </div>
              <div className="mt-2 px-3 py-2 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-700">
                  <span className="material-symbols-outlined text-xs align-middle mr-1">info</span>
                  Includes travel charges
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 text-xl">medical_services</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Clinic Visit</h4>
                    <p className="text-xs text-slate-500">At your clinic</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">₹</span>
                <input
                  type="number"
                  value={fees.fee_clinic_visit}
                  onChange={(e) => handleFeeChange('fee_clinic_visit', e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="500"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="bg-gradient-to-br from-primary to-blue-600 p-5 rounded-2xl text-white">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">calculate</span>
            Average Fee
          </h4>
          <div className="text-3xl font-black">
            ₹{((fees.fee_online_video + fees.fee_online_chat + fees.fee_home_visit + fees.fee_clinic_visit) / 4).toFixed(2)}
          </div>
          <p className="text-xs text-blue-100 mt-1">Across all consultation types</p>
        </div>

        {/* Spacer for fixed bottom button */}
        <div className="h-10"></div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleSaveFees}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary-light text-white font-black text-base py-5 rounded-[28px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              <span>Save Fee Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DoctorFeeManagement;
