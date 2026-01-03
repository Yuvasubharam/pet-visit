import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';

// Agora Configuration
// NOTE: You need to get these from Agora Console (https://console.agora.io/)
export const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

// Token generation endpoint - You'll need to implement this on your backend
const TOKEN_ENDPOINT = '/api/agora/token';

interface AgoraConfig {
  appId: string;
  channel: string;
  token?: string;
  uid?: UID;
}

interface JoinCallParams {
  channelName: string;
  userId: string;
  role: 'doctor' | 'customer';
}

class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private remoteUsers: Map<UID, { audioTrack?: IRemoteAudioTrack; videoTrack?: IRemoteVideoTrack }> = new Map();

  // Event callbacks
  public onUserJoined?: (uid: UID) => void;
  public onUserLeft?: (uid: UID) => void;
  public onRemoteVideoTrack?: (uid: UID, track: IRemoteVideoTrack) => void;
  public onRemoteAudioTrack?: (uid: UID, track: IRemoteAudioTrack) => void;
  public onConnectionStateChange?: (curState: string, revState: string, reason?: string) => void;

  constructor() {
    // Initialize Agora Client
    this.client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    });

    this.setupClientEvents();
  }

  /**
   * Set up event listeners for Agora client
   */
  private setupClientEvents() {
    if (!this.client) return;

    // User published event
    this.client.on('user-published', async (user, mediaType) => {
      console.log('[Agora] User published:', user.uid, mediaType);

      // Subscribe to the remote user
      await this.client!.subscribe(user, mediaType);
      console.log('[Agora] Subscribed to user:', user.uid, mediaType);

      if (mediaType === 'video') {
        const remoteVideoTrack = user.videoTrack;
        console.log('[Agora] Remote video track:', remoteVideoTrack ? 'Available' : 'Not available');
        if (remoteVideoTrack) {
          const userData = this.remoteUsers.get(user.uid) || {};
          userData.videoTrack = remoteVideoTrack;
          this.remoteUsers.set(user.uid, userData);

          console.log('[Agora] Calling onRemoteVideoTrack callback...');
          if (this.onRemoteVideoTrack) {
            this.onRemoteVideoTrack(user.uid, remoteVideoTrack);
          } else {
            console.warn('[Agora] onRemoteVideoTrack callback not set!');
          }
        }
      }

      if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          const userData = this.remoteUsers.get(user.uid) || {};
          userData.audioTrack = remoteAudioTrack;
          this.remoteUsers.set(user.uid, userData);

          // Play the remote audio track
          remoteAudioTrack.play();

          if (this.onRemoteAudioTrack) {
            this.onRemoteAudioTrack(user.uid, remoteAudioTrack);
          }
        }
      }
    });

    // User unpublished event
    this.client.on('user-unpublished', (user, mediaType) => {
      console.log('[Agora] User unpublished:', user.uid, mediaType);

      const userData = this.remoteUsers.get(user.uid);
      if (userData) {
        if (mediaType === 'video') {
          userData.videoTrack = undefined;
        }
        if (mediaType === 'audio') {
          userData.audioTrack = undefined;
        }
      }
    });

    // User joined event
    this.client.on('user-joined', (user) => {
      console.log('[Agora] User joined:', user.uid);
      if (this.onUserJoined) {
        this.onUserJoined(user.uid);
      }
    });

    // User left event
    this.client.on('user-left', (user) => {
      console.log('[Agora] User left:', user.uid);
      this.remoteUsers.delete(user.uid);
      if (this.onUserLeft) {
        this.onUserLeft(user.uid);
      }
    });

    // Connection state change
    this.client.on('connection-state-change', (curState, revState, reason) => {
      console.log('[Agora] Connection state changed:', curState, 'Previous:', revState, 'Reason:', reason);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(curState, revState, reason);
      }
    });
  }

  /**
   * Generate Agora token from backend (Production)
   */
  async generateToken(channelName: string, uid: string, role: 'publisher' | 'subscriber' = 'publisher'): Promise<string> {
    try {
      console.log('[Agora] Generating token for channel:', channelName);

      // Call Supabase Edge Function to generate token
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase credentials not configured');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-agora-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          channelName,
          uid: uid || 0,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Agora] Token generated successfully');

      return data.token;
    } catch (error) {
      console.error('[Agora] Error generating token:', error);
      throw error;
    }
  }

  /**
   * Join a video call channel
   */
  async joinCall(params: JoinCallParams): Promise<void> {
    const { channelName, userId, role } = params;

    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    if (!AGORA_APP_ID) {
      throw new Error('AGORA_APP_ID not configured. Please set VITE_AGORA_APP_ID in your .env file');
    }

    try {
      // Check if already connected
      if (this.client.connectionState === 'CONNECTED' || this.client.connectionState === 'CONNECTING') {
        console.log('[Agora] Already connected or connecting. Skipping join.');
        return;
      }

      console.log('[Agora] Joining channel:', channelName, 'as', role);

      // Generate token from backend (using 0 to let Agora auto-assign UID)
      const token = await this.generateToken(channelName, '0', 'publisher');

      // Join the channel with token (Production mode)
      // Pass null to let Agora auto-assign a unique UID
      const uid = await this.client.join(
        AGORA_APP_ID,
        channelName,
        token, // Use real token for production
        null  // Let Agora auto-assign unique UID
      );

      console.log('[Agora] Joined channel successfully. UID:', uid);

      // Create and publish local tracks
      await this.createLocalTracks();
      await this.publishLocalTracks();

      console.log('[Agora] Published local tracks');
    } catch (error) {
      console.error('[Agora] Error joining call:', error);
      throw error;
    }
  }

  /**
   * Create local audio and video tracks
   */
  async createLocalTracks(): Promise<void> {
    try {
      // Create microphone audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log('[Agora] Microphone track created');

      // Create camera video track
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: {
          width: 640,
          height: 480,
          frameRate: 30,
          bitrateMin: 600,
          bitrateMax: 1000,
        },
      });
      console.log('[Agora] Camera track created');
    } catch (error) {
      console.error('[Agora] Error creating local tracks:', error);
      throw error;
    }
  }

  /**
   * Publish local tracks to the channel
   */
  async publishLocalTracks(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    if (!this.localAudioTrack || !this.localVideoTrack) {
      throw new Error('Local tracks not created');
    }

    try {
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
      console.log('[Agora] Local tracks published');
    } catch (error) {
      console.error('[Agora] Error publishing tracks:', error);
      throw error;
    }
  }

  /**
   * Get local video track to display in UI
   */
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  /**
   * Get local audio track
   */
  getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localAudioTrack;
  }

  /**
   * Get remote users
   */
  getRemoteUsers(): Map<UID, { audioTrack?: IRemoteAudioTrack; videoTrack?: IRemoteVideoTrack }> {
    return this.remoteUsers;
  }

  /**
   * Toggle local microphone
   */
  async toggleMicrophone(): Promise<boolean> {
    if (!this.localAudioTrack) return false;

    const enabled = this.localAudioTrack.enabled;
    await this.localAudioTrack.setEnabled(!enabled);
    console.log('[Agora] Microphone', !enabled ? 'enabled' : 'disabled');
    return !enabled;
  }

  /**
   * Toggle local camera
   */
  async toggleCamera(): Promise<boolean> {
    if (!this.localVideoTrack) return false;

    const enabled = this.localVideoTrack.enabled;
    await this.localVideoTrack.setEnabled(!enabled);
    console.log('[Agora] Camera', !enabled ? 'enabled' : 'disabled');
    return !enabled;
  }

  /**
   * Switch camera (front/back on mobile)
   */
  async switchCamera(): Promise<void> {
    if (!this.localVideoTrack) return;

    try {
      // Get available video devices
      const devices = await AgoraRTC.getCameras();
      if (devices.length <= 1) {
        console.log('[Agora] Only one camera available');
        return;
      }

      // Get current device
      const currentDevice = this.localVideoTrack.getMediaStreamTrack().getSettings().deviceId;

      // Find next device
      const currentIndex = devices.findIndex(d => d.deviceId === currentDevice);
      const nextDevice = devices[(currentIndex + 1) % devices.length];

      // Switch to next device
      await this.localVideoTrack.setDevice(nextDevice.deviceId);
      console.log('[Agora] Switched camera to:', nextDevice.label);
    } catch (error) {
      console.error('[Agora] Error switching camera:', error);
      throw error;
    }
  }

  /**
   * Leave the call
   */
  async leaveCall(): Promise<void> {
    try {
      // Stop local tracks
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      // Leave the channel
      if (this.client) {
        await this.client.leave();
        console.log('[Agora] Left channel');
      }

      // Clear remote users
      this.remoteUsers.clear();
    } catch (error) {
      console.error('[Agora] Error leaving call:', error);
      throw error;
    }
  }

  /**
   * Get call statistics
   */
  async getCallStats() {
    if (!this.client) return null;

    try {
      const stats = this.client.getRTCStats();
      return stats;
    } catch (error) {
      console.error('[Agora] Error getting stats:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.leaveCall();
    this.client = null;
    this.remoteUsers.clear();
  }
}

// Export singleton instance
export const agoraService = new AgoraService();
export default agoraService;
