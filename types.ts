
export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  image: string;
  breed?: string;
  age?: number;
  weight?: number;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Address {
  id?: string;
  type: 'Home' | 'Office' | 'Other';
  flatNumber: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description?: string;
  price: number;
  category: string;
  image: string;
  stock?: number;
  rating?: number;
  pet?: 'all' | 'dog' | 'cat' | 'rabbits' | 'turtles' | 'birds' | 'other';
  main_category?: 'food' | 'toys' | 'care' | 'medicine';
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  addressId: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  estimatedDelivery?: string;
  createdAt?: string;
  address?: Address;
  orderItems?: OrderItem[];
}

export interface GroomingPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  package_type: 'basic' | 'full' | 'luxury';
  duration_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  pet_id: string;
  service_type: string;
  booking_type: 'online' | 'home' | 'clinic';
  package_type?: string;
  grooming_package_id?: string;
  contact_number?: string;
  date: string;
  time: string;
  address_id?: string;
  doctor_id?: string;
  notes?: string;
  payment_amount?: number;
  service_fee?: number; // Fee paid to doctor
  platform_fee?: number; // Platform's 5% margin (Tax & Handling)
  total_amount?: number; // Total user pays (service_fee + platform_fee)
  status: 'pending' | 'upcoming' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  prescription_url?: string;
  medical_notes?: string;
  created_at?: string;
  pets?: Pet;
  addresses?: Address;
  grooming_packages?: GroomingPackage;
}

export interface Doctor {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  clinic_address?: string;
  clinic_latitude?: number | null;
  clinic_longitude?: number | null;
  profile_photo_url?: string;
  credentials_url?: string;
  is_verified: boolean;
  is_active: boolean;
  rating: number;
  total_consultations: number;
  total_earnings: number;
  created_at?: string;
  updated_at?: string;
  clinic_name?: string;
  approval?: 'pending' | 'approved' | 'rejected';
  status?: string;
  fee_online_video?: number;
  fee_online_chat?: number;
  fee_home_visit?: number;
  fee_clinic_visit?: number;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_type: 'clinic' | 'home' | 'online';
  capacity: number;
  booked_count: number;
  is_active: boolean;
  weekday?: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  created_at?: string;
  updated_at?: string;
}

export interface DoctorEarning {
  id: string;
  doctor_id: string;
  booking_id: string;
  amount: number;
  commission: number;
  net_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  created_at?: string;
}

export interface DoctorReview {
  id: string;
  doctor_id: string;
  user_id: string;
  booking_id: string;
  rating: number;
  review_text?: string;
  created_at?: string;
}

export interface PrescriptionProduct {
  id: string;
  booking_id: string;
  doctor_id: string;
  product_id: string;
  quantity: number;
  dosage_instructions?: string;
  duration_days?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  product?: Product;
}

export type AppView =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'login-otp'
  | 'pet-selection'
  | 'add-pet'
  | 'edit-pet'
  | 'home'
  | 'grooming'
  | 'shop'
  | 'bookings-overview'
  | 'booking-details'
  | 'online-consult-booking'
  | 'home-consult-booking'
  | 'checkout'
  | 'confirmation-online'
  | 'confirmation-home'
  | 'confirmation-clinic'
  | 'payment-failure'
  | 'waiting-room'
  | 'live-consultation'
  | 'profile'
  | 'personal-information'
  | 'my-pets'
  | 'address-management'
  | 'shopping-cart'
  | 'checkout-shop'
  | 'order-confirmation'
  | 'orders-history'
  | 'order-details-page'
  | 'doctor-login'
  | 'doctor-register'
  | 'doctor-dashboard'
  | 'doctor-profile-setup'
  | 'doctor-availability'
  | 'doctor-fee-management'
  | 'doctor-consultations'
  | 'doctor-consultation-details'
  | 'grooming-store-login'
  | 'grooming-store-register'
  | 'grooming-store-dashboard'
  | 'grooming-store-bookings'
  | 'grooming-store-management';
