
import React, { useState, useEffect } from 'react';
import { Pet, GroomingPackage, Address } from '../types';
import { groomingService, addressService } from '../services/api';
import { groomingStorePackageService, groomingStoreTimeSlotService } from '../services/groomingStoreApi';
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
    packageType?: string;
    packageId?: string;
    contactNumber?: string;
    notes?: string;
    amount: number;
    serviceFee?: number;
    platformFee?: number;
    totalAmount?: number;
    serviceName: string;
    groomingStoreId?: string;
    groomingStoreName?: string;
}

interface Props {
    onBack: () => void;
    pets: Pet[];
    userId?: string | null;
    defaultAddress?: Address;
    onProceedToCheckout?: (bookingData: BookingData) => void;
    reschedulingBooking?: any; // Booking being rescheduled
}

const Grooming: React.FC<Props> = ({ onBack, pets, userId, defaultAddress, onProceedToCheckout, reschedulingBooking }) => {
    const [selectedPet, setSelectedPet] = useState<string>(
        reschedulingBooking?.pet_id || pets[0]?.id || ''
    );
    const [location, setLocation] = useState<'home' | 'clinic'>(
        reschedulingBooking?.booking_type === 'clinic' ? 'clinic' : 'home'
    );
    const [isRescheduling] = useState<boolean>(!!reschedulingBooking);
    const [selectedPackage, setSelectedPackage] = useState<string>('full');
    const [contactNumber, setContactNumber] = useState<string>('');
    const [groomingPackages, setGroomingPackages] = useState<GroomingPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userAddress, setUserAddress] = useState<Address | null>(null);
    const [userAddresses, setUserAddresses] = useState<Address[]>([]);
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [showAddNewAddress, setShowAddNewAddress] = useState(false);

    // Clinic selection states
    const [groomingStores, setGroomingStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [storePackages, setStorePackages] = useState<any[]>([]);

    // Date and Time selection
    const today = new Date();
    const dateSlots = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return date;
    });
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
    // Platform fee is collected from grooming stores, not users

    useEffect(() => {
        loadPackages();
        loadGroomingStores();
        if (userId) {
            loadUserAddress();
        }
    }, [userId, defaultAddress]);

    useEffect(() => {
        // Load store packages when store is selected (both home and clinic)
        if (selectedStore) {
            loadStorePackages(selectedStore.id);
        }
    }, [selectedStore]);

    useEffect(() => {
        // Load available time slots when store or date changes
        if (selectedStore && location === 'clinic') {
            loadAvailableTimeSlots();
        } else if (location === 'home') {
            // For home visits, use default fallback if no store-specific slots
            loadAvailableTimeSlots();
        }

        // Set up polling to refresh time slots every 30 seconds for real-time updates
        const interval = setInterval(() => {
            if (selectedStore || location === 'home') {
                loadAvailableTimeSlots();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [selectedStore, selectedDateIndex, location]);

    const loadPackages = async () => {
        try {
            setIsLoading(true);
            const data = await groomingService.getPackages();
            setGroomingPackages(data || []);
        } catch (error) {
            console.error('Error loading grooming packages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadGroomingStores = async () => {
        try {
            const stores = await groomingStorePackageService.getAllActiveStores();
            setGroomingStores(stores || []);

            // If rescheduling, select the specific store from the booking
            if (isRescheduling && reschedulingBooking?.grooming_store_id) {
                const matchingStore = stores?.find((s: any) => s.id === reschedulingBooking.grooming_store_id);
                if (matchingStore) {
                    setSelectedStore(matchingStore);
                } else {
                    console.error('[Grooming] Could not find store for rescheduling:', reschedulingBooking.grooming_store_id);
                }
            } else if (stores && stores.length > 0) {
                // Auto-select first store if available (normal booking)
                setSelectedStore(stores[0]);
            }
        } catch (error) {
            console.error('Error loading grooming stores:', error);
        }
    };

    const loadStorePackages = async (storeId: string) => {
        try {
            const packages = await groomingStorePackageService.getStorePackagesByStoreId(storeId);
            setStorePackages(packages || []);
            // Auto-select first package if available
            if (packages && packages.length > 0) {
                setSelectedPackage(packages[0].package_type);
            }
        } catch (error) {
            console.error('Error loading store packages:', error);
        }
    };

    // Helper function to sort time slots in chronological order (AM to PM)
    const sortTimeSlots = (slots: string[]) => {
        return slots.sort((a, b) => {
            const parseTime = (timeStr: string) => {
                const [time, period] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);

                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;

                return hours * 60 + minutes;
            };

            return parseTime(a) - parseTime(b);
        });
    };

    const loadAvailableTimeSlots = async () => {
        if (!selectedStore) {
            // Default fallback time slots if no store selected
            const defaultSlots = [
                '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
            ];
            const sortedSlots = sortTimeSlots(defaultSlots);
            setAvailableTimeSlots(sortedSlots);
            if (!selectedTime) setSelectedTime(sortedSlots[0]);
            return;
        }

        try {
            setLoadingTimeSlots(true);
            const selectedDate = dateSlots[selectedDateIndex];
            const dateStr = selectedDate.toISOString().split('T')[0];

            // Fetch available time slots for the store and date
            const slots = await groomingStoreTimeSlotService.getAvailableTimeSlots(
                selectedStore.id,
                dateStr
            );

            if (slots && slots.length > 0) {
                const sortedSlots = sortTimeSlots(slots);
                setAvailableTimeSlots(sortedSlots);
                // Auto-select first slot if current selection is not available
                if (!selectedTime || !sortedSlots.includes(selectedTime)) {
                    setSelectedTime(sortedSlots[0]);
                }
            } else {
                // Fallback to default slots if store has no configured slots
                const defaultSlots = [
                    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
                ];
                const sortedSlots = sortTimeSlots(defaultSlots);
                setAvailableTimeSlots(sortedSlots);
                if (!selectedTime) setSelectedTime(sortedSlots[0]);
            }
        } catch (error) {
            console.error('Error loading time slots:', error);
            // Fallback to default slots on error
            const defaultSlots = [
                '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
            ];
            const sortedSlots = sortTimeSlots(defaultSlots);
            setAvailableTimeSlots(sortedSlots);
            if (!selectedTime) setSelectedTime(sortedSlots[0]);
        } finally {
            setLoadingTimeSlots(false);
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

    const loadUserAddress = async () => {
        if (!userId) return;

        try {
            const addresses = await addressService.getUserAddresses(userId);
            if (addresses && addresses.length > 0) {
                const mappedAddresses = addresses.map((addr: any) => ({
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
                setUserAddresses(mappedAddresses);

                // Set address from parent (defaultAddress) if available, otherwise use first address
                if (defaultAddress && defaultAddress.id) {
                    // Try to find the default address in the mapped addresses
                    const matchingAddress = mappedAddresses.find(addr => addr.id === defaultAddress.id);
                    if (matchingAddress) {
                        setUserAddress(matchingAddress);
                        console.log('Grooming - Using default address from parent:', matchingAddress);
                    } else if (mappedAddresses.length > 0) {
                        setUserAddress(mappedAddresses[0]);
                        console.log('Grooming - Default address not found, using first address:', mappedAddresses[0]);
                    }
                } else if (mappedAddresses.length > 0) {
                    setUserAddress(mappedAddresses[0]);
                    console.log('Grooming - Auto-selected first address:', mappedAddresses[0]);
                }
            }
        } catch (error) {
            console.error('Error loading address:', error);
        }
    };

    const handleSaveAddress = async (address: Address) => {
        if (!userId) {
            alert('User not logged in. Please log in to save address.');
            return;
        }

        try {
            console.log('Grooming - Saving address:', address);
            const savedAddress: any = await addressService.addAddress(userId, address);
            console.log('Grooming - Address saved successfully:', savedAddress);

            // Reload addresses to get the latest list
            await loadUserAddress();

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
                setUserAddress(mappedAddress);
                console.log('Grooming - Selected new address:', mappedAddress);
            }

            setShowAddNewAddress(false);
            setShowAddressDropdown(false);
            alert('Address saved successfully!');
        } catch (error: any) {
            console.error('Grooming - Error saving address:', error);

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
            alert('Please login to book a grooming service');
            return;
        }

        if (!selectedPet) {
            alert('Please select a pet');
            return;
        }

        if (!contactNumber) {
            alert('Please enter a contact number');
            return;
        }

        if (!selectedStore) {
            alert('Please select a grooming service provider');
            return;
        }

        if (location === 'home' && !userAddress) {
            alert('Please add a delivery address from your profile');
            return;
        }

        // Use store packages for both home and clinic
        const selectedPkg = storePackages.find(pkg => pkg.package_type === selectedPackage);

        if (!selectedPkg) {
            alert('Please select a package');
            return;
        }

        // Get selected pet name
        const pet = pets.find(p => p.id === selectedPet);
        const petName = pet ? `${pet.name} (${pet.species})` : undefined;

        // Get selected date and time
        const selectedDate = dateSlots[selectedDateIndex];
        const dateStr = selectedDate.toISOString().split('T')[0];

        // No platform fee for users - fee is deducted from grooming store earnings
        const serviceFee = selectedPkg.price;
        const totalAmount = serviceFee;

        const bookingData: BookingData = {
            type: 'grooming',
            petId: selectedPet,
            petName,
            bookingType: location,
            date: dateStr,
            time: selectedTime,
            addressId: location === 'home' ? userAddress?.id : undefined,
            address: location === 'home' ? userAddress || undefined : undefined,
            packageType: selectedPackage,
            packageId: selectedPkg.id,
            contactNumber,
            notes: `${selectedPkg.name} package from ${selectedStore.store_name}`,
            amount: serviceFee,
            serviceFee: serviceFee,
            platformFee: 0, // No platform fee for users
            totalAmount: totalAmount,
            serviceName: `${selectedPkg.name} Grooming (${location === 'home' ? 'Home' : 'Clinic'})`,
            groomingStoreId: selectedStore.id,
            groomingStoreName: selectedStore.store_name,
        };

        console.log('Proceeding to checkout with booking data:', bookingData);

        if (onProceedToCheckout) {
            onProceedToCheckout(bookingData);
        } else {
            onBack();
        }
    };

    const getSelectedPackagePrice = () => {
        // Use store packages for both home and clinic
        const pkg = storePackages.find(p => p.package_type === selectedPackage);
        return pkg?.price || 0;
    };

    return (
        <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                    </button>
                    <img src="assets/images/logo.png" className="h-8 w-8 object-contain" alt="Logo" />
                    <h1 className="text-xl font-black text-primary tracking-tight font-display">
                        {isRescheduling ? 'Reschedule Grooming' : 'Grooming'}
                    </h1>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-32">
                {/* Map Section - Show for both home and clinic visits */}
                {location === 'home' ? (
                    <section className="space-y-4">
                        <div className="relative w-full h-60 bg-gray-200 rounded-[32px] overflow-hidden shadow-lg">
                            {userAddress?.latitude && userAddress?.longitude ? (
                                <iframe
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${userAddress.longitude - 0.005}%2C${userAddress.latitude - 0.005}%2C${userAddress.longitude + 0.005}%2C${userAddress.latitude + 0.005}&layer=mapnik&marker=${userAddress.latitude},${userAddress.longitude}`}
                                    className="w-full h-full"
                                    style={{ border: 0 }}
                                    title="Home Visit Location"
                                />
                            ) : (
                                <iframe
                                    src="https://www.openstreetmap.org/export/embed.html?bbox=77.5%2C12.9%2C77.8%2C13.1&layer=mapnik"
                                    className="w-full h-full"
                                    style={{ border: 0 }}
                                    title="Default Location"
                                />
                            )}

                            {/* Location Pin Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 bg-primary rounded-full shadow-2xl flex items-center justify-center transform -translate-y-6">
                                    <span className="material-symbols-outlined text-white text-2xl">location_on</span>
                                </div>
                            </div>

                            {/* Address Card at Bottom */}
                            {userAddress && (
                                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-lg rounded-[24px] p-4 shadow-xl">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary text-lg">home</span>
                                                </div>
                                                <span className="text-xs font-black text-primary uppercase tracking-widest">{userAddress.type}</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 leading-snug">{userAddress.fullAddress}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAddressDropdown(true)}
                                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                                        >
                                            <span className="material-symbols-outlined text-gray-700 text-xl">edit</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!userAddress && (
                                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-lg rounded-[24px] p-4 shadow-xl">
                                    <button
                                        onClick={() => setShowAddNewAddress(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-light text-white font-bold text-sm rounded-xl transition-colors"
                                    >
                                        <span className="material-symbols-outlined">add_location_alt</span>
                                        Add Home Address
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Address Dropdown */}
                        {showAddressDropdown && (
                            <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-gray-900 text-base font-black tracking-tight">Select Address</h3>
                                    <button
                                        onClick={() => setShowAddressDropdown(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="max-h-64 overflow-y-auto">
                                    {userAddresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => {
                                                setUserAddress(addr);
                                                setShowAddressDropdown(false);
                                            }}
                                            className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${userAddress?.id === addr.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    <span className="material-symbols-outlined text-lg">
                                                        {addr.type === 'Home' ? 'home' : addr.type === 'Office' ? 'work' : 'location_on'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-900 font-bold text-sm">{addr.type}</p>
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        {addr.flatNumber}, {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                                                    </p>
                                                </div>
                                                {userAddress?.id === addr.id && (
                                                    <span className="material-symbols-outlined text-primary">check_circle</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

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
                        )}
                    </section>
                ) : location === 'clinic' && selectedStore?.latitude && selectedStore?.longitude ? (
                    /* Clinic Visit Map */
                    <section className="space-y-4">
                        <div className="relative w-full h-60 bg-gray-200 rounded-[32px] overflow-hidden shadow-lg">
                            <iframe
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedStore.longitude - 0.005}%2C${selectedStore.latitude - 0.005}%2C${selectedStore.longitude + 0.005}%2C${selectedStore.latitude + 0.005}&layer=mapnik&marker=${selectedStore.latitude},${selectedStore.longitude}`}
                                className="w-full h-full"
                                style={{ border: 0 }}
                                title="Clinic Location"
                            />

                            {/* Location Pin Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-12 h-12 bg-primary rounded-full shadow-2xl flex items-center justify-center transform -translate-y-6">
                                    <span className="material-symbols-outlined text-white text-2xl">location_on</span>
                                </div>
                            </div>

                            {/* Clinic Info Card at Bottom */}
                            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-lg rounded-[24px] p-4 shadow-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-xl">medical_services</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 mb-1">{selectedStore.store_name}</h4>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {selectedStore.address && `${selectedStore.address}, `}
                                            {selectedStore.city}
                                            {selectedStore.state && `, ${selectedStore.state}`}
                                        </p>
                                        {selectedStore.phone && (
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">call</span>
                                                {selectedStore.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Select Pet</h3>
                        <button className="text-primary font-bold text-xs uppercase tracking-widest">Add New</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
                        {pets.map((pet) => (
                            <button
                                key={pet.id}
                                onClick={() => setSelectedPet(pet.id)}
                                className="flex flex-col items-center gap-3 shrink-0 group"
                            >
                                <div className={`w-20 h-20 rounded-[28px] p-1 border-4 transition-all duration-300 ${selectedPet === pet.id ? 'border-primary shadow-xl shadow-primary/20 bg-white' : 'border-transparent opacity-50 scale-90'}`}>
                                    <img src={pet.image} className="w-full h-full rounded-[22px] object-cover" alt={pet.name} />
                                </div>
                                <span className={`text-xs font-black uppercase tracking-widest ${selectedPet === pet.id ? 'text-primary' : 'text-gray-400'}`}>{pet.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Booking Details</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-5 bg-white rounded-[24px] shadow-sm border border-gray-100">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl">call</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Contact Number</p>
                                <input
                                    type="tel"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    placeholder="+1 (555) 867-5309"
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-black text-gray-900 placeholder-gray-300"
                                />
                            </div>
                        </div>

                        <div className="p-1.5 bg-white rounded-[28px] flex border border-gray-100 shadow-sm">
                            <button
                                onClick={() => !isRescheduling && setLocation('home')}
                                className={`flex-1 py-4 px-6 rounded-[22px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${isRescheduling ? 'cursor-not-allowed opacity-60' : ''} ${location === 'home' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">home</span>
                                Home Visit
                            </button>
                            <button
                                onClick={() => !isRescheduling && setLocation('clinic')}
                                className={`flex-1 py-4 px-6 rounded-[22px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${isRescheduling ? 'cursor-not-allowed opacity-60' : ''} ${location === 'clinic' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">medical_services</span>
                                Clinic
                            </button>
                        </div>
                    </div>
                </section>

                {/* Store Selection - Show for both home and clinic visits */}
                <section className="space-y-4">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        {isRescheduling
                            ? 'Your Grooming Store'
                            : (location === 'clinic' ? 'Select Clinic' : 'Select Grooming Service')
                        }
                    </h3>
                    {isRescheduling && (
                        <div className="mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-blue-700 text-xs font-semibold">
                                📅 Rescheduling with the same grooming store
                            </p>
                        </div>
                    )}
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                        {groomingStores.map((store) => (
                            <div
                                key={store.id}
                                onClick={() => !isRescheduling && setSelectedStore(store)}
                                className={`flex-shrink-0 w-[280px] p-5 rounded-[24px] border-2 transition-all ${isRescheduling ? 'cursor-default' : 'cursor-pointer'} ${selectedStore?.id === store.id
                                        ? 'border-primary bg-white ring-4 ring-primary/5 shadow-xl'
                                        : 'border-white bg-white shadow-sm hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-black text-gray-900 truncate">{store.store_name}</h4>
                                        {selectedStore?.id === store.id && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-full">
                                                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                                    Selected
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ml-2 ${selectedStore?.id === store.id ? 'border-primary bg-primary' : 'border-gray-200'
                                        }`}>
                                        {selectedStore?.id === store.id && (
                                            <span className="material-symbols-outlined text-white text-[14px] font-black">check</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                        {store.address && `${store.address}, `}
                                        {store.city}
                                        {store.state && `, ${store.state}`}
                                    </p>
                                    {store.phone && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">call</span>
                                            {store.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-5">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Select Package</h3>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : storePackages.length === 0 && selectedStore ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-[24px] border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-gray-400 text-3xl">inventory_2</span>
                            </div>
                            <p className="text-gray-600 font-bold text-sm">No packages available</p>
                            <p className="text-gray-400 text-xs mt-1">This store hasn't added any packages yet</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {storePackages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg.package_type)}
                                    className={`relative p-6 rounded-[32px] border-2 transition-all cursor-pointer hover:shadow-lg ${selectedPackage === pkg.package_type ? 'border-primary bg-white ring-4 ring-primary/5' : 'border-white bg-white shadow-sm'}`}
                                >
                                    {pkg.package_type === 'full' && (
                                        <div className="absolute -top-3 left-8 bg-amber-400 text-black text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Most Loved</div>
                                    )}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black text-gray-900 leading-tight">{pkg.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[90%]">{pkg.description}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPackage === pkg.package_type ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                                            {selectedPackage === pkg.package_type && <span className="material-symbols-outlined text-white text-[16px] font-black">check</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{pkg.price.toFixed(2)}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">/ session</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Date & Time Selection */}
                <section className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Select Date & Time</h3>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{getMonthYear(today)}</div>
                    </div>

                    {/* Date Selection */}
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

                    {/* Time Selection */}
                    <div>
                        <h4 className="text-sm font-black text-gray-900 mb-3">Available Time Slots</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {availableTimeSlots.map((time) => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTime === time ? 'bg-primary text-white border-primary shadow-xl' : 'border-gray-100 bg-white text-gray-600 hover:border-primary/20'}`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <div className="p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 fixed bottom-0 w-full max-w-md flex items-center justify-between gap-6 z-40">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Estimate</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">₹{getSelectedPackagePrice().toFixed(2)}</p>
                </div>
                <button
                    onClick={handleConfirmBooking}
                    className="flex-1 py-5 bg-primary text-white font-black text-base rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all group"
                >
                    Proceed to Checkout
                    <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
            </div>

            {/* Address Selection Dropdown Modal */}
            {showAddressDropdown && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 fade-in" onClick={() => setShowAddressDropdown(false)}>
                    <div className="bg-white rounded-t-[32px] w-full max-w-md p-6 space-y-4 slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-black text-gray-900">Select Address</h3>
                            <button onClick={() => setShowAddressDropdown(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-700">close</span>
                            </button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {userAddresses.map((addr) => (
                                <button
                                    key={addr.id}
                                    onClick={() => {
                                        setUserAddress(addr);
                                        setShowAddressDropdown(false);
                                    }}
                                    className={`w-full p-4 rounded-[20px] border-2 transition-all text-left ${userAddress?.id === addr.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-primary">location_on</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-primary uppercase tracking-widest">{addr.type}</span>
                                                {userAddress?.id === addr.id && (
                                                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 leading-snug">{addr.fullAddress}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setShowAddressDropdown(false);
                                    setShowAddNewAddress(true);
                                }}
                                className="w-full p-4 rounded-[20px] border-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">add</span>
                                    </div>
                                    <span className="text-sm font-black text-primary">Add New Address</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

export default Grooming;
