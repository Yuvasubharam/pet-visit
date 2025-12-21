
import React from 'react';

interface Props {
  onBack: () => void;
  onPay: () => void;
}

const Checkout: React.FC<Props> = ({ onBack, onPay }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light font-body text-gray-900 antialiased overflow-hidden fade-in">
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white shadow-sm z-30 border-b border-gray-50">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                </button>
                <h1 className="text-xl font-extrabold text-primary tracking-tight font-display">Checkout</h1>
            </div>
            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">shield_lock</span>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-48">
            {/* Order Summary */}
            <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-900 text-lg tracking-tight">Order Summary</h3>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">#PV-9210</span>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Service Fee</span>
                        <span className="text-gray-900">$50.00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-400 uppercase tracking-widest text-[10px]">Tax & Handling</span>
                        <span className="text-gray-900">$2.50</span>
                    </div>
                    <div className="h-px bg-gray-50 w-full"></div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-black text-gray-900">Total Due</span>
                        <span className="text-3xl font-black text-primary tracking-tighter">$52.50</span>
                    </div>
                </div>
            </section>

            {/* Payment Methods */}
            <section className="space-y-5">
                <h3 className="font-black text-gray-900 text-lg tracking-tight px-2">Payment Method</h3>
                <div className="space-y-4">
                    {/* Active Option: Card */}
                    <div className="bg-white rounded-[40px] border-2 border-primary p-7 shadow-2xl shadow-primary/5 relative">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl font-black">credit_card</span>
                            </div>
                            <span className="font-black text-gray-900 text-base">Credit / Debit Card</span>
                            <div className="ml-auto flex gap-2">
                                <div className="w-8 h-5 bg-gray-200 rounded-md"></div>
                                <div className="w-8 h-5 bg-gray-300 rounded-md"></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Card Number</label>
                                <div className="relative">
                                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm font-black focus:ring-primary focus:ring-2 placeholder-gray-300 shadow-inner" />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300">verified</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry</label>
                                    <input type="text" placeholder="MM/YY" className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm font-black focus:ring-primary shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CVV</label>
                                    <input type="password" placeholder="***" className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm font-black focus:ring-primary shadow-inner" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center gap-3">
                            <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary" checked readOnly />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Save card securely</span>
                        </div>
                    </div>

                    {/* Secondary Options */}
                    <div className="bg-white rounded-[32px] border border-gray-100 p-6 flex items-center gap-5 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <span className="font-black text-xs italic tracking-tighter">Pay</span>
                        </div>
                        <span className="font-black text-gray-900">Apple Pay</span>
                        <div className="ml-auto size-6 rounded-full border-2 border-gray-200"></div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 p-6 flex items-center gap-5 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-500/10">
                            <span className="material-symbols-outlined text-3xl">account_balance</span>
                        </div>
                        <span className="font-black text-gray-900">Net Banking</span>
                        <div className="ml-auto size-6 rounded-full border-2 border-gray-200"></div>
                    </div>
                </div>
            </section>
        </main>

        <div className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-gray-100 p-8 pb-12 z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
            <button 
                onClick={onPay}
                className="w-full py-5 bg-primary hover:bg-primary-light text-white font-black text-lg rounded-[28px] shadow-[0_20px_50px_rgba(1,75,122,0.3)] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
                Confirm Payment • $52.50
            </button>
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-300">
                <span className="material-symbols-outlined text-sm font-black">lock</span>
                <p className="text-[9px] font-black uppercase tracking-[0.3em]">PCI-DSS Secure Gateway</p>
            </div>
        </div>
    </div>
  );
};

export default Checkout;
