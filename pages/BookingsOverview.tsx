
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
  onReschedule?: (booking: Booking) => void;
  userId?: string | null;
}

const BookingsOverview: React.FC<Props> = ({ onBack, onHomeClick, onDetailClick, onPlusClick, onJoinCall, onProfileClick, onPetsClick, onReschedule, userId }) => {
  const [activeTab, setActiveTab] = useState<'Current' | 'Past'>('Current');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Grooming' | 'Consultation' | 'Online' | 'Home' | 'Clinic'>('All');

  // New sorting and filtering state
  const [sortBy, setSortBy] = useState<'Latest' | 'Oldest' | 'PriceHighLow' | 'PriceLowHigh' | 'Upcoming'>('Latest');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [selectedPet, setSelectedPet] = useState<string>('All');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    if (userId) {
      loadBookings();
    }
  }, [userId]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.sort-menu-container')) {
          setShowSortMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

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

  // Check if a booking is lapsed (scheduled time passed but not attended)
  const isBookingLapsed = (booking: Booking): boolean => {
    try {
      const now = new Date();

      // Convert time to 24-hour format if needed
      let timeStr = booking.time;
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const isPM = timeStr.includes('PM');
        const timeOnly = timeStr.replace(/\s*(AM|PM)/i, '').trim();
        const [hours, minutes] = timeOnly.split(':').map(Number);
        let hour24 = hours;

        if (isPM && hours !== 12) {
          hour24 = hours + 12;
        } else if (!isPM && hours === 12) {
          hour24 = 0;
        }

        timeStr = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }

      const appointmentDateTime = new Date(`${booking.date}T${timeStr}`);

      // Check if the date is valid
      if (isNaN(appointmentDateTime.getTime())) {
        console.error('[BookingsOverview] Invalid appointment date/time:', booking.date, booking.time);
        return false;
      }

      // Booking is lapsed if:
      // 1. Status is still 'upcoming' or 'pending' (not completed or cancelled)
      // 2. The scheduled time has passed
      const isLapsed = (booking.status === 'upcoming' || booking.status === 'pending') &&
        appointmentDateTime < now;

      if (isLapsed) {
        console.log('[BookingsOverview] Lapsed booking detected:', {
          id: booking.id,
          date: booking.date,
          time: booking.time,
          appointmentDateTime: appointmentDateTime.toISOString(),
          now: now.toISOString()
        });
      }

      return isLapsed;
    } catch (error) {
      console.error('[BookingsOverview] Error checking if booking is lapsed:', error);
      return false;
    }
  };

  // Get unique pets from bookings
  const uniquePets = Array.from(new Set(bookings.filter(b => b.pets).map(b => b.pets!.name)));

  // Apply payment filter
  const applyPaymentFilter = (bookingsList: Booking[]) => {
    if (paymentFilter === 'All') return bookingsList;

    return bookingsList.filter(booking => {
      if (paymentFilter === 'Paid') {
        return booking.payment_status === 'paid';
      }
      if (paymentFilter === 'Pending') {
        return booking.payment_status === 'pending' || booking.payment_status === 'failed';
      }
      // Note: Payment method details are not stored in booking table currently
      // COD, Card, UPI would require additional payment_method field
      return true;
    });
  };

  // Apply pet filter
  const applyPetFilter = (bookingsList: Booking[]) => {
    if (selectedPet === 'All') return bookingsList;
    return bookingsList.filter(b => b.pets?.name === selectedPet);
  };

  // Apply sorting
  const applySorting = (bookingsList: Booking[]) => {
    const sorted = [...bookingsList];

    switch (sortBy) {
      case 'Latest':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'Oldest':
        return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'PriceHighLow':
        return sorted.sort((a, b) => (b.payment_amount || 0) - (a.payment_amount || 0));
      case 'PriceLowHigh':
        return sorted.sort((a, b) => (a.payment_amount || 0) - (b.payment_amount || 0));
      case 'Upcoming':
        return sorted.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateA - dateB;
        });
      default:
        return sorted;
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

  // Separate bookings into current, lapsed, and past with all filters applied
  const allCurrentBookings = bookings.filter(b => b.status === 'upcoming' || b.status === 'pending');

  // Apply all filters in sequence: booking type → payment → pet → sort
  const applyAllFilters = (bookingsList: Booking[]) => {
    let filtered = applyFilter(bookingsList); // Apply booking type filter
    filtered = applyPaymentFilter(filtered); // Apply payment filter
    filtered = applyPetFilter(filtered); // Apply pet filter
    return applySorting(filtered); // Apply sorting
  };

  const lapsedBookings = applyAllFilters(allCurrentBookings.filter(b => isBookingLapsed(b)));
  const activeCurrentBookings = applyAllFilters(allCurrentBookings.filter(b => !isBookingLapsed(b)));
  const pastBookings = applyAllFilters(bookings.filter(b => b.status === 'completed' || b.status === 'cancelled'));

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

        <div className="bg-background-light sticky top-[72px] z-10 overflow-visible relative">
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

          {/* Sort and Additional Filters */}
          <div className="px-6 pb-3 overflow-visible">
            <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-1">
              {/* Sort Dropdown */}
              <div className="relative sort-menu-container" style={{ zIndex: 100 }}>
                <button
                  onClick={() => {
                    console.log('Sort button clicked, current state:', showSortMenu);
                    setShowSortMenu(!showSortMenu);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:border-primary/30 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px] text-gray-600">sort</span>
                  <span className="text-[10px] font-bold text-gray-700">
                    {sortBy === 'Latest' ? 'Latest' : sortBy === 'Oldest' ? 'Oldest' : sortBy === 'PriceHighLow' ? 'Price ↓' : sortBy === 'PriceLowHigh' ? 'Price ↑' : 'Upcoming'}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
                </button>

              </div>

              {/* Payment Filter Chips */}
              {['All', 'Paid', 'Pending'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPaymentFilter(filter as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full shrink-0 transition-all text-[10px] font-bold uppercase tracking-wider ${paymentFilter === filter
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                    }`}
                >
                  {filter === 'Paid' && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                  {filter === 'Pending' && <span className="material-symbols-outlined text-[14px]">pending</span>}
                  {filter}
                </button>
              ))}

              {/* Pet Filter Dropdown */}
              {uniquePets.length > 0 && (
                <select
                  value={selectedPet}
                  onChange={(e) => setSelectedPet(e.target.value)}
                  className="px-3 py-2 rounded-full bg-white border border-gray-200 hover:border-primary/30 transition-all text-[10px] font-bold text-gray-700 uppercase tracking-wider shrink-0 appearance-none pr-8 cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                >
                  <option value="All">All Pets</option>
                  {uniquePets.map((petName) => (
                    <option key={petName} value={petName}>{petName}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Booking Type Filter Options */}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-all ${selectedFilter === filter.id
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

          {/* Sort Menu Dropdown */}
          {showSortMenu && (
            <div
              className="absolute left-6 top-[130px] bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 min-w-[200px]"
              style={{ zIndex: 9999 }}
            >
              {[
                { value: 'Latest', label: 'Latest First', icon: 'schedule' },
                { value: 'Oldest', label: 'Oldest First', icon: 'history' },
                { value: 'Upcoming', label: 'Upcoming First', icon: 'event' },
                { value: 'PriceHighLow', label: 'Price: High to Low', icon: 'trending_down' },
                { value: 'PriceLowHigh', label: 'Price: Low to High', icon: 'trending_up' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Option clicked:', option.value);
                    setSortBy(option.value as any);
                    setTimeout(() => setShowSortMenu(false), 100);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left cursor-pointer ${sortBy === option.value ? 'bg-primary/5 text-primary' : 'text-gray-700'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                  <span className="text-sm font-bold">{option.label}</span>
                  {sortBy === option.value && (
                    <span className="material-symbols-outlined text-[18px] ml-auto">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col gap-6 pb-40">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === 'Current' ? (
            <>
              {/* Lapsed Bookings Section */}
              {lapsedBookings.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-2">
                    <span className="material-symbols-outlined text-red-500 text-xl">schedule</span>
                    <h3 className="text-sm font-black text-red-600 uppercase tracking-wider">Missed Appointments</h3>
                  </div>
                  {lapsedBookings.map((booking) => {
                    const isGrooming = booking.service_type === 'grooming';
                    return (
                      <div
                        key={booking.id}
                        onClick={() => onDetailClick(booking)}
                        className="bg-red-50 rounded-[32px] p-6 shadow-sm border-2 border-red-200 active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[22px] flex items-center justify-center bg-red-100 text-red-600 shadow-lg">
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
                              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-0.5">
                                Missed Appointment
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-red-100 text-red-600 border border-red-200">
                            Lapsed
                          </span>
                        </div>

                        {/* Pet Info */}
                        {booking.pets && (
                          <div className="flex items-center gap-4 bg-white rounded-2xl p-4 mb-5 border border-red-100">
                            <div className="w-12 h-12 rounded-[18px] border-2 border-white shadow-xl overflow-hidden shrink-0">
                              <img src={booking.pets.image} className="w-full h-full object-cover" alt={booking.pets.name} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-black text-gray-900 leading-none">{booking.pets.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{booking.pets.species}</p>
                            </div>
                          </div>
                        )}

                        {/* Date & Time */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-xl font-black">calendar_month</span>
                            <span className="text-xs font-black text-gray-700">
                              {formatDate(booking.date)}, {booking.time}
                            </span>
                          </div>
                          {booking.payment_amount && (
                            <span className="text-xs font-black text-gray-900">₹{booking.payment_amount.toFixed(2)}</span>
                          )}
                        </div>

                        {/* Reschedule Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onReschedule) {
                              onReschedule(booking);
                            } else {
                              onPlusClick(); // Fallback to booking page
                            }
                          }}
                          className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg font-black">event_repeat</span>
                          Reschedule Appointment
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Active Current Bookings */}
              {activeCurrentBookings.length > 0 && (
                <>
                  {lapsedBookings.length > 0 && (
                    <div className="flex items-center gap-2 px-2 mt-4">
                      <span className="material-symbols-outlined text-primary text-xl">event_available</span>
                      <h3 className="text-sm font-black text-primary uppercase tracking-wider">Upcoming Appointments</h3>
                    </div>
                  )}
                  {activeCurrentBookings.map((booking) => {
                    const isGrooming = booking.service_type === 'grooming';

                    return (
                      <div
                        key={booking.id}
                        onClick={() => onDetailClick(booking)}
                        className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shadow-lg transition-colors duration-500 ${isGrooming
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
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${booking.payment_status === 'paid'
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
                  })}
                </>
              )}

              {/* Empty State */}
              {activeCurrentBookings.length === 0 && lapsedBookings.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
                  <span className="material-symbols-outlined text-[80px] text-primary">event_busy</span>
                  <p className="font-black uppercase tracking-[0.3em] text-sm mt-6">No Upcoming Bookings</p>
                </div>
              )}
            </>
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
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${isGrooming ? 'bg-pink-50 text-pink-600' : 'bg-gray-100 text-gray-500'
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
