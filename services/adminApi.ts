// =====================================================
// ADMIN API SERVICE
// All admin-related API calls for user, doctor, and platform management
// =====================================================

import { supabase } from '../lib/supabase';
import {
  AdminUser,
  AdminActivityLog,
  UserReport,
  DoctorVerificationRequest,
  PlatformAnalytics,
  UserWithDetails,
  AdminDashboardStats,
  Doctor,
  Booking,
  Order,
  ShopProduct,
  ProductVariation,
  ProductAttribute,
  GroupedProduct,
  GroupedProductItem,
  BulkImportResult,
  BulkImportError
} from '../types';

// =====================================================
// ADMIN AUTHENTICATION SERVICE
// =====================================================

export const adminAuthService = {
  /**
   * Sign in admin user with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<{ user: any; adminProfile: AdminUser }> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    // Get admin profile
    const { data: adminProfile, error: profileError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .single();

    if (profileError || !adminProfile) {
      // Sign out if not an admin
      await supabase.auth.signOut();
      throw new Error('Unauthorized: Not an admin user');
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminProfile.id);

    return { 
      user: authData.user, 
      adminProfile: {
        ...adminProfile,
        id: adminProfile.user_id // Use user_id as id for consistency
      } 
    };
  },

  /**
   * Sign out admin user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current admin user
   */
  async getCurrentUser(): Promise<any> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Get admin profile by user ID
   */
  async getAdminProfile(userId: string): Promise<AdminUser> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return {
      ...data,
      id: data.user_id // Use user_id as id for consistency
    };
  },

  /**
   * Update admin profile
   */
  async updateAdminProfile(adminId: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.profile_photo !== undefined) updateData.profile_photo = updates.profile_photo || null;

    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('user_id', adminId)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      id: data.user_id
    };
  },
};

// =====================================================
// ADMIN USER MANAGEMENT SERVICE
// =====================================================

