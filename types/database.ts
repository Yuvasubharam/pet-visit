export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          name: string
          phone: string
          email: string | null
          profile_photo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          phone: string
          email?: string | null
          profile_photo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          phone?: string
          email?: string | null
          profile_photo_url?: string | null
        }
      }
      pets: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          species: 'dog' | 'cat'
          image: string
          breed: string | null
          age: number | null
          weight: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          species: 'dog' | 'cat'
          image: string
          breed?: string | null
          age?: number | null
          weight?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          species?: 'dog' | 'cat'
          image?: string
          breed?: string | null
          age?: number | null
          weight?: number | null
        }
      }
      addresses: {
        Row: {
          id: string
          created_at: string
          user_id: string
          type: 'Home' | 'Office' | 'Other'
          flat_number: string
          street: string
          landmark: string
          city: string
          state: string
          pincode: string
          latitude: number | null
          longitude: number | null
          full_address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          type: 'Home' | 'Office' | 'Other'
          flat_number: string
          street: string
          landmark: string
          city: string
          state: string
          pincode: string
          latitude?: number | null
          longitude?: number | null
          full_address?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          type?: 'Home' | 'Office' | 'Other'
          flat_number?: string
          street?: string
          landmark?: string
          city?: string
          state?: string
          pincode?: string
          latitude?: number | null
          longitude?: number | null
          full_address?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          user_id: string
          pet_id: string
          service_type: string
          booking_type: 'online' | 'home' | 'clinic'
          date: string
          time: string
          status: 'upcoming' | 'completed' | 'cancelled'
          address_id: string | null
          doctor_name: string | null
          notes: string | null
          payment_status: 'pending' | 'paid' | 'failed'
          payment_amount: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          pet_id: string
          service_type: string
          booking_type: 'online' | 'home' | 'clinic'
          date: string
          time: string
          status?: 'upcoming' | 'completed' | 'cancelled'
          address_id?: string | null
          doctor_name?: string | null
          notes?: string | null
          payment_status?: 'pending' | 'paid' | 'failed'
          payment_amount?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          pet_id?: string
          service_type?: string
          booking_type?: 'online' | 'home' | 'clinic'
          date?: string
          time?: string
          status?: 'upcoming' | 'completed' | 'cancelled'
          address_id?: string | null
          doctor_name?: string | null
          notes?: string | null
          payment_status?: 'pending' | 'paid' | 'failed'
          payment_amount?: number | null
        }
      }
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          brand: string
          description: string | null
          price: number
          category: string
          image: string
          stock: number
          rating: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          brand: string
          description?: string | null
          price: number
          category: string
          image: string
          stock?: number
          rating?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          brand?: string
          description?: string | null
          price?: number
          category?: string
          image?: string
          stock?: number
          rating?: number | null
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          user_id: string
          order_number: string
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          address_id: string
          subtotal: number
          delivery_fee: number
          tax: number
          discount: number
          total: number
          payment_status: 'pending' | 'paid' | 'failed'
          estimated_delivery: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          order_number: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          address_id: string
          subtotal: number
          delivery_fee: number
          tax: number
          discount: number
          total: number
          payment_status?: 'pending' | 'paid' | 'failed'
          estimated_delivery?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          order_number?: string
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          address_id?: string
          subtotal?: number
          delivery_fee?: number
          tax?: number
          discount?: number
          total?: number
          payment_status?: 'pending' | 'paid' | 'failed'
          estimated_delivery?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          created_at: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
        }
      }
      cart_items: {
        Row: {
          id: string
          created_at: string
          user_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          product_id: string
          quantity: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          product_id?: string
          quantity?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
