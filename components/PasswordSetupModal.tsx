import React, { useState } from 'react';
import { authService } from '../services/api';

interface PasswordSetupModalProps {
    email: string;
    isOpen: boolean;
    onComplete: () => void;
    onSkip?: () => void;
}

const PasswordSetupModal: React.FC<PasswordSetupModalProps> = ({
    email,
    isOpen,
    onComplete,
    onSkip
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/(?=.*[a-z])/.test(pwd)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(pwd)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(pwd)) {
            return 'Password must contain at least one number';
        }
        return '';
    };

    const handleSetPassword = async () => {
        setError('');

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        // Check passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await authService.setPasswordForOAuthUser(email, password);
            onComplete();
        } catch (err: any) {
            console.error('Error setting password:', err);
            // If the password is already set to this value, treat as success
            if (err.message && err.message.includes('New password should be different from the old password')) {
                console.log('Password already set, treating as success');
                onComplete();
            } else {
                setError(err.message || 'Failed to set password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && password && confirmPassword) {
            handleSetPassword();
        }
    };

    const passwordRequirements = [
        { met: password.length >= 8, text: 'At least 8 characters' },
        { met: /(?=.*[a-z])/.test(password), text: 'One lowercase letter' },
        { met: /(?=.*[A-Z])/.test(password), text: 'One uppercase letter' },
        { met: /(?=.*\d)/.test(password), text: 'One number' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
                    <div className="flex items-center justify-center mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">lock</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-center">Complete Your Account</h2>
                    <p className="text-white/90 text-sm text-center mt-1">
                        Set a password to enable email/password login
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Email Display */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-600">email</span>
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Account Email</p>
                                    <p className="text-sm text-blue-700">{email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-900"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                            <div className="space-y-1">
                                {passwordRequirements.map((req, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-sm ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                                            {req.met ? 'check_circle' : 'radio_button_unchecked'}
                                        </span>
                                        <span className={`text-sm ${req.met ? 'text-green-700' : 'text-gray-600'}`}>
                                            {req.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-6 space-y-3">
                        <button
                            onClick={handleSetPassword}
                            disabled={loading || !password || !confirmPassword}
                            className="w-full py-4 bg-primary hover:bg-primary-light text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Setting Password...' : 'Set Password & Continue'}
                        </button>

                        {onSkip && (
                            <button
                                onClick={onSkip}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
                            >
                                Skip for Now
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        You can set your password later from your profile settings
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PasswordSetupModal;