export const adminUserManagementService = {
  /**
   * Get all admin users
   */
  async getAllAdminUsers(filters?: {
    role?: 'super_admin' | 'admin' | 'moderator' | 'support' | string;
    is_active?: boolean;
  }): Promise<AdminUser[]> {
    let query = supabase
      .from('users')
      .select(`
        *,
        admin_users (
          id,
          last_login,
          permissions
        )
      `)
      .neq('role', 'user')
      .order('created_at', { ascending: false });

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(u => ({
      id: u.id, // Using user id as id for consistency
      user_id: u.id,
      email: u.email || '',
      full_name: u.name,
      role: u.role as any,
      is_active: u.status === 'active',
      profile_photo: u.profile_photo_url,
      phone: u.phone,
      created_at: u.created_at,
      updated_at: u.updated_at,
      last_login: u.admin_users?.[0]?.last_login,
      permissions: u.admin_users?.[0]?.permissions,
    }));
  },

  /**
   * Create new admin user
   */
  async createAdminUser(userId: string, adminData: {
    email: string;
    full_name: string;
    role: 'super_admin' | 'admin' | 'moderator' | 'support';
    phone?: string;
  }): Promise<AdminUser> {
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        email: adminData.email,
        full_name: adminData.full_name,
        role: adminData.role,
        phone: adminData.phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update admin user role or status
   */
  async updateAdminUser(adminId: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;

    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', adminId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Suspend/Activate admin user
   */
  async toggleAdminUserStatus(userId: string, isActive: boolean): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .update({
        status: isActive ? 'active' : 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Also update admin_users table if exists
    await supabase
      .from('admin_users')
      .update({ is_active: isActive })
      .eq('user_id', userId);

    // Update doctor status if exists
    await supabase
      .from('doctors')
      .update({ is_active: isActive })
      .eq('user_id', userId);

    // Update grooming store status if exists
    await supabase
      .from('grooming_stores')
      .update({ is_active: isActive })
      .eq('user_id', userId);

    return data;
  },

  /**
   * Delete admin user
   */
  async deleteAdminUser(adminId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId);

    if (error) throw error;
  },
};

// =====================================================
// STORE MANAGER MANAGEMENT SERVICE
// =====================================================

export const adminStoreManagerService = {
  /**
   * Get all store managers with filters
   */
  async getAllStoreManagers(filters?: {
    approval_status?: 'pending' | 'approved' | 'rejected';
    is_active?: boolean;
    search?: string;
  }): Promise<StoreManager[]> {
    let query = supabase
      .from('store_managers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.approval_status) {
      query = query.eq('approval_status', filters.approval_status);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.or(`store_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new store manager (Super Admin only)
   */
  async createStoreManager(managerData: {
    user_id: string;
    store_name: string;
    email: string;
    phone?: string;
    license_url?: string;
    margin_percentage?: number;
  }): Promise<StoreManager> {
    const { data, error } = await supabase
      .from('store_managers')
      .insert({
        ...managerData,
        approval_status: 'pending',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Approve store manager
   */
  async approveStoreManager(managerId: string, adminId: string): Promise<StoreManager> {
    const { data, error } = await supabase
      .from('store_managers')
      .update({
        approval_status: 'approved',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', managerId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'approve_store_manager',
      target_type: 'store_manager',
      target_id: managerId,
    });

    return data;
  },

  /**
   * Reject store manager
   */
  async rejectStoreManager(managerId: string, reason: string, adminId: string): Promise<StoreManager> {
    const { data, error } = await supabase
      .from('store_managers')
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', managerId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'reject_store_manager',
      target_type: 'store_manager',
      target_id: managerId,
    });

    return data;
  },
};

// =====================================================
// GROOMING STORE APPROVAL SERVICE
// =====================================================

export const adminGroomingStoreService = {
  /**
   * Get all grooming stores with filters
   */
  async getAllGroomingStores(filters?: {
    approval_status?: 'pending' | 'approved' | 'rejected';
    is_active?: boolean;
    search?: string;
  }): Promise<GroomingStore[]> {
    let query = supabase
      .from('grooming_stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.approval_status) {
      query = query.eq('approval_status', filters.approval_status);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.or(`store_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Approve grooming store
   */
  async approveGroomingStore(storeId: string, adminId: string): Promise<GroomingStore> {
    const { data, error } = await supabase
      .from('grooming_stores')
      .update({
        approval_status: 'approved',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'approve_grooming_store',
      target_type: 'grooming_store',
      target_id: storeId,
    });

    return data;
  },

  /**
   * Reject grooming store
   */
  async rejectGroomingStore(storeId: string, reason: string, adminId: string): Promise<GroomingStore> {
    const { data, error } = await supabase
      .from('grooming_stores')
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'reject_grooming_store',
      target_type: 'grooming_store',
      target_id: storeId,
    });

    return data;
  },
};

// =====================================================
// CUSTOMER MANAGEMENT SERVICE
// =====================================================

export const adminCustomerService = {
  /**
   * Get all customers with filters
   */
  async getAllCustomers(filters?: {
    status?: 'active' | 'inactive' | 'suspended' | 'pending';
    role?: string;
    search?: string;
    createdAfter?: string;
    createdBefore?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserWithDetails[]> {
    let query = supabase
      .from('users')
      .select(`
        *,
        pets (*),
        addresses (*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.role) {
      query = query.eq('role', filters.role);
    } else {
      // Default: exclude admins and super admins
      query = query.neq('role', 'admin').neq('role', 'super_admin');
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.createdAfter) {
      query = query.gte('created_at', filters.createdAfter);
    }

    if (filters?.createdBefore) {
      query = query.lte('created_at', filters.createdBefore);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(u => ({
      ...u,
      profile_photo: u.profile_photo_url
    }));
  },

  /**
   * Get customer details by ID
   */
  async getCustomerDetails(userId: string): Promise<UserWithDetails> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        pets (*),
        addresses (*),
        bookings (
          *,
          pets (*),
          doctors (id, full_name, specialization)
        ),
        orders (
          *,
          order_items (
            *,
            products (*)
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return {
      ...data,
      profile_photo: data.profile_photo_url
    };
  },

  /**
   * Update customer profile
   */
  async updateCustomer(userId: string, updates: Partial<UserWithDetails>): Promise<UserWithDetails> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.profile_photo !== undefined) updateData.profile_photo_url = updates.profile_photo;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      profile_photo: data.profile_photo_url
    };
  },

  /**
   * Suspend customer account
   */
  async suspendCustomer(userId: string, reason: string, adminId: string): Promise<UserWithDetails> {
    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        suspended_by: adminId,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'suspend_customer',
      target_type: 'user',
      target_id: userId,
      details: { reason },
    });

    return {
      ...data,
      profile_photo: data.profile_photo_url
    };
  },

  /**
   * Activate customer account
   */
  async activateCustomer(userId: string, adminId: string): Promise<UserWithDetails> {
    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'active',
        suspension_reason: null,
        suspended_at: null,
        suspended_by: null,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'activate_customer',
      target_type: 'user',
      target_id: userId,
    });

    return data;
  },

  /**
   * Delete customer account
   */
  async deleteCustomer(userId: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'delete_customer',
      target_type: 'user',
      target_id: userId,
    });
  },

  /**
   * Change user role
   */
  async changeUserRole(userId: string, newRole: string, adminId: string): Promise<UserWithDetails> {
    const validRoles = ['user', 'doctor', 'grooming_store', 'store_manager'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'change_user_role',
      target_type: 'user',
      target_id: userId,
      details: { old_role: (await supabase.from('users').select('role').eq('id', userId).single()).data?.role, new_role: newRole },
    });

    return {
      ...data,
      profile_photo: data.profile_photo_url
    };
  },

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('users')
      .select('id, status, created_at')
      .neq('role', 'admin')
      .neq('role', 'super_admin');

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(u => u.status === 'active').length,
      suspended: data.filter(u => u.status === 'suspended').length,
      newToday: data.filter(u => u.created_at?.startsWith(today)).length,
      newThisWeek: data.filter(u => new Date(u.created_at || '') >= new Date(weekAgo)).length,
      newThisMonth: data.filter(u => new Date(u.created_at || '') >= new Date(monthAgo)).length,
    };

    return stats;
  },
};

// =====================================================
// DOCTOR MANAGEMENT SERVICE
// =====================================================

export const adminDoctorService = {
  /**
   * Get all doctors with filters
   */
  async getAllDoctors(filters?: {
    approval?: 'pending' | 'approved' | 'rejected';
    is_active?: boolean;
    is_verified?: boolean;
    search?: string;
  }): Promise<Doctor[]> {
    let query = supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.approval) {
      query = query.eq('approval', filters.approval);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,specialization.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get doctor details by ID
   */
  async getDoctorDetails(doctorId: string): Promise<Doctor & { bookings?: Booking[] }> {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        bookings (
          *,
          users (id, name, email, phone),
          pets (*)
        )
      `)
      .eq('id', doctorId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Approve doctor application
   */
  async approveDoctor(doctorId: string, adminId: string): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .update({
        approval: 'approved',
        is_verified: true,
        is_active: true,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'approve_doctor',
      target_type: 'doctor',
      target_id: doctorId,
    });

    return data;
  },

  /**
   * Reject doctor application
   */
  async rejectDoctor(doctorId: string, reason: string, adminId: string): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .update({
        approval: 'rejected',
        rejection_reason: reason,
        is_active: false,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'reject_doctor',
      target_type: 'doctor',
      target_id: doctorId,
      details: { reason },
    });

    return data;
  },

  /**
   * Suspend doctor account
   */
  async suspendDoctor(doctorId: string, reason: string, adminId: string): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .update({
        is_active: false,
        rejection_reason: reason,
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'suspend_doctor',
      target_type: 'doctor',
      target_id: doctorId,
      details: { reason },
    });

    return data;
  },

  /**
   * Activate doctor account
   */
  async activateDoctor(doctorId: string, adminId: string): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .update({
        is_active: true,
        rejection_reason: null,
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'activate_doctor',
      target_type: 'doctor',
      target_id: doctorId,
    });

    return data;
  },

  /**
   * Delete doctor account
   */
  async deleteDoctor(doctorId: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', doctorId);

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'delete_doctor',
      target_type: 'doctor',
      target_id: doctorId,
    });
  },

  /**
   * Get doctor statistics
   */
  async getDoctorStats(): Promise<{
    total: number;
    active: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
    newToday: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('doctors')
      .select('id, is_active, approval, created_at');

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(d => d.is_active).length,
      pendingApproval: data.filter(d => d.approval === 'pending').length,
      approved: data.filter(d => d.approval === 'approved').length,
      rejected: data.filter(d => d.approval === 'rejected').length,
      newToday: data.filter(d => d.created_at?.startsWith(today)).length,
    };

    return stats;
  },

  /**
   * Update doctor verification status
   */
  async updateDoctorVerification(doctorId: string, isVerified: boolean, adminId: string): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .update({ is_verified: isVerified })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: isVerified ? 'verify_doctor' : 'unverify_doctor',
      target_type: 'doctor',
      target_id: doctorId,
    });

    return data;
  },
};

// =====================================================
// BOOKING MANAGEMENT SERVICE
// =====================================================

