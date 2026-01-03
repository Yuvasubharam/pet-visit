import React, { useState } from 'react';
import { doctorAuthService } from '../services/doctorApi';

interface DoctorRegisterProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

const DoctorRegister: React.FC<DoctorRegisterProps> = ({ onBack, onRegisterSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await doctorAuthService.signUpDoctor(email, password, {
        full_name: fullName,
        phone,
        specialization,
        clinic_address: clinicAddress,
      });

      alert('Registration successful! Your account is pending approval. You will be notified once approved.');
      onRegisterSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-slate-50 dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-slate-50 px-4 py-4 z-20 border-b border-slate-100">
        <button
          onClick={onBack}
          className="text-slate-600 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-800 ml-3">Doctor Registration</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto no-scrollbar">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200 mb-4 text-primary">
            <span className="material-symbols-outlined text-[32px]">person_add</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Join as a Doctor</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Register to provide veterinary consultations through our platform. Your account will be reviewed and approved by our admin team.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullname" className="text-sm font-bold text-slate-800 ml-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  person
                </span>
              </div>
              <input
                id="fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="Dr. Jane Smith"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-slate-800 ml-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  mail
                </span>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="doctor@example.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-bold text-slate-800 ml-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  call
                </span>
              </div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <label htmlFor="specialization" className="text-sm font-bold text-slate-800 ml-1">
              Specialization <span className="text-red-500">*</span>
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
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="Veterinary Surgeon"
              />
            </div>
          </div>

          {/* Clinic Address */}
          <div className="space-y-2">
            <label htmlFor="clinic" className="text-sm font-bold text-slate-800 ml-1">
              Clinic Address <span className="text-slate-400 font-normal text-xs">(Optional)</span>
            </label>
            <div className="relative group">
              <div className="absolute top-3 left-0 pl-4 flex pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  location_on
                </span>
              </div>
              <input
                id="clinic"
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="123 Pet Lane, Animal City"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold text-slate-800 ml-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  lock
                </span>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-12 pr-12 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-bold text-slate-800 ml-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  lock
                </span>
              </div>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="pt-2 pb-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              By registering, you agree to our{' '}
              <a href="#" className="text-primary font-semibold hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary font-semibold hover:underline">Privacy Policy</a>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#013d63] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Register</span>
                <span className="material-symbols-outlined text-sm">person_add</span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center pb-6">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onBack}
              className="text-primary font-bold hover:underline"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;
