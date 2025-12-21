
import React, { useState } from 'react';
import { Pet } from '../types';

interface Props {
  pets: Pet[];
  onBack: () => void;
  onBook: () => void;
}

const HomeConsultBooking: React.FC<Props> = ({ pets, onBack, onBook }) => {
  const [selectedPet, setSelectedPet] = useState<string>(pets[0]?.id || '');
  const [visitType, setVisitType] = useState<'home' | 'clinic'>('home');
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');

  const docs = [
    { 
      name: 'Dr. Sarah Smith', 
      role: 'Veterinary Surgeon', 
      rating: '4.9', 
      reviews: '120+', 
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDj38tfea70fqLut2foI7mYQL0VGyBYsqPI967lKlrhn4786s8H84esoXRy4segOLeVegfqpgU505-bYJszNUssog_hsW2ksOjkQO0BN3_AgESKmEZEORqjUvdHPkg5xDacIZ64YMZzfW6jV3QaDqzru5qiVyeynsSYfYLXJYm1KJrnb-ggNXqnhDGbTpDHWbgW63wO8wE1NeMCWQxmc2Z2gLFcUfk_ie5xoxlR7Y5W6s5mdsKsE6Nk63TceniRXTgr6EZDIePOjZw',
      clinic: 'Paws & Claws Central',
      clinicAddr: '123 Main St, Downtown'
    },
    { 
      name: 'Dr. John Doe', 
      role: 'General Vet', 
      rating: '4.7', 
      reviews: '85', 
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAILVPGDgcm7YivGLa7adtuZziISV6tGj0MVO_nQ8g9FMpX_cZWPHxe3-rNQkbsnGmv53Sea2xIzDnRKmfXYCIB7zl73NX4RtKTlT6HAiwHpBiU6V3JJ5QEMA7IZo6z_MTmbiBmku_096CE1eBPAsdJZE7h5N864C2QMauLohZ9O2xOakBPvQm9jeSjruDwjOZmxeBOOirxUfCuuqs1T3_v0H2Wvl4a9UvbEwHRIKnWyUzLQtiVNQY_NuYH4MQx-zftTqXXbMBkB8g',
      clinic: 'Happy Tails Clinic',
      clinicAddr: '456 West Side, Uptown'
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 antialiased overflow-x-hidden fade-in">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center bg-white/95 backdrop-blur-md px-4 py-3 justify-between border-b border-gray-100">
        <div 
          onClick={onBack}
          className="text-gray-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <h2 className="text-primary text-xl font-extrabold tracking-tight flex-1 text-center font-display">
          Doctor Consultation
        </h2>
        <div className="size-10"></div>
      </div>

      <main className="flex-1 flex flex-col space-y-6 pb-40 overflow-y-auto no-scrollbar">
        {/* Toggle Navbar */}
        <div className="px-6 py-4 bg-white shadow-sm">
          <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-gray-100 p-1">
            <button 
              onClick={() => setVisitType('home')}
              className={`flex-1 h-full rounded-xl text-xs font-black uppercase tracking-widest transition-all ${visitType === 'home' ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
            >
              Home Visit
            </button>
            <button 
              onClick={() => setVisitType('clinic')}
              className={`flex-1 h-full rounded-xl text-xs font-black uppercase tracking-widest transition-all ${visitType === 'clinic' ? 'bg-primary text-white shadow-lg' : 'text-gray-400'}`}
            >
              Clinic Visit
            </button>
          </div>
        </div>

        {/* Dynamic Map Header based on Visit Type */}
        <div className="relative w-full h-60 bg-gray-200">
          <img 
            src={visitType === 'home' 
              ? "https://picsum.photos/seed/home_map/600/400" 
              : "https://picsum.photos/seed/clinic_map/600/400"
            } 
            className="w-full h-full object-cover opacity-80" 
            alt="Map"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="material-symbols-outlined text-primary text-5xl drop-shadow-2xl fill-current">location_on</span>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-3xl shadow-2xl border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="bg-primary/10 text-primary p-2.5 rounded-2xl shrink-0">
                <span className="material-symbols-outlined text-2xl">
                  {visitType === 'home' ? 'home_pin' : 'local_hospital'}
                </span>
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">
                  {visitType === 'home' ? 'Your Home Address' : 'Selected Clinic'}
                </span>
                <span className="font-black text-sm truncate text-gray-900">
                  {visitType === 'home' 
                    ? '124 Pet Lane, Apt 4B, NYC' 
                    : docs[selectedDoc].clinic + ' • ' + docs[selectedDoc].clinicAddr
                  }
                </span>
              </div>
            </div>
            {visitType === 'home' && (
              <button className="text-primary font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-primary/5 rounded-xl">Edit</button>
            )}
          </div>
        </div>

        {/* Patient Selection */}
        <div className="flex flex-col px-6">
          <h3 className="text-gray-900 text-lg font-black tracking-tight mb-4">Patient</h3>
          <div className="flex items-center justify-start gap-5 overflow-x-auto no-scrollbar pb-2">
            {pets.map((pet) => (
              <div 
                key={pet.id}
                onClick={() => setSelectedPet(pet.id)}
                className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
              >
                <div className={`relative p-1 rounded-[28px] border-4 transition-all duration-300 ${selectedPet === pet.id ? 'border-primary shadow-xl scale-105' : 'border-transparent opacity-60'}`}>
                  <img src={pet.image} className="w-16 h-16 rounded-[24px] object-cover" alt={pet.name} />
                  {selectedPet === pet.id && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full border-2 border-white shadow-md">
                      <span className="material-symbols-outlined text-[12px] block font-black">check</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPet === pet.id ? 'text-primary' : 'text-gray-400'}`}>{pet.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Selection */}
        <div className="flex flex-col w-full px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 text-lg font-black tracking-tight">Available Specialists</h3>
            <button className="text-primary font-black text-[10px] uppercase tracking-widest">See All</button>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-5 pb-4">
            {docs.map((doc, i) => (
              <div 
                key={i}
                onClick={() => setSelectedDoc(i)}
                className={`min-w-[260px] p-5 rounded-[32px] border transition-all cursor-pointer ${selectedDoc === i ? 'border-primary bg-primary/5 shadow-xl ring-4 ring-primary/5' : 'border-gray-100 bg-white opacity-80'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-[24px] overflow-hidden border-2 border-white shadow-md">
                    <img src={doc.img} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900 text-sm leading-tight mb-1">{doc.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{doc.role}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-yellow-500 text-sm fill-current">star</span>
                      <span className="text-xs font-black text-gray-700">{doc.rating}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">({doc.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visit Details */}
        <div className="px-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-gray-900 text-lg font-black tracking-tight">Visit Reason</h3>
            <div className="relative">
              <select className="w-full appearance-none bg-white border border-gray-100 text-gray-900 text-sm rounded-2xl p-5 pr-12 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-black shadow-sm">
                <option>General Health Check</option>
                <option>Vaccination Follow-up</option>
                <option>Behavioral Advice</option>
                <option>Emergency Consultation</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                <span className="material-symbols-outlined font-black">expand_more</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900 text-lg font-black tracking-tight">Select Slot</h3>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">October 2023</div>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-3 py-1">
              {[23, 24, 25, 26, 27].map((d, i) => (
                <div 
                  key={d}
                  className={`flex flex-col items-center justify-center min-w-[64px] h-[80px] rounded-2xl transition-all cursor-pointer border ${i === 1 ? 'bg-primary text-white border-primary shadow-2xl scale-110' : 'bg-white border-gray-100 text-gray-400'}`}
                >
                  <span className="text-[10px] font-black uppercase mb-1">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}</span>
                  <span className="text-xl font-black">{d}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {['09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTime === t ? 'bg-primary text-white border-primary shadow-xl' : 'bg-white border-gray-100 text-gray-600 hover:border-primary/20'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Estimated Cost</span>
            <span className="text-3xl font-black text-primary tracking-tighter leading-none">${visitType === 'home' ? '85.00' : '50.00'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/5 px-4 py-2 rounded-full font-black uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm font-black">info</span>
            {visitType === 'home' ? 'Includes Travel' : 'Clinic Base Fee'}
          </div>
        </div>
        <button 
          onClick={onBook}
          className="w-full bg-primary hover:bg-primary-light text-white font-black text-base py-5 rounded-[28px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all group"
        >
          <span>Continue to Checkout</span>
          <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default HomeConsultBooking;
