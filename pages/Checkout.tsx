
import React, { useState, useEffect } from 'react';
import { Address } from '../types';
import { addressService } from '../services/api';
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
  onBack: () => void;
  onPay: () => void;
  userId?: string | null;
  bookingData?: BookingData | null;
}

const Checkout: React.FC<Props> = ({ onBack, onPay, userId, bookingData }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');

  useEffect(() => {
    if (userId) {
      loadAddresses();
    }
  }, [userId]);

  // Set address from bookingData if available
  useEffect(() => {
    if (bookingData?.address) {
      console.log('Checkout - Setting address from bookingData:', bookingData.address);
      setSelectedAddress(bookingData.address);
    }
  }, [bookingData?.address]); // Watch for address changes specifically

  const loadAddresses = async () => {
    if (!userId) return;

    try {
      setIsLoadingAddresses(true);
      const data = await addressService.getUserAddresses(userId);
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
      setAddresses(mappedAddresses);

      // Only auto-select first address if no address is set AND no bookingData address
      if (mappedAddresses.length > 0 && !selectedAddress && !bookingData?.address) {
        setSelectedAddress(mappedAddresses[0]);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (address: Address) => {
    if (!userId) return;

    try {
      await addressService.addAddress(userId, address);
      await loadAddresses();
      setShowAddNewAddress(false);
      setShowAddressDropdown(false);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 antialiased overflow-hidden fade-in">
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white shadow-sm z-30 border-b border-gray-50">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                </button>
                <h1 className="text-xl font-extrabold text-primary tracking-tight font-display">Checkout</h1>
            </div>
            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">shield_lock</span>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-48">
            {/* Delivery Address */}
            <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-900 text-lg tracking-tight">Delivery Address</h3>
                </div>
                {isLoadingAddresses ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : selectedAddress ? (
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-3xl">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined">
                                    {selectedAddress.type === 'Home' ? 'home' : selectedAddress.type === 'Office' ? 'work' : 'location_on'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-gray-900">{selectedAddress.type}</p>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                    {selectedAddress.flatNumber}, {selectedAddress.street}<br/>
                                    {selectedAddress.landmark && `${selectedAddress.landmark}, `}
                                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                            className="w-full py-3 px-4 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">swap_horiz</span>
                            Change Address
                        </button>

                        {/* Address Dropdown */}
                        {showAddressDropdown && (
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        onClick={() => {
                                            setSelectedAddress(addr);
                                            setShowAddressDropdown(false);
                                        }}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all ${
                                            selectedAddress?.id === addr.id
                                                ? 'bg-primary/10 border-2 border-primary'
                                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`size-10 rounded-full flex items-center justify-center ${
                                                selectedAddress?.id === addr.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                <span className="material-symbols-outlined text-lg">
                                                    {addr.type === 'Home' ? 'home' : addr.type === 'Office' ? 'work' : 'location_on'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-900">{addr.type}</p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {addr.flatNumber}, {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                                                </p>
                                            </div>
                                            {selectedAddress?.id === addr.id && (
                                                <span className="material-symbols-outlined text-primary">check_circle</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        setShowAddNewAddress(true);
                                        setShowAddressDropdown(false);
                                    }}
                                    className="w-full py-3 px-4 bg-primary hover:bg-primary-light text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">add_location_alt</span>
                                    Add New Address
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddNewAddress(true)}
                        className="w-full flex items-center justify-center gap-3 p-6 bg-primary/5 border-2 border-primary/20 rounded-3xl hover:bg-primary/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-primary text-2xl">add_location_alt</span>
                        <span className="text-base font-black text-primary">Add Delivery Address</span>
                    </button>
                )}
            </section>

            {/* Order Summary */}
            <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-900 text-lg tracking-tight">Order Summary</h3>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">
                        #{new Date().getTime().toString().slice(-6)}
                    </span>
                </div>

                {bookingData && (
                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined">
                                    {bookingData.type === 'grooming' ? 'spa' : 'medical_services'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-gray-900">{bookingData.serviceName}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {bookingData.petName && `${bookingData.petName} • `}
                                    {new Date(bookingData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {bookingData.time}
                                </p>
                                {bookingData.doctorName && (
                                    <p className="text-xs text-gray-600">{bookingData.doctorName}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Service Fee (Doctor)</span>
                        <span className="text-gray-900">₹{(bookingData?.serviceFee || bookingData?.amount || 50).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Tax & Handling (Platform Fee)</span>
                        <span className="text-gray-900">₹{(bookingData?.platformFee || ((bookingData?.amount || 50) * 0.05)).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-gray-50 w-full"></div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-black text-gray-900">Total Due</span>
                        <span className="text-3xl font-black text-primary tracking-tighter">
                            ₹{(bookingData?.totalAmount || ((bookingData?.amount || 50) * 1.05)).toFixed(2)}
                        </span>
                    </div>
                </div>
            </section>

            {/* Payment Methods */}
            <section className="space-y-5">
                <h3 className="font-black text-gray-900 text-lg tracking-tight px-2">Payment Method</h3>
                <div className="space-y-4">
                    {/* Card Payment */}
                    <div
                        onClick={() => setSelectedPaymentMethod('card')}
                        className={`bg-white rounded-[32px] border-2 p-6 transition-all cursor-pointer ${
                            selectedPaymentMethod === 'card'
                                ? 'border-primary shadow-2xl shadow-primary/5'
                                : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                                selectedPaymentMethod === 'card'
                                    ? 'bg-primary text-white shadow-primary/20'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                <span className="material-symbols-outlined text-2xl font-black">credit_card</span>
                            </div>
                            <div className="flex-1">
                                <span className="font-black text-gray-900 text-base">Credit / Debit Card</span>
                                <p className="text-xs text-gray-400 font-bold mt-1">Visa, Mastercard, Rupay</p>
                            </div>
                            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedPaymentMethod === 'card'
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-200'
                            }`}>
                                {selectedPaymentMethod === 'card' && <div className="size-2 bg-white rounded-full"></div>}
                            </div>
                        </div>

                        {selectedPaymentMethod === 'card' && (
                            <div className="mt-6 space-y-6 border-t border-gray-100 pt-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Card Number</label>
                                    <div className="relative">
                                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm font-black focus:ring-primary focus:ring-2 placeholder-gray-300 shadow-inner" />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300">verified</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry</label>
                                        <input type="text" placeholder="MM/YY" className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm font-black focus:ring-primary shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CVV</label>
                                        <input type="password" placeholder="***" className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm font-black focus:ring-primary shadow-inner" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Save card securely</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* UPI Payment */}
                    <div
                        onClick={() => setSelectedPaymentMethod('upi')}
                        className={`bg-white rounded-[32px] border-2 p-6 transition-all cursor-pointer ${
                            selectedPaymentMethod === 'upi'
                                ? 'border-primary shadow-2xl shadow-primary/5'
                                : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                                selectedPaymentMethod === 'upi'
                                    ? 'bg-primary text-white shadow-primary/20'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                <span className="material-symbols-outlined text-2xl font-black">qr_code_scanner</span>
                            </div>
                            <div className="flex-1">
                                <span className="font-black text-gray-900 text-base">UPI</span>
                                <p className="text-xs text-gray-400 font-bold mt-1">Google Pay, PhonePe, Paytm</p>
                            </div>
                            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedPaymentMethod === 'upi'
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-200'
                            }`}>
                                {selectedPaymentMethod === 'upi' && <div className="size-2 bg-white rounded-full"></div>}
                            </div>
                        </div>

                        {selectedPaymentMethod === 'upi' && (
                            <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">UPI ID</label>
                                    <input type="text" placeholder="yourname@upi" className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm font-black focus:ring-primary focus:ring-2 placeholder-gray-300 shadow-inner" />
                                </div>
                                <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl">
                                    <span className="material-symbols-outlined text-gray-400">info</span>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">You will receive payment request on your UPI app</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cash on Delivery */}
                    <div
                        onClick={() => setSelectedPaymentMethod('cod')}
                        className={`bg-white rounded-[32px] border-2 p-6 transition-all cursor-pointer ${
                            selectedPaymentMethod === 'cod'
                                ? 'border-primary shadow-2xl shadow-primary/5'
                                : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                                selectedPaymentMethod === 'cod'
                                    ? 'bg-primary text-white shadow-primary/20'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                <span className="material-symbols-outlined text-2xl font-black">payments</span>
                            </div>
                            <div className="flex-1">
                                <span className="font-black text-gray-900 text-base">Cash on Delivery</span>
                                <p className="text-xs text-gray-400 font-bold mt-1">Pay when you receive</p>
                            </div>
                            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedPaymentMethod === 'cod'
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-200'
                            }`}>
                                {selectedPaymentMethod === 'cod' && <div className="size-2 bg-white rounded-full"></div>}
                            </div>
                        </div>

                        {selectedPaymentMethod === 'cod' && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <span className="material-symbols-outlined text-amber-600">info</span>
                                    <div>
                                        <p className="text-xs font-bold text-amber-900 mb-1">Cash Payment</p>
                                        <p className="text-[10px] font-bold text-amber-700">Please keep exact change ready. Our service provider will collect payment upon service completion.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>

        <div className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-gray-100 p-8 pb-12 z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
            <button
                onClick={onPay}
                className="w-full py-5 bg-primary hover:bg-primary-light text-white font-black text-lg rounded-[28px] shadow-[0_20px_50px_rgba(1,75,122,0.3)] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
                {selectedPaymentMethod === 'cod'
                    ? `Confirm Order • ₹${(bookingData?.totalAmount || ((bookingData?.amount || 50) * 1.05)).toFixed(2)}`
                    : `Confirm Payment • ₹${(bookingData?.totalAmount || ((bookingData?.amount || 50) * 1.05)).toFixed(2)}`
                }
            </button>
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-300">
                <span className="material-symbols-outlined text-sm font-black">
                    {selectedPaymentMethod === 'cod' ? 'verified_user' : 'lock'}
                </span>
                <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                    {selectedPaymentMethod === 'cod' ? '100% Secure Delivery' : 'PCI-DSS Secure Gateway'}
                </p>
            </div>
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

export default Checkout;
