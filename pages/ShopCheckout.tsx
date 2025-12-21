
import React from 'react';

interface Props {
  onBack: () => void;
  onPlaceOrder: () => void;
}

const ShopCheckout: React.FC<Props> = ({ onBack, onPlaceOrder }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-32">
        <div className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm border-b border-gray-200/50">
          <div className="flex items-center h-16 px-4 justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="text-[#111418] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <p className="text-primary tracking-tight text-[22px] font-extrabold leading-tight">Checkout</p>
            </div>
            <button className="text-primary font-bold text-sm">Help?</button>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-between items-center relative">
          <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-gray-200 -z-10"></div>
          <div className="flex flex-col items-center gap-1 bg-background-light px-2 z-10">
            <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">1</div>
            <p className="text-[10px] font-bold text-primary">Cart</p>
          </div>
          <div className="flex flex-col items-center gap-1 bg-background-light px-2 z-10">
            <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-background-light">2</div>
            <p className="text-[10px] font-bold text-primary">Checkout</p>
          </div>
          <div className="flex flex-col items-center gap-1 bg-background-light px-2 z-10">
            <div className="size-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">3</div>
            <p className="text-[10px] font-bold text-gray-400">Done</p>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-40 space-y-6">
          <div className="px-4">
            <h3 className="px-1 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</h3>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 text-primary rounded-full p-2.5 shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#111418] text-base">Home</h4>
                    <button className="text-primary text-sm font-bold px-2 py-1 -mr-2 rounded-lg hover:bg-blue-50 transition-colors">Change</button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Jane Doe<br/>
                    123 Pet Lover Lane, Apt 4B<br/>
                    San Francisco, CA 94107
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4">
            <h3 className="px-1 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Method</h3>
            <div className="flex flex-col gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/20 ring-1 ring-primary/20 relative overflow-hidden group cursor-pointer">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                  <span className="material-symbols-outlined filled" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-14 bg-gray-50 rounded border border-gray-200 flex items-center justify-center shrink-0">
                    <span className="font-bold text-blue-900 italic text-sm font-serif">VISA</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-[#111418] text-sm">Visa ending in 4242</p>
                    <p className="text-xs text-gray-500">Expires 09/28</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4">
            <h3 className="px-1 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Order Items (2)</h3>
            <div className="flex flex-col gap-3">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 items-center">
                <div className="h-20 w-20 shrink-0 bg-white rounded-xl border border-gray-100 p-2 flex items-center justify-center overflow-hidden">
                  <img alt="Dog Food" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPLGN2ii82OQcglGSR7fkEJbpPZgGo_eiL4uDVNV9mQkTckta1fmzUMSBr2_2J1Qwaodbz3dtRLn2AplK8Gu8hRpd9JeWBfoIcEMdgtH5VxDy-mQtab64yiyEfMxvoFmZqsNnBAw3byJRTbthi10McS6jNAE9tNaW4ueAIYX6s-2vze_fnGuvwssFeiPe39JJOgNxAteGARuPdoLdmoWcKeSElotyyy12eKiUR4ggeItEn4uSO-fiXdw1UxGrhGt3PzMfzBdtDum4"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-0.5">Royal Canin</p>
                  <p className="font-semibold text-[#111418] text-sm leading-tight line-clamp-2">Medium Adult Dry Dog Food</p>
                  <div className="flex justify-between items-end mt-2">
                    <p className="font-bold text-[#111418]">$45.99</p>
                    <div className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">Qty: 1</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-12">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-500 text-sm font-medium">Subtotal</span>
                <span className="font-bold text-[#111418]">$58.98</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-500 text-sm font-medium">Shipping Fee</span>
                <span className="font-bold text-[#111418]">$5.00</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 text-sm font-medium">Discount</span>
                <span className="font-bold text-green-600">-$2.00</span>
              </div>
              <div className="h-px bg-gray-100 w-full mb-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#111418]">Total</span>
                <span className="text-2xl font-extrabold text-primary">$61.98</span>
              </div>
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="p-4">
            <button 
              onClick={onPlaceOrder}
              className="w-full bg-primary hover:bg-[#013d63] text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Place Order</span>
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCheckout;
