import React, { useEffect, useRef, useState } from 'react';
import { agoraService } from '../services/agoraService';
import { videoCallService, VideoCall } from '../services/videoCallService';
import type { UID } from 'agora-rtc-sdk-ng';

interface Props {
  onEnd: () => void;
  bookingId: string;
  userId: string;
  doctorId: string;
  userType: 'doctor' | 'customer';
  doctorName?: string;
}

const LiveConsultation: React.FC<Props> = ({ onEnd, bookingId, userId, doctorId, userType, doctorName = 'Doctor' }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [videoCall, setVideoCall] = useState<VideoCall | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<number | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      console.log('[LiveConsultation] Initializing call for booking:', bookingId);

      // Get or create video call record
      const call = await videoCallService.getOrCreateVideoCall(bookingId, doctorId, userId);
      setVideoCall(call);

      console.log('[LiveConsultation] Video call:', call);

      // Set up Agora event listeners
      agoraService.onUserJoined = handleUserJoined;
      agoraService.onUserLeft = handleUserLeft;
      agoraService.onRemoteVideoTrack = handleRemoteVideoTrack;
      agoraService.onConnectionStateChange = handleConnectionStateChange;

      // Join the call
      await agoraService.joinCall({
        channelName: call.channel_name,
        userId: userId,
        role: userType,
      });

      // Display local video
      displayLocalVideo();

      // Update call status
      await videoCallService.startCall(call.id, userId, userType);

      setIsConnected(true);
      setIsConnecting(false);

      // Start duration timer
      callStartTimeRef.current = Date.now();
      startDurationTimer();

      console.log('[LiveConsultation] Call initialized successfully');
    } catch (err) {
      console.error('[LiveConsultation] Error initializing call:', err);
      setError('Failed to connect to the call. Please check your camera and microphone permissions.');
      setIsConnecting(false);
    }
  };

  const displayLocalVideo = () => {
    const localVideoTrack = agoraService.getLocalVideoTrack();
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
      console.log('[LiveConsultation] Local video displayed');
    }
  };

  const handleUserJoined = (uid: UID) => {
    console.log('[LiveConsultation] Remote user joined:', uid);
    // Don't set remoteUserJoined here - wait for video track to be published
  };

  const handleUserLeft = (uid: UID) => {
    console.log('[LiveConsultation] Remote user left:', uid);
    setRemoteUserJoined(false);
  };

  const handleRemoteVideoTrack = (uid: UID, track: any) => {
    console.log('[LiveConsultation] Remote video track received:', uid);
    if (remoteVideoRef.current) {
      track.play(remoteVideoRef.current);
      console.log('[LiveConsultation] Remote video displayed');
      // Set remoteUserJoined when we actually receive and play the video
      setRemoteUserJoined(true);
    }
  };

  const handleConnectionStateChange = (curState: string, revState: string, reason?: string) => {
    console.log('[LiveConsultation] Connection state changed:', curState);

    if (curState === 'CONNECTED') {
      setIsConnected(true);
      setIsConnecting(false);
    } else if (curState === 'DISCONNECTED') {
      setIsConnected(false);
    }
  };

  const startDurationTimer = () => {
    durationIntervalRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setCallDuration(elapsed);
    }, 1000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMicrophone = async () => {
    try {
      const enabled = await agoraService.toggleMicrophone();
      setIsMicOn(enabled);
    } catch (err) {
      console.error('[LiveConsultation] Error toggling microphone:', err);
    }
  };

  const toggleCamera = async () => {
    try {
      const enabled = await agoraService.toggleCamera();
      setIsCameraOn(enabled);
    } catch (err) {
      console.error('[LiveConsultation] Error toggling camera:', err);
    }
  };

  const switchCamera = async () => {
    try {
      await agoraService.switchCamera();
    } catch (err) {
      console.error('[LiveConsultation] Error switching camera:', err);
    }
  };

  const endCall = async () => {
    try {
      // End call in database
      if (videoCall) {
        await videoCallService.endCall(videoCall.id, userId);
      }

      // Clean up and navigate back
      await cleanup();
      onEnd();
    } catch (err) {
      console.error('[LiveConsultation] Error ending call:', err);
      // Still navigate back even if there's an error
      await cleanup();
      onEnd();
    }
  };

  const cleanup = async () => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Leave Agora call
    try {
      await agoraService.leaveCall();
    } catch (err) {
      console.error('[LiveConsultation] Error leaving call:', err);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-slate-900 font-display overflow-hidden h-screen w-full relative fade-in items-center justify-center">
        <div className="text-center px-6">
          <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
          <h2 className="text-white text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-white/80 text-sm mb-6">{error}</p>
          <button
            onClick={onEnd}
            className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex-1 flex flex-col bg-slate-900 font-display overflow-hidden h-screen w-full relative fade-in items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-bold">Connecting to call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 font-display overflow-hidden h-screen w-full relative fade-in">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0 w-full h-full bg-slate-900 z-0">
        <div
          ref={remoteVideoRef}
          className="w-full h-full bg-slate-800"
          style={{ display: remoteUserJoined ? 'block' : 'none' }}
        ></div>
        {!remoteUserJoined && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4 mx-auto">
                <span className="material-symbols-outlined text-white text-5xl">person</span>
              </div>
              <p className="text-white/80 text-lg">Waiting for {userType === 'doctor' ? 'patient' : 'doctor'} to join...</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
      </div>

      {/* Top Bar */}
      <div className="relative z-10 w-full pt-12 pb-4 px-4 flex items-start justify-between">
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white">
          <span className="material-symbols-outlined text-[24px]">expand_more</span>
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            {remoteUserJoined && (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            )}
            <h2 className="text-white text-lg font-bold shadow-sm">{doctorName}</h2>
          </div>
          <div className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
            <span className="text-white/90 text-sm font-medium tracking-wide">{formatDuration(callDuration)}</span>
          </div>
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white">
          <span className="material-symbols-outlined text-[20px]">signal_cellular_alt</span>
        </button>
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="relative z-10 flex-1 w-full px-4 py-4 pointer-events-none">
        <div className="absolute top-4 right-4 w-28 aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 pointer-events-auto">
          <div
            ref={localVideoRef}
            className="w-full h-full bg-slate-700"
            style={{ display: isCameraOn ? 'block' : 'none' }}
          ></div>
          {!isCameraOn && (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <span className="material-symbols-outlined text-white text-3xl">videocam_off</span>
            </div>
          )}
          <button
            onClick={switchCamera}
            className="absolute bottom-2 right-2 p-1 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">cameraswitch</span>
          </button>
        </div>
      </div>

      {/* Connection Status Message */}
      {!isConnected && (
        <div className="absolute bottom-32 left-4 right-4 z-10 pointer-events-none">
          <div className="flex items-start gap-3 bg-amber-500/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-amber-200 max-w-sm mx-auto">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-sm">wifi_off</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white mb-0.5">Connection Issue</p>
              <p className="text-sm text-white/90 truncate">Reconnecting...</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="relative z-20 w-full px-4 pb-12 pt-4">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-xl mx-2 sm:mx-auto sm:max-w-md w-full self-center">
          <button
            onClick={toggleMicrophone}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-800 group"
          >
            <div className={`${isMicOn ? 'bg-primary/10' : 'bg-red-100'} p-2 rounded-full mb-0`}>
              <span className={`material-symbols-outlined ${isMicOn ? 'text-primary' : 'text-red-500'} text-[24px]`}>
                {isMicOn ? 'mic' : 'mic_off'}
              </span>
            </div>
          </button>
          <button
            onClick={toggleCamera}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-800"
          >
            <div className={`${isCameraOn ? 'bg-gray-100' : 'bg-red-100'} p-2 rounded-full mb-0`}>
              <span className={`${isCameraOn ? 'text-gray-600' : 'text-red-500'} material-symbols-outlined text-[24px]`}>
                {isCameraOn ? 'videocam' : 'videocam_off'}
              </span>
            </div>
          </button>
          <button
            onClick={endCall}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-transform active:scale-95 mx-2 -my-4 border-4 border-white z-10 relative"
          >
            <span className="material-symbols-outlined text-[32px] fill-current">call_end</span>
          </button>
          <button className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-800">
            <span className="material-symbols-outlined text-gray-600 text-[24px]">chat_bubble</span>
          </button>
          <button className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-800">
            <span className="material-symbols-outlined text-gray-600 text-[24px]">more_vert</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveConsultation;
