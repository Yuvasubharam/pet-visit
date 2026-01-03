
import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { groomingService, consultationService } from '../services/api';

interface Props {
  onBack: () => void;
  onHomeClick: () => void;
  onDetailClick: (booking: Booking) => void;
  onPlusClick: () => void;
  onJoinCall: (booking: Booking) => void;
  onProfileClick: () => void;
  onPetsClick: () => void;
  userId?: string | null;
}

const BookingsOverview: React.FC<Props> = ({ onBack, onHomeClick, onDetailClick, onPlusClick, onJoinCall, onProfileClick, onPetsClick, userId }) => {
  const [activeTab, setActiveTab] = useState<'Current' | 'Past'>('Current');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Grooming' | 'Consultation' | 'Online' | 'Home' | 'Clinic'>('All');

  useEffect(() => {
    if (userId) {
      loadBookings();
    }
  }, [userId]);

  const loadBookings = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      // Fetch grooming bookings
      const groomingBookings = await groomingService.getUserGroomingBookings(userId);
      // Fetch consultation bookings
      const consultationBookings = await consultationService.getUserConsultationBookings(userId);

      // Combine all bookings and sort by date (newest first)
      const allBookings = [...(groomingBookings || []), ...(consultationBookings || [])].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setBookings(allBookings);
      console.log('Loaded bookings:', allBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Apply filters
  const applyFilter = (bookingsList: Booking[]) => {
    if (selectedFilter === 'All') return bookingsList;

    return bookingsList.filter(booking => {
      if (selectedFilter === 'Grooming') {
        return booking.service_type === 'grooming';
      }
      if (selectedFilter === 'Consultation') {
        return booking.service_type === 'consultation';
      }
      if (selectedFilter === 'Online') {
        return booking.booking_type === 'online';
      }
      if (selectedFilter === 'Home') {
        return booking.booking_type === 'home';
      }
      if (selectedFilter === 'Clinic') {
        return booking.booking_type === 'clinic';
      }
      return true;
    });
  };

  const currentBookings = applyFilter(bookings.filter(b => b.status === 'upcoming' || b.status === 'pending'));
  const pastBookings = applyFilter(bookings.filter(b => b.status === 'completed' || b.status === 'cancelled'));

  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 antialiased overflow-hidden fade-in">
      <div className="relative flex h-full w-full flex-col max-w-md mx-auto bg-background-light overflow-hidden">
        <header className="flex items-center bg-white p-4 sticky top-0 z-20 shadow-sm">
          <div 
            onClick={onBack}
            className="text-gray-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </div>
          <h2 className="text-primary text-xl font-extrabold leading-tight tracking-tight flex-1 text-center pr-2 font-display">My Bookings</h2>
          <div className="flex w-10 items-center justify-end">
            <button className="flex items-center justify-center rounded-full size-10 hover:bg-gray-100 transition-colors text-gray-900">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </header>

        <div className="bg-background-light sticky top-[72px] z-10">
          {/* Current/Past Toggle */}
          <div className="px-6 pt-5 pb-3">
            <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-gray-200/50 p-1">
              <button
                onClick={() => setActiveTab('Current')}
                className={`flex-1 h-full rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'Current' ? 'bg-white text-primary shadow-lg' : 'text-gray-400'}`}
              >
                Current
              </button>
              <button
                onClick={() => setActiveTab('Past')}
                className={`flex-1 h-full rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'Past' ? 'bg-white text-primary shadow-lg' : 'text-gray-400'}`}
              >
                Past
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="px-6 pb-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'All', label: 'All', icon: 'apps' },
                { id: 'Grooming', label: 'Grooming', icon: 'content_cut' },
                { id: 'Consultation', label: 'Consultation', icon: 'medical_services' },
                { id: 'Online', label: 'Online', icon: 'videocam' },
                { id: 'Home', label: 'Home Visit', icon: 'home_health' },
                { id: 'Clinic', label: 'Clinic Visit', icon: 'local_hospital' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{filter.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col gap-6 pb-40">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === 'Current' ? (
            currentBookings.length > 0 ? (
              currentBookings.map((booking) => {
                const isGrooming = booking.service_type === 'grooming';

                return (
                  <div
                    key={booking.id}
                    onClick={() => onDetailClick(booking)}
                    className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shadow-lg transition-colors duration-500 ${
                          isGrooming
                            ? 'bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white'
                            : booking.booking_type === 'online'
                            ? 'bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white'
                            : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                        }`}>
                          <span className="material-symbols-outlined text-3xl">
                            {isGrooming ? 'content_cut' : booking.booking_type === 'online' ? 'videocam' : 'home_health'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-base leading-tight">
                            {isGrooming
                              ? `${booking.booking_type === 'home' ? 'Home' : 'Clinic'} Grooming`
                              : `${booking.booking_type === 'home' ? 'Home' : booking.booking_type === 'online' ? 'Online' : 'Clinic'} Consult`
                            }
                          </h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            {isGrooming && booking.grooming_packages ? booking.grooming_packages.name : 'Standard Checkup'}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        booking.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {booking.status === 'upcoming' ? 'Confirmed' : booking.status}
                      </span>
                    </div>

                    {/* Pet Info */}
                    {booking.pets && (
                      <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100/50">
                        <div className="w-12 h-12 rounded-[18px] border-2 border-white shadow-xl overflow-hidden shrink-0">
                          <img src={booking.pets.image} className="w-full h-full object-cover" alt={booking.pets.name} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-900 leading-none">{booking.pets.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{booking.pets.species}</p>
                        </div>
                        {booking.contact_number && (
                          <>
                            <div className="h-10 w-[1px] bg-gray-200"></div>
                            <div className="flex items-center gap-2 pl-2">
                              <span className="material-symbols-outlined text-primary text-sm">call</span>
                              <span className="text-[10px] font-black text-gray-700">{booking.contact_number.slice(-4)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Date & Time */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl font-black">calendar_month</span>
                        <span className="text-xs font-black text-gray-700">
                          {formatDate(booking.date)}, {booking.time}
                        </span>
                      </div>
                      {booking.payment_amount && (
                        <span className="text-xs font-black text-gray-900">₹{booking.payment_amount.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {booking.booking_type === 'online' && booking.status === 'upcoming' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[BookingsOverview] Joining call for booking:', booking.id);
                          onJoinCall(booking);
                        }}
                        className="w-full py-4 bg-primary hover:bg-primary-light text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                      >
                        <span className="material-symbols-outlined text-lg font-black">videocam</span>
                        Join Consultation
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
                <span className="material-symbols-outlined text-[80px] text-primary">event_busy</span>
                <p className="font-black uppercase tracking-[0.3em] text-sm mt-6">No Upcoming Bookings</p>
              </div>
            )
          ) : (
            pastBookings.length > 0 ? (
              pastBookings.map((booking) => {
                const isGrooming = booking.service_type === 'grooming';

                return (
                  <div
                    key={booking.id}
                    onClick={() => onDetailClick(booking)}
                    className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer opacity-75"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${
                          isGrooming ? 'bg-pink-50 text-pink-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className="material-symbols-outlined text-2xl">
                            {isGrooming ? 'content_cut' : booking.booking_type === 'online' ? 'videocam' : 'home_health'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-black text-gray-700 text-sm leading-tight">
                            {isGrooming
                              ? `${booking.booking_type === 'home' ? 'Home' : 'Clinic'} Grooming`
                              : `${booking.booking_type} Consult`
                            }
                          </h3>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {formatDate(booking.date)}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
                <span className="material-symbols-outlined text-[80px] text-primary">history_toggle_off</span>
                <p className="font-black uppercase tracking-[0.3em] text-sm mt-6">History Empty</p>
              </div>
            )
          )}
        </main>

        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 z-50">
          <div className="grid grid-cols-5 items-center h-[72px] pb-2">
            <button
              onClick={onHomeClick}
              className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">home</span>
              <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Home</span>
            </button>
            <button className="flex flex-col items-center justify-center h-full text-primary">
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
              onClick={onPetsClick}
              className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">pets</span>
              <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Pets</span>
            </button>
            <button
              onClick={onProfileClick}
              className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">person</span>
              <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default BookingsOverview;
