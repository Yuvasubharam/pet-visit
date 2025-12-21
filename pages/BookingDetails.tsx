
import React from 'react';

interface Props {
  onBack: () => void;
}

const BookingDetails: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 h-screen overflow-hidden antialiased fade-in">
      <header className="flex items-center bg-white p-4 pb-2 justify-between shrink-0 z-10 shadow-sm border-b border-gray-100">
        <button 
          onClick={onBack}
          className="text-gray-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-primary text-xl font-extrabold tracking-tight flex-1 text-center font-display">
          Booking Details
        </h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-40 px-6 space-y-6 pt-6">
        {/* Status Card */}
        <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 fill-current text-[24px]">check_circle</span>
              <p className="text-2xl font-black text-gray-900 leading-none tracking-tighter">Confirmed</p>
            </div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Booking #83921 • Upcoming</p>
          </div>
          <div className="flex items-center justify-center bg-primary/10 rounded-[28px] h-16 w-16 text-primary shadow-lg shadow-primary/5">
            <span className="material-symbols-outlined text-4xl">home_health</span>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-[40px] p-7 shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-[32px] border-4 border-gray-50 shadow-xl overflow-hidden p-1 bg-white">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7A1kI2w4YYa-I2qlAUcQNzZeXM0pfSNHXwphXMktI6JojMYec51oFWtkjynWTfLYl1KvTnVgq1PQmTztWsgAh4g7tPU263_xRdzU7EExl3iVtMdfuj_WrAl6JkfvRFNaZpEcW2RBdttmO1aN5WswhSeXGdkktvOLKIjT9GAP10kd_10IfR35GBB5xesOdMfQ2u0LDHKBCH7wL7eCtSs9tpOexQoMYkZ_Xd4JlhBi-IizLsBR_LMsqRfwcgd8Tty56PKnQ8BOl0Vo" className="w-full h-full rounded-[24px] object-cover" />
              </div>
              <div className="space-y-1">
                <h3 className="text-gray-900 text-lg font-black leading-tight tracking-tight">Dr. Sarah Jenkins</h3>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest">Veterinarian • Surgeon</p>
              </div>
            </div>
            <button className="w-12 h-12 bg-primary text-white rounded-[18px] flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </button>
          </div>
          
          <div className="h-px bg-gray-50"></div>

          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full border-4 border-primary/5 p-1 bg-white shadow-lg overflow-hidden">
              <img src="https://picsum.photos/seed/buddy/100/100" className="w-full h-full rounded-full object-cover" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Patient</p>
              <p className="text-sm font-black text-gray-900 tracking-tight">Buddy (Golden Retriever)</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-8 tracking-tight font-display">Appointment Info</h3>
          <div className="grid grid-cols-2 gap-y-10 gap-x-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-primary">
                <span className="material-symbols-outlined text-[22px] font-black">calendar_today</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Date</span>
              </div>
              <p className="text-sm font-black text-gray-900 ml-8">Oct 24, 2023</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-primary">
                <span className="material-symbols-outlined text-[22px] font-black">schedule</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Time</span>
              </div>
              <p className="text-sm font-black text-gray-900 ml-8">10:00 AM</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-primary">
                <span className="material-symbols-outlined text-[22px] font-black">medical_services</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Type</span>
              </div>
              <p className="text-sm font-black text-gray-900 ml-8">Home Consult</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-primary">
                <span className="material-symbols-outlined text-[22px] font-black">timer</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
              </div>
              <p className="text-sm font-black text-gray-900 ml-8">45 Minutes</p>
            </div>
          </div>
        </div>

        {/* Location / Directions */}
        <div className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-5 px-2">
            <h3 className="font-black text-gray-900">Location</h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
              Navigate <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </button>
          </div>
          <div className="px-2 pb-2">
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-4">123 Maple Street, Springfield, IL 62704</p>
            <div className="w-full aspect-video bg-gray-100 rounded-[32px] relative overflow-hidden shadow-inner">
              <img src="https://picsum.photos/seed/mapview/600/300" className="w-full h-full object-cover opacity-60" alt="Map" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                <span className="material-symbols-outlined text-red-500 text-5xl drop-shadow-2xl fill-current">location_on</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Fee</p>
              <p className="text-xl font-black text-gray-900">$75.00</p>
            </div>
          </div>
          <span className="px-5 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-emerald-100">Paid</span>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-gray-100 p-6 pb-10 space-y-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3">
          <button className="w-full py-5 bg-primary text-white font-black text-base rounded-[28px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <span className="material-symbols-outlined font-black">edit_calendar</span>
            Reschedule
          </button>
          <button className="w-full py-5 bg-transparent text-gray-400 font-black text-base rounded-[28px] border border-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <span className="material-symbols-outlined font-black text-[22px]">cancel</span>
            Cancel Booking
          </button>
        </div>
      </footer>
    </div>
  );
};

export default BookingDetails;
