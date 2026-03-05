
export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  image: string;
  breed?: string;
  age?: number;
  weight?: number;
  date_of_birth?: string;
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
  pet_types?: string[]; // For shop_products with multiple pet types
  main_category?: 'food' | 'toys' | 'care' | 'medicine';
  seller_id?: string;
  seller_type?: 'admin' | 'store_manager' | 'grooming_store' | 'doctor';
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
  seller_id?: string;
  seller_type?: 'grooming_store' | 'doctor' | 'admin' | 'store_manager';
  admin_margin_amount?: number;
  fulfillment_status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
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

export interface GroomingTimeSlot {
  id: string;
  grooming_store_id: string;
  time_slot: string;
  is_active: boolean;
  weekdays?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
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

export interface GroomingStore {
  id: string;
  user_id?: string;
  store_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  license_url?: string;
  margin_percentage: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoreManager {
  id: string;
  user_id?: string;
  store_name: string;
  email: string;
  phone?: string;
  license_url?: string;
  margin_percentage: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  approval_status?: 'pending' | 'approved' | 'rejected'; // For consistency
  margin_percentage?: number;
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

// =====================================================
// ADMIN TYPES
// =====================================================

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  is_active: boolean;
  profile_photo?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  permissions?: string[];
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: 'user' | 'doctor' | 'grooming_store' | 'store_manager' | 'booking' | 'order' | 'admin';
  target_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at?: string;
  admin_users?: AdminUser;
}

export interface UserReport {
  id: string;
  reported_user_id: string;
  reporter_id?: string;
  reporter_type: 'user' | 'doctor' | 'admin';
  reason: string;
  description?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolution_notes?: string;
  created_at?: string;
  resolved_at?: string;
  users?: {
    id: string;
    name: string;
    email: string;
    profile_photo?: string;
  };
}

export interface DoctorVerificationRequest {
  id: string;
  doctor_id: string;
  credentials_url: string;
  license_number?: string;
  experience_years?: number;
  education?: Record<string, any>;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_notes?: string;
  created_at?: string;
  reviewed_at?: string;
  doctors?: Doctor;
}

export interface PlatformAnalytics {
  id: string;
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_doctors: number;
  active_doctors: number;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  platform_revenue: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile_photo?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  suspension_reason?: string;
  suspended_at?: string;
  suspended_by?: string;
  created_at?: string;
  updated_at?: string;
  pets?: Pet[];
  addresses?: Address[];
  bookings?: Booking[];
  orders?: Order[];
}

export interface AdminDashboardStats {
  userStats: {
    total: number;
    active: number;
    suspended: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  doctorStats: {
    total: number;
    active: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
    newToday: number;
  };
  bookingStats: {
    total: number;
    pending: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    todayBookings: number;
    totalRevenue: number;
    platformRevenue: number;
  };
  revenueStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    platformFeeToday: number;
    platformFeeThisMonth: number;
  };
}

// =====================================================
// SHOP PRODUCT MANAGEMENT TYPES (Admin Dashboard)
// =====================================================

export interface ShopProduct {
  id: string;
  name: string;
  description?: string;
  category: string;
  base_price: number;
  sale_price?: number;
  has_attribute_pricing?: boolean;
  stock_quantity: number;
  sku?: string;
  images?: string[];
  main_image?: string;
  is_active: boolean;
  is_grouped: boolean;
  pet_types?: string[]; // Multiple pet types this product is for
  seller_id?: string;
  seller_type?: 'admin' | 'store_manager' | 'grooming_store' | 'doctor';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Related data when loaded with joins
  variations?: ProductVariation[];
  attributes?: ProductAttribute[];
}

export interface ProductVariation {
  id: string;
  product_id: string;
  variation_name: string;
  variation_value: string;
  price_adjustment: number; // Legacy field - kept for backward compatibility
  base_price?: number; // MRP for this variation
  sale_price?: number | null; // Discounted price
  purchase_price?: number | null; // Cost price for margin tracking
  stock_quantity: number;
  sku?: string;
  image?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  attribute_name: string;
  attribute_values: string[];
  created_at?: string;
}

export interface GroupedProduct {
  id: string;
  name: string;
  description?: string;
  final_price: number;
  discount_percentage?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedProductItem {
  id: string;
  grouped_product_id: string;
  product_id: string;
  quantity: number;
  product?: ShopProduct;
}

export interface BulkImportResult {
  total_rows: number;
  successful: number;
  failed: number;
  errors: BulkImportError[];
}

export interface BulkImportError {
  row: number;
  field: string;
  value: string;
  error: string;
}

export type AppView =
  | 'splash'
  | 'onboarding'
  | 'register'
  | 'set-password'
  | 'login'
  | 'login-otp'
  | 'unified-login-user'
  | 'unified-login-doctor'
  | 'unified-login-grooming-store'
  | 'unified-login-admin'
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
  | 'grooming-store-management'
  | 'store-manager-dashboard'
  | 'order-management-seller'
  | 'order-management-admin'
  | 'seller-approvals'
  | 'reschedule-confirmation'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-customers'
  | 'admin-customer-details'
  | 'admin-users-management'
  | 'admin-doctors-management'
  | 'admin-shop-products'
  | 'admin-create-product'
  | 'admin-edit-product'
  | 'admin-create-grouped-product'
  | 'admin-product-variations'
  | 'admin-notifications'
  | 'admin-bulk-import'
  | 'admin-seller-approvals'
  | 'admin-order-management'
  | 'admin-margin-management'
  | 'admin-settlements';
