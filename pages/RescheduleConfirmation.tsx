import React from 'react';
import type { Booking } from '../types';

interface RescheduleConfirmationProps {
  onBackHome: () => void;
  onViewAppointments: () => void;
  booking: Booking | null;
  oldDate: string;
  oldTime: string;
}

const RescheduleConfirmation: React.FC<RescheduleConfirmationProps> = ({
  onBackHome,
  onViewAppointments,
  booking,
  oldDate,
  oldTime
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!booking) {
    return (
      <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 h-screen overflow-hidden antialiased">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No booking data available</p>
        </div>
      </div>
    );
  }

  const isGrooming = booking.service_type === 'grooming';
  const serviceIcon = isGrooming
    ? 'content_cut'
    : booking.booking_type === 'online'
      ? 'videocam'
      : 'home_health';

  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 h-screen overflow-hidden antialiased fade-in">
      {/* Success Animation Header */}
      <div className="relative bg-gradient-to-b from-emerald-500 to-emerald-600 pt-20 pb-32">
        {/* Animated Success Icon */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 animate-bounce-slow">
            <span className="material-symbols-outlined text-emerald-500 fill-current text-[80px]">
              check_circle
            </span>
          </div>
          <h1 className="text-white text-3xl font-black mb-2 text-center px-6">
            Successfully Rescheduled!
          </h1>
          <p className="text-emerald-100 text-base font-semibold text-center px-8">
            Your appointment has been rescheduled
          </p>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 right-20 w-12 h-12 bg-white/10 rounded-full"></div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar -mt-16 px-6 pb-32">
        {/* Booking Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-gray-100 mb-6 relative overflow-hidden">
          {/* Service Type Badge */}
          <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-[24px] text-xs font-black uppercase tracking-wider">
            Rescheduled
          </div>

          {/* Service Icon */}
          <div className="flex items-center gap-6 mb-8 pt-6">
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg ${
              isGrooming
                ? 'bg-pink-50 text-pink-600'
                : booking.booking_type === 'online'
                  ? 'bg-blue-50 text-primary'
                  : 'bg-purple-50 text-purple-600'
            }`}>
              <span className="material-symbols-outlined text-4xl">
                {serviceIcon}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">
                {isGrooming
                  ? `${booking.booking_type === 'home' ? 'Home' : 'Clinic'} Grooming`
                  : `${booking.booking_type === 'home' ? 'Home' : booking.booking_type === 'online' ? 'Online' : 'Clinic'} Consult`
                }
              </h2>
              <p className="text-sm text-gray-500 font-bold mt-1">
                {isGrooming && booking.grooming_packages
                  ? booking.grooming_packages.name
                  : 'Veterinary Consultation'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mb-8"></div>

          {/* Old Schedule (Crossed Out) */}
          <div className="bg-red-50 rounded-2xl p-5 mb-4 border border-red-100 relative">
            <div className="flex items-start gap-3 opacity-60">
              <span className="material-symbols-outlined text-red-500 text-2xl">cancel</span>
              <div className="flex-1">
                <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-2">
                  Previous Schedule
                </p>
                <p className="text-base font-bold text-gray-700 line-through">
                  {formatDate(oldDate)}
                </p>
                <p className="text-sm font-bold text-gray-600 line-through">
                  {oldTime}
                </p>
              </div>
            </div>
          </div>

          {/* New Schedule (Highlighted) */}
          <div className="bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-200">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-2xl fill-current">
                event_available
              </span>
              <div className="flex-1">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">
                  New Schedule
                </p>
                <p className="text-lg font-black text-gray-900">
                  {formatDate(booking.date)}
                </p>
                <p className="text-base font-bold text-gray-700">
                  {booking.time}
                </p>
              </div>
            </div>
          </div>

          {/* Pet Info */}
          {booking.pets && (
            <>
              <div className="h-px bg-gray-100 my-8"></div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-100 shadow-md">
                  <img
                    src={booking.pets.image}
                    alt={booking.pets.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-black uppercase tracking-wider mb-1">
                    Patient
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    {booking.pets.name}
                  </p>
                  <p className="text-xs text-gray-500 font-bold">
                    {booking.pets.species}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Booking ID */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">
              Booking ID: #{booking.id.substring(0, 8)}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-[24px] p-6 border border-blue-100 mb-6">
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-2xl shrink-0">
              info
            </span>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-relaxed">
                A confirmation notification has been sent. Please arrive 10 minutes before your appointment time.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-gray-100 p-6 pb-10 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3">
          <button
            onClick={onViewAppointments}
            className="w-full py-5 bg-primary text-white font-black text-base rounded-[28px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined font-black">calendar_month</span>
            View Appointments
          </button>
          <button
            onClick={onBackHome}
            className="w-full py-5 bg-transparent text-gray-600 font-black text-base rounded-[28px] border border-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined font-black">home</span>
            Back to Home
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RescheduleConfirmation;
