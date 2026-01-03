
import React, { useState, useEffect } from 'react';
import { prescriptionProductService } from '../services/doctorApi';
import { cartService } from '../services/api';
import type { PrescriptionProduct } from '../types';

interface Booking {
  id: string;
  service_type: string;
  booking_type: 'home' | 'clinic' | 'online';
  date: string;
  time: string;
  status: string;
  payment_status: string;
  payment_amount: number;
  service_fee?: number; // Fee paid to doctor
  platform_fee?: number; // Platform's 5% margin (Tax & Handling)
  total_amount?: number; // Total user pays
  package_type?: string;
  contact_number?: string;
  prescription_url?: string;
  pets?: {
    name: string;
    species: string;
    image: string;
  };
  addresses?: {
    type: string;
    flat_number: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
    full_address?: string;
  };
  grooming_packages?: {
    name: string;
    package_type: string;
    price: number;
  };
  doctors?: {
    full_name: string;
    clinic_name?: string;
    clinic_address?: string;
    clinic_latitude?: number;
    clinic_longitude?: number;
    profile_photo_url?: string;
    specialization?: string;
  };
}

interface Props {
  onBack: () => void;
  booking?: Booking | null;
  userId?: string;
  onCartClick?: () => void;
}

interface Doctor {
  id: string;
  full_name: string;
  email: string;
  specialization?: string;
  profile_photo_url?: string;
}

