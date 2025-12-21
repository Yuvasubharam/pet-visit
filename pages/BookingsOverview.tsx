
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onHomeClick: () => void;
  onDetailClick: () => void;
  onPlusClick: () => void;
  onJoinCall: () => void;
  onProfileClick: () => void;
}

const BookingsOverview: React.FC<Props> = ({ onBack, onHomeClick, onDetailClick, onPlusClick, onJoinCall, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<'Current' | 'Past'>('Current');

  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 antialiased overflow-hidden fade-in">
      <div className="relative flex h-full w-full flex-col max-w-md mx-auto bg-background-light overflow-hidden">
        <header className="flex items-center bg-white p-4 sticky top-0 z-20 shadow-sm">
          <div 
            onClick={onBack}
            className="text-gray-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </div>
          <h2 className="text-primary text-xl font-extrabold leading-tight tracking-tight flex-1 text-center pr-2 font-display">My Bookings</h2>
          <div className="flex w-10 items-center justify-end">
            <button className="flex items-center justify-center rounded-full size-10 hover:bg-gray-100 transition-colors text-gray-900">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </header>

        <div className="px-6 py-5 bg-background-light sticky top-[72px] z-10">
          <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-gray-200/50 p-1">
            <button 
              onClick={() => setActiveTab('Current')}
              className={`flex-1 h-full rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'Current' ? 'bg-white text-primary shadow-lg' : 'text-gray-400'}`}
            >
              Current
            </button>
            <button 
              onClick={() => setActiveTab('Past')}
              className={`flex-1 h-full rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'Past' ? 'bg-white text-primary shadow-lg' : 'text-gray-400'}`}
            >
              Past
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col gap-6 pb-40">
          {activeTab === 'Current' ? (
            <>
              <div 
                onClick={onDetailClick}
                className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[22px] bg-blue-50 text-primary flex items-center justify-center shadow-lg shadow-blue-500/5 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                      <span className="material-symbols-outlined text-3xl">videocam</span>
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-base leading-tight">Online Consult</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Video Call Session</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[8px] font-black bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-100">
                    Confirmed
                  </span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100/50">
                  <div className="w-12 h-12 rounded-[18px] bg-cover bg-center border-2 border-white shadow-xl overflow-hidden shrink-0" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDZSi_wO3hDHRDR12_XSDXht8zqj74RJ693oqU_V1NsO1I_nvjcbuzU9ZzXNtCw-6QkMr4T8lTnIXB_QW92KSmbay-3ezvlKn-KTNF_c_QAw-1U53gmSdXaPVUbDz50oHHPi0SGa6Q17pz3LFJLnKxlQaKhaNq8ur5dzoWiLCixIONd-W82XZyKDADJGUvUMAhd6bM6MIGsoOVfZfTtGBmUKCtT38RHgjnTODw07B59Mn7RGWbK8byoKwH4TBGzrY_trkwIg8vZ1xc')"}}></div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-900 leading-none">Dr. Sarah Smith</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Veterinarian</p>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-200"></div>
                  <div className="flex flex-col items-center pl-2 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                      <span className="material-symbols-outlined text-sm fill-current">pets</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-1 uppercase">Bella</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl font-black">calendar_month</span>
                    <span className="text-xs font-black text-gray-700">Tomorrow, 10:00 AM</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onJoinCall(); }}
                  className="w-full py-4 bg-primary hover:bg-primary-light text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-lg font-black">videocam</span>
                  Join Consultation
                </button>
              </div>

              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 group cursor-pointer active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[22px] bg-purple-50 text-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/5 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500">
                      <span className="material-symbols-outlined text-3xl">home_health</span>
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-base leading-tight">Home Visit</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Standard Checkup</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[8px] font-black bg-amber-50 text-amber-600 uppercase tracking-widest border border-amber-100">
                    Pending
                  </span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100/50">
                  <div className="w-12 h-12 rounded-[18px] bg-cover bg-center border-2 border-white shadow-xl overflow-hidden shrink-0" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbg6149UmutkPV8FLo9IWBvtlvc_UEulpTr-dsAfU-_9N3VWtsnzCSf_q0AGoHHnmtK1uZ4cFAJdvHbv3VDZ6QGdDbnsFTR5ElwMHY3LQwVQwB2Cql4-8lagElnIEee2oJtD--lH98fNQysOvDm1kyIdTyI8aNY8_l0VQWkz58yVdZ54aES2C2QMvgU_Ws2FJ13sENlDBV8tVK2y2mOFA_cKV3_GUPM_t_HbMYIMqVzKCk93vyqDdVoNpmtLW_1WMYJKIZRKUjHSY')"}}></div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-900 leading-none">Dr. Alex Jones</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Vet Tech</p>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-200"></div>
                  <div className="flex flex-col items-center pl-2 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                      <span className="material-symbols-outlined text-sm fill-current">cruelty_free</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-700 mt-1 uppercase">Max</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-4 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors">Reschedule</button>
                  <button className="py-4 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors">Manage</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
               <span className="material-symbols-outlined text-[80px] text-primary">history_toggle_off</span>
               <p className="font-black uppercase tracking-[0.3em] text-sm mt-6">History Empty</p>
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe pt-4 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <div className="flex justify-around items-center h-16 pb-2 px-4 relative">
            <button 
              onClick={onHomeClick}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
            >
              <span className="material-symbols-outlined group-hover:-translate-y-0.5 transition-transform duration-200">home</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
            </button>
            <button className="flex flex-col items-center justify-center flex-1 gap-1 text-primary relative">
              <span className="material-symbols-outlined fill-current -translate-y-0.5">calendar_month</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Bookings</span>
              <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"></div>
            </button>
            
            <div className="flex-1 relative flex justify-center">
              <div 
                onClick={onPlusClick}
                className="absolute -top-12 w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/30 border-4 border-white cursor-pointer transform hover:scale-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-white text-4xl font-black">add</span>
              </div>
            </div>

            <button className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all">
              <span className="material-symbols-outlined group-hover:-translate-y-0.5 transition-transform duration-200">pets</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Pets</span>
            </button>
            <button 
              onClick={onProfileClick}
              className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
            >
              <span className="material-symbols-outlined group-hover:-translate-y-0.5 transition-transform duration-200">account_circle</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default BookingsOverview;
