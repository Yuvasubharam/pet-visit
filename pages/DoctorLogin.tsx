import React, { useState } from 'react';
import { doctorAuthService } from '../services/doctorApi';

interface DoctorLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  onRegister: () => void;
  onGroomingStoreLogin?: () => void;
}

const DoctorLogin: React.FC<DoctorLoginProps> = ({ onBack, onLoginSuccess, onRegister, onGroomingStoreLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await doctorAuthService.signInWithEmail(email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-slate-50 dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      <div className="flex items-center bg-slate-50 p-4 z-20">
        <button
          onClick={onBack}
          className="text-slate-600 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 pb-20 overflow-y-auto no-scrollbar">
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-700 mb-6 text-primary">
            <span className="material-symbols-outlined text-[40px]">stethoscope</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
            Doctor Portal
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Welcome back. Please login to access your consultation schedule.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-slate-900 ml-1">
              Doctor Email / Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                  mail
                </span>
              </div>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-4 pl-12 pr-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="dr.smith@petvisit.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold text-slate-900 ml-1">
              Password
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

          <div className="flex items-center justify-end pt-1">
            <a href="#" className="text-sm font-bold text-primary hover:text-[#013d63] transition-colors">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#013d63] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Login</span>
                <span className="material-symbols-outlined text-sm">login</span>
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Don't have an account?{' '}
            <button
              onClick={onRegister}
              className="text-primary font-bold hover:underline"
            >
              Register as Doctor
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400 font-normal">
            Having trouble?{' '}
            <a href="#" className="text-slate-500 dark:text-slate-300 font-medium hover:underline">
              Contact Admin Support
            </a>
          </p>
        </div>

        {/* Grooming Store Login Link */}
        {onGroomingStoreLogin && (
          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 px-2 text-slate-500">Or</span>
              </div>
            </div>
            <button
              onClick={onGroomingStoreLogin}
              className="mt-6 w-full flex items-center justify-center gap-2 py-4 px-4 border-2 border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 rounded-xl transition-all"
            >
              <span className="material-symbols-outlined text-primary">storefront</span>
              <span className="text-sm font-bold text-primary">Login as Grooming Store</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorLogin;
