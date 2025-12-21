
import React from 'react';
import { Pet } from '../types';

interface Props {
    pets: Pet[];
    onServiceClick: (service: string) => void;
    onShopClick: () => void;
    onBookingsClick: () => void;
    onPlusClick: () => void;
    onProfileClick: () => void;
}

const Home: React.FC<Props> = ({ pets, onServiceClick, onShopClick, onBookingsClick, onPlusClick, onProfileClick }) => {
    return (
        <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white shadow-sm z-30">
                <div className="flex items-center gap-3">
                    <img src="assets/images/logo.jpg" className="h-10 w-26 object-contain" alt="Logo" />
                    <div className="h-8 w-[1px] bg-gray-100"></div>
                    <div>
                        <h2 className="text-lg font-black text-primary font-display leading-none">Home</h2>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">New York City</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center relative hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-600 text-[22px]">notifications</span>
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div
                        onClick={onProfileClick}
                        className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    >
                        <img src="https://picsum.photos/seed/jessica/100/100" className="w-full h-full rounded-full object-cover" alt="User" />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                <div className="p-6 bg-white border-b border-gray-100">
                    <div className="flex items-baseline gap-1 mb-1">
                        <h1 className="text-2xl font-extrabold text-gray-900">Hello, Jessica!</h1>
                        <span className="text-xl">👋</span>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Your pets are waiting for some love today.</p>

                    <div className="mt-6 flex items-center gap-4 bg-primary/5 rounded-2xl p-4 border border-primary/10 cursor-pointer" onClick={onBookingsClick}>
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">event_upcoming</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Upcoming Visit</p>
                            <p className="text-sm font-black text-gray-900">Grooming for Max</p>
                            <p className="text-[11px] text-gray-500 font-medium">Tomorrow, 10:30 AM</p>
                        </div>
                        <span className="material-symbols-outlined text-primary/40">chevron_right</span>
                    </div>
                </div>

                <div className="px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Quick Services</h3>
                        <button className="text-primary font-bold text-xs hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { name: 'Online Consult', icon: 'video_camera_front', color: 'bg-blue-500' },
                            { name: 'Grooming', icon: 'content_cut', color: 'bg-indigo-500' },
                            { name: 'Health Check', icon: 'stethoscope', color: 'bg-rose-500' },
                            { name: 'Pharmacy', icon: 'medication', color: 'bg-emerald-500' },
                            { name: 'Pet Food', icon: 'restaurant', color: 'bg-amber-500' },
                            { name: 'Accessories', icon: 'shopping_bag', color: 'bg-violet-500' },
                        ].map((s) => (
                            <button
                                key={s.name}
                                onClick={() => onServiceClick(s.name)}
                                className="flex flex-col items-center gap-3 p-4 bg-white rounded-[24px] shadow-sm hover:shadow-md transition-all active:scale-95 group border border-gray-50"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                                    <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                                </div>
                                <span className="text-[11px] font-black text-gray-700 text-center leading-tight">{s.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">My Little Family</h3>
                        <button onClick={onPlusClick} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
                        {pets.map((pet) => (
                            <div key={pet.id} className="flex flex-col items-center gap-3 shrink-0">
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-[28px] border-2 border-white bg-white shadow-xl overflow-hidden p-1 transition-transform group-hover:rotate-3">
                                        <img src={pet.image} className="w-full h-full rounded-[24px] object-cover" alt={pet.name} />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md">
                                        <span className="material-symbols-outlined text-[14px] fill-current">check_circle</span>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-gray-800 tracking-tight">{pet.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 pb-8">
                    <div className="w-full bg-gradient-to-br from-primary to-primary-light rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/30">
                        <div className="relative z-10 space-y-4">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Pet Store</span>
                            <h3 className="text-3xl font-black leading-[1.1]">The Best For Your Best Friend</h3>
                            <p className="text-white/70 text-sm font-medium">Exclusive deals on premium toys & nutrition.</p>
                            <button
                                onClick={onShopClick}
                                className="bg-white text-primary px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-gray-100 transition-colors active:scale-95"
                            >
                                Explore Shop
                            </button>
                        </div>
                        <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[200px] text-white/10 rotate-12 pointer-events-none">shopping_basket</span>
                    </div>
                </div>
            </main>

            <nav className="absolute bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe pt-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                <div className="flex justify-around items-center h-16 pb-2 px-4 relative">
                    <button className="flex flex-col items-center justify-center flex-1 gap-1 text-primary relative">
                        <span className="material-symbols-outlined fill-current -translate-y-0.5">home</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
                        <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"></div>
                    </button>
                    <button
                        onClick={onBookingsClick}
                        className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
                    >
                        <span className="material-symbols-outlined text-[26px]">calendar_month</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Bookings</span>
                    </button>

                    <div className="flex-1 relative flex justify-center">
                        <div
                            onClick={onPlusClick}
                            className="absolute -top-12 w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/30 border-4 border-white cursor-pointer transform hover:scale-110 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-white text-4xl font-black">add</span>
                        </div>
                    </div>

                    <button
                        onClick={onShopClick}
                        className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
                    >
                        <span className="material-symbols-outlined text-[26px]">storefront</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Shop</span>
                    </button>
                    <button
                        onClick={onProfileClick}
                        className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-300 hover:text-primary group transition-all"
                    >
                        <span className="material-symbols-outlined text-[26px] group-hover:text-primary transition-colors">account_circle</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default Home;
