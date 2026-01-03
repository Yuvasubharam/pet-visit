import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { groomingStoreAuthService } from '../services/groomingStoreApi';
import StoreLocationPicker from '../components/StoreLocationPicker';

interface GroomingStoreRegisterProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

const GroomingStoreRegister: React.FC<GroomingStoreRegisterProps> = ({ onBack, onRegisterSuccess }) => {
  // Store information
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Store address with coordinates
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const validateStep1 = () => {
    if (!storeName.trim()) {
      setError('Store name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!city.trim()) {
      setError('City is required');
      return false;
    }
    if (!state.trim()) {
      setError('State is required');
      return false;
    }
    if (!pincode.trim()) {
      setError('Pincode is required');
      return false;
    }
    if (!latitude || !longitude) {
      setError('Please select your store location on the map');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'grooming_store',
            store_name: storeName,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // 2. Create grooming store profile
      // Note: The session might not be active if email confirmation is required
      // But the RLS policy allows authenticated inserts, and the user_id proves ownership
      try {
        await groomingStoreAuthService.createGroomingStoreProfile(authData.user.id, {
          store_name: storeName,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          latitude,
          longitude,
        });
      } catch (profileError: any) {
        // If profile creation fails due to RLS, the user account was still created
        // We need to clean up or inform the user
        console.error('Profile creation error:', profileError);
        throw new Error('Account created but profile setup failed. Please contact support with your email: ' + email);
      }

      alert('Registration successful! Please check your email to verify your account, then login.');
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
      <div className="flex items-center bg-slate-50 p-4 z-20">
        <button
          onClick={step === 1 ? onBack : () => setStep(1)}
          className="text-slate-600 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col px-8 pb-20 overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-700 mb-6 text-primary">
            <span className="material-symbols-outlined text-[40px]">storefront</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
            Register Grooming Store
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            {step === 1
              ? 'Create your store account to start managing grooming bookings'
              : 'Add your store location details'
            }
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-200'}`}></div>
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-200'}`}></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Basic Information */
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="storeName" className="text-sm font-bold text-slate-900 ml-1">
                Store Name *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                    store
                  </span>
                </div>
                <input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-4 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                  placeholder="Paws & Claws Grooming"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold text-slate-900 ml-1">
                Email Address *
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
                  className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-4 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                  placeholder="store@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-bold text-slate-900 ml-1">
                Phone Number *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                    phone
                  </span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-4 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                  placeholder="+91-9876543210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold text-slate-900 ml-1">
                Password *
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
                  className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-4 pl-12 pr-12 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                  placeholder="••••••••"
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

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-900 ml-1">
                Confirm Password *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-4 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-[#013d63] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              <span>Next: Store Location</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>
        ) : (
          /* Step 2: Store Location */
          <form onSubmit={handleRegister} className="space-y-6">
            <StoreLocationPicker
              onLocationSelect={(location) => {
                setAddress(location.address);
                setCity(location.city);
                setState(location.state);
                setPincode(location.pincode);
                setLatitude(location.latitude);
                setLongitude(location.longitude);
              }}
              initialLocation={
                latitude && longitude
                  ? { address, city, state, pincode, latitude, longitude }
                  : undefined
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-[#013d63] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Registering...</span>
              ) : (
                <>
                  <span>Create Store Account</span>
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{' '}
            <button
              onClick={onBack}
              className="text-primary font-bold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroomingStoreRegister;
