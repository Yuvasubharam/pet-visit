
import React from 'react';

interface Props {
  onBack: () => void;
  onJoin: () => void;
}

const WaitingRoom: React.FC<Props> = ({ onBack, onJoin }) => {
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
          {/* Appointment Card */}
          <div className="p-4">
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-cover bg-center shrink-0 border-2 border-white shadow-sm" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCxz3vxYVxlkxKXvrTw2pgTTvW__ryY5cLLnzhIh0-qhRiVcEiidMsOPLoSjZQnGsjk-Td3vTaC0f78_l0aJVxYW6bccfK_JLSsdtweW225Zw0Pyxwo-0c2P8_ONReI7ERvqaYWOhbYzcqku_baz115tJbTzBI0g8X_4FV7KW7o1OfnvXhQOYW1yDrxi1J_LYRkn2iFrGsHKevDrqnovCjK-x14UuU-UJfsxskV1aYuA4EJqV_KGg-2V94DPi4TAHNijyhJg_WBViE")'}}></div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">UPCOMING APPOINTMENT</p>
                  <h3 className="text-slate-900 text-lg font-bold leading-tight truncate">Dr. Sarah Jenkins</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-primary">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <p className="text-sm font-medium leading-normal">Today, 10:00 AM</p>
                  </div>
                </div>
              </div>
              <div className="h-px bg-slate-100 w-full"></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-lg">pets</span>
                </div>
                <p className="text-slate-700 text-sm font-medium">Luna (Golden Retriever)</p>
              </div>
            </div>
          </div>

          {/* Timer Section */}
          <div className="flex flex-col items-center justify-center pt-2 pb-6 px-4">
            <h3 className="text-slate-500 tracking-wide text-sm font-semibold uppercase mb-4">CONSULTATION STARTS IN</h3>
            <div className="flex gap-3 w-full max-w-[320px]">
              <div className="flex grow basis-0 flex-col items-center gap-2">
                <div className="flex h-16 w-full items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                  <p className="text-primary text-2xl font-bold tracking-tight">00</p>
                </div>
                <p className="text-slate-400 text-xs font-medium">Hours</p>
              </div>
              <div className="h-16 flex items-center justify-center">
                <span className="text-primary font-bold text-xl">:</span>
              </div>
              <div className="flex grow basis-0 flex-col items-center gap-2">
                <div className="flex h-16 w-full items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                  <p className="text-primary text-2xl font-bold tracking-tight">14</p>
                </div>
                <p className="text-slate-400 text-xs font-medium">Minutes</p>
              </div>
              <div className="h-16 flex items-center justify-center">
                <span className="text-primary font-bold text-xl">:</span>
              </div>
              <div className="flex grow basis-0 flex-col items-center gap-2">
                <div className="flex h-16 w-full items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                  <p className="text-primary text-2xl font-bold tracking-tight">59</p>
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
                    <span className="text-xs text-slate-500">FaceTime HD Camera</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Ready
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
                    <span className="text-xs text-slate-500">Default Microphone</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-primary text-xs font-bold hover:underline">Test</button>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                    Not Detected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Note */}
          <div className="px-4">
            <h3 className="text-slate-900 text-base font-bold leading-tight px-1 pb-3">Quick Note</h3>
            <div className="relative">
              <input className="w-full bg-white rounded-2xl border-0 ring-1 ring-slate-200 py-3.5 pl-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary shadow-sm transition-all" placeholder="Leave a note for Dr. Sarah..." type="text"/>
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/5 rounded-full transition-colors">
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 px-1">Doctors review these notes before the call begins.</p>
          </div>
        </main>

        <footer className="absolute bottom-0 w-full bg-white border-t border-slate-100 p-4 pb-8 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onJoin}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-sky-800 active:scale-[0.98] transition-all text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25"
          >
            <span className="material-symbols-outlined">video_camera_front</span>
            Join Consultation
          </button>
        </footer>
      </div>
    </div>
  );
};

export default WaitingRoom;
