import { supabase } from '../lib/supabase';

// Grooming Store Auth Services
export const groomingStoreAuthService = {
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Verify this is a grooming store account
    if (data.user) {
      const storeProfile = await this.getGroomingStoreProfile(data.user.id);
      if (!storeProfile) {
        // Sign out if not a grooming store account
        await supabase.auth.signOut();
        throw new Error('This account is not registered as a grooming store.');
      }

      // Return data with store profile - let UI handle approval status display
      return { ...data, storeProfile };
    }

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

  async getGroomingStoreProfile(userId: string) {
    const { data, error } = await supabase
      .from('grooming_stores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createGroomingStoreProfile(userId: string, storeData: {
    store_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const { data, error } = await supabase
      .from('grooming_stores')
      .insert({
        user_id: userId,
        store_name: storeData.store_name,
        email: storeData.email,
        phone: storeData.phone || null,
        address: storeData.address || null,
        city: storeData.city || null,
        state: storeData.state || null,
        pincode: storeData.pincode || null,
        latitude: storeData.latitude || null,
        longitude: storeData.longitude || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGroomingStoreProfile(storeId: string, updates: {
    store_name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const { data, error } = await supabase
      .from('grooming_stores')
      .update(updates)
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Grooming Store Booking Services
export const groomingStoreBookingService = {
  async getStoreBookings(storeId: string, filters?: {
    status?: 'pending' | 'upcoming' | 'completed' | 'cancelled';
    booking_type?: 'home' | 'clinic';
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        pets (*),
        addresses (*),
        grooming_packages:grooming_package_id (*),
        users:user_id (id, name, email, phone)
      `)
      .eq('grooming_store_id', storeId)
      .eq('service_type', 'grooming')
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.booking_type) {
      query = query.eq('booking_type', filters.booking_type);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getBookingById(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pets (*),
        addresses (*),
        grooming_packages:grooming_package_id (*),
        users:user_id (id, name, email, phone)
      `)
      .eq('id', bookingId)
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

  async getBookingStats(storeId: string) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('status, booking_type, payment_amount')
      .eq('grooming_store_id', storeId)
      .eq('service_type', 'grooming');

    if (error) throw error;

    const stats = {
      total: bookings?.length || 0,
      pending: bookings?.filter(b => b.status === 'pending').length || 0,
      upcoming: bookings?.filter(b => b.status === 'upcoming').length || 0,
      completed: bookings?.filter(b => b.status === 'completed').length || 0,
      cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      home_visits: bookings?.filter(b => b.booking_type === 'home').length || 0,
      clinic_visits: bookings?.filter(b => b.booking_type === 'clinic').length || 0,
      total_revenue: bookings?.reduce((sum, b) => sum + (b.payment_amount || 0), 0) || 0,
    };

    return stats;
  }
};

// Grooming Store Package Management
export const groomingStorePackageService = {
  async getStorePackages(storeId: string) {
    const { data, error } = await supabase
      .from('grooming_packages')
      .select('*')
      .eq('grooming_store_id', storeId)
      .order('price', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getAllActiveStores() {
    const { data, error } = await supabase
      .from('grooming_stores')
      .select('*')
      .eq('is_active', true)
      .order('store_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getStorePackagesByStoreId(storeId: string) {
    const { data, error } = await supabase
      .from('grooming_packages')
      .select('*')
      .eq('grooming_store_id', storeId)
      .order('price', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createPackage(storeId: string, packageData: {
    name: string;
    description: string;
    price: number;
    package_type: 'basic' | 'full' | 'luxury';
    duration_minutes: number;
  }) {
    const { data, error } = await supabase
      .from('grooming_packages')
      .insert({
        grooming_store_id: storeId,
        name: packageData.name,
        description: packageData.description,
        price: packageData.price,
        package_type: packageData.package_type,
        duration_minutes: packageData.duration_minutes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePackage(packageId: string, updates: {
    name?: string;
    description?: string;
    price?: number;
    duration_minutes?: number;
  }) {
    const { data, error } = await supabase
      .from('grooming_packages')
      .update(updates)
      .eq('id', packageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePackage(packageId: string) {
    const { error } = await supabase
      .from('grooming_packages')
      .delete()
      .eq('id', packageId);

    if (error) throw error;
  }
};

// Grooming Store Time Slot Management
export const groomingStoreTimeSlotService = {
  async getStoreTimeSlots(storeId: string) {
    const { data, error } = await supabase
      .from('grooming_time_slots')
      .select('*')
      .eq('grooming_store_id', storeId)
      .order('time_slot', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createTimeSlot(storeId: string, timeSlot: string, isActive: boolean = true, weekdays: number[] = [0,1,2,3,4,5,6]) {
    const { data, error } = await supabase
      .from('grooming_time_slots')
      .insert({
        grooming_store_id: storeId,
        time_slot: timeSlot,
        is_active: isActive,
        weekdays: weekdays,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTimeSlot(slotId: string, updates: {
    time_slot?: string;
    is_active?: boolean;
    weekdays?: number[];
  }) {
    const { data, error } = await supabase
      .from('grooming_time_slots')
      .update(updates)
      .eq('id', slotId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTimeSlot(slotId: string) {
    const { error } = await supabase
      .from('grooming_time_slots')
      .delete()
      .eq('id', slotId);

    if (error) throw error;
  },

  async getAvailableTimeSlots(storeId: string, date: string) {
    // Get all active time slots for the store
    const { data: timeSlots, error: slotsError } = await supabase
      .from('grooming_time_slots')
      .select('time_slot, weekdays')
      .eq('grooming_store_id', storeId)
      .eq('is_active', true)
      .order('time_slot', { ascending: true });

    if (slotsError) throw slotsError;

    // Get the day of week for the selected date (0=Sunday, 1=Monday, ..., 6=Saturday)
    // Parse date string properly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const dayOfWeek = selectedDate.getDay();

    console.log('[getAvailableTimeSlots] Date:', date, 'Day of week:', dayOfWeek, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]);

    // Filter time slots by weekday availability
    const slotsForDay = timeSlots?.filter(slot => {
      if (!slot.weekdays || slot.weekdays.length === 0) {
        // If no weekdays specified, available all days
        console.log('[getAvailableTimeSlots] Slot', slot.time_slot, 'has no weekdays restriction - including');
        return true;
      }
      const isAvailable = slot.weekdays.includes(dayOfWeek);
      console.log('[getAvailableTimeSlots] Slot', slot.time_slot, 'weekdays:', slot.weekdays, 'includes', dayOfWeek, '?', isAvailable);
      return isAvailable;
    }) || [];

    console.log('[getAvailableTimeSlots] Total slots:', timeSlots?.length, 'Slots for', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek], ':', slotsForDay.length);

    // Get booked time slots for the specific date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('time')
      .eq('grooming_store_id', storeId)
      .eq('date', date)
      .in('status', ['pending', 'upcoming']);

    if (bookingsError) throw bookingsError;

    // Filter out booked time slots
    const bookedTimes = new Set(bookings?.map(b => b.time) || []);
    const availableSlots = slotsForDay.filter(slot => !bookedTimes.has(slot.time_slot));

    return availableSlots.map(slot => slot.time_slot);
  }
};

// Grooming Store Earnings
export const groomingStoreEarningsService = {
  async getStoreEarnings(storeId: string, filters?: {
    status?: 'pending' | 'paid' | 'cancelled';
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase
      .from('grooming_store_earnings')
      .select(`
        *,
        bookings (
          id,
          date,
          time,
          booking_type,
          pets (name, species)
        )
      `)
      .eq('grooming_store_id', storeId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getEarningsStats(storeId: string) {
    const { data: earnings, error } = await supabase
      .from('grooming_store_earnings')
      .select('status, net_amount, platform_commission')
      .eq('grooming_store_id', storeId);

    if (error) throw error;

    const stats = {
      total_earnings: earnings?.reduce((sum, e) => sum + (e.net_amount || 0), 0) || 0,
      pending_earnings: earnings?.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.net_amount || 0), 0) || 0,
      paid_earnings: earnings?.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.net_amount || 0), 0) || 0,
      platform_commission: earnings?.reduce((sum, e) => sum + (e.platform_commission || 0), 0) || 0,
    };

    return stats;
  }
};