export const adminBookingService = {
  /**
   * Get all bookings with filters
   */
  async getAllBookings(filters?: {
    status?: 'pending' | 'upcoming' | 'completed' | 'cancelled';
    booking_type?: 'online' | 'home' | 'clinic';
    service_type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Booking[]> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        users (id, name, email, phone),
        pets (*),
        doctors (id, full_name, specialization)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.booking_type) {
      query = query.eq('booking_type', filters.booking_type);
    }

    if (filters?.service_type) {
      query = query.eq('service_type', filters.service_type);
    }

    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get booking statistics
   */
  async getBookingStats(): Promise<{
    total: number;
    pending: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    todayBookings: number;
    totalRevenue: number;
    platformRevenue: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    platformFeeToday: number;
    platformFeeThisMonth: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch only necessary columns
    const { data, error } = await supabase
      .from('bookings')
      .select('status, created_at, total_amount, platform_fee');

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
      todayBookings: 0,
      totalRevenue: 0,
      platformRevenue: 0,
      revenueToday: 0,
      revenueThisWeek: 0,
      revenueThisMonth: 0,
      platformFeeToday: 0,
      platformFeeThisMonth: 0,
    };

    data.forEach(b => {
      const createdAt = b.created_at || '';
      const isToday = createdAt.startsWith(today);
      const isThisWeek = new Date(createdAt) >= new Date(weekAgo);
      const isThisMonth = new Date(createdAt) >= new Date(monthAgo);

      if (b.status === 'pending') stats.pending++;
      else if (b.status === 'upcoming') stats.upcoming++;
      else if (b.status === 'completed') {
        stats.completed++;
        stats.totalRevenue += (b.total_amount || 0);
        stats.platformRevenue += (b.platform_fee || 0);
        
        if (isToday) {
          stats.revenueToday += (b.total_amount || 0);
          stats.platformFeeToday += (b.platform_fee || 0);
        }
        if (isThisWeek) stats.revenueThisWeek += (b.total_amount || 0);
        if (isThisMonth) {
          stats.revenueThisMonth += (b.total_amount || 0);
          stats.platformFeeThisMonth += (b.platform_fee || 0);
        }
      }
      else if (b.status === 'cancelled') stats.cancelled++;

      if (isToday) {
        stats.todayBookings++;
      }
    });

    return stats;
  },

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, adminId: string, reason: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'cancel_booking',
      target_type: 'booking',
      target_id: bookingId,
      details: { reason },
    });

    return data;
  },
};

// =====================================================
// ANALYTICS AND REPORTING SERVICE
// =====================================================

