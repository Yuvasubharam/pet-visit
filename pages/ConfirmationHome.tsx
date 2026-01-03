
import React from 'react';
import { Booking } from '../types';

interface Props {
  onBackHome: () => void;
  onViewAppointments: () => void;
  booking?: Booking | null;
}

const ConfirmationHome: React.FC<Props> = ({
  onBackHome,
  onViewAppointments,
  booking
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Today';

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

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
  const serviceTitle = isGrooming
    ? `${booking.booking_type === 'home' ? 'Home' : 'Clinic'} Grooming`
    : 'Home Visit';

  const doctorName = booking?.doctor_name || 'Dr. Sarah Jenkins';
  const petName = booking?.pets ? `${booking.pets.name} (${booking.pets.species})` : 'Baxter (Golden)';
  const appointmentTime = formatTime(booking?.time);
  const appointmentDate = formatDate(booking?.date);
  const address = booking?.addresses?.full_address ||
    (booking?.addresses
      ? `${booking.addresses.flat_number}, ${booking.addresses.street}, ${booking.addresses.city}, ${booking.addresses.state} ${booking.addresses.pincode}`
      : '124 Pet Lane, Apt 4B, New York, NY 10001'
    );
  const bookingId = booking?.id ? `#REF-${booking.id.substring(0, 8).toUpperCase()}` : '#REF-2023-889';

  // Grooming specific data
  const groomingStoreName = booking?.grooming_stores?.store_name || 'Grooming Store';
  const groomingPackageName = booking?.grooming_packages?.name || 'Full Grooming';
  const groomingPackageDescription = booking?.grooming_packages?.description || '';
  const providerName = isGrooming ? groomingStoreName : doctorName;
  const providerRole = isGrooming ? 'Grooming Service' : 'Veterinarian';
  return (
    <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden">
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="size-10"></div>
            <h1 className="text-xl font-black text-primary tracking-tight font-display">Confirmation</h1>
            <div className="size-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col items-center">
            <div className="py-6 flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-primary rounded-[28px] flex items-center justify-center shadow-2xl shadow-primary/30">
                    <span className="material-symbols-outlined text-[48px] text-white fill-current">check_circle</span>
                </div>
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{serviceTitle} Set!</h2>
                    <p className="text-sm text-gray-500 font-medium px-8 mt-2">
                      {isGrooming
                        ? `${groomingStoreName} will arrive at your location at the scheduled time.`
                        : `${doctorName} will arrive at your location at the scheduled time.`}
                    </p>
                </div>
            </div>

            <div className="w-full bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden mt-6">
                <div className="px-8 py-4 bg-primary/5 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Ref ID</span>
                    <span className="text-[10px] font-black text-gray-900">{bookingId}</span>
                </div>
                <div className="p-8 space-y-8">
                    <div className="flex items-center gap-4">
                        {isGrooming ? (
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
                          </div>
                        ) : (
                          <img src="https://picsum.photos/seed/doc1/100/100" className="w-14 h-14 rounded-full border-4 border-gray-50" />
                        )}
                        <div>
                            <h3 className="font-black text-gray-900 text-lg">{providerName}</h3>
                            <p className="text-xs text-primary font-bold">{providerRole}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Patient</p>
                            <p className="text-sm font-black text-gray-900">{petName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Timing</p>
                            <p className="text-sm font-black text-gray-900">{appointmentTime} {appointmentDate}</p>
                        </div>
                    </div>

                    {isGrooming && groomingPackageDescription && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Package</p>
                        <p className="text-sm font-black text-gray-900">{groomingPackageName}</p>
                        <p className="text-xs text-gray-500 font-medium">{groomingPackageDescription}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Address</p>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
                            <p className="text-sm font-black text-gray-900 leading-tight">{address}</p>
                        </div>
                    </div>
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

export default ConfirmationHome;
