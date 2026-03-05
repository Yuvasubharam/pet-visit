import React, { useState } from 'react';
import { groomingStoreAuthService } from '../services/groomingStoreApi';

interface GroomingStoreLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  onRegister?: () => void;
}

const GroomingStoreLogin: React.FC<GroomingStoreLoginProps> = ({ onBack, onLoginSuccess, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [storeName, setStoreName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingApproval(false);
    setLoading(true);

    try {
      const result = await groomingStoreAuthService.signInWithEmail(email, password);

      // Check if store is pending approval
      if (result.storeProfile) {
        if (result.storeProfile.approval_status === 'pending') {
          setPendingApproval(true);
          setStoreName(result.storeProfile.store_name);
          return;
        } else if (result.storeProfile.approval_status === 'rejected') {
          setError(`Your store account was rejected. ${result.storeProfile.rejection_reason ? `Reason: ${result.storeProfile.rejection_reason}` : 'Please contact support for more information.'}`);
          return;
        }
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Pending Approval Screen
  if (pendingApproval) {
    return (
      <div className="relative flex h-screen w-full flex-col bg-slate-50 dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
        <div className="flex items-center bg-slate-50 p-4 z-20">
          <button
            onClick={() => {
              setPendingApproval(false);
              groomingStoreAuthService.signOut();
            }}
            className="text-slate-600 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-100 mb-6">
              <span className="material-symbols-outlined text-[48px] text-amber-600">hourglass_top</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-3">
              Approval Pending
            </h1>
            <p className="text-slate-600 mb-2">
              Welcome, <span className="font-semibold text-primary">{storeName}</span>!
            </p>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Your grooming store registration is under review. Our admin team will verify your details and approve your account soon.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-800">What happens next?</p>
                  <ul className="text-xs text-amber-700 mt-2 space-y-1">
                    <li>• Admin reviews your store information</li>
                    <li>• You'll receive notification once approved</li>
                    <li>• After approval, you can manage bookings</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPendingApproval(false);
                groomingStoreAuthService.signOut();
              }}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold h-12 rounded-xl transition-all"
            >
              Go Back
            </button>

            <p className="text-xs text-slate-400 mt-4">
              Need help? Contact us at <a href="mailto:support@petvisit.com" className="text-primary">support@petvisit.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="material-symbols-outlined text-[40px]">storefront</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
            Grooming Store Portal
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Welcome back. Please login to manage your grooming bookings and services.
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
              Store Email
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
                placeholder="store@petvisit.com"
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
                <span>Login to Store Portal</span>
                <span className="material-symbols-outlined text-sm">login</span>
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        {onRegister && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Don't have an account?{' '}
              <button
                onClick={onRegister}
                className="text-primary font-bold hover:underline"
              >
                Register Store
              </button>
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400 font-normal">
            Need help?{' '}
            <a href="#" className="text-slate-500 dark:text-slate-300 font-medium hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroomingStoreLogin;
