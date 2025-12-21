
import React, { useState } from 'react';
import { Pet } from '../types';

interface Props {
    onBack: () => void;
    pets: Pet[];
}

const Grooming: React.FC<Props> = ({ onBack, pets }) => {
    const [selectedPet, setSelectedPet] = useState<string>(pets[0]?.id || '');
    const [location, setLocation] = useState<'home' | 'clinic'>('home');
    const [selectedPackage, setSelectedPackage] = useState<string>('full');

    return (
        <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                    </button>
                    <img src="assets/images/logo.jpg" className="h-8 w-8 object-contain" alt="Logo" />
                    <h1 className="text-xl font-black text-primary tracking-tight font-display">Grooming</h1>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-32">
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Select Pet</h3>
                        <button className="text-primary font-bold text-xs uppercase tracking-widest">Add New</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
                        {pets.map((pet) => (
                            <button
                                key={pet.id}
                                onClick={() => setSelectedPet(pet.id)}
                                className="flex flex-col items-center gap-3 shrink-0 group"
                            >
                                <div className={`w-20 h-20 rounded-[28px] p-1 border-4 transition-all duration-300 ${selectedPet === pet.id ? 'border-primary shadow-xl shadow-primary/20 bg-white' : 'border-transparent opacity-50 scale-90'}`}>
                                    <img src={pet.image} className="w-full h-full rounded-[22px] object-cover" alt={pet.name} />
                                </div>
                                <span className={`text-xs font-black uppercase tracking-widest ${selectedPet === pet.id ? 'text-primary' : 'text-gray-400'}`}>{pet.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Booking Details</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-5 bg-white rounded-[24px] shadow-sm border border-gray-100">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl">call</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Contact Number</p>
                                <input
                                    type="tel"
                                    defaultValue="+1 (555) 867-5309"
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-black text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="p-1.5 bg-white rounded-[28px] flex border border-gray-100 shadow-sm">
                            <button
                                onClick={() => setLocation('home')}
                                className={`flex-1 py-4 px-6 rounded-[22px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${location === 'home' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">home</span>
                                Home Visit
                            </button>
                            <button
                                onClick={() => setLocation('clinic')}
                                className={`flex-1 py-4 px-6 rounded-[22px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${location === 'clinic' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">medical_services</span>
                                Clinic
                            </button>
                        </div>
                    </div>
                </section>

                <section className="space-y-5">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Select Package</h3>
                    <div className="space-y-5">
                        {[
                            { id: 'basic', name: 'Standard Bath', desc: 'Deep cleaning, drying, nail clipping & ear hygiene.', price: 40 },
                            { id: 'full', name: 'Full Styling', desc: 'Bath + Professional haircut, trimming & scenting.', price: 65, popular: true },
                            { id: 'luxury', name: 'Spa Day', desc: 'Full Styling + Paw massage, facial & organic treats.', price: 90 },
                        ].map((pkg) => (
                            <div
                                key={pkg.id}
                                onClick={() => setSelectedPackage(pkg.id)}
                                className={`relative p-6 rounded-[32px] border-2 transition-all cursor-pointer hover:shadow-lg ${selectedPackage === pkg.id ? 'border-primary bg-white ring-4 ring-primary/5' : 'border-white bg-white shadow-sm'}`}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-8 bg-amber-400 text-black text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Most Loved</div>
                                )}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-gray-900 leading-tight">{pkg.name}</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[90%]">{pkg.desc}</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPackage === pkg.id ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                                        {selectedPackage === pkg.id && <span className="material-symbols-outlined text-white text-[16px] font-black">check</span>}
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-gray-900 tracking-tighter">${pkg.price}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">/ session</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <div className="p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 fixed bottom-0 w-full max-w-md flex items-center justify-between gap-6 z-40">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Estimate</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">$65.00</p>
                </div>
                <button className="flex-1 py-5 bg-primary text-white font-black text-base rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all group">
                    Confirm Booking
                    <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default Grooming;
