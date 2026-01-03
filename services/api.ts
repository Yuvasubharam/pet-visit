import { supabase } from '../lib/supabase';
import type { Pet, Address } from '../types';

// Auth Services
export const authService = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signUpWithPhone(phone: string, name: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        phone,
        name,
      });
    }

    return data;
  },

  async verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async createOrUpdateUserProfile(userId: string, userData: { name: string; email?: string; phone?: string; profile_photo_url?: string }) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        name: userData.name,
        email: userData.email || null,
        phone: userData.phone || '',
        profile_photo_url: userData.profile_photo_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadProfilePhoto(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    // Update user profile with photo URL
    await supabase
      .from('users')
      .update({ profile_photo_url: publicUrl })
      .eq('id', userId);

    return publicUrl;
  },

  async deleteProfilePhoto(userId: string) {
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([`${userId}/profile.jpg`, `${userId}/profile.png`, `${userId}/profile.jpeg`]);

    if (error) throw error;

    // Remove URL from user profile
    await supabase
      .from('users')
      .update({ profile_photo_url: null })
      .eq('id', userId);
  }
};

// Pet Services
export const petService = {
  async getUserPets(userId: string) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addPet(userId: string, pet: Omit<Pet, 'id'>) {
    const { data, error } = await supabase
      .from('pets')
      .insert({
        user_id: userId,
        name: pet.name,
        species: pet.species,
        image: pet.image,
        breed: pet.breed || null,
        age: pet.age || null,
        weight: pet.weight || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePet(petId: string, updates: Partial<Pet>) {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.species !== undefined) updateData.species = updates.species;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.breed !== undefined) updateData.breed = updates.breed || null;
    if (updates.age !== undefined) updateData.age = updates.age || null;
    if (updates.weight !== undefined) updateData.weight = updates.weight || null;

    const { data, error } = await supabase
      .from('pets')
      .update(updateData)
      .eq('id', petId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePet(petId: string) {
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', petId);

    if (error) throw error;
  }
};

// Address Services
export const addressService = {
  async getUserAddresses(userId: string) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addAddress(userId: string, address: Omit<Address, 'id'>) {
    console.log('Address service: Adding address for user', userId);
    console.log('Address data:', address);

    const insertData = {
      user_id: userId,
      type: address.type,
      flat_number: address.flatNumber,
      street: address.street,
      landmark: address.landmark || '', // Ensure landmark is never undefined/null
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      latitude: address.latitude || null,
      longitude: address.longitude || null,
      full_address: address.fullAddress || null,
    };

    console.log('Insert data to Supabase:', insertData);

    const { data, error } = await supabase
      .from('addresses')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error adding address:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('Address added successfully:', data);
    return data;
  },

  async updateAddress(addressId: string, updates: Partial<Address>) {
    const updateData: any = {};

    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.flatNumber !== undefined) updateData.flat_number = updates.flatNumber;
    if (updates.street !== undefined) updateData.street = updates.street;
    if (updates.landmark !== undefined) updateData.landmark = updates.landmark || '';
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.pincode !== undefined) updateData.pincode = updates.pincode;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude || null;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude || null;
    if (updates.fullAddress !== undefined) updateData.full_address = updates.fullAddress || null;

    const { data, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      console.error('Error updating address:', error);
      throw error;
    }
    return data;
  },

  async deleteAddress(addressId: string) {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);

    if (error) throw error;
  }
};

