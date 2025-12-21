
import React from 'react';

interface Props {
    onBack: () => void;
    onCartClick: () => void;
}

const Marketplace: React.FC<Props> = ({ onBack, onCartClick }) => {
    return (
        <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                    </button>
                    <img src="assets/images/logo.jpg" className="h-8 w-8 object-contain" alt="Logo" />
                    <h1 className="text-xl font-black text-primary tracking-tight font-display">Pet Market</h1>
                </div>
                <button
                    onClick={onCartClick}
                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 relative active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-white text-[22px]">shopping_cart</span>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white">2</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-24">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-primary-light transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Find the best for your pet..."
                        className="w-full py-4 pl-12 pr-14 bg-white border-none rounded-[20px] shadow-sm focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                    </button>
                </div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                    <button className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 shrink-0 shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <span className="material-symbols-outlined text-[18px]">apps</span>
                        <span className="text-xs font-black uppercase tracking-widest">All</span>
                    </button>
                    {[
                        { name: 'Organic', icon: 'eco' },
                        { name: 'Toys', icon: 'videogame_asset' },
                        { name: 'Care', icon: 'spa' },
                        { name: 'Pharma', icon: 'medical_services' }
                    ].map((cat) => (
                        <button key={cat.name} className="bg-white text-gray-700 px-6 py-3 rounded-2xl flex items-center gap-2 shrink-0 shadow-sm border border-gray-50 hover:border-primary/20 transition-all active:scale-95">
                            <span className="material-symbols-outlined text-primary text-[18px]">{cat.icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
                        </button>
                    ))}
                </div>

                <div className="relative aspect-[16/9] rounded-[32px] overflow-hidden shadow-2xl group cursor-pointer">
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUQuhpEtIfGp1hVNTRCMmJoSWaOY14GltHMWcDYXzw2rfbiBz2BDSKpPFbBRDGWi3fiB_xKpa83j2D1j2j6Vnwww26lG_4gdgN3XfBL3pHGDKTTnm9vfsdcHVK6n30bIX7q9kG_dJrKLfRFkxPqE3GfHv3wK61d2IO980SM5_HqZDeQQBtBT-x15MhnxEjhZ09uJG-EXpODUDVHuPDhYWbi0OUIty051RTjK1bXT4umqjCBqEioAPo5b5J47E__aA-wfFRdqr8S2U"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        alt="Promotional"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
                        <span className="bg-yellow-400 text-black text-[9px] font-black px-3 py-1 rounded-lg w-fit mb-3 uppercase tracking-widest shadow-lg">New Arrival</span>
                        <h2 className="text-white text-3xl font-black mb-1 leading-tight">Eco-Friendly Essentials</h2>
                        <p className="text-white/70 text-sm font-medium mb-6">Sustainable products for a happy planet & pet.</p>
                        <button className="bg-white text-primary px-8 py-3 rounded-xl font-black text-xs w-fit shadow-xl group-hover:bg-primary group-hover:text-white transition-all active:scale-95">Shop Collection</button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-black text-primary tracking-tight">Best Sellers</h3>
                        <button className="text-primary font-black text-[11px] uppercase tracking-widest border-b-2 border-primary/20 pb-0.5">Show All</button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { brand: 'TailWags', name: 'Premium Plush Bone Toy', price: '14.50', rating: '5.0', reviews: '1.2k', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlcvySymcrsEFhVXbLd6WEB2Z7PhG8t-PldpXJC46UgMHLQbHU90kg9mVO11V-XmVvwloCcu8AM8UDJz6vCL2NnyPyyUnJdWMwUzXMWO2kE7jIbO8Bu7g3-TtakwW3fIvsrqvNaPkceb1l-MZJgx4xR0TMuo6tEhzH9aZheOtmCzcUGROl0yJNmgmrofP4OEV6Kgx0RZtN2BBAzu4eT9cAer5-5WiL-SOMFrVqAI68tARf8pQIjZ8rKxvihFPWRf1IYfWwlGsWMWU' },
                            { brand: 'NutriChoice', name: 'Grain-Free Salmon Bites', price: '18.99', rating: '4.9', reviews: '840', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPLGN2ii82OQcglGSR7fkEJbpPZgGo_eiL4uDVNV9mQkTckta1fmzUMSBr2_2J1Qwaodbz3dtRLn2AplK8Gu8hRpd9JeWBfoIcEMdgtH5VxDy-mQtab64yiyEfMxvoFmZqsNnBAw3byJRTbthi10McS6jNAE9tNaW4ueAIYX6s-2vze_fnGuvwssFeiPe39JJOgNxAteGARuPdoLdmoWcKeSElotyyy12eKiUR4ggeItEn4uSO-fiXdw1UxGrhGt3PzMfzBdtDum4' },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white rounded-[32px] p-4 shadow-md hover:shadow-xl transition-all group flex flex-col border border-gray-50">
                                <div className="relative aspect-square bg-gray-50 rounded-[24px] mb-4 flex items-center justify-center overflow-hidden group-hover:bg-primary/5 transition-colors">
                                    <img src={item.img} className="object-contain w-3/4 h-3/4 group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                                    <button className="absolute top-3 right-3 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-[20px] fill-current">favorite</span>
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col px-1">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">{item.brand}</span>
                                    <h4 className="text-sm font-black text-gray-900 leading-tight mb-2 line-clamp-2">{item.name}</h4>
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <span className="material-symbols-outlined text-yellow-500 text-[14px] fill-current">star</span>
                                        <span className="text-[11px] font-bold text-gray-400">{item.rating} <span className="font-medium">({item.reviews})</span></span>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-xl font-black text-gray-900">${item.price}</span>
                                        <button className="w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-primary transition-all active:scale-90">
                                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Marketplace;
