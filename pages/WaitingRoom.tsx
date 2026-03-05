import React, { useEffect, useState, useRef } from 'react';
import { videoCallService, VideoCall } from '../services/videoCallService';
import { supabase } from '../lib/supabase';
import type { Booking } from '../types';

interface Props {
  onBack: () => void;
  onJoin: () => void;
  booking: Booking;
  userId: string;
  userType: 'doctor' | 'customer';
}

interface SystemCheckResult {
  camera: { available: boolean; label: string };
  microphone: { available: boolean; label: string };
}

const WaitingRoom: React.FC<Props> = ({ onBack, onJoin, booking, userId, userType }) => {
  const [timeUntilStart, setTimeUntilStart] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [systemCheck, setSystemCheck] = useState<SystemCheckResult>({
    camera: { available: false, label: 'Checking...' },
    microphone: { available: false, label: 'Checking...' },
  });
  const [videoCall, setVideoCall] = useState<VideoCall | null>(null);
  const [note, setNote] = useState('');
  const [isSendingNote, setIsSendingNote] = useState(false);
  const [doctorOnline, setDoctorOnline] = useState(false);
  const [canJoinNow, setCanJoinNow] = useState(false);
  const [isConsultationCompleted, setIsConsultationCompleted] = useState(false);

  const timerIntervalRef = useRef<number | null>(null);
  const subscriptionRef = useRef<any>(null);
  const bookingSubscriptionRef = useRef<any>(null);

  // Safety check - if booking is not provided, show error
  if (!booking) {
    return (
      <div className="flex-1 flex flex-col bg-background-light font-display text-slate-900 overflow-hidden fade-in items-center justify-center">
        <div className="text-center px-6">
          <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
          <h2 className="text-slate-900 text-xl font-bold mb-2">No Booking Found</h2>
          <p className="text-slate-600 text-sm mb-6">Unable to load booking details.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (booking && booking.id) {
      // Check initial booking status
      setIsConsultationCompleted(booking.status === 'completed');

      initializeWaitingRoom();
      checkSystemRequirements();
      startCountdownTimer();
      subscribeToBookingStatus();
    }

    return () => {
      cleanup();
    };
  }, [booking]);

  const initializeWaitingRoom = async () => {
    try {
      // Get or create video call
      const call = await videoCallService.getOrCreateVideoCall(
        booking.id,
        booking.doctor_id || '',
        booking.user_id
      );
      setVideoCall(call);

      // Subscribe to video call updates
      subscriptionRef.current = videoCallService.subscribeToCallUpdates(call.id, (updatedCall) => {
        setVideoCall(updatedCall);

        // Check if other party has joined
        if (userType === 'customer' && updatedCall.doctor_joined) {
          setDoctorOnline(true);
        } else if (userType === 'doctor' && updatedCall.user_joined) {
          setDoctorOnline(true);
        }

        // Enable join button if call is ongoing
        if (updatedCall.status === 'ongoing') {
          setCanJoinNow(true);
        }
      });

      console.log('[WaitingRoom] Initialized for booking:', booking.id);
    } catch (error) {
      console.error('[WaitingRoom] Error initializing:', error);
    }
  };

  const checkSystemRequirements = async () => {
    try {
      // Check for camera
      const cameras = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = cameras.filter((device) => device.kind === 'videoinput');
      const audioDevices = cameras.filter((device) => device.kind === 'audioinput');

      setSystemCheck({
        camera: {
          available: videoDevices.length > 0,
          label: videoDevices[0]?.label || 'No camera detected',
        },
        microphone: {
          available: audioDevices.length > 0,
          label: audioDevices[0]?.label || 'No microphone detected',
        },
      });

      // Request permissions
      if (videoDevices.length > 0 || audioDevices.length > 0) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: videoDevices.length > 0,
            audio: audioDevices.length > 0,
          });

          // Update with actual device labels
          const updatedCameras = await navigator.mediaDevices.enumerateDevices();
          const updatedVideoDevices = updatedCameras.filter((device) => device.kind === 'videoinput');
          const updatedAudioDevices = updatedCameras.filter((device) => device.kind === 'audioinput');

          setSystemCheck({
            camera: {
              available: updatedVideoDevices.length > 0,
              label: updatedVideoDevices[0]?.label || 'Camera',
            },
            microphone: {
              available: updatedAudioDevices.length > 0,
              label: updatedAudioDevices[0]?.label || 'Microphone',
            },
          });

          // Stop the stream
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          console.error('[WaitingRoom] Permission denied:', err);
        }
      }
    } catch (error) {
      console.error('[WaitingRoom] Error checking system:', error);
    }
  };

  const startCountdownTimer = () => {
    const updateTimer = () => {
      const appointmentTime = new Date(`${booking.date}T${booking.time}`);
      const now = new Date();
      const diff = appointmentTime.getTime() - now.getTime();

      if (diff <= 0) {
        // Time has passed, can join now (if not completed)
        setTimeUntilStart({ hours: 0, minutes: 0, seconds: 0 });
        if (!isConsultationCompleted) {
          setCanJoinNow(true);
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilStart({ hours, minutes, seconds });

      // Don't allow joining before scheduled time - user must wait for the exact time slot
      setCanJoinNow(false);
    };

    updateTimer();
    timerIntervalRef.current = window.setInterval(updateTimer, 1000);
  };

  const handleSendNote = async () => {
    if (!note.trim() || !booking.id) return;

    try {
      setIsSendingNote(true);

      // Save note to booking
      const { error } = await supabase
        .from('bookings')
        .update({ notes: note })
        .eq('id', booking.id);

      if (error) throw error;

      console.log('[WaitingRoom] Note sent:', note);
      setNote('');

      // Show success feedback
      alert('Note sent to doctor!');
    } catch (error) {
      console.error('[WaitingRoom] Error sending note:', error);
      alert('Failed to send note');
    } finally {
      setIsSendingNote(false);
    }
  };

  const subscribeToBookingStatus = () => {
    if (!booking?.id) return;

    // Subscribe to real-time booking status changes
    bookingSubscriptionRef.current = supabase
      .channel(`booking-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`,
        },
        (payload: any) => {
          console.log('[WaitingRoom] Booking status changed:', payload.new);
          if (payload.new.status === 'completed') {
            setIsConsultationCompleted(true);
            setCanJoinNow(false);
          }
        }
      )
      .subscribe();

    console.log('[WaitingRoom] Subscribed to booking status updates');
  };

  const cleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    if (bookingSubscriptionRef.current) {
      bookingSubscriptionRef.current.unsubscribe();
    }
  };

  const getDoctorName = () => {
    // You can fetch doctor details from booking if available
    return 'Doctor';
  };

  const getPetName = () => {
    return booking.pets?.name || 'Your Pet';
  };

  const getPetBreed = () => {
    return booking.pets?.breed || booking.pets?.species || '';
  };

  const formatTime = (time: string) => {
    try {
      const date = new Date(`2000-01-01T${time}`);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return time;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const padNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-slate-900 overflow-hidden fade-in">
      <div className="relative flex h-full w-full flex-col mx-auto max-w-md bg-background-light shadow-2xl overflow-hidden">
        <header className="flex items-center bg-background-light p-4 pb-2 justify-between z-10">
          <button
            onClick={onBack}
            className="text-slate-800 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Waiting Room</h2>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {/* Consultation Completed Banner */}
          {isConsultationCompleted && (
            <div className="mx-4 mt-4 mb-2 px-4 py-3 bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-600">check_circle</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Consultation Completed</p>
                <p className="text-xs text-slate-600 mt-0.5">This consultation has ended</p>
              </div>
            </div>
          )}

          {/* Real-time Status Banner */}
          {!isConsultationCompleted && doctorOnline && (
            <div className="mx-4 mt-4 mb-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-sm font-semibold text-green-800">
                {userType === 'customer' ? 'Doctor is online and ready!' : 'Patient is waiting!'}
              </p>
            </div>
          )}

          {/* Appointment Card */}
          <div className="p-4">
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-cover bg-center shrink-0 border-2 border-white shadow-sm overflow-hidden">
                  {booking?.pets?.image ? (
                    <img src={booking.pets.image} alt={booking.pets?.name || 'Pet'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-3xl">pets</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">UPCOMING APPOINTMENT</p>
                  <h3 className="text-slate-900 text-lg font-bold leading-tight truncate">{getDoctorName()}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-primary">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <p className="text-sm font-medium leading-normal">
                      {formatDate(booking.date)}, {formatTime(booking.time)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-px bg-slate-100 w-full"></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-lg">pets</span>
                </div>
                <p className="text-slate-700 text-sm font-medium">
                  {getPetName()} {getPetBreed() ? `(${getPetBreed()})` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Timer Section */}
          <div className="flex flex-col items-center justify-center pt-2 pb-6 px-4">
            <h3 className="text-slate-500 tracking-wide text-sm font-semibold uppercase mb-4">
              {isConsultationCompleted ? 'CONSULTATION ENDED' : canJoinNow ? 'READY TO JOIN' : 'CONSULTATION STARTS IN'}
            </h3>
            <div className="flex gap-3 w-full max-w-[320px]">
              <div className="flex grow basis-0 flex-col items-center gap-2">
                <div className={`flex h-16 w-full items-center justify-center rounded-xl shadow-sm border ${
                  canJoinNow ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'
                }`}>
                  <p className={`text-2xl font-bold tracking-tight ${canJoinNow ? 'text-green-600' : 'text-primary'}`}>
                    {padNumber(timeUntilStart.hours)}
                  </p>
                </div>
                <p className="text-slate-400 text-xs font-medium">Hours</p>
              </div>
              <div className="h-16 flex items-center justify-center">
                <span className={`font-bold text-xl ${canJoinNow ? 'text-green-600' : 'text-primary'}`}>:</span>
              </div>
              <div className="flex grow basis-0 flex-col items-center gap-2">
                <div className={`flex h-16 w-full items-center justify-center rounded-xl shadow-sm border ${
                  canJoinNow ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'
                }`}>
                  <p className={`text-2xl font-bold tracking-tight ${canJoinNow ? 'text-green-600' : 'text-primary'}`}>
                    {padNumber(timeUntilStart.minutes)}
                  </p>
                </div>
                <p className="text-slate-400 text-xs font-medium">Minutes</p>
              </div>
              <div className="h-16 flex items-center justify-center">
                <span className={`font-bold text-xl ${canJoinNow ? 'text-green-600' : 'text-primary'}`}>:</span>
              </div>
              <div className="flex grow basis-0 flex-col items-center gap-2">
                <div className={`flex h-16 w-full items-center justify-center rounded-xl shadow-sm border ${
                  canJoinNow ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'
                }`}>
                  <p className={`text-2xl font-bold tracking-tight ${canJoinNow ? 'text-green-600' : 'text-primary'}`}>
                    {padNumber(timeUntilStart.seconds)}
                  </p>
                </div>
                <p className="text-slate-400 text-xs font-medium">Seconds</p>
              </div>
            </div>
          </div>

          {/* System Check */}
          <div className="px-4 pb-6">
            <h3 className="text-slate-900 text-base font-bold leading-tight px-1 pb-3">System Check</h3>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                    <span className="material-symbols-outlined">videocam</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">Camera</span>
                    <span className="text-xs text-slate-500 truncate max-w-[180px]">{systemCheck.camera.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    systemCheck.camera.available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {systemCheck.camera.available ? 'check_circle' : 'cancel'}
                    </span>
                    {systemCheck.camera.available ? 'Ready' : 'Not Found'}
                  </span>
                </div>
              </div>
              <div className="h-px bg-slate-100 w-full pl-14"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                    <span className="material-symbols-outlined">mic</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">Microphone</span>
                    <span className="text-xs text-slate-500 truncate max-w-[180px]">{systemCheck.microphone.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    systemCheck.microphone.available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {systemCheck.microphone.available ? 'check_circle' : 'cancel'}
                    </span>
                    {systemCheck.microphone.available ? 'Ready' : 'Not Found'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Note */}
          {userType === 'customer' && (
            <div className="px-4">
              <h3 className="text-slate-900 text-base font-bold leading-tight px-1 pb-3">Quick Note</h3>
              <div className="relative">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                  disabled={isSendingNote}
                  className="w-full bg-white rounded-2xl border-0 ring-1 ring-slate-200 py-3.5 pl-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary shadow-sm transition-all disabled:opacity-50"
                  placeholder="Leave a note for the doctor..."
                  type="text"
                />
                <button
                  onClick={handleSendNote}
                  disabled={!note.trim() || isSendingNote}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 px-1">Doctors review these notes before the call begins.</p>
            </div>
          )}
        </main>

        <footer className="absolute bottom-0 w-full bg-white border-t border-slate-100 p-4 pb-8 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={onJoin}
            disabled={isConsultationCompleted || !canJoinNow || (!systemCheck.camera.available && !systemCheck.microphone.available)}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              !isConsultationCompleted && canJoinNow && (systemCheck.camera.available || systemCheck.microphone.available)
                ? 'bg-primary hover:bg-sky-800 active:scale-[0.98] text-white shadow-primary/25'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined">
              {isConsultationCompleted ? 'check_circle' : 'video_camera_front'}
            </span>
            {isConsultationCompleted
              ? 'Consultation Completed'
              : canJoinNow
                ? 'Join Consultation'
                : 'Waiting for Scheduled Time...'}
          </button>
          {!isConsultationCompleted && !canJoinNow && (
            <p className="text-xs text-center text-slate-500 mt-2">
              You can join at your scheduled appointment time
            </p>
          )}
          {isConsultationCompleted && (
            <p className="text-xs text-center text-slate-500 mt-2">
              This consultation has been completed by the doctor
            </p>
          )}
        </footer>
      </div>
    </div>
  );
};

export default WaitingRoom;
