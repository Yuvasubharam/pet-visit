
import React, { useState, useEffect } from 'react';
import { Pet, Address, Booking } from '../types';
import { consultationService, groomingService } from '../services/api';
import NotificationBell from '../components/NotificationBell';

interface Props {
    pets: Pet[];
    onServiceClick: (service: string) => void;
    onShopClick: () => void;
    onBookingsClick: () => void;
    onPlusClick: () => void;
    onProfileClick: () => void;
    onAddPetClick: () => void;
    onDeletePet?: (petId: string) => void;
    onEditPet?: (petId: string) => void;
    onLocationClick?: () => void;
    onRescheduleFromNotification?: (bookingId: string) => void;
    userAddress?: Address;
    userName?: string;
    userProfilePhoto?: string | null;
    userId?: string | null;
}

// Utility function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Format address for header display
const formatAddressForHeader = (address: Address): string => {
    const truncatedFlat = truncateText(address.flatNumber, 10);
    return `${address.type}, ${truncatedFlat}...`;
};

const Home: React.FC<Props> = ({ pets, onServiceClick, onShopClick, onBookingsClick, onPlusClick, onProfileClick, onAddPetClick, onDeletePet, onEditPet, onLocationClick, onRescheduleFromNotification, userAddress, userName, userProfilePhoto, userId }) => {
    const [petToDelete, setPetToDelete] = useState<{ id: string; name: string } | null>(null);
    const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
    const [isLoadingBooking, setIsLoadingBooking] = useState(true);
    const [expandedPetImage, setExpandedPetImage] = useState<Pet | null>(null);

    // Default address if none provided
    const defaultAddress: Address = {
        type: 'Home',
        flatNumber: 'Not Set',
        street: '',
        landmark: '',
        city: 'New York City',
        state: 'NY',
        pincode: '10001'
    };

    const displayAddress = userAddress || defaultAddress;
    const headerLocationText = formatAddressForHeader(displayAddress);

    const handleDeleteClick = (petId: string, petName: string) => {
        setPetToDelete({ id: petId, name: petName });
    };

    const confirmDelete = () => {
        if (petToDelete && onDeletePet) {
            onDeletePet(petToDelete.id);
            setPetToDelete(null);
        }
    };

    const cancelDelete = () => {
        setPetToDelete(null);
    };

    // Load nearest upcoming booking
    useEffect(() => {
        const loadUpcomingBooking = async () => {
            if (!userId) {
                console.log('[Home] No userId provided for upcoming booking');
                setIsLoadingBooking(false);
                return;
            }

            try {
                setIsLoadingBooking(true);
                console.log('[Home] Loading upcoming booking for userId:', userId);

                // Fetch both consultation and grooming bookings
                const [consultations, groomings] = await Promise.all([
                    consultationService.getUserConsultationBookings(userId),
                    groomingService.getUserGroomingBookings(userId)
                ]);

                console.log('[Home] Consultations fetched:', consultations?.length || 0);
                console.log('[Home] Groomings fetched:', groomings?.length || 0);

                // Combine all bookings
                const allBookings: Booking[] = [...(consultations || []), ...(groomings || [])];
                console.log('[Home] Total bookings combined:', allBookings.length);

                // Filter for upcoming bookings (status is upcoming)
                const now = new Date();
                const upcomingBookings = allBookings.filter(booking => {
                    if (booking.status !== 'upcoming') {
                        console.log('[Home] Booking filtered out - status:', booking.status);
                        return false;
                    }

                    // Parse the booking date and time
                    try {
                        // Handle different time formats (HH:MM or HH:MM AM/PM)
                        let timeStr = booking.time;

                        // If time has AM/PM, convert to 24-hour format
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

                            timeStr = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        }

                        if (!timeStr || !timeStr.includes(':')) {
                            console.warn('[Home] Invalid time format:', booking.time);
                            return true; // Include it anyway if time format is invalid
                        }

                        // Parse booking date (handle YYYY-MM-DD format)
                        const bookingDateTime = new Date(`${booking.date}T${timeStr}:00`);
                        const isInFuture = bookingDateTime > now;
                        console.log('[Home] Booking date/time:', booking.date, timeStr, '- In future?', isInFuture, 'DateTime:', bookingDateTime.toISOString());
                        return isInFuture;
                    } catch (e) {
                        console.error('[Home] Error parsing booking date/time:', e);
                        return true; // Include it anyway if parsing fails
                    }
                });

                console.log('[Home] Upcoming bookings after filter:', upcomingBookings.length);

                // Sort by date and time (earliest first)
                upcomingBookings.sort((a, b) => {
                    const dateTimeA = new Date(`${a.date}T${a.time}`);
                    const dateTimeB = new Date(`${b.date}T${b.time}`);
                    return dateTimeA.getTime() - dateTimeB.getTime();
                });

                // Get the nearest upcoming booking
                if (upcomingBookings.length > 0) {
                    console.log('[Home] Setting upcoming booking:', upcomingBookings[0]);
                    setUpcomingBooking(upcomingBookings[0]);
                } else {
                    console.log('[Home] No upcoming bookings found');
                    setUpcomingBooking(null);
                }
            } catch (error) {
                console.error('[Home] Error loading upcoming booking:', error);
                setUpcomingBooking(null);
            } finally {
                setIsLoadingBooking(false);
            }
        };

        loadUpcomingBooking();
    }, [userId]);

    // Format booking display
    const formatBookingDisplay = (booking: Booking) => {
        const petName = booking.pets?.name || 'Your Pet';
        const serviceType = booking.service_type === 'grooming'
            ? 'Grooming'
            : booking.booking_type === 'online'
                ? 'Online Consultation'
                : booking.booking_type === 'home'
                    ? 'Home Visit'
                    : 'Clinic Visit';

        return `${serviceType} for ${petName}`;
    };

    const formatBookingTime = (booking: Booking) => {
        const bookingDate = new Date(booking.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const bookingDay = new Date(bookingDate);
        bookingDay.setHours(0, 0, 0, 0);

        let dateStr = '';
        if (bookingDay.getTime() === today.getTime()) {
            dateStr = 'Today';
        } else if (bookingDay.getTime() === tomorrow.getTime()) {
            dateStr = 'Tomorrow';
        } else {
            const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
            dateStr = bookingDate.toLocaleDateString('en-US', options);
        }

        // Format time (assuming time is in format like "10:30" or "10:30 AM")
        const time = booking.time.includes('AM') || booking.time.includes('PM')
            ? booking.time
            : formatTimeTo12Hour(booking.time);

        return `${dateStr}, ${time}`;
    };

    const formatTimeTo12Hour = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white shadow-sm z-30">
                <div className="flex items-center gap-3">
                    <img src="/assets/images/logo.png" className="h-8 w-8 object-contain" alt="Furora Care Logo" />
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-gray-900 leading-none">Furora Care</h3>
                        <p className="text-[8px] text-gray-500 -mt-0.5">Pet Health & Wellness</p>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-100"></div>
                    <div
                        className="cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                        onClick={onLocationClick}
                    >
                        <h2 className="text-lg font-black text-primary font-display leading-none">{displayAddress.type}</h2>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-gray-400 text-[12px]">location_on</span>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{headerLocationText}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <NotificationBell
                        userId={userId || null}
                        onRescheduleClick={onRescheduleFromNotification}
                    />
                    <div
                        onClick={onProfileClick}
                        className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    >
                        <img src={userProfilePhoto || "https://picsum.photos/seed/jessica/100/100"} className="w-full h-full rounded-full object-cover" alt="User" />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                <div className="p-6 bg-white border-b border-gray-100">
                    <div className="flex items-baseline gap-1 mb-1">
                        <h1 className="text-2xl font-extrabold text-gray-900">Hello, {userName ? userName.trim().split(' ')[0] : 'there'}!</h1>
                        <span className="text-xl">👋</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Your pets are waiting for some love today.</p>

                    {isLoadingBooking ? (
                        <div className="mt-6 flex items-center justify-center bg-primary/5 rounded-2xl p-4 border border-primary/10">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : upcomingBooking ? (
                        <div className="mt-6 flex items-center gap-4 bg-primary/5 rounded-2xl p-4 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors" onClick={onBookingsClick}>
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-3xl">
                                    {upcomingBooking.service_type === 'grooming' ? 'content_cut' : 'medical_services'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Upcoming Visit</p>
                                <p className="text-sm font-black text-gray-900">{formatBookingDisplay(upcomingBooking)}</p>
                                <p className="text-[11px] text-gray-500 font-medium">{formatBookingTime(upcomingBooking)}</p>
                            </div>
                            <span className="material-symbols-outlined text-primary/40">chevron_right</span>
                        </div>
                    ) : null}
                </div>

                <div className="px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Quick Services</h3>
                        <button className="text-primary font-bold text-xs hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { name: 'Online Consult', icon: 'video_camera_front', color: 'bg-blue-500' },
                            { name: 'Grooming', icon: 'content_cut', color: 'bg-indigo-500' },
                            { name: 'Health Check', icon: 'stethoscope', color: 'bg-rose-500' },
                            { name: 'Pharmacy', icon: 'medication', color: 'bg-emerald-500' },
                            { name: 'Pet Food', icon: 'restaurant', color: 'bg-amber-500' },
                            { name: 'Accessories', icon: 'shopping_bag', color: 'bg-violet-500' },
                        ].map((s) => (
                            <button
                                key={s.name}
                                onClick={() => onServiceClick(s.name)}
                                className="flex flex-col items-center gap-3 p-4 bg-white rounded-[24px] shadow-sm hover:shadow-md transition-all active:scale-95 group border border-gray-50"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                                    <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                                </div>
                                <span className="text-[11px] font-black text-gray-700 text-center leading-tight">{s.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">My Little Family</h3>
                        <button onClick={onAddPetClick} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
                        {pets.map((pet) => (
                            <div key={pet.id} className="flex flex-col items-center gap-3 shrink-0">
                                <div className="relative group">
                                    <div
                                        className="w-20 h-20 rounded-[28px] border-2 border-white bg-white shadow-xl overflow-hidden p-1 transition-transform group-hover:rotate-3 cursor-pointer"
                                        onClick={() => setExpandedPetImage(pet)}
                                    >
                                        <img src={pet.image} className="w-full h-full rounded-[24px] object-cover" alt={pet.name} />
                                    </div>
                                    {/* Edit and Delete buttons - positioned at top-right */}
                                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                        {onEditPet && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditPet(pet.id);
                                                }}
                                                className="w-6 h-6 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-600 transition-colors"
                                                title="Edit pet"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                            </button>
                                        )}
                                        {onDeletePet && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(pet.id, pet.name);
                                                }}
                                                className="w-6 h-6 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600 transition-colors"
                                                title="Delete pet"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md">
                                        <span className="material-symbols-outlined text-[14px] fill-current">check_circle</span>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-gray-800 tracking-tight">{pet.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Promotional Slider */}
                <div className="mb-8">
                    <div className="px-6 mb-4">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Special Offers</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 snap-x snap-mandatory">
                        {/* Card 1 - Pet Store */}
                        <div className="min-w-[320px] bg-gradient-to-br from-primary to-primary-light rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/30 snap-center">
                            <div className="relative z-10 space-y-4">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Pet Store</span>
                                <h3 className="text-3xl font-black leading-[1.1]">The Best For Your Best Friend</h3>
                                <p className="text-white/70 text-sm font-medium">Exclusive deals on premium toys & nutrition.</p>
                                <button
                                    onClick={onShopClick}
                                    className="bg-white text-primary px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-gray-100 transition-colors active:scale-95"
                                >
                                    Explore Shop
                                </button>
                            </div>
                            <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[200px] text-white/10 rotate-12 pointer-events-none">shopping_basket</span>
                        </div>

                        {/* Card 2 - Wellness Care */}
                        <div className="min-w-[320px] bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/30 snap-center">
                            <div className="relative z-10 space-y-4">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Wellness</span>
                                <h3 className="text-3xl font-black leading-[1.1]">Complete Health & Wellness</h3>
                                <p className="text-white/70 text-sm font-medium">24/7 vet support and health monitoring plans.</p>
                                <button
                                    onClick={() => onServiceClick('Health Check')}
                                    className="bg-white text-emerald-600 px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-gray-100 transition-colors active:scale-95"
                                >
                                    Book Now
                                </button>
                            </div>
                            <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[200px] text-white/10 rotate-12 pointer-events-none">medical_services</span>
                        </div>

                        {/* Card 3 - Grooming */}
                        <div className="min-w-[320px] bg-gradient-to-br from-violet-500 to-purple-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-violet-500/30 snap-center">
                            <div className="relative z-10 space-y-4">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Grooming</span>
                                <h3 className="text-3xl font-black leading-[1.1]">Spa & Grooming Services</h3>
                                <p className="text-white/70 text-sm font-medium">Professional care to keep your pet looking fresh.</p>
                                <button
                                    onClick={() => onServiceClick('Grooming')}
                                    className="bg-white text-violet-600 px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-gray-100 transition-colors active:scale-95"
                                >
                                    Book Session
                                </button>
                            </div>
                            <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[200px] text-white/10 rotate-12 pointer-events-none">content_cut</span>
                        </div>
                    </div>
                </div>

                {/* Mini Static Cards */}
                <div className="px-6 pb-8">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Mini Card 1 - Training */}
                        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[24px] p-6 text-white relative overflow-hidden shadow-lg shadow-amber-500/30">
                            <div className="relative z-10 space-y-2">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-2">
                                    <span className="material-symbols-outlined text-2xl">school</span>
                                </div>
                                <h4 className="text-lg font-black leading-tight">Pet Training</h4>
                                <p className="text-white/80 text-[11px] font-medium">Expert trainers</p>
                            </div>
                            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-white/10 rotate-12">pets</span>
                        </div>

                        {/* Mini Card 2 - Insurance */}
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[24px] p-6 text-white relative overflow-hidden shadow-lg shadow-blue-500/30">
                            <div className="relative z-10 space-y-2">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-2">
                                    <span className="material-symbols-outlined text-2xl">shield</span>
                                </div>
                                <h4 className="text-lg font-black leading-tight">Pet Insurance</h4>
                                <p className="text-white/80 text-[11px] font-medium">Secure their future</p>
                            </div>
                            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-white/10 rotate-12">verified_user</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {petToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600 text-4xl">delete</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Delete Pet?</h3>
                            <p className="text-gray-600 text-sm">
                                Are you sure you want to delete <span className="font-bold text-gray-900">{petToDelete.name}</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 z-50">
                <div className="grid grid-cols-5 items-center h-[72px] pb-2">
                    <button className="flex flex-col items-center justify-center h-full text-primary">
                        <span className="material-symbols-outlined text-[24px]">home</span>
                        <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Home</span>
                    </button>
                    <button
                        onClick={onBookingsClick}
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
                    <button
                        onClick={onProfileClick}
                        className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">person</span>
                        <span className="text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Profile</span>
                    </button>
                </div>
            </nav>

            {/* Expanded Pet Image Modal */}
            {expandedPetImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 animate-fade-in"
                    onClick={() => setExpandedPetImage(null)}
                >
                    <div
                        className="relative max-w-2xl w-full bg-white rounded-[32px] overflow-hidden shadow-2xl animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setExpandedPetImage(null)}
                            className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-all z-10 shadow-lg"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>

                        {/* Pet Image */}
                        <div className="aspect-square w-full bg-slate-100">
                            <img
                                src={expandedPetImage.image}
                                alt={expandedPetImage.name}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Pet Info */}
                        <div className="p-6 bg-gradient-to-b from-white to-slate-50">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-black text-slate-900 mb-1">
                                        {expandedPetImage.name}
                                    </h2>
                                    <p className="text-sm text-slate-600 font-bold">
                                        {expandedPetImage.breed || expandedPetImage.species}
                                    </p>
                                </div>
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-3xl">pets</span>
                                </div>
                            </div>

                            {/* Pet Details */}
                            <div className="grid grid-cols-2 gap-3">
                                {expandedPetImage.species && (
                                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                                            Species
                                        </p>
                                        <p className="text-sm font-black text-slate-900">
                                            {expandedPetImage.species}
                                        </p>
                                    </div>
                                )}
                                {expandedPetImage.age && (
                                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                                            Age
                                        </p>
                                        <p className="text-sm font-black text-slate-900">
                                            {expandedPetImage.age} years
                                        </p>
                                    </div>
                                )}
                                {expandedPetImage.weight && (
                                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                                            Weight
                                        </p>
                                        <p className="text-sm font-black text-slate-900">
                                            {expandedPetImage.weight} kg
                                        </p>
                                    </div>
                                )}
                                {expandedPetImage.breed && (
                                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                                            Breed
                                        </p>
                                        <p className="text-sm font-black text-slate-900">
                                            {expandedPetImage.breed}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                {onEditPet && (
                                    <button
                                        onClick={() => {
                                            setExpandedPetImage(null);
                                            onEditPet(expandedPetImage.id);
                                        }}
                                        className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-xl">edit</span>
                                        Edit Pet
                                    </button>
                                )}
                                <button
                                    onClick={() => setExpandedPetImage(null)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
