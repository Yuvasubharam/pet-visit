
import React from 'react';

interface Props {
  onEnd: () => void;
}

const LiveConsultation: React.FC<Props> = ({ onEnd }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-900 font-display overflow-hidden h-screen w-full relative fade-in">
      {/* Background Video Simulator */}
      <div className="absolute inset-0 w-full h-full bg-slate-900 z-0">
        <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAhrejyvwAPNOVEV9Oqw3Xw7XzEY3R-NacpfTQeUrKgQrD3laz8YAJzNhjoRRU4I6BxTHw69zOW1GoBRzq2hvUPlAzXdxdC6LCbyCVF0zVgDkCjYhyLXhIg2zUgPR1ZmMw_vx_i9Wj5L2ElcCjiAvwlroCdeEJq0Q7RKPkDAMjeujwQ3uTCc7goBMWeW9aUVkDWP_61XY2TbLzdzokzMD3eHwyBI1mLy8f5D9frEf3reodaXKh2CInShtL6DewkBCPJ2_QOkMTelSk")'}}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
      </div>

      {/* Top Bar */}
      <div className="relative z-10 w-full pt-12 pb-4 px-4 flex items-start justify-between">
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white">
          <span className="material-symbols-outlined text-[24px]">expand_more</span>
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h2 className="text-white text-lg font-bold shadow-sm">Dr. Sarah Jenkins</h2>
          </div>
          <div className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
            <span className="text-white/90 text-sm font-medium tracking-wide">04:23</span>
          </div>
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white">
          <span className="material-symbols-outlined text-[20px]">signal_cellular_alt</span>
        </button>
      </div>

      {/* Middle PiP */}
      <div className="relative z-10 flex-1 w-full px-4 py-4 pointer-events-none">
        <div className="absolute top-4 right-4 w-28 aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 pointer-events-auto">
          <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDNpyNBDhG7q4RWOvGn-yAo8pc-ac9WhAa4mCkn12KM34Vr3fstwcayez3kODTx7s5P5ZHV5Xu_eyTolNlkg1mjXXm-TlBkGqyDsrscw8Q8iv0w77m6BXJJNaXAz4ajGdI947f49okfm-HqakrliO9zwH1WvqHmM3P536bkoTyBKNuYOypd_0Syd0pWCUVXWWkLSlE3I9Zz0y-PpGy3SVhIX8XKFMddzLpt3eAvWw4nX04GkTkBD1FD5nhE_u9rQ2PRZudHsXfK0Kw")'}}></div>
          <button className="absolute bottom-2 right-2 p-1 bg-black/40 rounded-full text-white">
            <span className="material-symbols-outlined text-[16px]">cameraswitch</span>
          </button>
        </div>
      </div>

      {/* Doctor Message Overlay */}
      <div className="absolute bottom-32 left-4 right-4 z-10 pointer-events-none">
        <div className="flex items-start gap-3 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-200 max-w-sm mx-auto">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-sm">medical_services</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 mb-0.5">Dr. Sarah Jenkins</p>
            <p className="text-sm text-gray-600 truncate">Let's check the paw closer to the camera.</p>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-20 w-full px-4 pb-12 pt-4">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-xl mx-2 sm:mx-auto sm:max-w-md w-full self-center">
          <button className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-800 group">
            <div className="bg-primary/10 p-2 rounded-full mb-0">
              <span className="material-symbols-outlined text-primary text-[24px]">mic</span>
            </div>
          </button>
          <button className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-800">
            <span className="material-symbols-outlined text-gray-600 text-[24px]">videocam</span>
          </button>
          <button 
            onClick={onEnd}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-transform active:scale-95 mx-2 -my-4 border-4 border-white z-10 relative"
          >
            <span className="material-symbols-outlined text-[32px] fill-current">call_end</span>
          </button>
          <button className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-slate-800">
            <span className="material-symbols-outlined text-gray-600 text-[24px]">chat_bubble</span>
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
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
