import React, { useState } from 'react';
import { authService } from '../services/api';
import { doctorAuthService } from '../services/doctorApi';
import { groomingStoreAuthService } from '../services/groomingStoreApi';

interface UnifiedLoginProps {
    onBack: () => void;
    onLoginSuccess: () => void;
    onRegisterDoctor: () => void;
    onRegisterGroomingStore: () => void;
    userType: 'user' | 'doctor' | 'grooming_store' | 'admin';
}

const UnifiedLogin: React.FC<UnifiedLoginProps> = ({
    onBack,
    onLoginSuccess,
    onRegisterDoctor,
    onRegisterGroomingStore,
    userType
}) => {
    const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getUserTypeConfig = () => {
        switch (userType) {
            case 'doctor':
                return {
                    title: 'Doctor Portal',
                    subtitle: 'Welcome back. Please login to access your consultation schedule.',
                    icon: 'stethoscope',
                    registerText: 'Register as Doctor',
                    onRegister: onRegisterDoctor
                };
            case 'grooming_store':
                return {
                    title: 'Grooming Store Portal',
                    subtitle: 'Welcome back. Please login to manage your store.',
                    icon: 'storefront',
                    registerText: 'Register Grooming Store',
                    onRegister: onRegisterGroomingStore
                };
            case 'admin':
                return {
                    title: 'Admin Portal',
                    subtitle: 'Administrative access only.',
                    icon: 'admin_panel_settings',
                    registerText: null,
                    onRegister: null
                };
            default:
                return {
                    title: 'Welcome Back!',
                    subtitle: 'Login to your account',
                    icon: 'login',
                    registerText: 'Create Account',
                    onRegister: null
                };
        }
    };

    const config = getUserTypeConfig();

    const handleEmailLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let result;
            switch (userType) {
                case 'doctor':
                    result = await doctorAuthService.signInWithEmail(email, password);
                    break;
                case 'grooming_store':
                    result = await groomingStoreAuthService.signInWithEmail(email, password);
                    // Check approval status for grooming stores
                    if (result.storeProfile?.approval_status === 'pending') {
                        setError(`Your store account is pending approval. Please wait for admin approval.`);
                        setIsLoading(false);
                        return;
                    } else if (result.storeProfile?.approval_status === 'rejected') {
                        setError(`Your store account was rejected. ${result.storeProfile.rejection_reason || 'Please contact support.'}`);
                        setIsLoading(false);
                        return;
                    }
                    break;
                case 'admin':
                    // For admin, we use regular auth but check role
                    await authService.signInWithPassword(email, password);
                    break;
                default:
                    await authService.signInWithPassword(email, password);
            }
            onLoginSuccess();
        } catch (err: any) {
            console.error('Error logging in:', err);
            setError(err.message || 'Invalid email or password');
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const phoneWithCode = `+91${mobileNumber}`;
            await authService.verifyOtp(phoneWithCode, otp);
            onLoginSuccess();
        } catch (err: any) {
            console.error('Error verifying OTP:', err);
            setError(err.message || 'Invalid OTP');
            setIsLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (mobileNumber.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const phoneWithCode = `+91${mobileNumber}`;
            await authService.signUpWithPhone(phoneWithCode, 'User');
            setIsOtpSent(true);
        } catch (err: any) {
            console.error('Error sending OTP:', err);
            setError(err.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
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
      `}</style>
            <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden relative">
                <div className="h-[45vh] flex items-center justify-center p-8 relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-blue-50/50 -z-10"></div>
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-700 mb-6 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[40px]">{config.icon}</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{config.title}</h2>
                        <p className="text-gray-400 text-sm font-medium">{config.subtitle}</p>
                    </div>
                </div>

                <div className="absolute top-[42vh] left-0 right-0 bottom-0 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
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
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="w-full space-y-4">
                            {authMethod === 'email' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">
                                            {userType === 'doctor' ? 'Doctor Email / Username' : 'Email'}
                                        </label>
                                        <input
                                            type="email"
                                            placeholder={userType === 'doctor' ? "dr.smith@petvisit.com" : "Enter your email"}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleEmailLogin();
                                                    }
                                                }}
                                                className="w-full px-4 py-3 pr-12 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {showPassword ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleEmailLogin}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-primary hover:bg-primary-light text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Mobile Number</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                                                +91
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="9876543210"
                                                value={mobileNumber}
                                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                disabled={isOtpSent}
                                                className="w-full pl-14 pr-4 py-3 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900 disabled:opacity-50"
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>

                                    {isOtpSent && (
                                        <div className="space-y-2 fade-in">
                                            <label className="text-sm font-bold text-gray-700 ml-1">Enter OTP</label>
                                            <input
                                                type="text"
                                                placeholder="Enter 6-digit OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary transition-all text-gray-900 text-center text-xl tracking-widest font-semibold"
                                                maxLength={6}
                                            />
                                            <p className="text-xs text-gray-500 ml-1 text-center">
                                                OTP sent to +91{mobileNumber}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsOtpSent(false);
                                                    setOtp('');
                                                    setError(null);
                                                }}
                                                className="text-sm text-primary font-semibold hover:underline w-full text-center"
                                            >
                                                Change Number
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={isOtpSent ? handleVerifyOtp : handleSendOtp}
                                        disabled={isLoading || (isOtpSent && otp.length !== 6) || (!isOtpSent && mobileNumber.length !== 10)}
                                        className="w-full py-4 bg-primary hover:bg-primary-light text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {isOtpSent ? (isLoading ? 'VERIFYING...' : 'VERIFY OTP') : (isLoading ? 'SENDING...' : 'SEND OTP')}
                                    </button>
                                </>
                            )}

                            {/* Auth Method Toggle - only for regular users */}
                            {userType === 'user' && (
                                <>
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-white border-2 border-gray-200 hover:border-primary hover:bg-blue-50/50 text-gray-700 font-bold text-lg rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Sign in with Google
                                    </button>
                                </>
                            )}

                            {/* Auth Method Toggle */}
                            {userType === 'user' && (
                                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl">
                                    <button
                                        onClick={() => {
                                            setAuthMethod('email');
                                            setError(null);
                                        }}
                                        className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${authMethod === 'email' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
                                            }`}
                                    >
                                        Email
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAuthMethod('phone');
                                            setError(null);
                                            setIsOtpSent(false);
                                        }}
                                        className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${authMethod === 'phone' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
                                            }`}
                                    >
                                        Phone
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 pt-4 text-center space-y-4">
                        {config.registerText && config.onRegister && (
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <button
                                    onClick={config.onRegister}
                                    className="text-primary font-bold hover:underline"
                                >
                                    {config.registerText}
                                </button>
                            </p>
                        )}

                        {/* Cross-login options */}
                        {userType === 'doctor' && onRegisterGroomingStore && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">Or</span>
                                </div>
                            </div>
                        )}

                        {userType === 'doctor' && onRegisterGroomingStore && (
                            <button
                                onClick={onRegisterGroomingStore}
                                className="w-full flex items-center justify-center gap-2 py-4 px-4 border-2 border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 rounded-xl transition-all"
                            >
                                <span className="material-symbols-outlined text-primary">storefront</span>
                                <span className="text-sm font-bold text-primary">Register Grooming Store</span>
                            </button>
                        )}

                        <p className="text-[10px] text-gray-400">
                            By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> & <span className="underline cursor-pointer">Privacy Policy</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UnifiedLogin;