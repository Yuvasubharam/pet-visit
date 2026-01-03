
import React, { useState } from 'react';
import { authService } from '../services/api';

interface Props {
  onNext: (userName: string) => void;
}

const Login: React.FC<Props> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (name.trim() && mobileNumber.trim() && mobileNumber.length === 10) {
      setIsVerifying(true);
      setError(null);

      try {
        // Format phone number with country code
        const phoneWithCode = `+91${mobileNumber}`;
        await authService.signUpWithPhone(phoneWithCode, name);
        setIsOtpSent(true);
      } catch (err: any) {
        console.error('Error sending OTP:', err);
        setError(err.message || 'Failed to send OTP. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length === 6) {
      setIsVerifying(true);
      setError(null);

      try {
        const phoneWithCode = `+91${mobileNumber}`;
        await authService.verifyOtp(phoneWithCode, otp);
        onNext(name);
      } catch (err: any) {
        console.error('Error verifying OTP:', err);
        setError(err.message || 'Invalid OTP. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  return (
    <>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
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
            <div className="relative">
              <img
                src="./assets/images/logo.jpg"
                alt="Pet Visit Logo"
                className="w-32 h-auto relative z-1 object-contain mb-10"
              />
            </div>
            <p className="text-gray-400 text-sm font-medium mt-1">Simplifying Pet Parenting</p>
          </div>

          <div className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isOtpSent}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Mobile Number</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">smartphone</span>
                <input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  disabled={isOtpSent}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm fade-in">
                {error}
              </div>
            )}

            {isOtpSent && (
              <div className="space-y-2 fade-in">
                <label className="text-sm font-bold text-gray-700 ml-1">Enter OTP</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500 ml-1">
                  OTP sent to {mobileNumber}. <span className="text-primary cursor-pointer hover:underline" onClick={() => setIsOtpSent(false)}>Change number?</span>
                </p>
              </div>
            )}

            <button
              onClick={isOtpSent ? handleVerifyOtp : handleSendOtp}
              disabled={isOtpSent ? otp.length !== 6 : !name.trim() || mobileNumber.length !== 10 || isVerifying}
              className="w-full py-4 bg-primary hover:bg-primary-light text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOtpSent ? 'VERIFY & GET STARTED' : isVerifying ? 'SENDING...' : 'SEND OTP'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await authService.signInWithGoogle();
                } catch (err: any) {
                  console.error('Error signing in with Google:', err);
                  setError(err.message || 'Failed to sign in with Google');
                }
              }}
              className="w-full py-4 bg-white border-2 border-gray-200 hover:border-primary hover:bg-blue-50/50 text-gray-700 font-bold text-lg rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
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

export default Login;
