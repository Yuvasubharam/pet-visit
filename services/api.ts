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

  async signUpWithEmail(email: string, password: string, name: string) {
    // First, check if an account with this email already exists
    const existingProfile = await this.checkEmailExists(email);

    if (existingProfile) {
      // Account exists - check if it has a password set
      const hasPassword = await this.checkUserHasPassword(email);

      if (!hasPassword) {
        // OAuth account without password - return special error
        throw new Error('OAUTH_NO_PASSWORD');
      } else {
        // Account exists with password - user should login instead
        throw new Error('An account with this email already exists. Please login instead.');
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          full_name: name,
        },
      },
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email,
        name,
      });
    }

    return data;
  },

  async checkEmailExists(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is fine
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error checking email:', err);
      return null;
    }
  },

  async checkUserHasPassword(email: string) {
    try {
      // Try to sign in with a dummy password to check if password auth is enabled
      // This is a workaround since Supabase doesn't expose password status directly
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: '__CHECK_PASSWORD_EXISTS__', // Dummy password
      });

      if (error) {
        // If error is "Invalid login credentials", password exists
        // If error is "Email not confirmed" or similar, password exists
        // If error is "User not found" or "No password set", password doesn't exist
        if (error.message.includes('Invalid login credentials')) {
          return true; // Password exists (just wrong password)
        }
        // For OAuth users, Supabase returns "Invalid login credentials" anyway
        // So we need a different approach - check user metadata
        return false;
      }

      return true; // Successful login (shouldn't happen with dummy password)
    } catch (err) {
      console.error('Error checking password:', err);
      return false;
    }
  },

  async setPasswordForOAuthUser(email: string, password: string) {
    try {
      // Use Supabase Admin API to update user password
      // First get the current user by email
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.email !== email) {
        throw new Error('User not authenticated or email mismatch');
      }

      // Update password using updateUser and mark password as set in metadata
      const { data, error } = await supabase.auth.updateUser({
        password: password,
        data: {
          ...user.user_metadata,
          password_set: true
        }
      });

      if (error) {
        // If the error is that the new password is the same as old, it means password is already set
        if (error.message.includes('New password should be different from the old password')) {
          console.log('Password already set to this value, just updating metadata');
          // Update only the metadata
          const { data: metadataData, error: metadataError } = await supabase.auth.updateUser({
            data: {
              ...user.user_metadata,
              password_set: true
            }
          });
          if (metadataError) throw metadataError;
          return metadataData;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error setting password:', err);
      throw err;
    }
  },

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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

  async createOrUpdateUserProfile(userId: string, userData: { name: string; email?: string; phone?: string; profile_photo_url?: string; role?: string }) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        name: userData.name,
        email: userData.email || null,
        phone: userData.phone || null, // Changed from '' to null to avoid unique constraint violation
        profile_photo_url: userData.profile_photo_url || null,
        role: userData.role || 'user', // Default to 'user' role
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
        date_of_birth: pet.date_of_birth || null,
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
    if (updates.date_of_birth !== undefined) updateData.date_of_birth = updates.date_of_birth || null;

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
  },

  async rescheduleBooking(bookingId: string, newDate: string, newTime: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        date: newDate,
        time: newTime,
        status: 'upcoming' // Reset status to upcoming
      })
      .eq('id', bookingId)
      .select('*, pets(*), addresses(*), users(*), doctors(*), grooming_stores(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async cancelBooking(bookingId: string) {
    // First, get the booking to check creation time
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('created_at')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;
    if (!booking) throw new Error('Booking not found');

    // Calculate time difference in hours
    const createdAt = new Date((booking as any).created_at);
    const now = new Date();
    const hoursDifference = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // If booking was created within 3 hours, delete it
    if (hoursDifference <= 3) {
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) throw deleteError;
      return { deleted: true, message: 'Booking cancelled and deleted successfully' };
    } else {
      // Otherwise, just update status to cancelled
      const { data, error: updateError } = await (supabase as any)
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) throw updateError;
      return { deleted: false, message: 'Booking cancelled successfully', data };
    }
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
  },

  async rescheduleGroomingBooking(bookingId: string, newDate: string, newTime: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        date: newDate,
        time: newTime,
        status: 'upcoming'
      })
      .eq('id', bookingId)
      .select(`
        *,
        pets (*),
        addresses (*),
        grooming_packages:grooming_package_id (*),
        grooming_stores:grooming_store_id (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }
};

// Product Services
export const productService = {
  async getAllProducts() {
    try {
      const { data: shopProducts, error: shopError } = await supabase
        .from('shop_products')
        .select(`
          id,
          name,
          description,
          category,
          base_price,
          sale_price,
          stock_quantity,
          main_image,
          pet_types,
          product_variations (id, sale_price, price_adjustment)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (shopError && shopError.code !== 'PGRST116') throw shopError;

      return (shopProducts || []).map((p: any) => {
        const hasVariations = p.product_variations && p.product_variations.length > 0;
        let displayPrice = p.base_price;
        let displaySalePrice = p.sale_price;

        if (hasVariations) {
          // Find minimum price among variations
          const prices = p.product_variations.map((v: any) => {
            if (v.sale_price && v.sale_price > 0) return v.sale_price;
            return p.base_price + (v.price_adjustment || 0);
          });
          displayPrice = Math.min(...prices);
          displaySalePrice = undefined; // Don't show sale badge if it's "Starting from"
        }

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          price: displayPrice,
          sale_price: displaySalePrice,
          stock: p.stock_quantity,
          image: p.main_image,
          pet_types: p.pet_types,
          seller_type: 'admin',
          brand: 'Shop',
          has_variations: hasVariations
        };
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async getProductsByCategory(category: string) {
    try {
      const { data: shopProducts, error: shopError } = await supabase
        .from('shop_products')
        .select(`
          id,
          name,
          description,
          category,
          base_price,
          sale_price,
          stock_quantity,
          main_image,
          pet_types,
          product_variations (id, sale_price, price_adjustment)
        `)
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (shopError && shopError.code !== 'PGRST116') throw shopError;

      return (shopProducts || []).map((p: any) => {
        const hasVariations = p.product_variations && p.product_variations.length > 0;
        let displayPrice = p.base_price;
        let displaySalePrice = p.sale_price;

        if (hasVariations) {
          // Find minimum price among variations
          const prices = p.product_variations.map((v: any) => {
            if (v.sale_price && v.sale_price > 0) return v.sale_price;
            return p.base_price + (v.price_adjustment || 0);
          });
          displayPrice = Math.min(...prices);
          displaySalePrice = undefined; // Don't show sale badge if it's "Starting from"
        }

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          price: displayPrice,
          sale_price: displaySalePrice,
          stock: p.stock_quantity,
          image: p.main_image,
          pet_types: p.pet_types,
          seller_type: 'admin',
          brand: 'Shop',
          has_variations: hasVariations
        };
      });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  },

  async getProduct(productId: string) {
    try {
      const { data, error } = await supabase
        .from('shop_products')
        .select(`
          id,
          name,
          description,
          category,
          base_price,
          sale_price,
          stock_quantity,
          main_image,
          pet_types
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.sale_price || data.base_price,
        stock: data.stock_quantity,
        image: data.main_image,
        pet_types: data.pet_types,
        seller_type: 'admin',
        brand: 'Shop'
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }
};

// Cart Services
export const cartService = {
  async getCartItems(userId: string) {
    // First try with variation_id support
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        shop_products (
          id,
          name,
          base_price,
          sale_price,
          main_image,
          category
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching cart items:', error);
      throw error;
    }

    // For items with variation_id, fetch variation details separately
    if (data && data.length > 0) {
      const itemsWithVariations = data.filter((item: any) => item.variation_id);
      if (itemsWithVariations.length > 0) {
        const variationIds = itemsWithVariations.map((item: any) => item.variation_id);
        const { data: variations } = await supabase
          .from('product_variations')
          .select('id, variation_name, variation_value, sale_price, price_adjustment')
          .in('id', variationIds);

        // Attach variations to items
        if (variations) {
          data.forEach((item: any) => {
            if (item.variation_id) {
              item.product_variations = variations.find((v: any) => v.id === item.variation_id);
            }
          });
        }
      }
    }

    return data;
  },

  async addToCart(userId: string, productId: string, quantity: number = 1, variationId?: string) {
    // Check if item already exists
    let query = supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId);

    // Check for matching variation if provided
    if (variationId) {
      query = query.eq('variation_id', variationId);
    } else {
      // For items without variation, check for null variation_id
      query = query.is('variation_id', null);
    }

    const { data: existingItems, error: checkError } = await query;

    // Ignore PGRST116 error (no rows returned), but throw other errors
    // Also ignore 42703 error (column doesn't exist) for backwards compatibility
    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== '42703') {
      throw checkError;
    }

    // Find existing item (handle case where variation_id column may not exist)
    const existing = existingItems?.find((item: any) => {
      if (variationId) {
        return item.variation_id === variationId;
      }
      return !item.variation_id;
    });

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
      const insertData: any = {
        user_id: userId,
        product_id: productId,
        quantity,
      };

      if (variationId) {
        insertData.variation_id = variationId;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .insert(insertData)
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
          shop_products (
            id,
            name,
            category,
            main_image,
            base_price,
            sale_price
          )
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
          shop_products (
            id,
            name,
            category,
            main_image,
            base_price,
            sale_price
          )
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
    marginPercentage?: number;
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
    // Note: seller_id can be added later when multi-seller is implemented
    const orderItems = orderData.items.map(item => {
      // Use provided margin or default to 10%
      const marginPct = orderData.marginPercentage !== undefined ? orderData.marginPercentage * 100 : 10.0;
      const adminMarginAmount = (item.price * item.quantity * marginPct) / 100;

      return {
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        admin_margin_amount: adminMarginAmount,
        fulfillment_status: 'pending'
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems as any);

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

// Notification Services
export const notificationService = {
  async createNotification(notificationData: {
    userId: string;
    bookingId?: string;
    type: string;
    title: string;
    message: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        booking_id: notificationData.bookingId || null,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAllAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (error) throw error;
    return data;
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  async clearAllNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
};
