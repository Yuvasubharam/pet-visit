import { supabase } from '../lib/supabase';

export interface VideoCall {
  id: string;
  booking_id: string;
  doctor_id: string;
  user_id: string;
  channel_name: string;
  agora_app_id: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'missed';
  scheduled_start_time?: string;
  actual_start_time?: string;
  end_time?: string;
  duration_seconds?: number;
  recording_enabled: boolean;
  recording_sid?: string;
  recording_url?: string;
  recording_status: 'pending' | 'recording' | 'processing' | 'completed' | 'failed';
  doctor_joined: boolean;
  user_joined: boolean;
  doctor_join_time?: string;
  user_join_time?: string;
  notes?: string;
  call_quality_rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CallNotification {
  id: string;
  call_id: string;
  recipient_user_id: string;
  notification_type: 'call_scheduled' | 'call_starting_soon' | 'call_started' | 'doctor_joined' | 'user_joined' | 'call_missed' | 'call_ended' | 'recording_available';
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at?: string;
}

class VideoCallService {
  /**
   * Create a new video call for a booking
   */
  async createVideoCall(bookingId: string, doctorId: string, userId: string): Promise<VideoCall> {
    try {
      // Generate unique channel name
      const channelName = `call_${bookingId}_${Date.now()}`;
      const agoraAppId = import.meta.env.VITE_AGORA_APP_ID || '';

      const { data, error } = await supabase
        .from('video_calls')
        .insert({
          booking_id: bookingId,
          doctor_id: doctorId,
          user_id: userId,
          channel_name: channelName,
          agora_app_id: agoraAppId,
          status: 'scheduled',
          recording_enabled: true,
        })
        .select()
        .single();

      if (error) {
        console.error('[VideoCallService] Error creating video call:', error);
        throw error;
      }

      console.log('[VideoCallService] Video call created:', data);
      return data;
    } catch (error) {
      console.error('[VideoCallService] Error in createVideoCall:', error);
      throw error;
    }
  }

  /**
   * Get video call by booking ID
   */
  async getVideoCallByBookingId(bookingId: string): Promise<VideoCall | null> {
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('[VideoCallService] Error fetching video call:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('[VideoCallService] Error in getVideoCallByBookingId:', error);
      return null;
    }
  }

  /**
   * Get video call by ID
   */
  async getVideoCallById(callId: string): Promise<VideoCall | null> {
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (error) {
        console.error('[VideoCallService] Error fetching video call:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[VideoCallService] Error in getVideoCallById:', error);
      return null;
    }
  }

  /**
   * Start a video call (when user joins)
   */
  async startCall(callId: string, userId: string, userType: 'doctor' | 'customer'): Promise<void> {
    try {
      const updates: any = {
        status: 'ongoing',
      };

      if (userType === 'doctor') {
        updates.doctor_joined = true;
        updates.doctor_join_time = new Date().toISOString();
      } else {
        updates.user_joined = true;
        updates.user_join_time = new Date().toISOString();
      }

      // If this is the first person to join, set actual_start_time
      const call = await this.getVideoCallById(callId);
      if (call && !call.actual_start_time) {
        updates.actual_start_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('video_calls')
        .update(updates)
        .eq('id', callId);

      if (error) {
        console.error('[VideoCallService] Error starting call:', error);
        throw error;
      }

      // Log event
      await this.logCallEvent(callId, 'participant_joined', { user_type: userType }, userId);

      console.log('[VideoCallService] Call started for', userType);
    } catch (error) {
      console.error('[VideoCallService] Error in startCall:', error);
      throw error;
    }
  }

  /**
   * End a video call
   */
  async endCall(callId: string, userId: string): Promise<void> {
    try {
      const call = await this.getVideoCallById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Calculate duration
      let duration = 0;
      if (call.actual_start_time) {
        const startTime = new Date(call.actual_start_time).getTime();
        const endTime = Date.now();
        duration = Math.floor((endTime - startTime) / 1000); // in seconds
      }

      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq('id', callId);

      if (error) {
        console.error('[VideoCallService] Error ending call:', error);
        throw error;
      }

      // Log event
      await this.logCallEvent(callId, 'call_ended', { duration_seconds: duration }, userId);

      console.log('[VideoCallService] Call ended. Duration:', duration, 'seconds');
    } catch (error) {
      console.error('[VideoCallService] Error in endCall:', error);
      throw error;
    }
  }

  /**
   * Cancel a video call
   */
  async cancelCall(callId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'cancelled',
        })
        .eq('id', callId);

