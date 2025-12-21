
import React, { useState } from 'react';
import { Pet } from '../types';

interface Props {
  pets: Pet[];
  onBack: () => void;
  onBook: () => void;
}

const OnlineConsultBooking: React.FC<Props> = ({ pets, onBack, onBook }) => {
  const [selectedPet, setSelectedPet] = useState<string>(pets[0]?.id || '');
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<'video' | 'chat'>('video');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');

  const docs = [
    { name: 'Dr. Sarah Jenkins', role: 'General Vet', rating: '4.9', reviews: '120', status: 'Online', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWbc74LFErRyuuetuhKAtKdhnVa8E7LTcaFaESktVcBisRmUSmWqUXfK1Wiu5gMiXJuFCqlB1VrNEimQ4sKMjYXgyFTXY6yBhJAJ8NAukyxZObZyJNIDFeo3PvH4mqlzcbGm4LvuZ2_nNs5FQECkHJTams9eW7dWcsOyfWvEagLWDMIMIFVoYO7ljI-0u0tQD_krryp8oQkurKQU0bJGUXIWLRgNp2zZwxqKQqerxCbyROuT9illksc8DWq8v6S0d0PLuisf7qSQQ' },
    { name: 'Dr. Mike Ross', role: 'Dermatologist', rating: '4.8', reviews: '85', status: 'Online', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9TGZOCqHHnVoHmskpi18Z_NZtz5ryvoGur-4oy7aWMra8lf5p_L1SzM6jAqvQpjmrYRns_P4M7X7zv3E8Po-5a9OsvrsWaaChhCPX_S6CoIKebkq8NvU93Q3TXo_qhQfwS6xI2Fee8fyc3BG_RNg9bRAAMnr7JgY0DvG58nU_CTmXiwgLUB-hhxI4iBCv8kDaYnnxQ9rsHYRAgWAMSY_NG9Q2GaXUVPFOmxVnwWOCgK3XSxv_uZr9VgKexx5S1D10nsXmJJKahvY' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 antialiased overflow-x-hidden fade-in">
      <div className="sticky top-0 z-50 flex items-center bg-white/95 backdrop-blur-md p-4 shadow-sm border-b border-gray-100">
        <div 
          onClick={onBack}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-gray-900">arrow_back</span>
        </div>
        <h2 className="text-primary text-xl font-extrabold tracking-tight flex-1 text-center font-display">Online Consultation</h2>
        <div className="size-10"></div>
      </div>

      <main className="flex-1 flex flex-col space-y-8 pb-40 overflow-y-auto no-scrollbar">
        {/* Patient Selection */}
        <section className="pt-6 px-6">
          <h2 className="text-lg font-black tracking-tight mb-4">Select Patient</h2>
          <div className="flex w-full overflow-x-auto no-scrollbar gap-5">
            {pets.map((pet) => (
              <div 
                key={pet.id}
                onClick={() => setSelectedPet(pet.id)}
                className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${selectedPet === pet.id ? 'scale-105' : 'opacity-50'}`}
              >
                <div className={`relative w-16 h-16 rounded-[24px] p-1 border-4 transition-all duration-300 ${selectedPet === pet.id ? 'border-primary bg-white shadow-xl' : 'border-transparent'}`}>
                  <img src={pet.image} className="w-full h-full rounded-[18px] object-cover" alt={pet.name} />
                  {selectedPet === pet.id && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-white shadow-md">
                      <span className="material-symbols-outlined text-[10px] block font-black">check</span>
                    </div>
                  )}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedPet === pet.id ? 'text-primary' : 'text-gray-400'}`}>{pet.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vet Selection */}
        <section className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black tracking-tight">Choose Specialist</h2>
            <button className="text-primary font-black text-[10px] uppercase tracking-widest">See All</button>
          </div>
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-5">
            {docs.map((doc, i) => (
              <div 
                key={i}
                onClick={() => setSelectedDoc(i)}
                className={`snap-start flex flex-col bg-white rounded-[32px] shadow-sm border min-w-[220px] overflow-hidden relative transition-all ${selectedDoc === i ? 'border-primary ring-4 ring-primary/5 shadow-xl scale-[1.02]' : 'border-gray-100 opacity-80'}`}
              >
                <div className="absolute top-3 right-3 bg-green-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 z-10 uppercase tracking-widest shadow-lg">
                  <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                  {doc.status}
                </div>
                <div className="h-40 w-full bg-center bg-no-repeat bg-cover" style={{backgroundImage: `url('${doc.img}')`}}></div>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-yellow-500 text-xs fill-current">star</span>
                    <span className="text-[11px] font-black text-gray-700">{doc.rating}</span>
                    <span className="text-[10px] text-gray-400 font-bold ml-1">({doc.reviews})</span>
                  </div>
                  <h3 className="text-gray-900 font-black text-sm mb-0.5 leading-tight">{doc.name}</h3>
                  <p className="text-primary font-black text-[10px] uppercase tracking-widest">{doc.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Method Toggle */}
        <section className="px-6">
          <h2 className="text-lg font-black tracking-tight mb-4">Consultation Method</h2>
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setSelectedMethod('video')}
              className={`flex flex-col gap-3 p-5 rounded-[32px] border-2 transition-all cursor-pointer ${selectedMethod === 'video' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-2xl w-fit ${selectedMethod === 'video' ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-2xl">videocam</span>
                </div>
                <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === 'video' ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                  {selectedMethod === 'video' && <div className="size-2 bg-white rounded-full"></div>}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="font-black text-gray-900 text-sm leading-tight">Video Call</p>
                <p className="font-black text-primary text-lg tracking-tighter leading-none">$40.00</p>
              </div>
            </div>
            
            <div 
              onClick={() => setSelectedMethod('chat')}
              className={`flex flex-col gap-3 p-5 rounded-[32px] border-2 transition-all cursor-pointer ${selectedMethod === 'chat' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-2xl w-fit ${selectedMethod === 'chat' ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-2xl">chat</span>
                </div>
                <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === 'chat' ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                  {selectedMethod === 'chat' && <div className="size-2 bg-white rounded-full"></div>}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="font-black text-gray-900 text-sm leading-tight">Text Chat</p>
                <p className="font-black text-primary text-lg tracking-tighter leading-none">$25.00</p>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black tracking-tight">Date & Time</h2>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Oct 2023</div>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-4 py-1">
            {[24, 25, 26, 27, 28].map((d, i) => (
              <div 
                key={d}
                className={`flex flex-col items-center justify-center min-w-[64px] h-[80px] rounded-2xl transition-all cursor-pointer border ${i === 0 ? 'bg-primary text-white border-primary shadow-2xl scale-110' : 'bg-white border-gray-100 text-gray-400'}`}
              >
                <span className="text-[10px] font-black uppercase mb-1">{i === 0 ? 'Today' : ['Wed', 'Thu', 'Fri', 'Sat'][i-1]}</span>
                <span className="text-xl font-black">{d}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'].map((t) => (
              <button 
                key={t} 
                onClick={() => setSelectedTime(t)}
                className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTime === t ? 'bg-primary text-white border-primary shadow-xl' : 'border-gray-100 bg-white text-gray-600 hover:border-primary/20'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-6 max-w-2xl mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Final Amount</span>
            <span className="text-3xl font-black text-primary tracking-tighter leading-none">${selectedMethod === 'video' ? '40.00' : '25.00'}</span>
          </div>
          <button 
            onClick={onBook}
            className="flex-1 bg-primary hover:bg-primary-light text-white font-black py-5 px-6 rounded-[28px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Confirm & Book</span>
            <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform font-black">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnlineConsultBooking;
