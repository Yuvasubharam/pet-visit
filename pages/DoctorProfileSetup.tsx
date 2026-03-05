import React, { useState, useEffect } from 'react';
import { doctorAuthService } from '../services/doctorApi';
import type { Doctor } from '../types';
import ClinicLocationPicker from '../components/ClinicLocationPicker';

interface DoctorProfileSetupProps {
  onBack: () => void;
  doctorId: string | null;
}

const DoctorProfileSetup: React.FC<DoctorProfileSetupProps> = ({ onBack, doctorId }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicLatitude, setClinicLatitude] = useState<number | null>(null);
  const [clinicLongitude, setClinicLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    loadDoctorProfile();
  }, [doctorId]);

  const loadDoctorProfile = async () => {
    if (!doctorId) return;

    try {
      const profile = await doctorAuthService.getDoctorById(doctorId);
      if (profile) {
        setDoctor(profile);
        setFullName(profile.full_name || '');
        setSpecialization(profile.specialization || '');
        setPhone(profile.phone || '');
        setClinicAddress(profile.clinic_address || '');
        setClinicLatitude(profile.clinic_latitude || null);
        setClinicLongitude(profile.clinic_longitude || null);
      }
      // If no profile exists, form will be empty for new doctor to fill out
    } catch (error: any) {
      // PGRST116 means no rows found - this is expected for new doctors
      if (error?.code === 'PGRST116') {
        console.log('No existing doctor profile found - new doctor setup');
      } else {
        console.error('Error loading doctor profile:', error);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !doctorId) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const photoUrl = await doctorAuthService.uploadDoctorPhoto(doctorId, file);
      setDoctor(prev => prev ? { ...prev, profile_photo_url: photoUrl } : null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleCredentialsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !doctorId) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const credentialsUrl = await doctorAuthService.uploadCredentials(doctorId, file);
      setDoctor(prev => prev ? { ...prev, credentials_url: credentialsUrl } : null);
      alert('Credentials uploaded successfully');
    } catch (error) {
      console.error('Error uploading credentials:', error);
      alert('Failed to upload credentials');
    } finally {
      setUploading(false);
    }
  };

  const handleLocationSave = (location: { latitude: number; longitude: number; address: string }) => {
    setClinicLatitude(location.latitude);
    setClinicLongitude(location.longitude);
    setClinicAddress(location.address);
    setShowLocationPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;

    setLoading(true);

    try {
      await doctorAuthService.updateDoctorProfile(doctorId, {
        full_name: fullName,
        specialization,
        phone,
        clinic_address: clinicAddress,
        clinic_latitude: clinicLatitude,
        clinic_longitude: clinicLongitude,
      });

      alert('Profile updated successfully!');
      onBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-background-dark px-4 py-4 z-20 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={onBack}
          className="text-slate-700 dark:text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 white:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-dark">Profile Setup</h1>
        <div className="size-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pb-20 overflow-y-auto no-scrollbar">
        {/* Profile Photo */}
        <div className="mb-8 mt-2 flex flex-col items-center">
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white dark:ring-surface-dark shadow-xl bg-gray-200 dark:bg-surface-dark flex items-center justify-center">
              {doctor?.profile_photo_url ? (
                <img
                  src={doctor.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-slate-500">
                  person
                </span>
              )}
            </div>
            <label
              htmlFor="photo-upload"
              className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full shadow-lg hover:bg-[#013d63] transition-colors border-4 border-background-light dark:border-background-dark flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-900 font-medium">
            {uploading ? 'Uploading...' : 'Upload Profile Picture'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullname" className="text-sm font-bold text-slate-900 dark:text-dark ml-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  id_card
                </span>
              </div>
              <input
                id="fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white dark:bg-surface-dark border-0 py-4 pl-12 pr-4 text-slate-900 dark:text-dark font-medium shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="Dr. Jane Smith"
              />
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <label htmlFor="specialization" className="text-sm font-bold text-slate-900 dark:text-dark ml-1">
              Specialization
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  medical_services
                </span>
              </div>
              <input
                id="specialization"
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white dark:bg-surface-dark border-0 py-4 pl-12 pr-4 text-slate-900 dark:text-dark font-medium shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="e.g. Veterinary Surgeon"
              />
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <label htmlFor="contact" className="text-sm font-bold text-slate-900 dark:text-dark ml-1">
              Contact Number
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  call
                </span>
              </div>
              <input
                id="contact"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white dark:bg-surface-dark border-0 py-4 pl-12 pr-4 text-slate-900 dark:text-dark font-medium shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Clinic Location & Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-bold text-slate-900 dark:text-dark ml-1">
              Clinic Location{' '}
              <span className="font-normal text-slate-400 text-xs ml-1">(Optional)</span>
            </label>

            {/* Map Preview (if location is set) */}
            {clinicLatitude && clinicLongitude && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3 border-2 border-primary/20">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${clinicLongitude - 0.005}%2C${clinicLatitude - 0.005}%2C${clinicLongitude + 0.005}%2C${clinicLatitude + 0.005}&layer=mapnik&marker=${clinicLatitude},${clinicLongitude}`}
                  className="w-full h-full border-0"
                  title="Clinic Location"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="material-symbols-outlined text-primary text-5xl drop-shadow-2xl fill-current">
                    location_on
                  </span>
                </div>
              </div>
            )}

            {/* Select Location Button */}
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="w-full flex items-center gap-3 p-4 bg-primary/5 border-2 border-primary/20 rounded-xl hover:bg-primary/10 transition-colors mb-3"
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">
                  {clinicLatitude && clinicLongitude ? 'edit_location' : 'add_location'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-primary">
                  {clinicLatitude && clinicLongitude ? 'Update Clinic Location' : 'Select Clinic Location'}
                </p>
                <p className="text-xs text-gray-500">
                  {clinicLatitude && clinicLongitude
                    ? `${clinicLatitude.toFixed(6)}, ${clinicLongitude.toFixed(6)}`
                    : 'Pin your clinic on the map'}
                </p>
              </div>
              <span className="material-symbols-outlined text-primary">chevron_right</span>
            </button>

            {/* Address Textarea */}
            <div className="relative group">
              <div className="absolute top-4 left-0 pl-4 flex pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  edit_note
                </span>
              </div>
              <textarea
                id="address"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                rows={3}
                className="w-full appearance-none rounded-xl bg-white dark:bg-surface-dark border-0 py-4 pl-12 pr-4 text-slate-900 dark:text-dark font-medium shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary placeholder:text-slate-400 transition-all outline-none resize-none"
                placeholder="123 Pet Lane, Animal City, PC 90210"
              />
            </div>
          </div>

          {/* Platform Fee Card */}
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-xl">receipt_long</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-dark">Platform Fee</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Deducted per consultation</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Online</p>
                <p className="text-lg font-black text-amber-600">{doctor?.platform_fee_online || doctor?.margin_percentage || 0}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Home</p>
                <p className="text-lg font-black text-amber-600">{doctor?.platform_fee_home || doctor?.margin_percentage || 0}%</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Clinic</p>
                <p className="text-lg font-black text-amber-600">{doctor?.platform_fee_clinic || doctor?.margin_percentage || 0}%</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">info</span>
              <p>These percentages are deducted from each consultation. The remaining amount is credited to your earnings.</p>
            </div>
          </div>

          {/* Credentials Upload */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-dark ml-1">
              Credentials & Certificates
            </label>
            <label
              htmlFor="credentials-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-2 group-hover:text-primary transition-colors">
                  upload_file
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-200">
                  <span className="font-bold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  PDF, JPG or PNG (MAX. 5MB)
                </p>
                {doctor?.credentials_url && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✓ Credentials uploaded
                  </p>
                )}
              </div>
              <input
                id="credentials-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCredentialsUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4 pb-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-primary hover:bg-[#013d63] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>Save Profile</span>
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                </>
              )}
            </button>
          </div>

          {/* Logout Button */}
          <div className="pb-4">
            <button
              type="button"
              onClick={async () => {
                if (confirm('Are you sure you want to logout?')) {
                  try {
                    const { supabase } = await import('../lib/supabase');
                    await supabase.auth.signOut();
                    window.location.reload();
                  } catch (error) {
                    console.error('Error logging out:', error);
                    alert('Failed to logout. Please try again.');
                  }
                }
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-14 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </form>
      </div>

      {/* Clinic Location Picker Modal */}
      {showLocationPicker && (
        <ClinicLocationPicker
          onClose={() => setShowLocationPicker(false)}
          onSave={handleLocationSave}
          initialLocation={{
            latitude: clinicLatitude || undefined,
            longitude: clinicLongitude || undefined,
            address: clinicAddress,
          }}
        />
      )}
    </div>
  );
};

export default DoctorProfileSetup;
