
import React from 'react';

interface Props {
  onClose: () => void;
  onRetry: () => void;
}

const PaymentFailure: React.FC<Props> = ({ onClose, onRetry }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden">
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="size-10"></div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight font-display">Payment Issue</h1>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
                <span className="material-symbols-outlined text-gray-900">close</span>
            </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="relative">
                <div className="absolute inset-0 bg-red-500/10 rounded-full blur-3xl scale-150"></div>
                <div className="w-48 h-48 bg-white rounded-full shadow-2xl flex items-center justify-center relative z-10 p-4">
                    <img src="https://picsum.photos/seed/sadpup/300/300" className="w-full h-full object-cover rounded-full opacity-60" />
                    <div className="absolute -bottom-2 bg-red-500 text-white w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-3xl font-black">close</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Transaction Failed</h2>
                <p className="text-sm text-gray-500 font-medium px-4">We couldn't process your payment. Please check your card or try a different method.</p>
            </div>

            <div className="w-full bg-red-50 rounded-[32px] p-5 border border-red-100 flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
                    <span className="material-symbols-outlined">error</span>
                </div>
                <div>
                    <p className="text-xs font-black text-red-600 leading-none mb-1 uppercase tracking-widest">Card Declined</p>
                    <p className="text-[10px] text-gray-400 font-bold">Ending in •••• 4242</p>
                </div>
            </div>
        </main>

        <div className="p-6 pb-10 space-y-3 bg-background-light">
            <button onClick={onRetry} className="w-full py-4 bg-primary text-white font-black text-base rounded-[24px] shadow-xl shadow-primary/20">Try Again</button>
            <button onClick={onClose} className="w-full py-4 text-gray-400 font-black text-base border border-gray-100 rounded-[24px]">Contact Support</button>
        </div>
    </div>
  );
};

export default PaymentFailure;
