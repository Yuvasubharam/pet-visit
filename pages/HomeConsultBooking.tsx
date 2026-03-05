
import React, { useState, useEffect } from 'react';
import { Pet, Address, Doctor } from '../types';
import { addressService } from '../services/api';
import { doctorAuthService } from '../services/doctorApi';
import AddressForm from '../components/AddressForm';

interface BookingData {
  type: 'consultation' | 'grooming';
  petId: string;
  petName?: string;
  bookingType: 'online' | 'home' | 'clinic';
  date: string;
  time: string;
  addressId?: string;
  address?: Address;
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
  defaultAddress?: Address;
  onProceedToCheckout?: (bookingData: BookingData) => void;
  reschedulingBooking?: any; // Booking being rescheduled
}

const HomeConsultBooking: React.FC<Props> = ({ pets, onBack, onBook, userId, defaultAddress, onProceedToCheckout, reschedulingBooking }) => {
  const [selectedPet, setSelectedPet] = useState<string>(
    reschedulingBooking?.pet_id || pets[0]?.id || ''
  );
  const [visitType, setVisitType] = useState<'home' | 'clinic'>(
    reschedulingBooking?.booking_type === 'clinic' ? 'clinic' : 'home'
  );
  const [isRescheduling] = useState<boolean>(!!reschedulingBooking);
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [visitReason, setVisitReason] = useState<string>('General Health Check');
  // Platform fee is collected from doctors, not users

  // Generate dates starting from today (30 days for scrollable calendar)
  const today = new Date();
  const dateSlots = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const getDayName = (date: Date, index: number) => {
    if (index === 0) return 'Today';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const getMonthYear = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // useEffect to load addresses on component mount
  useEffect(() => {
    if (userId) {
      loadAddresses();
    } else {
      setIsLoadingAddresses(false);
    }
  }, [userId, defaultAddress]);

  // Load doctors when component mounts or date/visit type changes
  useEffect(() => {
    loadDoctors();
  }, [selectedDateIndex, visitType]);

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
      const slotType = visitType === 'home' ? 'home' : 'clinic';

      console.log('[HomeConsultBooking] Loading doctors for:', { slotType, dateStr, isRescheduling });

      // If rescheduling, only load the specific doctor
      if (isRescheduling && reschedulingBooking?.doctor_id) {
        console.log('[HomeConsultBooking] Rescheduling mode - loading specific doctor:', reschedulingBooking.doctor_id);

        const doctor = await doctorAuthService.getDoctorById(reschedulingBooking.doctor_id);
        if (doctor) {
          setDoctors([doctor]);
          setSelectedDoc(0);
        } else {
          console.error('[HomeConsultBooking] Could not find doctor for rescheduling');
          setDoctors([]);
        }
      } else {
        // Normal booking - load all available doctors
        const availableDoctors = await doctorAuthService.getAvailableDoctors({
          slot_type: slotType,
          date: dateStr,
        });
        console.log('[HomeConsultBooking] Doctors loaded:', availableDoctors?.length || 0);
        setDoctors(availableDoctors);
      }
    } catch (error) {
      console.error('[HomeConsultBooking] Error loading doctors:', error);
      console.error('[HomeConsultBooking] Error details:', JSON.stringify(error, null, 2));
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
      const slotType = visitType === 'home' ? 'home' : 'clinic';

      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('start_time, capacity, booked_count')
        .eq('doctor_id', doctors[selectedDoc].id)
        .eq('date', dateStr)
        .eq('slot_type', slotType)
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
      setAvailableTimeSlots(['09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM']);
    }
  };

  const loadAddresses = async () => {
    if (!userId) return;

    try {
      setIsLoadingAddresses(true);
      console.log('HomeConsultBooking - Loading addresses for user:', userId);
      const data = await addressService.getUserAddresses(userId);
      console.log('HomeConsultBooking - Received addresses:', data);

      const mappedAddresses = (data || []).map((addr: any) => ({
        id: addr.id,
        type: addr.type,
        flatNumber: addr.flat_number,
        street: addr.street,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        latitude: addr.latitude,
        longitude: addr.longitude,
        fullAddress: addr.full_address,
      }));

      console.log('HomeConsultBooking - Mapped addresses:', mappedAddresses);
      setAddresses(mappedAddresses);

      // Set address from parent (defaultAddress) if available, otherwise use first address
      if (!selectedAddress) {
        if (defaultAddress && defaultAddress.id) {
          // Try to find the default address in the mapped addresses
          const matchingAddress = mappedAddresses.find(addr => addr.id === defaultAddress.id);
          if (matchingAddress) {
            setSelectedAddress(matchingAddress);
            console.log('HomeConsultBooking - Using default address from parent:', matchingAddress);
          } else if (mappedAddresses.length > 0) {
            setSelectedAddress(mappedAddresses[0]);
            console.log('HomeConsultBooking - Default address not found, using first address:', mappedAddresses[0]);
          }
        } else if (mappedAddresses.length > 0) {
          setSelectedAddress(mappedAddresses[0]);
          console.log('HomeConsultBooking - Auto-selected first address:', mappedAddresses[0]);
        }
      }
    } catch (error) {
      console.error('HomeConsultBooking - Error loading addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (address: Address) => {
    if (!userId) {
      alert('User not logged in. Please log in to save address.');
      return;
    }

    try {
      console.log('HomeConsultBooking - Saving address:', address);
      const savedAddress: any = await addressService.addAddress(userId, address);
      console.log('HomeConsultBooking - Address saved successfully:', savedAddress);

      // Reload addresses to get the latest list
      await loadAddresses();

      // Auto-select the newly saved address
      if (savedAddress) {
        const mappedAddress: Address = {
          id: savedAddress.id,
          type: savedAddress.type,
          flatNumber: savedAddress.flat_number,
          street: savedAddress.street,
          landmark: savedAddress.landmark,
          city: savedAddress.city,
          state: savedAddress.state,
          pincode: savedAddress.pincode,
          latitude: savedAddress.latitude,
          longitude: savedAddress.longitude,
          fullAddress: savedAddress.full_address,
        };
        setSelectedAddress(mappedAddress);
        console.log('HomeConsultBooking - Selected new address:', mappedAddress);
      }

      setShowAddNewAddress(false);
      setShowAddressDropdown(false);
      alert('Address saved successfully!');
    } catch (error: any) {
      console.error('HomeConsultBooking - Error saving address:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to save address. ';
      if (error?.message) {
        errorMessage += error.message;
      } else if (error?.error_description) {
        errorMessage += error.error_description;
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }

      alert(errorMessage);
    }
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

    if (visitType === 'home' && !selectedAddress) {
      alert('Please select or add a home address');
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
    const serviceFee = visitType === 'home'
      ? (selectedDoctor?.fee_home_visit || 850)
      : (selectedDoctor?.fee_clinic_visit || 500);
    const totalAmount = serviceFee; // User only pays service fee

    const bookingData: BookingData = {
      type: 'consultation',
      petId: selectedPet,
      petName,
      bookingType: visitType,
      date: dateStr,
      time: selectedTime,
      addressId: visitType === 'home' ? selectedAddress?.id : undefined,
      address: visitType === 'home' ? selectedAddress || undefined : undefined,
      doctorName: selectedDoctor?.full_name || selectedDoctor?.email || 'Doctor',
      doctorId: selectedDoctor?.id,
      notes: visitReason, // Use the selected visit reason
      amount: serviceFee, // Doctor's service fee
      serviceFee: serviceFee, // Explicit service fee
      platformFee: 0, // No platform fee for users
      totalAmount: totalAmount, // Total to be paid by user
      serviceName: visitType === 'home' ? 'Home Visit Consultation' : 'Clinic Visit Consultation',
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
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center bg-white/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-100">
        <div
          onClick={onBack}
          className="text-gray-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <h2 className="text-primary text-xl font-extrabold tracking-tight flex-1 text-center font-display">
          {isRescheduling ? 'Reschedule Appointment' : 'Doctor Consultation'}
        </h2>
        <div className="size-10"></div>
      </div>

      <main className="flex-1 flex flex-col space-y-6 pb-56 overflow-y-auto no-scrollbar">
        {/* Toggle Navbar */}
        <div className="px-6 py-4 bg-white shadow-sm">
          <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-gray-100 p-1">
            <button
              onClick={() => !isRescheduling && setVisitType('home')}
              className={`flex-1 h-full rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isRescheduling ? 'cursor-not-allowed opacity-60' : ''} ${visitType === 'home' ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
            >
              Home Visit
            </button>
            <button
              onClick={() => !isRescheduling && setVisitType('clinic')}
              className={`flex-1 h-full rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isRescheduling ? 'cursor-not-allowed opacity-60' : ''} ${visitType === 'clinic' ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
            >
              Clinic Visit
            </button>
          </div>
        </div>

        {/* Dynamic Map Header based on Visit Type */}
        <div className="relative w-full h-60 bg-gray-200">
          {visitType === 'home' ? (
            selectedAddress?.latitude && selectedAddress?.longitude ? (
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedAddress.longitude - 0.005}%2C${selectedAddress.latitude - 0.005}%2C${selectedAddress.longitude + 0.005}%2C${selectedAddress.latitude + 0.005}&layer=mapnik&marker=${selectedAddress.latitude},${selectedAddress.longitude}`}
                className="w-full h-full"
                style={{ border: 0 }}
                title="Location Map"
              />
            ) : (
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=-122.3422%2C47.6062%2C-122.3322%2C47.6162&layer=mapnik&marker=47.6112,-122.3372"
                className="w-full h-full"
                style={{ border: 0 }}
                title="Location Map"
              />
            )
          ) : (
            doctors.length > 0 && doctors[selectedDoc]?.clinic_latitude && doctors[selectedDoc]?.clinic_longitude ? (
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${doctors[selectedDoc].clinic_longitude! - 0.005}%2C${doctors[selectedDoc].clinic_latitude! - 0.005}%2C${doctors[selectedDoc].clinic_longitude! + 0.005}%2C${doctors[selectedDoc].clinic_latitude! + 0.005}&layer=mapnik&marker=${doctors[selectedDoc].clinic_latitude},${doctors[selectedDoc].clinic_longitude}`}
                className="w-full h-full"
                style={{ border: 0 }}
                title="Clinic Map"
              />
            ) : (
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=-122.3422%2C47.6062%2C-122.3322%2C47.6162&layer=mapnik&marker=47.6112,-122.3372"
                className="w-full h-full"
                style={{ border: 0 }}
                title="Default Clinic Map"
              />
            )
          )}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <span className="material-symbols-outlined text-primary text-5xl drop-shadow-2xl fill-current">location_on</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-3xl shadow-2xl border border-gray-50 flex items-center justify-between">
            {isLoadingAddresses && visitType === 'home' ? (
              <div className="flex items-center justify-center w-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-2xl shrink-0">
                    <span className="material-symbols-outlined text-2xl">
                      {visitType === 'home' ? 'home_pin' : 'local_hospital'}
                    </span>
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">
                      {visitType === 'home' ? 'Your Home Address' : 'Selected Clinic'}
                    </span>
                    <span className="font-black text-sm truncate text-gray-900">
                      {visitType === 'home'
                        ? selectedAddress
                          ? `${selectedAddress.flatNumber}, ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.pincode}`
                          : 'No address selected'
                        : doctors.length > 0 && doctors[selectedDoc]
                          ? (doctors[selectedDoc].clinic_name || 'Clinic') + ' • ' + (doctors[selectedDoc].clinic_address || 'Address not provided')
                          : 'Select a doctor'
                      }
                    </span>
                  </div>
                </div>
                {visitType === 'home' && (
                  <button
                    onClick={() => selectedAddress ? setShowAddressDropdown(!showAddressDropdown) : setShowAddNewAddress(true)}
                    className="text-primary font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-primary/5 rounded-xl"
                  >
                    {selectedAddress ? 'Edit' : 'Add'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Address Dropdown - Only show for Home Visit */}
        {visitType === 'home' && showAddressDropdown && (
          <div className="px-6 -mt-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-gray-900 text-base font-black tracking-tight">Select Address</h3>
                <button
                  onClick={() => setShowAddressDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Existing Addresses */}
              <div className="max-h-64 overflow-y-auto">
                {addresses.map((addr, index) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setShowAddressDropdown(false);
                    }}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${selectedAddress?.id === addr.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${index === 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <span className="material-symbols-outlined text-lg">
                          {addr.type === 'Home' ? 'home' : addr.type === 'Office' ? 'work' : 'location_on'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 font-bold text-sm">{addr.type}</p>
                          {index === 0 && (
                            <span className="text-primary text-[8px] uppercase font-bold bg-primary/10 px-2 py-0.5 rounded-md tracking-wider">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {addr.flatNumber}, {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                        </p>
                      </div>
                      {selectedAddress?.id === addr.id && (
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Address Button */}
              <div className="p-4">
                <button
                  onClick={() => {
                    setShowAddNewAddress(true);
                    setShowAddressDropdown(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined">add_location_alt</span>
                  Add New Address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patient Selection */}
        <div className="flex flex-col px-6">
          <h3 className="text-gray-900 text-lg font-black tracking-tight mb-4">Patient</h3>
          <div className="flex items-center justify-start gap-5 overflow-x-auto no-scrollbar pb-2">
            {pets.map((pet) => (
              <div
                key={pet.id}
                onClick={() => setSelectedPet(pet.id)}
                className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
              >
                <div className={`relative p-1 rounded-[28px] border-4 transition-all duration-300 ${selectedPet === pet.id ? 'border-primary shadow-xl scale-105' : 'border-transparent opacity-60'}`}>
                  <img src={pet.image} className="w-16 h-16 rounded-[24px] object-cover" alt={pet.name} />
                  {selectedPet === pet.id && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full border-2 border-white shadow-md">
                      <span className="material-symbols-outlined text-[12px] block font-black">check</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPet === pet.id ? 'text-primary' : 'text-gray-400'}`}>{pet.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Selection */}
        <div className="flex flex-col w-full px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 text-lg font-black tracking-tight">
              {isRescheduling ? 'Your Doctor' : 'Available Specialists'}
            </h3>
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
              <p className="text-gray-400 text-xs mt-2">Try selecting a different date or visit type</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto no-scrollbar gap-5 pb-4">
              {doctors.map((doc, i) => (
                <div
                  key={doc.id}
                  onClick={() => !isRescheduling && setSelectedDoc(i)}
                  className={`min-w-[260px] p-5 rounded-[32px] border transition-all ${isRescheduling ? 'cursor-default' : 'cursor-pointer'} ${selectedDoc === i ? 'border-primary bg-primary/5 shadow-xl ring-4 ring-primary/5' : 'border-gray-100 bg-white opacity-80'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-[24px] overflow-hidden border-2 border-white shadow-md">
                      <img
                        src={doc.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.full_name || 'Doctor')}&size=200&background=random`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-900 text-sm leading-tight mb-1">{doc.full_name || 'Dr. ' + (doc.email?.split('@')[0] || 'Doctor')}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{doc.specialization || 'General Vet'}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="material-symbols-outlined text-yellow-500 text-sm fill-current">star</span>
                        <span className="text-xs font-black text-gray-700">{doc.rating || '4.5'}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">({doc.total_consultations || 0})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visit Details */}
        <div className="px-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-gray-900 text-lg font-black tracking-tight">Visit Reason</h3>
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
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900 text-lg font-black tracking-tight">Select Slot</h3>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{getMonthYear(today)}</div>
            </div>
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="flex gap-3 py-1 w-max">
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
            <div className="grid grid-cols-3 gap-3 pt-4">
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
                    className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTime === t ? 'bg-primary text-white border-primary shadow-xl' : 'bg-white border-gray-100 text-gray-600 hover:border-primary/20'}`}
                  >
                    {t}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Consultation Fee</span>
            <span className="text-3xl font-black text-primary tracking-tighter leading-none">
              ₹{(() => {
                const serviceFee = doctors.length > 0 && doctors[selectedDoc]
                  ? visitType === 'home'
                    ? (doctors[selectedDoc].fee_home_visit || 850)
                    : (doctors[selectedDoc].fee_clinic_visit || 500)
                  : visitType === 'home' ? 850 : 500;
                return serviceFee.toFixed(2);
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/5 px-4 py-2 rounded-full font-black uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm font-black">info</span>
            {visitType === 'home' ? 'Includes Travel' : 'Clinic Base Fee'}
          </div>
        </div>
        <button
          onClick={handleConfirmBooking}
          className="w-full bg-primary hover:bg-primary-light text-white font-black text-base py-5 rounded-[28px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all group"
        >
          <span>Proceed to Checkout</span>
          <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>

      {/* Address Form Modal */}
      {showAddNewAddress && (
        <AddressForm
          onClose={() => setShowAddNewAddress(false)}
          onSave={handleSaveAddress}
        />
      )}
    </div>
  );
};

export default HomeConsultBooking;