// Booking Services
export const bookingService = {
  async getUserBookings(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pets (*),
        addresses (*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createBooking(bookingData: {
    userId: string;
    petId: string;
    serviceType: string;
    bookingType: 'online' | 'home' | 'clinic';
    date: string;
    time: string;
    addressId?: string;
    notes?: string;
    paymentAmount?: number;
    doctorId?: string;  // Add optional doctor ID
  }) {
    const insertData: any = {
      user_id: bookingData.userId,
      pet_id: bookingData.petId,
      service_type: bookingData.serviceType,
      booking_type: bookingData.bookingType,
      date: bookingData.date,
      time: bookingData.time,
      address_id: bookingData.addressId,
      notes: bookingData.notes,
      payment_amount: bookingData.paymentAmount,
      status: 'upcoming',
      payment_status: 'pending',
    };

    // Add doctor_id if provided (for pre-selected doctor bookings)
    if (bookingData.doctorId) {
      insertData.doctor_id = bookingData.doctorId;
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBookingStatus(bookingId: string, status: 'upcoming' | 'completed' | 'cancelled') {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePaymentStatus(bookingId: string, paymentStatus: 'pending' | 'paid' | 'failed') {
    const { data, error } = await supabase
      .from('bookings')
      .update({ payment_status: paymentStatus })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Consultation Services
export const consultationService = {
  async createConsultationBooking(bookingData: {
    userId: string;
    petId: string;
    bookingType: 'online' | 'home' | 'clinic';
    date: string;
    time: string;
    addressId?: string;
    doctorId?: string;
    doctorName?: string;
    notes?: string;
    paymentAmount: number;
  }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: bookingData.userId,
        pet_id: bookingData.petId,
        service_type: 'consultation',
        booking_type: bookingData.bookingType,
        date: bookingData.date,
        time: bookingData.time,
        address_id: bookingData.addressId,
        doctor_id: bookingData.doctorId || null,
        doctor_name: bookingData.doctorName,
        notes: bookingData.notes,
        payment_amount: bookingData.paymentAmount,
        status: bookingData.doctorId ? 'pending' : 'upcoming',
        payment_status: 'pending',
      })
      .select(`
        *,
        pets (*),
        addresses (*)
      `)
      .single();

    if (error) {
      console.error('Error creating consultation booking:', error);
      throw error;
    }
    return data;
  },

  async getUserConsultationBookings(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pets (*),
        addresses (*),
        doctors (
          full_name,
          clinic_name,
          clinic_address,
          clinic_latitude,
          clinic_longitude,
          profile_photo_url,
          specialization
        )
      `)
      .eq('user_id', userId)
      .eq('service_type', 'consultation')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching consultation bookings:', error);
      throw error;
    }
    return data;
  }
};

// Grooming Services
export const groomingService = {
  async getPackages() {
    const { data, error } = await supabase
      .from('grooming_packages')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getPackageById(packageId: string) {
    const { data, error } = await supabase
      .from('grooming_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (error) throw error;
    return data;
  },

  async createGroomingBooking(bookingData: {
    userId: string;
    petId: string;
    packageType: string;
    packageId: string;
    location: 'home' | 'clinic';
    contactNumber: string;
    date: string;
    time: string;
    addressId?: string;
    notes?: string;
    paymentAmount: number;
    groomingStoreId?: string;
  }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: bookingData.userId,
        pet_id: bookingData.petId,
        service_type: 'grooming',
        booking_type: bookingData.location,
        package_type: bookingData.packageType,
        grooming_package_id: bookingData.packageId,
        contact_number: bookingData.contactNumber,
        date: bookingData.date,
        time: bookingData.time,
        address_id: bookingData.addressId,
        notes: bookingData.notes,
        payment_amount: bookingData.paymentAmount,
        grooming_store_id: bookingData.groomingStoreId,
        status: 'upcoming',
        payment_status: 'pending',
      })
      .select(`
        *,
        pets (*),
        addresses (*),
        grooming_packages:grooming_package_id (*),
        grooming_stores:grooming_store_id (*)
      `)
      .single();

    if (error) {
      console.error('Error creating grooming booking:', error);
      throw error;
    }
    return data;
  },

  async getUserGroomingBookings(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pets (*),
        addresses (*),
        grooming_packages:grooming_package_id (*)
      `)
      .eq('user_id', userId)
      .eq('service_type', 'grooming')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching grooming bookings:', error);
      throw error;
    }
    return data;
  }
};

// Product Services
export const productService = {
  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProductsByCategory(category: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProduct(productId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data;
  }
};

// Cart Services
export const cartService = {
  async getCartItems(userId: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          name,
          brand,
          price,
          image,
          category
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching cart items:', error);
      throw error;
    }
    return data;
  },

  async addToCart(userId: string, productId: string, quantity: number = 1) {
    // Check if item already exists - use maybeSingle() to avoid 406 error when no rows exist
    const { data: existing, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    // Ignore PGRST116 error (no rows returned), but throw other errors
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Add new item
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async updateCartItemQuantity(cartItemId: string, quantity: number) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeFromCart(cartItemId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  },

  async clearCart(userId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
};

// Order Services
export const orderService = {
  async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        ),
        addresses (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        ),
        addresses (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  },

  async createOrder(orderData: {
    userId: string;
    addressId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    total: number;
  }) {
    // Generate order number
    const orderNumber = `TRX-${Math.floor(Math.random() * 900000 + 100000)}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.userId,
        order_number: orderNumber,
        address_id: orderData.addressId,
        subtotal: orderData.subtotal,
        delivery_fee: orderData.deliveryFee,
        tax: orderData.tax,
        discount: orderData.discount,
        total: orderData.total,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Clear cart
    await cartService.clearCart(orderData.userId);

    return order;
  },

  async updateOrderStatus(orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'failed') {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
