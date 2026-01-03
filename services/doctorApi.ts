import { supabase } from '../lib/supabase';
import type { Doctor, DoctorAvailability, DoctorEarning, DoctorReview, PrescriptionProduct, Product } from '../types';

// Doctor Authentication & Profile Services
export const doctorAuthService = {
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signUpDoctor(email: string, password: string, doctorData: {
    full_name: string;
    phone: string;
    specialization: string;
    clinic_address?: string;
  }) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: 'doctor',
          full_name: doctorData.full_name,
        }
      }
    });

    if (authError) throw authError;

    // Create doctor profile
    if (authData.user) {
      const { data: doctor, error: profileError } = await supabase
        .from('doctors')
        .insert({
          user_id: authData.user.id,
          full_name: doctorData.full_name,
          email,
          phone: doctorData.phone,
          specialization: doctorData.specialization,
          clinic_address: doctorData.clinic_address,
        })
        .select()
        .single();

      if (profileError) throw profileError;
      return { auth: authData, doctor };
    }

    return { auth: authData, doctor: null };
  },

  async getDoctorProfile(userId: string) {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getDoctorById(doctorId: string) {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateDoctorProfile(doctorId: string, updates: Partial<Doctor>) {
    const updateData: any = {};

    if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.specialization !== undefined) updateData.specialization = updates.specialization;
    if (updates.clinic_address !== undefined) updateData.clinic_address = updates.clinic_address;
    if (updates.clinic_latitude !== undefined) updateData.clinic_latitude = updates.clinic_latitude;
    if (updates.clinic_longitude !== undefined) updateData.clinic_longitude = updates.clinic_longitude;
    if (updates.profile_photo_url !== undefined) updateData.profile_photo_url = updates.profile_photo_url;
    if (updates.credentials_url !== undefined) updateData.credentials_url = updates.credentials_url;

    // Fee fields
    if (updates.fee_online_video !== undefined) updateData.fee_online_video = updates.fee_online_video;
    if (updates.fee_online_chat !== undefined) updateData.fee_online_chat = updates.fee_online_chat;
    if (updates.fee_home_visit !== undefined) updateData.fee_home_visit = updates.fee_home_visit;
    if (updates.fee_clinic_visit !== undefined) updateData.fee_clinic_visit = updates.fee_clinic_visit;

    updateData.updated_at = new Date().toISOString();

    const { data, error} = await supabase
      .from('doctors')
      .update(updateData)
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadDoctorPhoto(doctorId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${doctorId}/profile.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('doctor-photos')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('doctor-photos')
      .getPublicUrl(fileName);

    // Update doctor profile with photo URL
    await supabase
      .from('doctors')
      .update({ profile_photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', doctorId);

    return publicUrl;
  },

  async uploadCredentials(doctorId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${doctorId}/credentials.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('doctor-credentials')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('doctor-credentials')
      .getPublicUrl(fileName);

    // Update doctor profile with credentials URL
    await supabase
      .from('doctors')
      .update({ credentials_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', doctorId);

    return publicUrl;
  },

  async getAllDoctors(filters?: { specialization?: string; is_verified?: boolean }) {
    let query = supabase
      .from('doctors')
      .select('*')
      .eq('is_active', true);

    if (filters?.specialization) {
      query = query.eq('specialization', filters.specialization);
    }

    if (filters?.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAvailableDoctors(params: {
    slot_type: 'clinic' | 'home' | 'online';
    date?: string;
  }) {
    const { slot_type, date } = params;
    const dateStr = date || new Date().toISOString().split('T')[0];

    console.log('[getAvailableDoctors] Fetching doctors for:', { slot_type, dateStr });

    // Get all active doctors
    // Note: We query for approval = 'approved' OR approval IS NULL to handle legacy data
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (doctorsError) {
      console.error('[getAvailableDoctors] Error fetching doctors:', doctorsError);
      throw doctorsError;
    }

    console.log('[getAvailableDoctors] Found doctors:', doctors?.length || 0);

    // Filter for approved doctors (or doctors without approval status for backward compatibility)
    const approvedDoctors = (doctors as Doctor[])?.filter((doc: Doctor) =>
      doc.approval === 'approved' || !doc.approval
    ) || [];

    console.log('[getAvailableDoctors] Approved doctors:', approvedDoctors.length);

    // Get availability for each doctor on the specified date and slot type
    // Note: We filter for booked_count < capacity to only show available slots
    const { data: availabilityData, error: availError } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('date', dateStr)
      .eq('slot_type', slot_type)
      .eq('is_active', true);

    // Filter in JavaScript where booked_count < capacity
    const availability = availabilityData?.filter((slot: any) => slot.booked_count < slot.capacity);

    if (availError) {
      console.error('[getAvailableDoctors] Error fetching availability:', availError);
      throw availError;
    }

    console.log('[getAvailableDoctors] Available slots found:', availability?.length || 0);

    // Match doctors with their availability
    const doctorsWithAvailability = approvedDoctors.map(doctor => {
      const docAvailability = availability?.filter(slot => slot.doctor_id === doctor.id) || [];
      return {
        ...doctor,
        availability: docAvailability,
        hasAvailability: docAvailability.length > 0,
      };
    }).filter(doc => doc.hasAvailability);

    console.log('[getAvailableDoctors] Doctors with availability:', doctorsWithAvailability.length);

    return doctorsWithAvailability;
  }
};

// Doctor Availability Services
export const doctorAvailabilityService = {
  async createAvailabilitySlot(slotData: Omit<DoctorAvailability, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('doctor_availability')
      .insert({
        doctor_id: slotData.doctor_id,
        date: slotData.date,
        start_time: slotData.start_time,
        end_time: slotData.end_time,
        slot_type: slotData.slot_type,
        capacity: slotData.capacity,
        booked_count: slotData.booked_count || 0,
        is_active: slotData.is_active !== undefined ? slotData.is_active : true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDoctorAvailability(doctorId: string, filters?: { date?: string; slot_type?: string }) {
    let query = supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('is_active', true);

    if (filters?.date) {
      query = query.eq('date', filters.date);
    }

    if (filters?.slot_type) {
      query = query.eq('slot_type', filters.slot_type);
    }

    const { data, error } = await query.order('date', { ascending: true }).order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getAvailableSlots(doctorId: string, date: string, slotType: 'clinic' | 'home' | 'online') {
    const { data, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .eq('slot_type', slotType)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Filter in JavaScript where booked_count < capacity
    return data?.filter((slot: any) => slot.booked_count < slot.capacity) || [];
  },

  async updateAvailabilitySlot(slotId: string, updates: Partial<DoctorAvailability>) {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.start_time !== undefined) updateData.start_time = updates.start_time;
    if (updates.end_time !== undefined) updateData.end_time = updates.end_time;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('doctor_availability')
      .update(updateData)
      .eq('id', slotId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAvailabilitySlot(slotId: string) {
    const { error } = await supabase
      .from('doctor_availability')
      .delete()
      .eq('id', slotId);

    if (error) throw error;
  },

  async bulkCreateAvailability(slots: Array<Omit<DoctorAvailability, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('doctor_availability')
      .insert(slots.map(slot => ({
        doctor_id: slot.doctor_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_type: slot.slot_type,
        capacity: slot.capacity,
        booked_count: 0,
        is_active: true,
      })))
      .select();

    if (error) throw error;
    return data;
  },

  async createWeeklyRecurringAvailability(params: {
    doctor_id: string;
    weekdays: number[];
    time_slots: string[];
    slot_type: 'clinic' | 'home' | 'online';
    capacity: number;
    weeks_ahead?: number;
  }) {
    const { doctor_id, weekdays, time_slots, slot_type, capacity, weeks_ahead = 4 } = params;
    const slots: any[] = [];

    // Calculate end time (30 minutes after start time)
    const getEndTime = (startTime: string) => {
      const [hour, minute] = startTime.split(':').map(Number);
      const totalMinutes = hour * 60 + minute + 30;
      const endHour = Math.floor(totalMinutes / 60);
      const endMinute = totalMinutes % 60;
      return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    };

    // Generate slots for the next N weeks
    const today = new Date();
    for (let week = 0; week < weeks_ahead; week++) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + week * 7 + dayOffset);
        const currentWeekday = currentDate.getDay();

        if (weekdays.includes(currentWeekday)) {
          const dateString = currentDate.toISOString().split('T')[0];

          for (const startTime of time_slots) {
            slots.push({
              doctor_id,
              date: dateString,
              start_time: startTime,
              end_time: getEndTime(startTime),
              slot_type,
              capacity,
              booked_count: 0,
              is_active: true,
              weekday: currentWeekday,
            });
          }
        }
      }
    }

    // Insert slots, handling duplicates gracefully
    const results = [];
    const errors = [];

    // Insert in smaller batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('doctor_availability')
        .insert(batch)
        .select();

      if (data) {
        results.push(...data);
      }
      if (error) {
        // Log duplicates but don't fail
        errors.push(error);
      }
    }

    // If we have some successful inserts, return them
    if (results.length > 0) {
      return results;
    }

    // If all failed, throw the first error
    if (errors.length > 0) {
      throw errors[0];
    }

    return [];
  }
};

// Doctor Consultation/Booking Services
export const doctorConsultationService = {
  async getDoctorBookings(doctorId: string, filters?: { status?: string; booking_type?: string; date?: string }) {
    console.log('[getDoctorBookings] Called with doctorId:', doctorId, 'filters:', filters);

    // First, try a simple query to see if we get ANY bookings
    const { data: testData, error: testError } = await supabase
      .from('bookings')
      .select('*')
      .limit(5);

    console.log('[getDoctorBookings] Test query - ALL bookings:', testData?.length, testData);
    if (testError) console.error('[getDoctorBookings] Test query error:', testError);

    let query = supabase
      .from('bookings')
      .select(`
        *,
        pets (*),
        addresses (*),
        users!bookings_user_id_fkey (
          id,
          name,
          email,
          phone,
          profile_photo_url
        )
      `)
      .eq('service_type', 'consultation');

    // Get bookings where doctor_id matches OR is null (unassigned)
    // We'll filter this in JavaScript instead of using .or() which might have issues

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.booking_type) {
      query = query.eq('booking_type', filters.booking_type);
    }

    if (filters?.date) {
      query = query.eq('date', filters.date);
    }

    const { data, error } = await query.order('date', { ascending: true }).order('time', { ascending: true });

    if (error) {
      console.error('[getDoctorBookings] Error:', error);
      throw error;
    }

    console.log('[getDoctorBookings] Raw data received:', data?.length, data);

    // Filter to show only bookings for this doctor or unassigned bookings, excluding cancelled ones
    const filteredData = data?.filter((booking: any) =>
      (booking.doctor_id === doctorId || booking.doctor_id === null) &&
      booking.status !== 'cancelled'
    ) || [];

    console.log('[getDoctorBookings] Filtered data:', filteredData.length, filteredData);

    return filteredData;
  },

  async getBookingDetails(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        pets (*),
        addresses (*),
        users!bookings_user_id_fkey (
          id,
          name,
          email,
          phone,
          profile_photo_url
        )
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

  async acceptBooking(bookingId: string, doctorId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        doctor_id: doctorId,
        status: 'upcoming'
      })
      .eq('id', bookingId)
      .select(`
        *,
        pets (*),
        addresses (*),
        users!bookings_user_id_fkey (
          id,
          name,
          email,
          phone,
          profile_photo_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async rejectBooking(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled'
      })
      .eq('id', bookingId)
      .select(`
        *,
        pets (*),
        addresses (*),
        users!bookings_user_id_fkey (
          id,
          name,
          email,
          phone,
          profile_photo_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async addMedicalNotes(bookingId: string, notes: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ medical_notes: notes })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadPrescription(bookingId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${bookingId}/prescription.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(fileName);

    // Update booking with prescription URL
    await supabase
      .from('bookings')
      .update({ prescription_url: publicUrl })
      .eq('id', bookingId);

    return publicUrl;
  },

  async deletePrescription(bookingId: string, prescriptionUrl: string) {
    // Extract file name from URL
    const urlParts = prescriptionUrl.split('/');
    const fileName = `${bookingId}/${urlParts[urlParts.length - 1]}`;

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('prescriptions')
      .remove([fileName]);

    if (deleteError) throw deleteError;

    // Update booking to remove prescription URL
    await supabase
      .from('bookings')
      .update({ prescription_url: null })
      .eq('id', bookingId);
  },

  async getTodayStats(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('date', today);

    if (error) throw error;

    const total = bookings?.length || 0;
    const completed = bookings?.filter(b => b.status === 'completed').length || 0;
    const upcoming = bookings?.filter(b => b.status === 'upcoming').length || 0;
    const cancelled = bookings?.filter(b => b.status === 'cancelled').length || 0;

    return {
      total,
      completed,
      upcoming,
      cancelled,
      bookings: bookings || [],
    };
  }
};

// Doctor Earnings Services
export const doctorEarningsService = {
  async getDoctorEarnings(doctorId: string, filters?: { status?: string }) {
    let query = supabase
      .from('doctor_earnings')
      .select(`
        *,
        bookings (
          *,
          pets (*),
          users!bookings_user_id_fkey (name)
        )
      `)
      .eq('doctor_id', doctorId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTotalEarnings(doctorId: string) {
    const { data, error } = await supabase
      .from('doctor_earnings')
      .select('net_amount, status')
      .eq('doctor_id', doctorId);

    if (error) throw error;

    const total = data?.reduce((sum, earning) => sum + (earning.net_amount || 0), 0) || 0;
    const paid = data?.filter(e => e.status === 'paid').reduce((sum, earning) => sum + (earning.net_amount || 0), 0) || 0;
    const pending = data?.filter(e => e.status === 'pending').reduce((sum, earning) => sum + (earning.net_amount || 0), 0) || 0;

    return { total, paid, pending };
  },

  async createEarning(data: {
    doctor_id: string;
    booking_id: string;
    gross_amount: number;
    platform_fee: number;
    net_amount: number;
    status?: 'pending' | 'paid' | 'failed';
  }) {
    const { data: earning, error } = await supabase
      .from('doctor_earnings')
      .insert({
        doctor_id: data.doctor_id,
        booking_id: data.booking_id,
        gross_amount: data.gross_amount,
        platform_fee: data.platform_fee,
        net_amount: data.net_amount,
        status: data.status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return earning;
  }
};

// Doctor Review Services
export const doctorReviewService = {
  async getDoctorReviews(doctorId: string) {
    const { data, error } = await supabase
      .from('doctor_reviews')
      .select(`
        *,
        users!doctor_reviews_user_id_fkey (
          name,
          profile_photo_url
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createReview(reviewData: {
    doctor_id: string;
    user_id: string;
    booking_id: string;
    rating: number;
    review_text?: string;
  }) {
    const { data, error } = await supabase
      .from('doctor_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateReview(reviewId: string, updates: { rating?: number; review_text?: string }) {
    const { data, error } = await supabase
      .from('doctor_reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteReview(reviewId: string) {
    const { error } = await supabase
      .from('doctor_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  }
};

// Prescription Product Services
export const prescriptionProductService = {
  async addProductToPrescription(data: {
    booking_id: string;
    doctor_id: string;
    product_id: string;
    quantity: number;
    dosage_instructions?: string;
    duration_days?: number;
    notes?: string;
  }) {
    const { data: result, error } = await supabase
      .from('prescription_products')
      .insert(data)
      .select(`
        *,
        product:products (*)
      `)
      .single();

    if (error) throw error;
    return result;
  },

  async getPrescriptionProducts(bookingId: string) {
    const { data, error } = await supabase
      .from('prescription_products')
      .select(`
        *,
        product:products (*)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PrescriptionProduct[];
  },

  async updatePrescriptionProduct(id: string, updates: {
    quantity?: number;
    dosage_instructions?: string;
    duration_days?: number;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('prescription_products')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        product:products (*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async removeProductFromPrescription(id: string) {
    const { error } = await supabase
      .from('prescription_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getProducts(filters?: { search?: string; category?: string }) {
    let query = supabase
      .from('products')
      .select('*');

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('main_category', filters.category);
    }

    const { data, error } = await query
      .order('name', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data as Product[];
  }
};

// Doctor Analytics Services (Real-time)
export const doctorAnalyticsService = {
  async getDoctorAnalytics(doctorId: string) {
    const { data, error } = await (supabase as any)
      .rpc('get_doctor_analytics', { p_doctor_id: doctorId });

    if (error) throw error;

    // The RPC returns an array with a single row, extract it
    const analytics = data && Array.isArray(data) && data.length > 0 ? data[0] : {
      total_consultations: 0,
      today_total: 0,
      today_completed: 0,
      today_upcoming: 0,
      today_cancelled: 0,
      week_total: 0,
      pending_requests: 0,
      total_earnings: 0,
      paid_earnings: 0,
      pending_earnings: 0,
      rating: 0
    };

    return analytics;
  },

  async getEarningsGrowth(doctorId: string) {
    const { data, error } = await (supabase as any)
      .rpc('calculate_earnings_growth', { p_doctor_id: doctorId });

    if (error) throw error;
    return data || 0;
  }
};