export const adminAnalyticsService = {
  /**
   * Get platform dashboard statistics
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [userStats, doctorStats, bookingStats] = await Promise.all([
      adminCustomerService.getCustomerStats(),
      adminDoctorService.getDoctorStats(),
      adminBookingService.getBookingStats(),
    ]);

    return {
      userStats,
      doctorStats,
      bookingStats,
      revenueStats: {
        today: bookingStats.revenueToday,
        thisWeek: bookingStats.revenueThisWeek,
        thisMonth: bookingStats.revenueThisMonth,
        platformFeeToday: bookingStats.platformFeeToday,
        platformFeeThisMonth: bookingStats.platformFeeThisMonth,
      },
    };
  },

  /**
   * Get platform analytics over time
   */
  async getPlatformAnalytics(dateFrom?: string, dateTo?: string): Promise<PlatformAnalytics[]> {
    let query = supabase
      .from('platform_analytics')
      .select('*')
      .order('date', { ascending: false });

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Update platform analytics for a specific date
   */
  async updatePlatformAnalytics(date?: string): Promise<void> {
    // Call the stored procedure
    const { error } = await supabase.rpc('update_platform_analytics');
    if (error) throw error;
  },
};

// =====================================================
// ACTIVITY LOG SERVICE
// =====================================================

export const adminActivityLogService = {
  /**
   * Log admin activity
   */
  async logActivity(logData: {
    admin_id: string;
    action: string;
    target_type: 'user' | 'doctor' | 'grooming_store' | 'booking' | 'order' | 'admin';
    target_id: string;
    details?: Record<string, any>;
    ip_address?: string;
  }): Promise<AdminActivityLog> {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: logData.admin_id,
        action: logData.action,
        target_type: logData.target_type,
        target_id: logData.target_id,
        details: logData.details || null,
        ip_address: logData.ip_address || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get activity logs with filters
   */
  async getActivityLogs(filters?: {
    admin_id?: string;
    target_type?: 'user' | 'doctor' | 'grooming_store' | 'booking' | 'order' | 'admin';
    target_id?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<AdminActivityLog[]> {
    let query = supabase
      .from('admin_activity_logs')
      .select(`
        *,
        admin_users (id, full_name, email, role)
      `)
      .order('created_at', { ascending: false });

    if (filters?.admin_id) {
      query = query.eq('admin_id', filters.admin_id);
    }

    if (filters?.target_type) {
      query = query.eq('target_type', filters.target_type);
    }

    if (filters?.target_id) {
      query = query.eq('target_id', filters.target_id);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

// =====================================================
// USER REPORT SERVICE
// =====================================================

export const adminReportService = {
  /**
   * Get all user reports
   */
  async getAllReports(filters?: {
    status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    reporter_type?: 'user' | 'doctor' | 'admin';
  }): Promise<UserReport[]> {
    let query = supabase
      .from('user_reports')
      .select(`
        *,
        users!reported_user_id (id, name, email, profile_photo)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.reporter_type) {
      query = query.eq('reporter_type', filters.reporter_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Update report status
   */
  async updateReportStatus(
    reportId: string,
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed',
    adminId: string,
    resolutionNotes?: string
  ): Promise<UserReport> {
    const updateData: any = {
      status,
      resolved_by: adminId,
    };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString();
      if (resolutionNotes) {
        updateData.resolution_notes = resolutionNotes;
      }
    }

    const { data, error } = await supabase
      .from('user_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// =====================================================
// ADMIN SHOP PRODUCT SERVICE
// =====================================================

export const adminProductService = {
  /**
   * Get all shop products with optional filters
   */
  async getAllProducts(filters?: {
    category?: string;
    search?: string;
    is_active?: boolean;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    seller_id?: string;
  }): Promise<ShopProduct[]> {
    let query = supabase
      .from('shop_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.seller_id) {
      query = query.eq('created_by', filters.seller_id);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let products = data || [];

    // Filter by stock status if specified
    if (filters?.stock_status) {
      products = products.filter(p => {
        if (filters.stock_status === 'out_of_stock') return p.stock_quantity === 0;
        if (filters.stock_status === 'low_stock') return p.stock_quantity > 0 && p.stock_quantity <= 5;
        if (filters.stock_status === 'in_stock') return p.stock_quantity > 5;
        return true;
      });
    }

    return products;
  },

  /**
   * Get product by ID with variations and attributes
   */
  async getProductById(productId: string): Promise<ShopProduct & { variations: ProductVariation[]; attributes: ProductAttribute[] }> {
    const { data: product, error: productError } = await supabase
      .from('shop_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    // Get variations
    const { data: variations, error: varError } = await supabase
      .from('product_variations')
      .select('*')
      .eq('product_id', productId);

    if (varError) throw varError;

    // Get attributes
    const { data: attributes, error: attrError } = await supabase
      .from('product_attributes')
      .select('*')
      .eq('product_id', productId);

    if (attrError) throw attrError;

    return {
      ...product,
      variations: variations || [],
      attributes: attributes || [],
    };
  },

  /**
   * Create a new product
   */
  async createProduct(productData: {
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
    pet_types?: string[];
  }): Promise<ShopProduct> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('shop_products')
      .insert({
        name: productData.name,
        description: productData.description || null,
        category: productData.category,
        base_price: productData.base_price,
        sale_price: productData.sale_price || null,
        has_attribute_pricing: productData.has_attribute_pricing || false,
        stock_quantity: productData.stock_quantity,
        sku: productData.sku || null,
        images: productData.images || [],
        main_image: productData.main_image || null,
        pet_types: productData.pet_types || ['dog', 'cat'],
        is_active: true,
        is_grouped: false,
        created_by: user?.id,
        updated_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Automatically create a seller listing for the creator in product_sellers
    try {
      // Determine seller type from user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

      let sellerType: 'admin' | 'doctor' | 'grooming_store' | 'store_manager' = 'admin';
      if (userData?.role === 'doctor') sellerType = 'doctor';
      else if (userData?.role === 'groomer') sellerType = 'grooming_store';
      else if (userData?.role === 'store_manager') sellerType = 'store_manager';

      await supabase
        .from('product_sellers')
        .insert({
          product_id: data.id,
          seller_id: user?.id,
          seller_price: productData.sale_price || productData.base_price,
          seller_stock: productData.stock_quantity,
          seller_sku: productData.sku,
          seller_type: sellerType,
          approval_status: 'approved', // Products created by authorized users are auto-approved
          is_active: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        });
    } catch (sellerError) {
      console.error('Error creating initial seller listing:', sellerError);
      // We don't fail the product creation if the seller listing fails
    }

    return data;
  },

  /**
   * Update a product
   */
  async updateProduct(productId: string, updates: Partial<ShopProduct>): Promise<ShopProduct> {
    const { data: { user } } = await supabase.auth.getUser();
    const updateData: any = { 
      updated_at: new Date().toISOString(),
      updated_by: user?.id
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.base_price !== undefined) updateData.base_price = updates.base_price;
    if (updates.sale_price !== undefined) updateData.sale_price = updates.sale_price;
    if (updates.has_attribute_pricing !== undefined) updateData.has_attribute_pricing = updates.has_attribute_pricing;
    if (updates.stock_quantity !== undefined) updateData.stock_quantity = updates.stock_quantity;
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.main_image !== undefined) updateData.main_image = updates.main_image;
    if (updates.pet_types !== undefined) updateData.pet_types = updates.pet_types;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('shop_products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<void> {
    // First delete related variations and attributes
    await supabase.from('product_variations').delete().eq('product_id', productId);
    await supabase.from('product_attributes').delete().eq('product_id', productId);

    const { error } = await supabase
      .from('shop_products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  },

  /**
   * Create product variation
   */
  async createVariation(variationData: {
    product_id: string;
    variation_name: string;
    variation_value: string;
    price_adjustment: number;
    base_price?: number | null;
    sale_price?: number | null;
    purchase_price?: number | null;
    stock_quantity: number;
    sku?: string;
    image?: string;
  }): Promise<ProductVariation> {
    const { data, error } = await supabase
      .from('product_variations')
      .insert({
        ...variationData,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update product variation
   */
  async updateVariation(variationId: string, updates: Partial<ProductVariation>): Promise<ProductVariation> {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.variation_name !== undefined) updateData.variation_name = updates.variation_name;
    if (updates.variation_value !== undefined) updateData.variation_value = updates.variation_value;
    if (updates.price_adjustment !== undefined) updateData.price_adjustment = updates.price_adjustment;
    if (updates.base_price !== undefined) updateData.base_price = updates.base_price;
    if (updates.sale_price !== undefined) updateData.sale_price = updates.sale_price;
    if (updates.purchase_price !== undefined) updateData.purchase_price = updates.purchase_price;
    if (updates.stock_quantity !== undefined) updateData.stock_quantity = updates.stock_quantity;
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('product_variations')
      .update(updateData)
      .eq('id', variationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete product variation
   */
  async deleteVariation(variationId: string): Promise<void> {
    const { error } = await supabase
      .from('product_variations')
      .delete()
      .eq('id', variationId);

    if (error) throw error;
  },

  /**
   * Create product attribute
   */
  async createAttribute(attrData: {
    product_id: string;
    attribute_name: string;
    attribute_values: string[];
  }): Promise<ProductAttribute> {
    const { data, error } = await supabase
      .from('product_attributes')
      .insert(attrData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete product attribute
   */
  async deleteAttribute(attributeId: string): Promise<void> {
    const { error } = await supabase
      .from('product_attributes')
      .delete()
      .eq('id', attributeId);

    if (error) throw error;
  },

  /**
   * Get all grouped products
   */
  async getGroupedProducts(): Promise<(GroupedProduct & { items: GroupedProductItem[] })[]> {
    const { data: groups, error: groupError } = await supabase
      .from('grouped_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupError) throw groupError;

    // Get items for each group
    const result = await Promise.all((groups || []).map(async (group) => {
      const { data: items, error: itemsError } = await supabase
        .from('grouped_product_items')
        .select('*, product:shop_products(*)')
        .eq('grouped_product_id', group.id);

      if (itemsError) throw itemsError;

      return {
        ...group,
        items: items || [],
      };
    }));

    return result;
  },

  /**
   * Create grouped product
   */
  async createGroupedProduct(groupData: {
    name: string;
    description?: string;
    final_price: number;
    discount_percentage?: number;
    items: { product_id: string; quantity: number }[];
  }): Promise<GroupedProduct> {
    // Create the grouped product
    const { data: group, error: groupError } = await supabase
      .from('grouped_products')
      .insert({
        name: groupData.name,
        description: groupData.description || null,
        final_price: groupData.final_price,
        discount_percentage: groupData.discount_percentage || null,
        is_active: true,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Create grouped product items
    const itemsToInsert = groupData.items.map(item => ({
      grouped_product_id: group.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('grouped_product_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return group;
  },

  /**
   * Delete grouped product
   */
  async deleteGroupedProduct(groupId: string): Promise<void> {
    // Delete items first
    await supabase.from('grouped_product_items').delete().eq('grouped_product_id', groupId);

    const { error } = await supabase
      .from('grouped_products')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  },

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
    lowStock: number;
    categories: { name: string; count: number }[];
  }> {
    const { data: products, error } = await supabase
      .from('shop_products')
      .select('id, is_active, stock_quantity, category');

    if (error) throw error;

    const allProducts = products || [];

    // Count by category
    const categoryMap: Record<string, number> = {};
    allProducts.forEach(p => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });

    const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    return {
      total: allProducts.length,
      active: allProducts.filter(p => p.is_active).length,
      inactive: allProducts.filter(p => !p.is_active).length,
      outOfStock: allProducts.filter(p => p.stock_quantity === 0).length,
      lowStock: allProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
      categories,
    };
  },

  /**
   * Bulk import products (mock implementation - actual CSV parsing would be done client-side)
   */
  async bulkImportProducts(products: {
    name: string;
    description?: string;
    category: string;
    base_price: number;
    stock_quantity: number;
    sku?: string;
  }[]): Promise<BulkImportResult> {
    const errors: BulkImportError[] = [];
    let successful = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const row = i + 2; // +2 for header row and 0-index

      // Validate
      if (!product.name) {
        errors.push({ row, field: 'name', value: '', error: 'Product name is required' });
        continue;
      }
      if (!product.category) {
        errors.push({ row, field: 'category', value: '', error: 'Category is required' });
        continue;
      }
      if (product.base_price <= 0) {
        errors.push({ row, field: 'base_price', value: String(product.base_price), error: 'Invalid price' });
        continue;
      }

      // Check for duplicate SKU
      if (product.sku) {
        const { data: existing } = await supabase
          .from('shop_products')
          .select('id')
          .eq('sku', product.sku)
          .single();

        if (existing) {
          errors.push({ row, field: 'sku', value: product.sku, error: 'Duplicate SKU' });
          continue;
        }
      }

      // Insert product
      try {
        await supabase.from('shop_products').insert({
          name: product.name,
          description: product.description || null,
          category: product.category,
          base_price: product.base_price,
          stock_quantity: product.stock_quantity || 0,
          sku: product.sku || null,
          is_active: true,
          is_grouped: false,
        });
        successful++;
      } catch (err: any) {
        errors.push({ row, field: 'insert', value: product.name, error: err.message || 'Insert failed' });
      }
    }

    return {
      total_rows: products.length,
      successful,
      failed: errors.length,
      errors,
    };
  },
};

// =====================================================
// ADMIN NOTIFICATION SERVICE
// =====================================================

export interface AdminNotification {
  id: string;
  user_id: string;
  booking_id?: string;
  type: string;
  title: string;
  message: string;
  image_url?: string;
  read: boolean;
  created_at: string;
  updated_at?: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

export const adminNotificationService = {
  /**
   * Get all notifications with filters
   */
  async getAllNotifications(filters?: {
    type?: string;
    read?: boolean;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminNotification[]> {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        users (id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.read !== undefined) {
      query = query.eq('read', filters.read);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Send notification to a specific user
   */
  async sendNotificationToUser(notificationData: {
    userId: string;
    type: string;
    title: string;
    message: string;
    imageUrl?: string;
    bookingId?: string;
  }): Promise<AdminNotification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        image_url: notificationData.imageUrl || null,
        booking_id: notificationData.bookingId || null,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(userIds: string[], notificationData: {
    type: string;
    title: string;
    message: string;
    imageUrl?: string;
  }): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          image_url: notificationData.imageUrl || null,
          read: false,
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send notification to user ${userId}:`, err);
        failed++;
      }
    }

    return { sent, failed };
  },

  /**
   * Broadcast notification to all active users
   */
  async broadcastNotification(notificationData: {
    type: string;
    title: string;
    message: string;
    imageUrl?: string;
  }): Promise<{ sent: number; failed: number }> {
    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('status', 'active');

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Create notifications for all users
    const notifications = users.map(user => ({
      user_id: user.id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      image_url: notificationData.imageUrl || null,
      read: false,
    }));

    // Insert in batches of 100
    let sent = 0;
    let failed = 0;
    const batchSize = 100;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error } = await supabase.from('notifications').insert(batch);

      if (error) {
        console.error('Batch insert error:', error);
        failed += batch.length;
      } else {
        sent += batch.length;
      }
    }

    return { sent, failed };
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Delete all notifications for a user
   */
  async deleteUserNotifications(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: { type: string; count: number }[];
    sentToday: number;
    sentThisWeek: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, read, created_at');

    if (error) throw error;

    const notifications = data || [];

    // Count by type
    const typeMap: Record<string, number> = {};
    notifications.forEach(n => {
      typeMap[n.type] = (typeMap[n.type] || 0) + 1;
    });

    const byType = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType,
      sentToday: notifications.filter(n => n.created_at?.startsWith(today)).length,
      sentThisWeek: notifications.filter(n => new Date(n.created_at || '') >= new Date(weekAgo)).length,
    };
  },

  /**
   * Get users for notification targeting
   */
  async getUsersForNotification(filters?: {
    search?: string;
    limit?: number;
  }): Promise<{ id: string; name: string; email: string }[]> {
    let query = supabase
      .from('users')
      .select('id, name, email')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

// =====================================================
// ATTRIBUTE PRICING MANAGEMENT SERVICE
// =====================================================

export const adminAttributePricingService = {
  /**
   * Get all attribute pricing for a product
   */
  async getAttributePricing(productId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('attribute_pricing')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('attribute_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Add attribute pricing (for color, size, etc. variants)
   */
  async addAttributePricing(productId: string, pricingData: {
    attribute_name: string;
    attribute_value: string;
    price_adjustment?: number;
    adjusted_price: number;
    sale_price?: number;
    stock_quantity: number;
    sku?: string;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('attribute_pricing')
      .insert({
        product_id: productId,
        attribute_name: pricingData.attribute_name,
        attribute_value: pricingData.attribute_value,
        price_adjustment: pricingData.price_adjustment || 0,
        adjusted_price: pricingData.adjusted_price,
        sale_price: pricingData.sale_price || null,
        stock_quantity: pricingData.stock_quantity,
        sku: pricingData.sku || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update attribute pricing
   */
  async updateAttributePricing(pricingId: string, updates: {
    price_adjustment?: number;
    adjusted_price?: number;
    sale_price?: number;
    stock_quantity?: number;
    sku?: string;
    is_active?: boolean;
  }): Promise<any> {
    const updateData: any = {};

    if (updates.price_adjustment !== undefined) updateData.price_adjustment = updates.price_adjustment;
    if (updates.adjusted_price !== undefined) updateData.adjusted_price = updates.adjusted_price;
    if (updates.sale_price !== undefined) updateData.sale_price = updates.sale_price;
    if (updates.stock_quantity !== undefined) updateData.stock_quantity = updates.stock_quantity;
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('attribute_pricing')
      .update(updateData)
      .eq('id', pricingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete attribute pricing
   */
  async deleteAttributePricing(pricingId: string): Promise<void> {
    const { error } = await supabase
      .from('attribute_pricing')
      .update({ is_active: false })
      .eq('id', pricingId);

    if (error) throw error;
  },

  /**
   * Get price for a specific attribute combination
   */
  async getAttributePrice(productId: string, attributeName: string, attributeValue: string): Promise<{
    base_price: number;
    sale_price?: number;
    adjusted_price: number;
    attribute_sale_price?: number;
  }> {
    const { data, error } = await supabase.rpc('get_attribute_price', {
      p_product_id: productId,
      p_attribute_name: attributeName,
      p_attribute_value: attributeValue,
    });

    if (error) throw error;
    return data?.[0] || {};
  },

  /**
   * Bulk add attribute pricing for multiple values
   */
  async bulkAddAttributePricing(
    productId: string,
    attributeName: string,
    pricingList: Array<{
      attribute_value: string;
      adjusted_price: number;
      sale_price?: number;
      stock_quantity: number;
      sku?: string;
    }>
  ): Promise<any[]> {
    const records = pricingList.map(item => ({
      product_id: productId,
      attribute_name: attributeName,
      attribute_value: item.attribute_value,
      price_adjustment: 0,
      adjusted_price: item.adjusted_price,
      sale_price: item.sale_price || null,
      stock_quantity: item.stock_quantity,
      sku: item.sku || null,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('attribute_pricing')
      .insert(records)
      .select();

    if (error) throw error;
    return data || [];
  },
};

// =====================================================
// CATEGORY & ATTRIBUTE MANAGEMENT SERVICE
// =====================================================

export const adminCategoryAttributeService = {
  /**
   * Get all product categories
   */
  async getAllCategories(): Promise<any[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new product category
   */
  async createCategory(categoryData: {
    name: string;
    description?: string;
    icon?: string;
    display_order?: number;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        name: categoryData.name,
        description: categoryData.description || null,
        icon: categoryData.icon || null,
        display_order: categoryData.display_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a product category
   */
  async updateCategory(categoryId: string, updates: {
    name?: string;
    description?: string;
    icon?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a product category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .update({ is_active: false })
      .eq('id', categoryId);

    if (error) throw error;
  },

  /**
   * Get all attributes for a product
   */
  async getProductAttributes(productId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('product_attributes')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Add an attribute to a product
   */
  async addProductAttribute(productId: string, attributeData: {
    attribute_name: string;
    attribute_values: string[];
  }): Promise<any> {
    const { data, error } = await supabase
      .from('product_attributes')
      .insert({
        product_id: productId,
        attribute_name: attributeData.attribute_name,
        attribute_values: attributeData.attribute_values,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a product attribute
   */
  async updateProductAttribute(attributeId: string, updates: {
    attribute_name?: string;
    attribute_values?: string[];
  }): Promise<any> {
    const { data, error } = await supabase
      .from('product_attributes')
      .update(updates)
      .eq('id', attributeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a product attribute
   */
  async deleteProductAttribute(attributeId: string): Promise<void> {
    const { error } = await supabase
      .from('product_attributes')
      .delete()
      .eq('id', attributeId);

    if (error) throw error;
  },

  /**
   * Get all unique attribute names used in the system
   */
  async getAllAttributeNames(): Promise<string[]> {
    const { data, error } = await supabase
      .from('product_attributes')
      .select('attribute_name')
      .order('attribute_name', { ascending: true });

    if (error) throw error;

    // Get unique attribute names
    const names = data?.map(d => d.attribute_name) || [];
    return [...new Set(names)];
  },
};

// =====================================================
// ORDER ALLOCATION SERVICE
// =====================================================

export const adminOrderAllocationService = {
  /**
   * Get pending orders that need allocation
   */
  async getPendingOrders(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        user_id:users(id, name, email, phone),
        address_id:addresses(*),
        order_items (
          *,
          product_id:shop_products(*)
        )
      `)
      .eq('allocation_status', 'pending')
      .order('created_at', { ascending: true });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Allocate an order to sellers automatically
   * Finds the best seller for each product based on:
   * - Approved seller listings
   * - Available stock
   * - Price
   */
  async allocateOrder(orderId: string, adminId: string): Promise<{
    success: boolean;
    allocated_items: number;
    failed_items: number;
    details: any[];
  }> {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product_id:shop_products(*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    const allocationDetails = [];
    let allocatedCount = 0;
    let failedCount = 0;

    for (const item of order.order_items) {
      try {
        // Find approved sellers for this product
        const { data: sellers, error: sellerError } = await supabase
          .from('product_sellers')
          .select(`
            *,
            seller_id:users(id, name, email, role)
          `)
          .eq('product_id', item.product_id)
          .eq('approval_status', 'approved')
          .eq('is_active', true)
          .gt('seller_stock', 0)
          .order('seller_price', { ascending: true }); // Lowest price first

        if (sellerError) throw sellerError;

        if (!sellers || sellers.length === 0) {
          failedCount++;
          allocationDetails.push({
            order_item_id: item.id,
            product_id: item.product_id,
            status: 'failed',
            reason: 'No approved sellers with available stock',
          });
          continue;
        }

        // Select seller with lowest price and available stock
        const bestSeller = sellers[0];

        // Fetch margin percentage for the seller
        let marginPercentage = 10.00; // Default 10%
        
        if (bestSeller.seller_type === 'doctor') {
          const { data: doc } = await supabase
            .from('doctors')
            .select('margin_percentage')
            .eq('user_id', bestSeller.seller_id)
            .single();
          if (doc?.margin_percentage) marginPercentage = doc.margin_percentage;
        } else if (bestSeller.seller_type === 'grooming_store') {
          const { data: store } = await supabase
            .from('grooming_stores')
            .select('margin_percentage')
            .eq('user_id', bestSeller.seller_id)
            .single();
          if (store?.margin_percentage) marginPercentage = store.margin_percentage;
        } else if (bestSeller.seller_type === 'store_manager') {
          const { data: manager } = await supabase
            .from('store_managers')
            .select('margin_percentage')
            .eq('user_id', bestSeller.seller_id)
            .single();
          if (manager?.margin_percentage) marginPercentage = manager.margin_percentage;
        }

        const marginAmount = (item.price * item.quantity) * (Number(marginPercentage) / 100);

        // Update order_item with seller and margin
        const { data: updatedItem, error: updateError } = await supabase
          .from('order_items')
          .update({
            seller_id: bestSeller.seller_id,
            seller_type: bestSeller.seller_type,
            admin_margin_amount: marginAmount,
            allocated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Create allocation record (audit trail)
        await supabase.from('order_seller_allocations').insert({
          order_id: orderId,
          order_item_id: item.id,
          seller_id: bestSeller.seller_id,
          product_id: item.product_id,
          quantity: item.quantity,
          allocated_price: item.price,
          seller_price: bestSeller.seller_price,
          seller_available_stock: bestSeller.seller_stock,
          allocation_reason: `Auto-allocated: Best price (₹${bestSeller.seller_price}) with ${bestSeller.seller_stock} stock`,
        });

        allocatedCount++;
        allocationDetails.push({
          order_item_id: item.id,
          product_id: item.product_id,
          seller_id: bestSeller.seller_id,
          seller_name: bestSeller.seller_id?.name,
          seller_price: bestSeller.seller_price,
          status: 'allocated',
        });
      } catch (err) {
        failedCount++;
        allocationDetails.push({
          order_item_id: item.id,
          product_id: item.product_id,
          status: 'failed',
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Log admin activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'allocate_order',
      target_type: 'order',
      target_id: orderId,
      details: {
        allocated_items: allocatedCount,
        failed_items: failedCount,
        total_items: order.order_items.length,
      },
    });

    return {
      success: failedCount === 0,
      allocated_items: allocatedCount,
      failed_items: failedCount,
      details: allocationDetails,
    };
  },

  /**
   * Manually allocate an order item to a specific seller
   */
  async allocateOrderItemToSeller(
    orderItemId: string,
    sellerId: string,
    adminId: string
  ): Promise<any> {
    // Get order item details
    const { data: item, error: itemError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', orderItemId)
      .single();

    if (itemError) throw itemError;

    // Get seller details
    const { data: seller, error: sellerError } = await supabase
      .from('product_sellers')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('product_id', item.product_id)
      .single();

    if (sellerError) throw sellerError;

    // Update order item
    const { data: updated, error: updateError } = await supabase
      .from('order_items')
      .update({
        seller_id: sellerId,
        allocated_at: new Date().toISOString(),
      })
      .eq('id', orderItemId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create allocation record
    await supabase.from('order_seller_allocations').insert({
      order_id: item.order_id,
      order_item_id: orderItemId,
      seller_id: sellerId,
      product_id: item.product_id,
      quantity: item.quantity,
      allocated_price: item.price,
      seller_price: seller?.seller_price,
      seller_available_stock: seller?.seller_stock,
      allocation_reason: 'Manually allocated by admin',
    });

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'allocate_order_item',
      target_type: 'order',
      target_id: item.order_id,
      details: {
        order_item_id: orderItemId,
        seller_id: sellerId,
        product_id: item.product_id,
      },
    });

    return updated;
  },

  /**
   * Get allocation history for an order
   */
  async getOrderAllocationHistory(orderId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('order_seller_allocations')
      .select(`
        *,
        seller_id:users(id, name, email),
        product_id:shop_products(id, name)
      `)
      .eq('order_id', orderId)
      .order('allocated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get seller's allocated orders
   */
  async getSellerAllocatedOrders(sellerId: string, filters?: {
    fulfillment_status?: 'pending' | 'confirmed' | 'shipped' | 'delivered';
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = supabase
      .from('order_items')
      .select(`
        *,
        order_id:orders(
          id,
          order_number,
          created_at,
          status,
          total,
          user_id:users(id, name, phone, email),
          address_id:addresses(full_address, city)
        ),
        product_id:shop_products(id, name, main_image)
      `)
      .eq('seller_id', sellerId);

    if (filters?.fulfillment_status) {
      query = query.eq('fulfillment_status', filters.fulfillment_status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query.order('allocated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /**
   * Update fulfillment status of an allocated order item
   */
  async updateFulfillmentStatus(
    orderItemId: string,
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  ): Promise<any> {
    const { data, error } = await supabase
      .from('order_items')
      .update({ fulfillment_status: status })
      .eq('id', orderItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get order allocation statistics
   */
  async getAllocationStats(): Promise<{
    totalOrders: number;
    pendingAllocation: number;
    fullyAllocated: number;
    partiallyAllocated: number;
    failedAllocation: number;
  }> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, allocation_status');

    if (error) throw error;

    const orders = data || [];

    return {
      totalOrders: orders.length,
      pendingAllocation: orders.filter(o => o.allocation_status === 'pending').length,
      fullyAllocated: orders.filter(o => o.allocation_status === 'allocated').length,
      partiallyAllocated: orders.filter(o => o.allocation_status === 'partially_allocated').length,
      failedAllocation: orders.filter(o => o.allocation_status === 'failed').length,
    };
  },
};

// =====================================================
// MULTI-SELLER MANAGEMENT SERVICE
// =====================================================

export const adminSellerService = {
  /**
   * Get all pending seller listings for approval
   */
  async getPendingSellerListings(filters?: {
    seller_type?: 'grooming_store' | 'doctor';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = supabase
      .from('product_sellers')
      .select(`
        *,
        product_id:shop_products(*),
        seller_id:users(id, name, email, role),
        approved_by:admin_users(id, full_name)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true });

    if (filters?.seller_type) {
      query = query.eq('seller_type', filters.seller_type);
    }

    if (filters?.search) {
      query = query.or(
        `seller_id->name.ilike.%${filters.search}%,product_id->name.ilike.%${filters.search}%`
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get all sellers for a specific product
   */
  async getProductSellers(productId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('product_sellers')
      .select(`
        *,
        seller_id:users(id, name, email, role),
        approved_by:admin_users(id, full_name)
      `)
      .eq('product_id', productId)
      .order('approval_status', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all products a seller is offering
   */
  async getSellerProducts(sellerId: string, approvedOnly: boolean = false): Promise<any[]> {
    let query = supabase
      .from('product_sellers')
      .select(`
        *,
        product_id:shop_products(*)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (approvedOnly) {
      query = query.eq('approval_status', 'approved').eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Approve a seller's product listing
   */
  async approveSellerListing(sellerListingId: string, adminId: string): Promise<any> {
    const { data, error } = await supabase
      .from('product_sellers')
      .update({
        approval_status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', sellerListingId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'approve_seller_product',
      target_type: 'grooming_store',
      target_id: data.seller_id,
      details: { product_id: data.product_id, listing_id: sellerListingId },
    });

    return data;
  },

  /**
   * Reject a seller's product listing
   */
  async rejectSellerListing(
    sellerListingId: string,
    reason: string,
    adminId: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from('product_sellers')
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', sellerListingId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'reject_seller_product',
      target_type: 'grooming_store',
      target_id: data.seller_id,
      details: { product_id: data.product_id, listing_id: sellerListingId, reason },
    });

    return data;
  },

  /**
   * Update seller listing details (price, stock)
   */
  async updateSellerListing(sellerListingId: string, updates: {
    seller_price?: number;
    seller_stock?: number;
    seller_sku?: string;
  }): Promise<any> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.seller_price !== undefined) updateData.seller_price = updates.seller_price;
    if (updates.seller_stock !== undefined) updateData.seller_stock = updates.seller_stock;
    if (updates.seller_sku !== undefined) updateData.seller_sku = updates.seller_sku;

    const { data, error } = await supabase
      .from('product_sellers')
      .update(updateData)
      .eq('id', sellerListingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deactivate a seller's listing
   */
  async deactivateSellerListing(sellerListingId: string, adminId: string): Promise<any> {
    const { data, error } = await supabase
      .from('product_sellers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sellerListingId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await adminActivityLogService.logActivity({
      admin_id: adminId,
      action: 'deactivate_seller_product',
      target_type: 'grooming_store',
      target_id: data.seller_id,
      details: { product_id: data.product_id },
    });

    return data;
  },

  /**
   * Get seller approval statistics
   */
  async getSellerStats(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    bySellerType: {
      grooming_store: { pending: number; approved: number; rejected: number };
      doctor: { pending: number; approved: number; rejected: number };
    };
  }> {
    const { data, error } = await supabase
      .from('product_sellers')
      .select('id, approval_status, seller_type');

    if (error) throw error;

    const listings = data || [];

    return {
      totalPending: listings.filter(l => l.approval_status === 'pending').length,
      totalApproved: listings.filter(l => l.approval_status === 'approved').length,
      totalRejected: listings.filter(l => l.approval_status === 'rejected').length,
      bySellerType: {
        grooming_store: {
          pending: listings.filter(
            l => l.seller_type === 'grooming_store' && l.approval_status === 'pending'
          ).length,
          approved: listings.filter(
            l => l.seller_type === 'grooming_store' && l.approval_status === 'approved'
          ).length,
          rejected: listings.filter(
            l => l.seller_type === 'grooming_store' && l.approval_status === 'rejected'
          ).length,
        },
        doctor: {
          pending: listings.filter(
            l => l.seller_type === 'doctor' && l.approval_status === 'pending'
          ).length,
          approved: listings.filter(
            l => l.seller_type === 'doctor' && l.approval_status === 'approved'
          ).length,
          rejected: listings.filter(
            l => l.seller_type === 'doctor' && l.approval_status === 'rejected'
          ).length,
        },
      },
    };
  },
};

// =====================================================
// ADMIN SETTINGS SERVICE
// =====================================================

export const adminSettingsService = {
  /**
   * Get all platform settings
   */
  async getAllSettings(): Promise<any[]> {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('setting_key');

    if (error) {
      console.error('Error fetching settings:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Get a specific setting by key
   */
  async getSetting(key: string): Promise<any> {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error) {
      console.error(`Error fetching setting ${key}:`, error);
      return null;
    }
    return data?.setting_value?.value ?? data?.setting_value;
  },

  /**
   * Update a setting
   */
  async updateSetting(key: string, value: any, description?: string): Promise<any> {
    const updateData: any = {
      setting_value: typeof value === 'object' ? value : { value },
      updated_at: new Date().toISOString(),
    };

    if (description) {
      updateData.description = description;
    }

    const { data, error } = await supabase
      .from('platform_settings')
      .update(updateData)
      .eq('setting_key', key)
      .select()
      .single();

    if (error) {
      // If setting doesn't exist, try to insert it
      if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
        const { data: insertData, error: insertError } = await supabase
          .from('platform_settings')
          .insert({
            setting_key: key,
            setting_value: typeof value === 'object' ? value : { value },
            description: description || '',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return insertData;
      }
      throw error;
    }
    return data;
  },

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaults(): Promise<void> {
    const defaults = [
      { key: 'online_consultation_platform_fee', value: 0.05, desc: 'Platform fee for Online Consultations (decimal)' },
      { key: 'home_visit_platform_fee', value: 0.05, desc: 'Platform fee for Home Visits (decimal)' },
      { key: 'clinic_visit_platform_fee', value: 0.05, desc: 'Platform fee for Clinic Visits (decimal)' },
      { key: 'grooming_platform_fee', value: 0.05, desc: 'Platform fee for Grooming Services (decimal)' },
      { key: 'shop_margin_percentage', value: 0.15, desc: 'Default margin for shop products (decimal)' },
    ];

    for (const d of defaults) {
      await this.updateSetting(d.key, d.value, d.desc);
    }
  }
};

// =====================================================
// PRODUCT SELLER SERVICE
// =====================================================

export const productSellerService = {
  /**
   * Get products for a specific seller from product_sellers table
   */
  async getSellerProducts(sellerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('product_sellers')
      .select(`
        *,
        shop_products(*)
      `)
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to include seller-specific data
    return (data || []).map(ps => ({
      ...ps.shop_products,
      seller_price: ps.seller_price,
      seller_stock: ps.seller_stock,
      seller_sku: ps.seller_sku,
      seller_type: ps.seller_type,
      product_seller_id: ps.id,
      approval_status: ps.approval_status,
    }));
  },

  /**
   * Get all product sellers for admin with filters
   */
  async getAllProductSellers(filters?: {
    seller_type?: 'admin' | 'doctor' | 'grooming_store' | 'store_manager';
    approval_status?: 'pending' | 'approved' | 'rejected';
    exclude_admin?: boolean;
  }): Promise<any[]> {
    let query = supabase
      .from('product_sellers')
      .select(`
        *,
        shop_products(*),
        users!product_sellers_seller_id_fkey(id, name, email, phone, role)
      `)
      .order('created_at', { ascending: false });

    if (filters?.seller_type) {
      query = query.eq('seller_type', filters.seller_type);
    }

    if (filters?.approval_status) {
      query = query.eq('approval_status', filters.approval_status);
    }

    if (filters?.exclude_admin) {
      query = query.neq('seller_type', 'admin');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get products created by admin only (for admin product listing)
   */
  async getAdminProducts(): Promise<ShopProduct[]> {
    const { data, error } = await supabase
      .from('product_sellers')
      .select(`
        shop_products(*)
      `)
      .eq('seller_type', 'admin')
      .eq('is_active', true)
      .eq('approval_status', 'approved');

    if (error) throw error;
    return (data || []).map(ps => ps.shop_products).filter(Boolean);
  },

  /**
   * Add a product to seller's inventory (for existing products)
   */
  async addProductToSeller(productId: string, sellerId: string, sellerData: {
    seller_price: number;
    seller_stock: number;
    seller_sku?: string;
    seller_type: 'doctor' | 'grooming_store' | 'store_manager';
  }): Promise<any> {
    const { data, error } = await supabase
      .from('product_sellers')
      .insert({
        product_id: productId,
        seller_id: sellerId,
        seller_price: sellerData.seller_price,
        seller_stock: sellerData.seller_stock,
        seller_sku: sellerData.seller_sku,
        seller_type: sellerData.seller_type,
        approval_status: 'pending',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update seller's product listing
   */
  async updateSellerProduct(productSellerId: string, updates: {
    seller_price?: number;
    seller_stock?: number;
    seller_sku?: string;
    is_active?: boolean;
  }): Promise<any> {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.seller_price !== undefined) updateData.seller_price = updates.seller_price;
    if (updates.seller_stock !== undefined) updateData.seller_stock = updates.seller_stock;
    if (updates.seller_sku !== undefined) updateData.seller_sku = updates.seller_sku;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('product_sellers')
      .update(updateData)
      .eq('id', productSellerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Approve or reject a seller's product listing
   */
  async updateApprovalStatus(productSellerId: string, status: 'approved' | 'rejected', reason?: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();

    const updateData: any = {
      approval_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      updateData.approved_by = user?.id;
      updateData.approved_at = new Date().toISOString();
    }

    if (status === 'rejected' && reason) {
      updateData.rejection_reason = reason;
    }

    const { data, error } = await supabase
      .from('product_sellers')
      .update(updateData)
      .eq('id', productSellerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get order items for a specific seller
   */
  async getSellerOrderItems(sellerId: string, status?: string): Promise<any[]> {
    let query = supabase
      .from('order_items')
      .select(`
        *,
        shop_products(id, name, main_image, base_price, sale_price),
        orders!order_items_order_id_fkey(
          *,
          users!orders_user_id_fkey(id, name, email, phone),
          addresses(*)
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('fulfillment_status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get seller stats
   */
  async getSellerStats(sellerId: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    pendingApproval: number;
    totalOrders: number;
    pendingOrders: number;
    totalEarnings: number;
  }> {
    // Get product stats
    const { data: productData } = await supabase
      .from('product_sellers')
      .select('id, is_active, approval_status')
      .eq('seller_id', sellerId);

    const products = productData || [];

    // Get order stats
    const { data: orderData } = await supabase
      .from('order_items')
      .select('id, fulfillment_status, price, quantity, admin_margin_amount')
      .eq('seller_id', sellerId);

    const orders = orderData || [];
    const totalEarnings = orders
      .filter(o => o.fulfillment_status === 'delivered')
      .reduce((sum, o) => sum + (o.price * o.quantity - (o.admin_margin_amount || 0)), 0);

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.is_active && p.approval_status === 'approved').length,
      pendingApproval: products.filter(p => p.approval_status === 'pending').length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.fulfillment_status === 'pending').length,
      totalEarnings,
    };
  }
};

// Export all services
export default {
  adminAuthService,
  adminUserManagementService,
  adminCustomerService,
  adminDoctorService,
  adminBookingService,
  adminAnalyticsService,
  adminActivityLogService,
  adminReportService,
  adminProductService,
  adminNotificationService,
  adminAttributePricingService,
  adminCategoryAttributeService,
  adminOrderAllocationService,
  adminSellerService,
  adminSettingsService,
  productSellerService,
};
