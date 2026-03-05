
import React, { useState, useEffect } from 'react';
import { Pet, Doctor } from '../types';
import { doctorAuthService } from '../services/doctorApi';

interface BookingData {
  type: 'consultation' | 'grooming';
  petId: string;
  petName?: string;
  bookingType: 'online' | 'home' | 'clinic';
  date: string;
  time: string;
  addressId?: string;
  address?: any;
  doctorName?: string;
  doctorId?: string;
  packageType?: string;
  packageId?: string;
  contactNumber?: string;
  notes?: string;
  amount: number; // Service fee (doctor's fee)
  serviceFee?: number; // Explicit service fee
  platformFee?: number; // Explicit platform fee (5%)
  totalAmount?: number; // Total to pay
  serviceName: string;
}

interface Props {
  pets: Pet[];
  onBack: () => void;
  onBook: () => void;
  userId?: string | null;
  onProceedToCheckout?: (bookingData: BookingData) => void;
  reschedulingBooking?: any; // Booking being rescheduled
}

const OnlineConsultBooking: React.FC<Props> = ({ pets, onBack, onBook, userId, onProceedToCheckout, reschedulingBooking }) => {
  // Prefill pet if rescheduling
  const [selectedPet, setSelectedPet] = useState<string>(
    reschedulingBooking?.pet_id || pets[0]?.id || ''
  );
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<'video' | 'chat'>('video');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [visitReason, setVisitReason] = useState<string>('General Health Check');
  const [isRescheduling] = useState<boolean>(!!reschedulingBooking);
  // Platform fee is collected from doctors, not users
  // Users only pay the service fee

  // Generate dates starting from today (30 days for scrollable calendar)
  const today = new Date();
  const dateSlots = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Load doctors when component mounts or date changes
  useEffect(() => {
    loadDoctors();
  }, [selectedDateIndex]);

  // Load time slots when doctor or date changes
  useEffect(() => {
    if (doctors.length > 0) {
      loadTimeSlots();
    }
  }, [selectedDoc, selectedDateIndex, doctors]);

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const selectedDate = dateSlots[selectedDateIndex];
      const dateStr = selectedDate.toISOString().split('T')[0];

      console.log('[OnlineConsultBooking] Loading doctors for:', { dateStr, isRescheduling });

      // If rescheduling, only load the specific doctor from the original booking
      if (isRescheduling && reschedulingBooking?.doctor_id) {
        console.log('[OnlineConsultBooking] Rescheduling mode - loading specific doctor:', reschedulingBooking.doctor_id);

        const doctor = await doctorAuthService.getDoctorById(reschedulingBooking.doctor_id);
        if (doctor) {
          setDoctors([doctor]);
          setSelectedDoc(0); // Always select the first (and only) doctor
        } else {
          console.error('[OnlineConsultBooking] Could not find doctor for rescheduling');
          setDoctors([]);
        }
      } else {
        // Normal booking flow - load all available doctors
        const availableDoctors = await doctorAuthService.getAvailableDoctors({
          slot_type: 'online',
          date: dateStr,
        });

        console.log('[OnlineConsultBooking] Doctors loaded:', availableDoctors?.length || 0);
        setDoctors(availableDoctors);
      }
    } catch (error) {
      console.error('[OnlineConsultBooking] Error loading doctors:', error);
      console.error('[OnlineConsultBooking] Error details:', JSON.stringify(error, null, 2));
      // Fallback to empty array on error
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadTimeSlots = async () => {
    try {
      if (!doctors[selectedDoc]?.id) return;

      const selectedDate = dateSlots[selectedDateIndex];
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Fetch available time slots for the selected doctor and date
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('start_time, capacity, booked_count')
        .eq('doctor_id', doctors[selectedDoc].id)
        .eq('date', dateStr)
        .eq('slot_type', 'online')
        .eq('is_active', true)
        .order('start_time');

      if (error) throw error;

      // Check if selected date is today
      const isToday = selectedDateIndex === 0;
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Filter slots where booked_count < capacity and convert to 12-hour format
      const times = (data || [])
        .filter((slot: any) => {
          // Filter out booked slots
          if (slot.booked_count >= slot.capacity) return false;

          // If today, filter out past time slots
          if (isToday) {
            const [hours, minutes] = slot.start_time.split(':');
            const slotHour = parseInt(hours);
            const slotMinute = parseInt(minutes);

            // Skip if slot time has passed
            if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
              return false;
            }
          }

          return true;
        })
        .map((slot: any) => {
          const [hours, minutes] = slot.start_time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        });

      setAvailableTimeSlots(times);
      if (times.length > 0 && !times.includes(selectedTime)) {
        setSelectedTime(times[0]);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      // Fallback to default time slots
      setAvailableTimeSlots(['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM']);
    }
  };

  const getDayName = (date: Date, index: number) => {
    if (index === 0) return 'Today';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const getMonthYear = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleConfirmBooking = () => {
    if (!userId) {
      alert('Please login to book a consultation');
      return;
    }

    if (!selectedPet) {
      alert('Please select a pet');
      return;
    }

    if (doctors.length === 0) {
      alert('No doctors available. Please try another date.');
      return;
    }

    // Get selected pet name
    const pet = pets.find(p => p.id === selectedPet);
    const petName = pet ? `${pet.name} (${pet.species})` : undefined;

    // Get selected date
    const selectedDate = dateSlots[selectedDateIndex];
    const dateStr = selectedDate.toISOString().split('T')[0];

    const selectedDoctor = doctors[selectedDoc];

    // Calculate fee structure - no platform fee for users
    // Platform fee is deducted from doctor's earnings
    const serviceFee = selectedMethod === 'video'
      ? (selectedDoctor?.fee_online_video || 400)
      : (selectedDoctor?.fee_online_chat || 250);
    const totalAmount = serviceFee; // User only pays service fee

    const bookingData: BookingData = {
      type: 'consultation',
      petId: selectedPet,
      petName,
      bookingType: 'online',
      date: dateStr,
      time: selectedTime,
      doctorName: selectedDoctor?.full_name || selectedDoctor?.email || 'Doctor',
      doctorId: selectedDoctor?.id,
      notes: visitReason, // Use the selected visit reason
      amount: serviceFee, // Doctor's service fee
      serviceFee: serviceFee, // Explicit service fee
      platformFee: 0, // No platform fee for users
      totalAmount: totalAmount, // Total to be paid by user
      serviceName: `Online ${selectedMethod === 'video' ? 'Video' : 'Chat'} Consultation`,
    };

    console.log('Proceeding to checkout with booking data:', bookingData);

    if (onProceedToCheckout) {
      onProceedToCheckout(bookingData);
    } else {
      onBook();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 antialiased overflow-x-hidden fade-in">
      <div className="sticky top-0 z-50 flex items-center bg-white/95 backdrop-blur-md p-4 shadow-sm border-b border-gray-100">
        <div
          onClick={onBack}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-gray-900">arrow_back</span>
        </div>
        <h2 className="text-primary text-xl font-extrabold tracking-tight flex-1 text-center font-display">
          {isRescheduling ? 'Reschedule Appointment' : 'Online Consultation'}
        </h2>
        <div className="size-10"></div>
      </div>

      <main className="flex-1 flex flex-col space-y-8 pb-56 overflow-y-auto no-scrollbar">
        {/* Patient Selection */}
        <section className="pt-6 px-6">
          <h2 className="text-lg font-black tracking-tight mb-4">Select Patient</h2>
          <div className="flex w-full overflow-x-auto no-scrollbar gap-5">
            {pets.map((pet) => (
              <div
                key={pet.id}
                onClick={() => setSelectedPet(pet.id)}
                className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${selectedPet === pet.id ? 'scale-105' : 'opacity-50'}`}
              >
                <div className={`relative w-16 h-16 rounded-[24px] p-1 border-4 transition-all duration-300 ${selectedPet === pet.id ? 'border-primary bg-white shadow-xl' : 'border-transparent'}`}>
                  <img src={pet.image} className="w-full h-full rounded-[18px] object-cover" alt={pet.name} />
                  {selectedPet === pet.id && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-white shadow-md">
                      <span className="material-symbols-outlined text-[10px] block font-black">check</span>
                    </div>
                  )}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedPet === pet.id ? 'text-primary' : 'text-gray-400'}`}>{pet.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vet Selection */}
        <section className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black tracking-tight">
              {isRescheduling ? 'Your Doctor' : 'Choose Specialist'}
            </h2>
            {!isRescheduling && (
              <button className="text-primary font-black text-[10px] uppercase tracking-widest">See All</button>
            )}
          </div>
          {isRescheduling && (
            <div className="mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-700 text-xs font-semibold">
                📅 Rescheduling with the same doctor
              </p>
            </div>
          )}
          {loadingDoctors ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">person_off</span>
              <p className="text-gray-400 font-black text-sm">No doctors available for selected date</p>
              <p className="text-gray-400 text-xs mt-2">Try selecting a different date</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-5">
              {doctors.map((doc, i) => (
                <div
                  key={doc.id}
                  onClick={() => !isRescheduling && setSelectedDoc(i)}
                  className={`snap-start flex flex-col bg-white rounded-[32px] shadow-sm border min-w-[220px] overflow-hidden relative transition-all ${
                    selectedDoc === i ? 'border-primary ring-4 ring-primary/5 shadow-xl scale-[1.02]' : 'border-gray-100 opacity-80'
                  } ${isRescheduling ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 z-10 uppercase tracking-widest shadow-lg">
                    <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                    {doc.status || 'Available'}
                  </div>
                  <div className="h-40 w-full bg-center bg-no-repeat bg-cover" style={{ backgroundImage: doc.profile_photo_url ? `url('${doc.profile_photo_url}')` : `url('https://ui-avatars.com/api/?name=${encodeURIComponent(doc.full_name || 'Doctor')}&size=400&background=random')` }}></div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="material-symbols-outlined text-yellow-500 text-xs fill-current">star</span>
                      <span className="text-[11px] font-black text-gray-700">{doc.rating || '4.5'}</span>
                      <span className="text-[10px] text-gray-400 font-bold ml-1">({doc.total_consultations || 0})</span>
                    </div>
                    <h3 className="text-gray-900 font-black text-sm mb-0.5 leading-tight">{doc.full_name || 'Dr. ' + (doc.email?.split('@')[0] || 'Doctor')}</h3>
                    <p className="text-primary font-black text-[10px] uppercase tracking-widest">{doc.specialization || 'General Vet'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Method Toggle */}
        <section className="px-6">
          <h2 className="text-lg font-black tracking-tight mb-4">Consultation Method</h2>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedMethod('video')}
              className={`flex flex-col gap-3 p-5 rounded-[32px] border-2 transition-all cursor-pointer ${selectedMethod === 'video' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-2xl w-fit ${selectedMethod === 'video' ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-2xl">videocam</span>
                </div>
                <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === 'video' ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                  {selectedMethod === 'video' && <div className="size-2 bg-white rounded-full"></div>}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="font-black text-gray-900 text-sm leading-tight">Video Call</p>
                <p className="font-black text-primary text-lg tracking-tighter leading-none">
                  ₹{doctors.length > 0 && doctors[selectedDoc]
                    ? (doctors[selectedDoc].fee_online_video || 400).toFixed(2)
                    : '400.00'
                  }
                </p>
              </div>
            </div>

            <div
              onClick={() => setSelectedMethod('chat')}
              className={`flex flex-col gap-3 p-5 rounded-[32px] border-2 transition-all cursor-pointer ${selectedMethod === 'chat' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-2xl w-fit ${selectedMethod === 'chat' ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-2xl">chat</span>
                </div>
                <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === 'chat' ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                  {selectedMethod === 'chat' && <div className="size-2 bg-white rounded-full"></div>}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="font-black text-gray-900 text-sm leading-tight">Text Chat</p>
                <p className="font-black text-primary text-lg tracking-tighter leading-none">
                  ₹{doctors.length > 0 && doctors[selectedDoc]
                    ? (doctors[selectedDoc].fee_online_chat || 250).toFixed(2)
                    : '250.00'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Visit Reason */}
        <section className="px-6">
          <h2 className="text-lg font-black tracking-tight mb-4">Visit Reason</h2>
          <div className="relative">
            <select
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-100 text-gray-900 text-sm rounded-2xl p-5 pr-12 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-black shadow-sm"
            >
              <option>General Health Check</option>
              <option>Vaccination Follow-up</option>
              <option>Behavioral Advice</option>
              <option>Emergency Consultation</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black tracking-tight">Date & Time</h2>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getMonthYear(today)}</div>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="flex gap-4 py-1 w-max">
              {dateSlots.map((date, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedDateIndex(i)}
                  className={`flex flex-col items-center justify-center min-w-[64px] h-[80px] rounded-2xl transition-all cursor-pointer border flex-shrink-0 ${selectedDateIndex === i ? 'bg-primary text-white border-primary shadow-2xl scale-110' : 'bg-white border-gray-100 text-gray-400'}`}
                >
                  <span className="text-[10px] font-black uppercase mb-1">{getDayName(date, i)}</span>
                  <span className="text-xl font-black">{date.getDate()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {availableTimeSlots.length === 0 ? (
              <div className="col-span-3 text-center py-8">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2 block">schedule</span>
                <p className="text-gray-400 font-black text-xs">No time slots available</p>
              </div>
            ) : (
              availableTimeSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTime === t ? 'bg-primary text-white border-primary shadow-xl' : 'border-gray-100 bg-white text-gray-600 hover:border-primary/20'}`}
                >
                  {t}
                </button>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Sticky Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Consultation Fee</span>
            <span className="text-3xl font-black text-primary tracking-tighter leading-none">
              ₹{(() => {
                const serviceFee = doctors.length > 0 && doctors[selectedDoc]
                  ? selectedMethod === 'video'
                    ? (doctors[selectedDoc].fee_online_video || 400)
                    : (doctors[selectedDoc].fee_online_chat || 250)
                  : selectedMethod === 'video' ? 400 : 250;
                return serviceFee.toFixed(2);
              })()}
            </span>
          </div>
          <button
            onClick={handleConfirmBooking}
            className="flex-1 bg-primary hover:bg-primary-light text-white font-black py-5 px-6 rounded-[28px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Proceed to Checkout</span>
            <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform font-black">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnlineConsultBooking;