const BookingDetails: React.FC<Props> = ({ onBack, booking, userId, onCartClick }) => {
  const [prescriptionProducts, setPrescriptionProducts] = useState<PrescriptionProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addingToCart, setAddingToCart] = useState<{ [key: string]: boolean }>({});
  const [cartQuantities, setCartQuantities] = useState<{ [key: string]: number }>({});

  // Doctor rating states
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);

  // Load prescription products and doctor info if booking is completed
  useEffect(() => {
    if (booking && booking.status === 'completed' && booking.service_type === 'consultation') {
      loadPrescriptionProducts();
      syncCartQuantities(); // Sync cart quantities when component loads
      if (booking.doctor_id) {
        loadDoctorInfo(booking.doctor_id);
        checkIfUserRated(booking.id);
      }
    }
  }, [booking]);

  // Sync cart quantities when user returns to this page (e.g., after visiting cart)
  useEffect(() => {
    if (userId && prescriptionProducts.length > 0) {
      syncCartQuantities();
    }
  }, [userId, prescriptionProducts.length]);

  const loadDoctorInfo = async (doctorId: string) => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, email, specialization, profile_photo_url')
        .eq('id', doctorId)
        .single();

      if (error) throw error;
      if (data) {
        setDoctor(data);
      }
    } catch (error) {
      console.error('Error loading doctor info:', error);
    }
  };

  const checkIfUserRated = async (bookingId: string) => {
    if (!userId) return;

    try {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase
        .from('doctor_reviews')
        .select('rating, review_text')
        .eq('booking_id', bookingId)
        .eq('user_id', userId)
        .single();

      if (data) {
        setHasRated(true);
        setUserRating((data as any).rating);
        setReviewText((data as any).review_text || '');
      }
    } catch (error) {
      // No rating found, which is fine
      setHasRated(false);
    }
  };

  const loadPrescriptionProducts = async () => {
    if (!booking) return;

    setLoadingProducts(true);
    try {
      const products = await prescriptionProductService.getPrescriptionProducts(booking.id);
      setPrescriptionProducts(products);
    } catch (error) {
      console.error('Error loading prescription products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const syncCartQuantities = async () => {
    if (!userId) return;

    try {
      const cartItems: any[] = await cartService.getCartItems(userId);

      // Build a map of product_id -> quantity from actual cart
      const actualQuantities: { [key: string]: number } = {};
      cartItems.forEach((item: any) => {
        actualQuantities[item.product_id] = item.quantity;
      });

      // Update local state to match actual cart
      setCartQuantities(actualQuantities);
    } catch (error) {
      console.error('Error syncing cart quantities:', error);
      // On error, clear local state to be safe
      setCartQuantities({});
    }
  };

  const handleAddToCart = async (product: PrescriptionProduct) => {
    if (!userId || !product.product) return;

    setAddingToCart(prev => ({ ...prev, [product.id]: true }));
    try {
      await cartService.addToCart(userId, product.product_id, product.quantity);
      // Update cart quantity state
      setCartQuantities(prev => ({
        ...prev,
        [product.product_id]: (prev[product.product_id] || 0) + product.quantity
      }));
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleAddAllToCart = async () => {
    if (!userId || prescriptionProducts.length === 0) return;

    setLoadingProducts(true);
    try {
      const newQuantities: { [key: string]: number } = {};
      for (const product of prescriptionProducts) {
        if (product.product) {
          await cartService.addToCart(userId, product.product_id, product.quantity);
          newQuantities[product.product_id] = (cartQuantities[product.product_id] || 0) + product.quantity;
        }
      }
      setCartQuantities(prev => ({ ...prev, ...newQuantities }));
    } catch (error) {
      console.error('Error adding products to cart:', error);
      alert('Failed to add some products to cart. Please try again.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleIncreaseQuantity = async (product: PrescriptionProduct) => {
    if (!userId || !product.product) return;

    try {
      await cartService.addToCart(userId, product.product_id, 1);
      setCartQuantities(prev => ({
        ...prev,
        [product.product_id]: (prev[product.product_id] || 0) + 1
      }));
    } catch (error) {
      console.error('Error increasing quantity:', error);
      alert('Failed to update cart. Please try again.');
    }
  };

  const handleDecreaseQuantity = async (product: PrescriptionProduct) => {
    if (!userId || !product.product) return;

    const currentQty = cartQuantities[product.product_id] || 0;
    if (currentQty <= 0) return;

    try {
      // We need to get the cart item ID first
      const cartItems: any[] = await cartService.getCartItems(userId);
      const cartItem = cartItems.find((item: any) => item.product_id === product.product_id);

      if (cartItem && cartItem.id) {
        if (currentQty === 1) {
          // Remove from cart
          await cartService.removeFromCart(cartItem.id);
          setCartQuantities(prev => {
            const updated = { ...prev };
            delete updated[product.product_id];
            return updated;
          });
        } else {
          // Decrease quantity
          await cartService.updateCartItemQuantity(cartItem.id, currentQty - 1);
          setCartQuantities(prev => ({
            ...prev,
            [product.product_id]: currentQty - 1
          }));
        }
      }
    } catch (error) {
      console.error('Error decreasing quantity:', error);
      alert('Failed to update cart. Please try again.');
    }
  };

  const handleSubmitRating = async () => {
    if (!userId || !booking || !booking.doctor_id || userRating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    setSubmittingRating(true);
    try {
      const { supabase } = await import('../lib/supabase');

      // Check if review already exists
      const { data: existingReview } = await (supabase as any)
        .from('doctor_reviews')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('user_id', userId)
        .single();

      if (existingReview) {
        // Update existing review
        const { error } = await (supabase as any)
          .from('doctor_reviews')
          .update({
            rating: userRating,
            review_text: reviewText.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('booking_id', booking.id)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new review
        const { error } = await (supabase as any)
          .from('doctor_reviews')
          .insert({
            doctor_id: booking.doctor_id,
            user_id: userId,
            booking_id: booking.id,
            rating: userRating,
            review_text: reviewText.trim() || null,
          });

        if (error) throw error;
      }

      // Update the doctor's average rating
      await updateDoctorRating(booking.doctor_id);

      setHasRated(true);
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const updateDoctorRating = async (doctorId: string) => {
    try {
      const { supabase } = await import('../lib/supabase');

      // Calculate average rating from all reviews
      const { data: reviews } = await supabase
        .from('doctor_reviews')
        .select('rating')
        .eq('doctor_id', doctorId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
        const roundedRating = Math.round(avgRating * 10) / 10; // Round to 1 decimal

        // Update doctor's rating
        await (supabase as any)
          .from('doctors')
          .update({ rating: roundedRating })
          .eq('id', doctorId);
      }
    } catch (error) {
      console.error('Error updating doctor rating:', error);
    }
  };

  // If no booking data, show static mock data
  if (!booking) {
    return (
      <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 h-screen overflow-hidden antialiased fade-in">
        <header className="flex items-center bg-white p-4 pb-2 justify-between shrink-0 z-10 shadow-sm border-b border-gray-100">
          <button
            onClick={onBack}
            className="text-gray-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-primary text-xl font-extrabold tracking-tight flex-1 text-center font-display">
            Booking Details
          </h2>
          <div className="flex w-10 items-center justify-end">
            <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-48 px-6 space-y-6 pt-6">
          {/* Status Card */}
          <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 fill-current text-[24px]">check_circle</span>
                <p className="text-2xl font-black text-gray-900 leading-none tracking-tighter">Confirmed</p>
              </div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Booking #83921 • Upcoming</p>
            </div>
            <div className="flex items-center justify-center bg-primary/10 rounded-[28px] h-16 w-16 text-primary shadow-lg shadow-primary/5">
              <span className="material-symbols-outlined text-4xl">home_health</span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-[32px] border-4 border-gray-50 shadow-xl overflow-hidden p-1 bg-white">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7A1kI2w4YYa-I2qlAUcQNzZeXM0pfSNHXwphXMktI6JojMYec51oFWtkjynWTfLYl1KvTnVgq1PQmTztWsgAh4g7tPU263_xRdzU7EExl3iVtMdfuj_WrAl6JkfvRFNaZpEcW2RBdttmO1aN5WswhSeXGdkktvOLKIjT9GAP10kd_10IfR35GBB5xesOdMfQ2u0LDHKBCH7wL7eCtSs9tpOexQoMYkZ_Xd4JlhBi-IizLsBR_LMsqRfwcgd8Tty56PKnQ8BOl0Vo" className="w-full h-full rounded-[24px] object-cover" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-gray-900 text-lg font-black leading-tight tracking-tight">Dr. Sarah Jenkins</h3>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">Veterinarian • Surgeon</p>
                </div>
              </div>
              <button className="w-12 h-12 bg-primary text-white rounded-[18px] flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </button>
            </div>

            <div className="h-px bg-gray-50"></div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full border-4 border-primary/5 p-1 bg-white shadow-lg overflow-hidden">
                <img src="https://picsum.photos/seed/buddy/100/100" className="w-full h-full rounded-full object-cover" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Patient</p>
                <p className="text-sm font-black text-gray-900 tracking-tight">Buddy (Golden Retriever)</p>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-8 tracking-tight font-display">Appointment Info</h3>
            <div className="grid grid-cols-2 gap-y-10 gap-x-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-primary">
                  <span className="material-symbols-outlined text-[22px] font-black">calendar_today</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Date</span>
                </div>
                <p className="text-sm font-black text-gray-900 ml-8">Oct 24, 2023</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-primary">
                  <span className="material-symbols-outlined text-[22px] font-black">schedule</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Time</span>
                </div>
                <p className="text-sm font-black text-gray-900 ml-8">10:00 AM</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-primary">
                  <span className="material-symbols-outlined text-[22px] font-black">medical_services</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Type</span>
                </div>
                <p className="text-sm font-black text-gray-900 ml-8">Home Consult</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-primary">
                  <span className="material-symbols-outlined text-[22px] font-black">timer</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
                </div>
                <p className="text-sm font-black text-gray-900 ml-8">45 Minutes</p>
              </div>
            </div>
          </div>

          {/* Location / Directions */}
          <div className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-5 px-2">
              <h3 className="font-black text-gray-900">Location</h3>
              <button className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                Navigate <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </button>
            </div>
            <div className="px-2 pb-2">
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-4">123 Maple Street, Springfield, IL 62704</p>
              <div className="w-full aspect-video bg-gray-100 rounded-[32px] relative overflow-hidden shadow-inner">
                <img src="https://picsum.photos/seed/mapview/600/300" className="w-full h-full object-cover opacity-60" alt="Map" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                  <span className="material-symbols-outlined text-red-500 text-5xl drop-shadow-2xl fill-current">location_on</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Fee</p>
                <p className="text-xl font-black text-gray-900">₹75.00</p>
              </div>
            </div>
            <span className="px-5 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-emerald-100">Paid</span>
          </div>
        </main>

        <footer className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-gray-100 p-6 pb-10 space-y-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-3">
            <button className="w-full py-5 bg-primary text-white font-black text-base rounded-[28px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined font-black">edit_calendar</span>
              Reschedule
            </button>
            <button className="w-full py-5 bg-transparent text-gray-400 font-black text-base rounded-[28px] border border-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined font-black text-[22px]">cancel</span>
              Cancel Booking
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  const isGrooming = booking.service_type === 'grooming';
  const isHomeVisit = booking.booking_type === 'home';

  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 h-screen overflow-hidden antialiased fade-in">
      <header className="flex items-center bg-white p-4 pb-2 justify-between shrink-0 z-10 shadow-sm border-b border-gray-100">
        <button
          onClick={onBack}
          className="text-gray-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-primary text-xl font-extrabold tracking-tight flex-1 text-center font-display">
          Booking Details
        </h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-48 px-6 space-y-6 pt-6">
        {/* Status Card */}
        <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 fill-current text-[24px]">check_circle</span>
              <p className="text-2xl font-black text-gray-900 leading-none tracking-tighter">{booking.status === 'upcoming' ? 'Confirmed' : booking.status}</p>
            </div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Booking #{booking.id.substring(0, 5)} • {booking.status}</p>
          </div>
          <div className="flex items-center justify-center bg-primary/10 rounded-[28px] h-16 w-16 text-primary shadow-lg shadow-primary/5">
            <span className="material-symbols-outlined text-4xl">
              {isGrooming ? 'content_cut' : 'home_health'}
            </span>
          </div>
        </div>

        {/* Pet Info */}
        {booking.pets && (
          <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100 space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full border-4 border-primary/5 p-1 bg-white shadow-lg overflow-hidden">
                <img src={booking.pets.image} className="w-full h-full rounded-full object-cover" alt={booking.pets.name} />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Patient</p>
                <p className="text-sm font-black text-gray-900 tracking-tight">{booking.pets.name} ({booking.pets.species})</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-8 tracking-tight font-display">
            {isGrooming ? 'Grooming Session Info' : 'Appointment Info'}
          </h3>
          <div className="grid grid-cols-2 gap-y-10 gap-x-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-primary">
                <span className="material-symbols-outlined text-[22px] font-black">calendar_today</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Date</span>
              </div>
              <p className="text-sm font-black text-gray-900 ml-8">{formatDate(booking.date)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-primary">
                <span className="material-symbols-outlined text-[22px] font-black">schedule</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Time</span>
              </div>
              <p className="text-sm font-black text-gray-900 ml-8">{formatTime(booking.time)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-primary">
                <span className="material-symbols-outlined text-[22px] font-black">
                  {isGrooming ? 'content_cut' : 'medical_services'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">Type</span>
              </div>
              <p className="text-sm font-black text-gray-900 ml-8">
                {isGrooming
                  ? `${booking.booking_type === 'home' ? 'Home' : 'Clinic'} Grooming`
                  : `${booking.booking_type === 'home' ? 'Home' : booking.booking_type === 'clinic' ? 'Clinic' : 'Online'} Consult`
                }
              </p>
            </div>
            {isGrooming && booking.grooming_packages && (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-primary">
                  <span className="material-symbols-outlined text-[22px] font-black">inventory_2</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Package</span>
                </div>
                <p className="text-sm font-black text-gray-900 ml-8">{booking.grooming_packages.name}</p>
              </div>
            )}
            {booking.contact_number && (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-primary">
                  <span className="material-symbols-outlined text-[22px] font-black">call</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Contact</span>
                </div>
                <p className="text-sm font-black text-gray-900 ml-8">{booking.contact_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location / Directions - Only show for home visits */}
        {isHomeVisit && booking.addresses && (
          <div className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-5 px-2">
              <h3 className="font-black text-gray-900">Location</h3>
              {booking.addresses.latitude && booking.addresses.longitude && (
                <button
                  onClick={() => {
                    const lat = booking.addresses!.latitude;
                    const lng = booking.addresses!.longitude;
                    const address = booking.addresses!.full_address ||
                      `${booking.addresses!.flat_number}, ${booking.addresses!.street}, ${booking.addresses!.city}`;

                    // Detect if iOS device
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

                    if (isIOS) {
                      // Open Apple Maps
                      window.open(`maps://maps.apple.com/?q=${encodeURIComponent(address)}&ll=${lat},${lng}`, '_blank');
                    } else {
                      // Open Google Maps
                      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                    }
                  }}
                  className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  Navigate <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </button>
              )}
            </div>
            <div className="px-2 pb-2">
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-4">
                {booking.addresses.full_address ||
                  `${booking.addresses.flat_number}, ${booking.addresses.street}, ${booking.addresses.city}, ${booking.addresses.state} ${booking.addresses.pincode}`
                }
              </p>
              <div className="w-full aspect-video bg-gray-100 rounded-[32px] relative overflow-hidden shadow-inner">
                {booking.addresses.latitude && booking.addresses.longitude ? (
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${booking.addresses.longitude - 0.005}%2C${booking.addresses.latitude - 0.005}%2C${booking.addresses.longitude + 0.005}%2C${booking.addresses.latitude + 0.005}&layer=mapnik&marker=${booking.addresses.latitude},${booking.addresses.longitude}`}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    title="Booking Location"
                  />
                ) : (
                  <img src="https://picsum.photos/seed/mapview/600/300" className="w-full h-full object-cover opacity-60" alt="Map" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clinic Location - Only show for clinic visits */}
        {booking.booking_type === 'clinic' && booking.doctors && (
          <div className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-5 px-2">
              <h3 className="font-black text-gray-900">Clinic Location</h3>
              {booking.doctors.clinic_latitude && booking.doctors.clinic_longitude && (
                <button
                  onClick={() => {
                    const lat = booking.doctors!.clinic_latitude;
                    const lng = booking.doctors!.clinic_longitude;
                    const address = booking.doctors!.clinic_address || booking.doctors!.clinic_name || 'Clinic';

                    // Detect if iOS device
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

                    if (isIOS) {
                      // Open Apple Maps
                      window.open(`maps://maps.apple.com/?q=${encodeURIComponent(address)}&ll=${lat},${lng}`, '_blank');
                    } else {
                      // Open Google Maps
                      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                    }
                  }}
                  className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  Navigate <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </button>
              )}
            </div>
            <div className="px-2 pb-2">
              {booking.doctors.clinic_name && (
                <p className="text-sm font-bold text-gray-900 mb-2">
                  {booking.doctors.clinic_name}
                </p>
              )}
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-4">
                {booking.doctors.clinic_address || 'Clinic address not available'}
              </p>
              <div className="w-full aspect-video bg-gray-100 rounded-[32px] relative overflow-hidden shadow-inner">
                {booking.doctors.clinic_latitude && booking.doctors.clinic_longitude ? (
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${booking.doctors.clinic_longitude - 0.005}%2C${booking.doctors.clinic_latitude - 0.005}%2C${booking.doctors.clinic_longitude + 0.005}%2C${booking.doctors.clinic_latitude + 0.005}&layer=mapnik&marker=${booking.doctors.clinic_latitude},${booking.doctors.clinic_longitude}`}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    title="Clinic Location"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400 text-5xl mb-2">location_off</span>
                    <p className="text-xs text-gray-400 font-bold">Location not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prescription - Only show for completed consultations */}
        {booking.status === 'completed' && booking.service_type === 'consultation' && booking.prescription_url && (
          <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900 tracking-tight font-display">Prescription</h3>
              <span className="material-symbols-outlined text-primary text-2xl">medical_information</span>
            </div>

            <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl">
                    <span className="material-symbols-outlined text-primary text-2xl">description</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">View Prescription</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">PDF Document</p>
                  </div>
                </div>
                <a
                  href={booking.prescription_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-white px-5 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Open
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Prescribed Products - Only show for completed consultations */}
        {booking.status === 'completed' && booking.service_type === 'consultation' && prescriptionProducts.length > 0 && (
          <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight font-display">Prescribed Products</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  {prescriptionProducts.length} {prescriptionProducts.length === 1 ? 'Product' : 'Products'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddAllToCart}
                  disabled={!userId || loadingProducts}
                  className="bg-primary text-white px-5 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                  Add All
                </button>
                {onCartClick && Object.keys(cartQuantities).length > 0 && (
                  <button
                    onClick={onCartClick}
                    className="bg-emerald-500 text-white px-5 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                    Cart ({Object.keys(cartQuantities).length})
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {prescriptionProducts.map((prescProduct) => (
                <div key={prescProduct.id} className="bg-gray-50 rounded-[28px] p-5 border border-gray-100">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    {prescProduct.product?.image_url && (
                      <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-white shadow-sm shrink-0">
                        <img
                          src={prescProduct.product.image_url}
                          alt={prescProduct.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-gray-900 leading-tight mb-1 truncate">
                            {prescProduct.product?.name || 'Product'}
                          </h4>
                          {prescProduct.product?.category && (
                            <p className="text-[9px] text-primary font-black uppercase tracking-widest">
                              {prescProduct.product.category}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-black text-gray-900">
                            ₹{prescProduct.product?.price ? (prescProduct.product.price * prescProduct.quantity).toFixed(2) : '0.00'}
                          </p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                            Qty: {prescProduct.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Dosage Instructions */}
                      {prescProduct.dosage_instructions && (
                        <div className="bg-white rounded-2xl p-3 mb-3 border border-gray-100">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">
                            Dosage Instructions
                          </p>
                          <p className="text-[11px] text-gray-700 font-semibold leading-relaxed">
                            {prescProduct.dosage_instructions}
                          </p>
                          {prescProduct.duration_days && (
                            <p className="text-[10px] text-primary font-bold mt-2">
                              Duration: {prescProduct.duration_days} days
                            </p>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {prescProduct.notes && (
                        <div className="bg-amber-50 rounded-2xl p-3 mb-3 border border-amber-100">
                          <p className="text-[9px] text-amber-600 font-black uppercase tracking-[0.2em] mb-1">
                            Note from Doctor
                          </p>
                          <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                            {prescProduct.notes}
                          </p>
                        </div>
                      )}

                      {/* Add to Cart Button or Quantity Updater */}
                      {cartQuantities[prescProduct.product_id] > 0 ? (
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-[18px] p-3 flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                            In Cart
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleDecreaseQuantity(prescProduct)}
                              disabled={!userId}
                              className="w-8 h-8 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                            <span className="text-base font-black text-emerald-700 min-w-[24px] text-center">
                              {cartQuantities[prescProduct.product_id]}
                            </span>
                            <button
                              onClick={() => handleIncreaseQuantity(prescProduct)}
                              disabled={!userId}
                              className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[18px]">add</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(prescProduct)}
                          disabled={!userId || addingToCart[prescProduct.id]}
                          className="w-full bg-primary/10 text-primary py-3 rounded-[18px] text-[11px] font-black uppercase tracking-wider border border-primary/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {addingToCart[prescProduct.id] ? 'hourglass_empty' : 'add_shopping_cart'}
                          </span>
                          {addingToCart[prescProduct.id] ? 'Adding...' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Rating - Only show for completed consultations */}
        {booking.status === 'completed' && booking.service_type === 'consultation' && doctor && (
          <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight font-display">Rate Your Experience</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  With Dr. {doctor.full_name}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-md">
                <img
                  src={doctor.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.full_name)}&size=200&background=random`}
                  alt={doctor.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {hasRated ? (
              <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                  <p className="text-sm font-black text-emerald-700">Thank you for your feedback!</p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`material-symbols-outlined text-2xl ${
                        star <= userRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                      }`}
                    >
                      star
                    </span>
                  ))}
                  <span className="text-sm font-black text-gray-700 ml-2">{userRating}/5</span>
                </div>
                {reviewText && (
                  <p className="text-xs text-gray-600 mt-3 italic">&quot;{reviewText}&quot;</p>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Star Rating */}
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-3">
                    Your Rating
                  </p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setUserRating(star)}
                        className="transition-transform active:scale-110 hover:scale-125"
                      >
                        <span
                          className={`material-symbols-outlined text-4xl ${
                            star <= (hoverRating || userRating)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        >
                          star
                        </span>
                      </button>
                    ))}
                    {userRating > 0 && (
                      <span className="text-lg font-black text-gray-700 ml-3">{userRating}/5</span>
                    )}
                  </div>
                </div>

                {/* Review Text (Optional) */}
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-3">
                    Your Review (Optional)
                  </p>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    placeholder="Share your experience with the doctor..."
                    className="w-full appearance-none rounded-2xl bg-gray-50 border-0 p-4 text-sm text-gray-900 font-medium shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary placeholder:text-gray-400 transition-all outline-none resize-none"
                    maxLength={500}
                  />
                  <p className="text-[9px] text-gray-400 mt-2 text-right">
                    {reviewText.length}/500
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitRating}
                  disabled={userRating === 0 || submittingRating}
                  className="w-full bg-primary hover:bg-[#013d63] text-white font-black py-4 rounded-[20px] shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingRating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      Submit Rating
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <section className=" mb-40 pb-12">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Payment Details</h3>
              </div>
              <span className={`px-5 py-2 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border ${booking.payment_status === 'paid'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : booking.payment_status === 'cod'
                ? 'bg-blue-50 text-blue-600 border-blue-100'
                : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                {booking.payment_status === 'paid' ? 'Paid' : booking.payment_status === 'cod' ? 'Cash on Delivery' : 'Pending'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Service Fee */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                  Service Fee {booking.service_type === 'consultation' ? '(Doctor)' : ''}
                </span>
                <span className="text-gray-900 font-black">
                  ₹{(booking.service_fee || booking.payment_amount || 0).toFixed(2)}
                </span>
              </div>

              {/* Platform Fee */}
              {booking.platform_fee && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                    Tax & Handling (Platform Fee)
                  </span>
                  <span className="text-gray-900 font-black">₹{booking.platform_fee.toFixed(2)}</span>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-gray-100"></div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-black text-gray-900">Total Amount</span>
                <span className="text-2xl font-black text-primary tracking-tighter">
                  ₹{(booking.total_amount || booking.payment_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-gray-100 p-6 pb-10 space-y-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {booking.status === 'completed' ? (
          <div className="flex items-center justify-center gap-3 py-5 bg-emerald-50 border-2 border-emerald-200 rounded-[28px]">
            <span className="material-symbols-outlined text-emerald-600 text-2xl fill-current">check_circle</span>
            <span className="text-emerald-700 font-black text-lg uppercase tracking-wider">Booking Completed</span>
          </div>
        ) : booking.status === 'cancelled' ? (
          <div className="flex items-center justify-center gap-3 py-5 bg-red-50 border-2 border-red-200 rounded-[28px]">
            <span className="material-symbols-outlined text-red-600 text-2xl">cancel</span>
            <span className="text-red-700 font-black text-lg uppercase tracking-wider">Booking Cancelled</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button className="w-full py-5 bg-primary text-white font-black text-base rounded-[28px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined font-black">edit_calendar</span>
              Reschedule
            </button>
            <button className="w-full py-5 bg-transparent text-gray-400 font-black text-base rounded-[28px] border border-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined font-black text-[22px]">cancel</span>
              Cancel Booking
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default BookingDetails;