      if (error) {
        console.error('[VideoCallService] Error cancelling call:', error);
        throw error;
      }

      // Log event
      await this.logCallEvent(callId, 'call_cancelled', {}, userId);

      console.log('[VideoCallService] Call cancelled');
    } catch (error) {
      console.error('[VideoCallService] Error in cancelCall:', error);
      throw error;
    }
  }

  /**
   * Update call recording status
   */
  async updateRecordingStatus(
    callId: string,
    recordingStatus: 'pending' | 'recording' | 'processing' | 'completed' | 'failed',
    recordingSid?: string,
    recordingUrl?: string
  ): Promise<void> {
    try {
      const updates: any = {
        recording_status: recordingStatus,
      };

      if (recordingSid) {
        updates.recording_sid = recordingSid;
      }

      if (recordingUrl) {
        updates.recording_url = recordingUrl;
      }

      const { error } = await supabase
        .from('video_calls')
        .update(updates)
        .eq('id', callId);

      if (error) {
        console.error('[VideoCallService] Error updating recording status:', error);
        throw error;
      }

      console.log('[VideoCallService] Recording status updated:', recordingStatus);
    } catch (error) {
      console.error('[VideoCallService] Error in updateRecordingStatus:', error);
      throw error;
    }
  }

  /**
   * Log call event
   */
  async logCallEvent(
    callId: string,
    eventType: string,
    eventData?: any,
    userId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_call_event', {
        p_call_id: callId,
        p_event_type: eventType,
        p_event_data: eventData || null,
        p_user_id: userId || null,
      });

      if (error) {
        console.error('[VideoCallService] Error logging event:', error);
        // Don't throw - logging shouldn't break the main flow
      }
    } catch (error) {
      console.error('[VideoCallService] Error in logCallEvent:', error);
      // Don't throw - logging shouldn't break the main flow
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<CallNotification[]> {
    try {
      let query = supabase
        .from('call_notifications')
        .select('*')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[VideoCallService] Error fetching notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[VideoCallService] Error in getUserNotifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('call_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        console.error('[VideoCallService] Error marking notification as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('[VideoCallService] Error in markNotificationAsRead:', error);
      throw error;
    }
  }

  /**
   * Subscribe to call notifications in real-time
   */
  subscribeToCallNotifications(userId: string, callback: (notification: CallNotification) => void) {
    const subscription = supabase
      .channel('call_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[VideoCallService] New notification:', payload.new);
          callback(payload.new as CallNotification);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Subscribe to call status changes in real-time
   */
  subscribeToCallUpdates(callId: string, callback: (call: VideoCall) => void) {
    const subscription = supabase
      .channel(`call_${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          console.log('[VideoCallService] Call updated:', payload.new);
          callback(payload.new as VideoCall);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Get or create video call for booking
   */
  async getOrCreateVideoCall(bookingId: string, doctorId: string, userId: string): Promise<VideoCall> {
    try {
      // Try to get existing call
      const existingCall = await this.getVideoCallByBookingId(bookingId);

      if (existingCall) {
        console.log('[VideoCallService] Using existing video call:', existingCall.id);
        return existingCall;
      }

      // Create new call
      console.log('[VideoCallService] Creating new video call for booking:', bookingId);
      return await this.createVideoCall(bookingId, doctorId, userId);
    } catch (error) {
      console.error('[VideoCallService] Error in getOrCreateVideoCall:', error);
      throw error;
    }
  }
}

export const videoCallService = new VideoCallService();
export default videoCallService;
