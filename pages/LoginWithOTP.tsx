
import React, { useState } from 'react';
import { authService } from '../services/api';

interface Props {
  onNext: () => void;
}

const LoginWithOTP: React.FC<Props> = ({ onNext }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Limit to 10 digits and add +91 prefix
    const limitedDigits = digits.slice(0, 10);
    if (limitedDigits.length > 0) {
      return '+91' + limitedDigits;
    }

    return '';
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('91')) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const fullPhone = phone;

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      await authService.signUpWithPhone(fullPhone, name.trim());
      setStep('otp');
      setError(null);
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await authService.verifyOtp(phone, otp);

      if (user) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          phone: user.phone,
          name: name,
        }));

        onNext();
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.signUpWithPhone(phone, name);
      setError(null);
    } catch (err: any) {
      console.error('Error resending OTP:', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await authService.signInWithGoogle();
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden relative">
        <div className="h-[45vh] flex items-center justify-center p-8 relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-blue-50/50 -z-10"></div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMrqOyKTZQM8CkTI7jCMV_qC9aQ-4zCkclALNo2GMIaA7rF4lZB_DkrRprV2wq4ac9jJw5ZJJzwkuG8OjBEODesT_NtphZHe9hy96ol87uCZdE1wMLoxUKJB5LMDfRqjCHS8FuJpGB2gdhW23YSEsjMONSwKeFt2Wg-lIhHqrN1kttIUEskWQoeXgO1-sxJVwH67ENshl59i0bn-0yUc9aWfaTHJFHWVNQFtlr6153I8cRNn6ZRvqB5W8kc0k22xQ6K_XGixqMwJY"
            alt="Illustration"
            className="w-full max-w-[280px] object-contain"
          />
        </div>

        <div className="absolute top-[42vh] left-0 right-0 bottom-0 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-8 px-8 pt-2 overscroll-behavior-contain scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/assets/images/logo.png"
                  alt="Furora Care Logo"
                  className="w-16 h-16 object-contain"
                />
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-gray-900">Furora Care</h1>
                  <p className="text-xs text-gray-500 -mt-1">Pet Health & Wellness</p>
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Welcome Back!</h2>
              <p className="text-gray-400 text-sm font-medium">
                {step === 'phone' ? 'Enter your details to continue' : 'Enter the OTP sent to your mobile'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-red-500 mr-2">error</span>
                  <div>
                    <p className="text-sm text-red-800 font-semibold mb-1">Error</p>
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 'phone' ? (
              <div className="w-full space-y-6">
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phone.replace('+91', '')}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setPhone(formatted);
                        }}
                        placeholder="9876543210"
                        maxLength={10}
                        className="w-full pl-14 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      We'll send you an OTP to verify your number
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white py-3 rounded-2xl font-bold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending OTP...
                      </div>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-4 bg-white border-2 border-gray-200 hover:border-primary hover:bg-blue-50/50 text-gray-700 font-bold text-lg rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOTP} className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest font-bold"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    OTP sent to {phone}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-primary text-white py-3 rounded-2xl font-bold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    'Verify OTP'
                  )}
                </button>

                <div className="flex items-center justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setError(null);
                    }}
                    className="text-sm text-primary font-semibold hover:underline"
                  >
                    Change Number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-primary font-semibold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="p-8 pt-4 text-center">
            <p className="text-[10px] text-gray-400">
              By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> & <span className="underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginWithOTP;
