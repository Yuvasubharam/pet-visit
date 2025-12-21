
import React from 'react';

interface Props {
  onClose: () => void;
  onSelect: (type: 'online' | 'home' | 'clinic') => void;
}

const NewBookingPopup: React.FC<Props> = ({ onClose, onSelect }) => {
  return (
    <>
      <div 
        className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 z-[70] p-4 fade-in">
        <div className="bg-white rounded-[2rem] p-6 pb-8 shadow-2xl ring-1 ring-black/5">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
          <div className="text-center mb-8">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">New Booking</h3>
            <p className="text-slate-500 text-sm font-medium">Select a service to proceed</p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => onSelect('online')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 hover:border-primary/30 transition-all active:scale-[0.98] group text-left relative overflow-hidden shadow-sm"
            >
              <div className="size-12 rounded-full bg-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <span className="material-symbols-outlined">videocam</span>
              </div>
              <div>
                <span className="block text-[15px] font-bold text-slate-900">Book Online Consult</span>
                <span className="block text-xs text-slate-500 font-medium mt-0.5">Video call with a specialist</span>
              </div>
              <div className="ml-auto text-slate-300 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </button>

            <button 
              onClick={() => onSelect('home')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 hover:border-primary/30 transition-all active:scale-[0.98] group text-left relative overflow-hidden shadow-sm"
            >
              <div className="size-12 rounded-full bg-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <span className="material-symbols-outlined">home_health</span>
              </div>
              <div>
                <span className="block text-[15px] font-bold text-slate-900">Book Home Visit</span>
                <span className="block text-xs text-slate-500 font-medium mt-0.5">Vet comes to your doorstep</span>
              </div>
              <div className="ml-auto text-slate-300 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </button>

            <button 
              onClick={() => onSelect('clinic')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 hover:border-primary/30 transition-all active:scale-[0.98] group text-left relative overflow-hidden shadow-sm"
            >
              <div className="size-12 rounded-full bg-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <span className="material-symbols-outlined">local_hospital</span>
              </div>
              <div>
                <span className="block text-[15px] font-bold text-slate-900">Book Clinic Visit</span>
                <span className="block text-xs text-slate-500 font-medium mt-0.5">Visit a nearby vet clinic</span>
              </div>
              <div className="ml-auto text-slate-300 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </button>
          </div>
          <button 
            onClick={onClose}
            className="w-full mt-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default NewBookingPopup;
