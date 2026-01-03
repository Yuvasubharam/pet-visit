
import React, { useState } from 'react';
import { authService } from '../services/api';

interface Props {
  onBack: () => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onShopClick: () => void;
  onProfileClick: () => void;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userId?: string | null;
  onUserUpdate?: (name: string, email: string, phone: string) => void;
}

const PersonalInformation: React.FC<Props> = ({
  onBack,
  onHomeClick,
  onVisitsClick,
  onShopClick,
  onProfileClick,
  userName = '',
  userEmail = '',
  userPhone = '',
  userId,
  onUserUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !userId) return;

    setIsSaving(true);
    try {
      await authService.createOrUpdateUserProfile(userId, {
        name,
        email: email || undefined,
        phone: phone || undefined,
      });

      if (onUserUpdate) {
        onUserUpdate(name, email, phone);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(userName);
    setEmail(userEmail);
    setPhone(userPhone);
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-slate-900 overflow-hidden fade-in h-screen">
      <div className="relative min-h-screen w-full mx-auto max-w-md bg-background-light flex flex-col pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900">Personal Information</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          ) : (
            <div className="w-10"></div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Name Field */}
            <div className="p-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-base font-medium text-slate-900">{name || 'Not provided'}</p>
              )}
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="h-px w-full bg-gray-50"></div>

            {/* Email Field */}
            <div className="p-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.email ? 'border-red-500' : 'border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-base font-medium text-slate-900">{email || 'Not provided'}</p>
              )}
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div className="h-px w-full bg-gray-50"></div>

            {/* Phone Field */}
            <div className="p-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.phone ? 'border-red-500' : 'border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-base font-medium text-slate-900">{phone || 'Not provided'}</p>
              )}
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          )}

          {/* Additional Information Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Account Details
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Account ID</span>
                <span className="text-sm font-mono text-slate-700">{userId?.slice(0, 8)}...</span>
              </div>
              <div className="h-px w-full bg-gray-50 my-3"></div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Account Status</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 z-50">
          <div className="flex justify-around items-center h-[72px] pb-2">
            <button
              onClick={onHomeClick}
              className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[28px]">home</span>
              <span className="text-[10px] font-bold mt-1 uppercase tracking-widest leading-none">Home</span>
            </button>
            <button
              onClick={onVisitsClick}
              className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[28px]">calendar_month</span>
              <span className="text-[10px] font-bold mt-1 uppercase tracking-widest leading-none">Appointments</span>
            </button>
            <button
              onClick={onShopClick}
              className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
              <span className="text-[10px] font-bold mt-1 uppercase tracking-widest leading-none">Shop</span>
            </button>
            <button
              onClick={onProfileClick}
              className="flex flex-col items-center justify-center flex-1 h-full text-primary"
            >
              <span className="material-symbols-outlined text-[28px] fill-current">person</span>
              <span className="text-[10px] font-bold mt-1 uppercase tracking-widest leading-none">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default PersonalInformation;
