
import React from 'react';

interface Props {
  onBack: () => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onShopClick: () => void;
  onProfileClick: () => void;
}

const OrderDetailsPage: React.FC<Props> = ({ onBack, onHomeClick, onVisitsClick, onShopClick, onProfileClick }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-32">
        <div className="flex flex-col gap-2 p-4 pb-2 sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm border-b border-black/5">
          <div className="flex items-center h-12 justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="text-[#111418] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <p className="text-[#111418] tracking-tight text-xl font-bold leading-tight">Order #29384</p>
            </div>
            <button className="text-primary text-sm font-bold px-2 py-1 hover:bg-primary/5 rounded-lg transition-colors">Help</button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-6 pb-40">
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Estimated Delivery</p>
                <h2 className="text-xl font-bold text-primary">Today, 2:00 PM - 4:00 PM</h2>
              </div>
              <div className="bg-blue-50 text-primary p-2 rounded-full">
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
              </div>
            </div>
            <div className="relative flex items-center justify-between w-full mb-2">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3/4 h-1 bg-primary rounded-full"></div>
              <div className="flex flex-col items-center gap-2 z-10"><div className="w-4 h-4 rounded-full bg-primary ring-4 ring-blue-50"></div></div>
              <div className="flex flex-col items-center gap-2 z-10"><div className="w-4 h-4 rounded-full bg-primary ring-4 ring-blue-50"></div></div>
              <div className="flex flex-col items-center gap-2 z-10"><div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-blue-50 shadow-sm"><span className="w-2 h-2 bg-white rounded-full"></span></div></div>
              <div className="flex flex-col items-center gap-2 z-10"><div className="w-4 h-4 rounded-full bg-gray-200 ring-4 ring-white"></div></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-2">
              <span className="text-primary">Confirmed</span>
              <span className="text-primary">Packed</span>
              <span className="text-primary">Shipping</span>
              <span>Delivered</span>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#111418]">Out for Delivery</p>
                <p className="text-xs text-gray-500">Your pet supplies are on the way with Mike.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[#111418] text-lg font-bold px-1">Items (3)</h3>
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 divide-y divide-gray-100 overflow-hidden">
              <div className="p-4 flex gap-4">
                <div className="w-20 h-20 shrink-0 bg-background-light rounded-xl p-2 flex items-center justify-center">
                  <img alt="Dog Food" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPLGN2ii82OQcglGSR7fkEJbpPZgGo_eiL4uDVNV9mQkTckta1fmzUMSBr2_2J1Qwaodbz3dtRLn2AplK8Gu8hRpd9JeWBfoIcEMdgtH5VxDy-mQtab64yiyEfMxvoFmZqsNnBAw3byJRTbthi10McS6jNAE9tNaW4ueAIYX6s-2vze_fnGuvwssFeiPe39JJOgNxAteGARuPdoLdmoWcKeSElotyyy12eKiUR4ggeItEn4uSO-fiXdw1UxGrhGt3PzMfzBdtDum4"/>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] text-primary font-bold uppercase mb-0.5">Royal Canin</p>
                  <p className="text-sm font-bold text-[#111418] line-clamp-2 leading-tight">Medium Adult Dry Dog Food</p>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xs font-medium text-gray-500">Size: 15lb • Qty: 1</p>
                    <p className="text-sm font-bold text-[#111418]">$45.99</p>
                  </div>
                </div>
              </div>
              <div className="p-4 flex gap-4">
                <div className="w-20 h-20 shrink-0 bg-background-light rounded-xl p-2 flex items-center justify-center">
                  <img alt="Dog Toy" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlcvySymcrsEFhVXbLd6WEB2Z7PhG8t-PldpXJC46UgMHLQbHU90kg9mVO11V-XmVvwloCcu8AM8UDJz6vCL2NnyPyyUnJdWMwUzXMWO2kE7jIbO8Bu7g3-TtakwW3fIvsrqvNaPkceb1l-MZJgx4xR0TMuo6tEhzH9aZheOtmCzcUGROl0yJNmgmrofP4OEV6Kgx0RZtN2BBAzu4eT9cAer5-5WiL-SOMFrVqAI68tARf8pQIjZ8rKxvihFPWRf1IYfWwlGsWMWU"/>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] text-primary font-bold uppercase mb-0.5">Kong</p>
                  <p className="text-sm font-bold text-[#111418] line-clamp-2 leading-tight">Classic Rubber Dog Toy - Red</p>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xs font-medium text-gray-500">Size: Medium • Qty: 2</p>
                    <p className="text-sm font-bold text-[#111418]">$25.98</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5">
              <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Delivery Address</h3>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">location_on</span>
                <div>
                  <p className="text-sm font-bold text-[#111418]">Home</p>
                  <p className="text-xs text-gray-500 leading-relaxed">1234 Pet Lover Lane,<br/>San Francisco, CA 94110</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">credit_card</span>
                <p className="text-sm font-bold text-[#111418]">Visa ending in 4242</p>
              </div>
              <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[#111418] text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-bold">$71.97</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery Fee</span><span className="font-bold">$5.99</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-bold">$6.25</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-green-600 font-bold">-$2.00</span></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-[#111418]">Total Amount</span>
              <span className="text-xl font-bold text-primary">$82.21</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pb-12">
            <button className="w-full bg-primary hover:bg-[#013d63] text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined">support_agent</span>
              Contact Support
            </button>
            <button className="w-full bg-white text-[#111418] border border-gray-200 font-bold h-12 rounded-xl flex items-center justify-center transition-all active:scale-[0.98]">
              Return Item
            </button>
          </div>
        </main>

        <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-200 pb-safe">
          <div className="flex justify-around items-center h-16">
            <button onClick={onHomeClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">home</span>
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={onVisitsClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
              <span className="text-[10px] font-medium">Visits</span>
            </button>
            <button onClick={onShopClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
              <span className="text-[10px] font-medium">Shop</span>
            </button>
            <button onClick={onProfileClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-primary">
              <span className="material-symbols-outlined text-[24px] filled" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
