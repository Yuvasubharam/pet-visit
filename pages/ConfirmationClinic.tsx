
import React from 'react';
import { Booking } from '../types';

interface Props {
  onBackHome: () => void;
  onViewAppointments: () => void;
  booking?: Booking | null;
}

const ConfirmationClinic: React.FC<Props> = ({
  onBackHome,
  onViewAppointments,
  booking
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) {
      const today = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
    }

    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '10:00 AM';
    return timeStr;
  };

  // Check if it's a grooming or consultation booking
  const isGrooming = booking?.service_type === 'grooming';

  // Use booking data if available, otherwise show defaults
  const doctorName = booking?.doctor_name || booking?.doctors?.full_name || 'Dr. Sarah Jenkins';
  const doctorPhoto = booking?.doctors?.profile_photo_url;
  const petName = booking?.pets ? `${booking.pets.name} (${booking.pets.species})` : booking?.pet_name || 'Bella (Golden)';
  const appointmentTime = formatTime(booking?.time);
  const appointmentDate = formatDate(booking?.date);
  const specialization = booking?.doctors?.specialization || 'Veterinary Specialist';
  const clinicAddress = booking?.doctors?.clinic_address || 'Visit clinic for address';
  const clinicName = booking?.doctors?.clinic_name || 'Veterinary Clinic';

  // Grooming specific data
  const groomingStoreName = booking?.grooming_stores?.store_name || 'Grooming Store';
  const groomingPackageName = booking?.grooming_packages?.name || 'Full Grooming';
  const groomingPackageDescription = booking?.grooming_packages?.description || '';
  const groomingStoreAddress = booking?.grooming_stores?.address || '';
  const groomingStoreCity = booking?.grooming_stores?.city || '';
  const groomingStoreState = booking?.grooming_stores?.state || '';
  const groomingStorePhone = booking?.grooming_stores?.phone || '';
  const fullGroomingAddress = groomingStoreAddress
    ? `${groomingStoreAddress}${groomingStoreCity ? ', ' + groomingStoreCity : ''}${groomingStoreState ? ', ' + groomingStoreState : ''}`
    : 'Visit store for address';

  return (
    <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden">
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="size-10"></div>
            <h1 className="text-xl font-black text-primary tracking-tight font-display">Confirmation</h1>
            <div className="size-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col items-center">
            <div className="py-10 flex flex-col items-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-150"></div>
                    <div className="w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center relative z-10">
                        <span className="material-symbols-outlined text-[64px] text-primary fill-current">check_circle</span>
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-primary tracking-tight">Booking Confirmed!</h2>
                    <p className="text-sm text-gray-500 font-medium max-w-[280px]">
                      {isGrooming
                        ? `Your grooming appointment at ${groomingStoreName} is all set.`
                        : `Your clinic visit with ${doctorName} is all set.`}
                    </p>
                </div>
            </div>

            <div className="w-full bg-white rounded-[40px] shadow-sm border border-gray-50 p-8 space-y-6">
                {isGrooming ? (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Grooming Store</p>
                      <p className="text-lg font-black text-gray-900 leading-none">{groomingStoreName}</p>
                      <p className="text-xs text-gray-400 font-bold mt-1">{groomingPackageName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border-2 border-primary/10 p-1">
                      <img
                        src={doctorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&size=200&background=random`}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Doctor</p>
                      <p className="text-lg font-black text-gray-900 leading-none">{doctorName}</p>
                      <p className="text-xs text-gray-400 font-bold mt-1">{specialization}</p>
                    </div>
                  </div>
                )}

                <div className="h-px bg-gray-50"></div>

                <div className="grid grid-cols-1 gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                            <span className="material-symbols-outlined text-[20px]">pets</span>
                            <span className="text-xs font-black uppercase tracking-widest">Pet</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">{petName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                            <span className="material-symbols-outlined text-[20px]">
                              {isGrooming ? 'content_cut' : 'local_hospital'}
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest">Type</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">
                          {isGrooming ? 'Grooming - Clinic Visit' : 'Clinic Visit'}
                        </span>
                    </div>
                    {isGrooming && groomingPackageDescription && (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                            <span className="text-xs font-black uppercase tracking-widest">Package</span>
                        </div>
                        <div className="text-right max-w-[60%]">
                            <p className="text-sm font-black text-gray-900">{groomingPackageName}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{groomingPackageDescription}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                            <span className="text-xs font-black uppercase tracking-widest">Timing</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-gray-900">{appointmentDate}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{appointmentTime}</p>
                        </div>
                    </div>
                    {isGrooming && booking?.contact_number && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                            <span className="material-symbols-outlined text-[20px]">call</span>
                            <span className="text-xs font-black uppercase tracking-widest">Contact</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">{booking.contact_number}</span>
                      </div>
                    )}
                </div>
            </div>

            <div className="w-full mt-6 bg-green-50/50 rounded-[32px] p-6 border border-green-100 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600">location_on</span>
                    <p className="text-sm font-black text-gray-900">
                      {isGrooming ? 'Store Location' : 'Clinic Location'}
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-4">
                    {isGrooming ? (
                      <>
                        <p className="text-sm font-bold text-gray-900 mb-1">{groomingStoreName}</p>
                        <p className="text-xs text-gray-500">{fullGroomingAddress}</p>
                        {groomingStorePhone && (
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">call</span>
                            {groomingStorePhone}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-gray-900 mb-1">{clinicName}</p>
                        <p className="text-xs text-gray-500">{clinicAddress}</p>
                      </>
                    )}
                </div>
            </div>
        </main>

        <div className="p-6 pb-10 space-y-3 bg-background-light">
            <button onClick={onViewAppointments} className="w-full py-4 bg-primary text-white font-black text-base rounded-[24px] shadow-xl shadow-primary/20">View My Appointments</button>
            <button onClick={onBackHome} className="w-full py-4 text-primary font-black text-base">Back to Home</button>
        </div>
    </div>
  );
};

export default ConfirmationClinic;
