
import React, { useState } from 'react';
import { authService } from '../services/api';

interface Props {
  onBack: () => void;
  onHomeClick: () => void;
  onAppointmentsClick: () => void;
  onAddressClick: () => void;
  onOrdersClick: () => void;
  onMyPetsClick: () => void;
  onPersonalInfoClick?: () => void;
  onLogout?: () => void;
  onPlusClick: () => void;
  onShopClick: () => void;
  userName?: string;
  userProfilePhoto?: string | null;
  userCreatedAt?: string;
  userId?: string | null;
  onPhotoUpload?: (photoUrl: string) => void;
}

const Profile: React.FC<Props> = ({ onBack, onHomeClick, onAppointmentsClick, onAddressClick, onOrdersClick, onMyPetsClick, onPersonalInfoClick, onLogout, onPlusClick, onShopClick, userName, userProfilePhoto, userCreatedAt, userId, onPhotoUpload }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setIsLoggingOut(true);

      try {
        // Sign out from Supabase
        await authService.signOut();

        // Clear all local storage
        localStorage.removeItem('user');
        localStorage.removeItem('otplessUser');

        // Call the onLogout callback if provided
        if (onLogout) {
          onLogout();
        } else {
          // Fallback: reload the page to reset the app
          window.location.reload();
        }
      } catch (error) {
        console.error('Error logging out:', error);
        alert('Failed to log out. Please try again.');
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const photoUrl = await authService.uploadProfilePhoto(userId, file);
      if (onPhotoUpload) {
        onPhotoUpload(photoUrl);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const formatMemberSince = (createdAt?: string): string => {
    if (!createdAt) return '2021';
    const date = new Date(createdAt);
    return date.getFullYear().toString();
  };
  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-slate-900 overflow-x-hidden fade-in h-screen">
      <div className="relative min-h-screen w-full mx-auto max-w-md bg-background-light flex flex-col pb-24">
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="w-10">
            <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Profile</h1>
          <div className="w-10 flex justify-end">
            <button className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        <section className="flex flex-col items-center pt-8 pb-6 px-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-slate-200 bg-cover bg-center shadow-lg border-4 border-white overflow-hidden">
              <img
                src={userProfilePhoto || "https://lh3.googleusercontent.com/aida-public/AB6AXuAHCGM2pGBAFhuDcldw-u7He2UfvPNnSaX-WhGfgG-STTztL47Sl3o7xmmOjkBa27twFaDz0n6C-Tjcx8YnxTg1kDzFWtaKFEkqYftqIX1qTku0lK2liwLp1ImDMKOUVR9jAIREqg5XX8WOtnYv8O6aKeLn_xN_4E6gs0xDHjXn_6aKh4PaZTdmH-wymWBRCUQaqxv9UDtG-7EZv4O-7iexvF3n8r3lsg_SGDHRR213wJ4lcsx7tkOsZHeyWittX1uoW11UIoJcu1Q"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary-light transition-colors border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px] block">
                {isUploadingPhoto ? 'hourglass_empty' : 'edit'}
              </span>
            </button>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-slate-900">{userName || 'Guest User'}</h2>
            <p className="text-primary font-medium mt-1">Pet Parent since {formatMemberSince(userCreatedAt)}</p>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="material-symbols-outlined text-[16px] mr-1">workspace_premium</span>
              Premium Member
            </div>
          </div>
        </section>

        <section className="px-4 mt-2 mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">ACCOUNT</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={onPersonalInfoClick} className="w-full flex items-center p-4 transition-colors hover:bg-slate-50 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-base font-semibold text-slate-900">Personal Information</p>
                <p className="text-sm text-slate-500">Name, Email, Phone</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <div className="h-px w-full bg-gray-50 ml-16"></div>
            <button
              onClick={onAddressClick}
              className="w-full flex items-center p-4 transition-colors hover:bg-slate-50 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-base font-semibold text-slate-900">Address Book</p>
                <p className="text-sm text-slate-500">Manage home & visit locations</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <div className="h-px w-full bg-gray-50 ml-16"></div>
            <button
              onClick={onOrdersClick}
              className="w-full flex items-center p-4 transition-colors hover:bg-slate-50 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <span className="material-symbols-outlined">shopping_bag</span>
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-base font-semibold text-slate-900">Orders</p>
                <p className="text-sm text-slate-500">Track and manage your purchases</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <div className="h-px w-full bg-gray-50 ml-16"></div>
            <button onClick={onMyPetsClick} className="w-full flex items-center p-4 transition-colors hover:bg-slate-50 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <span className="material-symbols-outlined">pets</span>
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-base font-semibold text-slate-900">My Pets</p>
                <p className="text-sm text-slate-500">Manage Bella & Max</p>
              </div>
              <div className="flex -space-x-2 mr-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC0W4m-cJu46zAkA0yU6ZPLMAuwCj2y6dve0gm7snhV9GPEoTbb6IieeKdLOewAJluzmq1Dm7_W1seEAhskKKbELXhIrydnigbu3rN-LwYeCflECWvFC0JqUfQhvbsctwlH5hdoGh_5l3yDVSuRR-LddHKDgRitPja3CKf81valv0rya3spG2QN-95noySBAqS3xJxwgBpFpdHUxjkFd90FtDurlFUhwj1v8GziVk4han-xUHNVHk1HTn3He-3ETCJUDLuilLnJbqE')" }}></div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuArSvMwZ9iEroFin5xBs8t--WL72YSI5KGXy9fhsXkAVxfsVhpcpalEss885nv1MDvbrDlTLGv3o_4TMCtCQxoM57pPgwcLEFGj0Fp56m2HySRiEN971GTkaM3yahGUNgkZX-qtoTtppWHf3nLsHObF1uN2A84lY9svigfS1UVGQzvJt9OrK3Kn_OBZ01VmA6fzlYwHju3z7XsynomY00idls3Tb-Z3kJB15jCw4jJm107r3y_12yNkKhIhddZK7tMUrvmIG_wSsRE')" }}></div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="px-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">GENERAL</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button className="w-full flex items-center p-4 transition-colors hover:bg-slate-50 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 shrink-0">
                <span className="material-symbols-outlined">notifications</span>
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-base font-semibold text-slate-900">Notifications</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <div className="h-px w-full bg-gray-50 ml-16"></div>
            <button className="w-full flex items-center p-4 transition-colors hover:bg-slate-50 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 shrink-0">
                <span className="material-symbols-outlined">help</span>
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-base font-semibold text-slate-900">Help & Support</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <div className="h-px w-full bg-gray-50 ml-16"></div>
            <button className="w-full flex items-center p-4 transition-colors hover:bg-slate-50 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 shrink-0">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-base font-semibold text-slate-900">Payment Methods</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="px-4 mb-40 pb-24">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-white border border-gray-200 text-red-600 font-semibold py-4 rounded-xl shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                Logging Out...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">logout</span>
                Log Out
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-4 font-medium uppercase tracking-widest">Furora Care App v2.4.0</p>
        </section>

        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 z-50">
          <div className="grid grid-cols-5 items-center h-[72px] pb-2">
            <button
              onClick={onHomeClick}
              className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">home</span>
              <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Home</span>
            </button>
            <button
              onClick={onAppointmentsClick}
              className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
              <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Bookings</span>
            </button>
            <button
              onClick={onPlusClick}
              className="flex flex-col items-center justify-center h-full -mt-8"
            >
              <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors">
                <span className="material-symbols-outlined text-white text-[32px]">add</span>
              </div>
            </button>
            <button
              onClick={onShopClick}
              className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">storefront</span>
              <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Shop</span>
            </button>
            <button className="relative flex flex-col items-center justify-center h-full text-primary">
              <span className="material-symbols-outlined text-[24px] fill-current">person</span>
              <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Profile;