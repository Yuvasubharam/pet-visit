
import React from 'react';

interface Props {
  onBack: () => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onProceed: () => void;
  onProfileClick: () => void;
}

const Cart: React.FC<Props> = ({ onBack, onHomeClick, onVisitsClick, onProceed, onProfileClick }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
      <div className="relative flex h-full w-full flex-col overflow-x-hidden pb-32">
        <div className="flex flex-col gap-2 p-4 pb-2 sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm">
          <div className="flex items-center h-12 justify-between">
            <button onClick={onBack} className="text-[#111418] flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <p className="text-primary tracking-tight text-[24px] font-extrabold leading-tight">Shopping Cart</p>
            <div className="size-12"></div> 
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar space-y-6">
          <div className="px-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Delivery Location</p>
                  <p className="text-sm font-bold text-[#111418] truncate">Home - 123 Pet Street, NY</p>
                </div>
              </div>
              <button className="text-primary text-sm font-bold ml-2 shrink-0">Change</button>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-4">
            {/* Item 1 */}
            <div className="flex bg-white rounded-2xl p-3 shadow-sm ring-1 ring-black/5 gap-3">
              <div className="w-24 h-24 shrink-0 bg-white rounded-xl p-2 flex items-center justify-center">
                <img alt="Bag of dry dog food" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPLGN2ii82OQcglGSR7fkEJbpPZgGo_eiL4uDVNV9mQkTckta1fmzUMSBr2_2J1Qwaodbz3dtRLn2AplK8Gu8hRpd9JeWBfoIcEMdgtH5VxDy-mQtab64yiyEfMxvoFmZqsNnBAw3byJRTbthi10McS6jNAE9tNaW4ueAIYX6s-2vze_fnGuvwssFeiPe39JJOgNxAteGARuPdoLdmoWcKeSElotyyy12eKiUR4ggeItEn4uSO-fiXdw1UxGrhGt3PzMfzBdtDum4"/>
              </div>
              <div className="flex flex-col flex-1 justify-between py-1 min-w-0">
                <div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-primary font-bold uppercase tracking-wider">Royal Canin</p>
                    <button className="text-gray-400 hover:text-red-500 ml-2"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                  </div>
                  <p className="text-sm font-bold text-[#111418] line-clamp-2 leading-snug pr-2">Medium Adult Dry Dog Food - 15kg</p>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-lg font-bold text-[#111418]">$45.99</p>
                  <div className="flex items-center bg-gray-50 rounded-lg ring-1 ring-black/5 h-8">
                    <button className="px-2 hover:text-primary transition-colors flex items-center h-full"><span className="material-symbols-outlined text-[18px]">remove</span></button>
                    <span className="text-sm font-bold px-1 min-w-[20px] text-center">1</span>
                    <button className="px-2 hover:text-primary transition-colors flex items-center h-full"><span className="material-symbols-outlined text-[18px]">add</span></button>
                  </div>
                </div>
              </div>
            </div>
            {/* Item 2 */}
            <div className="flex bg-white rounded-2xl p-3 shadow-sm ring-1 ring-black/5 gap-3">
              <div className="w-24 h-24 shrink-0 bg-white rounded-xl p-2 flex items-center justify-center">
                <img alt="Red rubber dog toy" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlcvySymcrsEFhVXbLd6WEB2Z7PhG8t-PldpXJC46UgMHLQbHU90kg9mVO11V-XmVvwloCcu8AM8UDJz6vCL2NnyPyyUnJdWMwUzXMWO2kE7jIbO8Bu7g3-TtakwW3fIvsrqvNaPkceb1l-MZJgx4xR0TMuo6tEhzH9aZheOtmCzcUGROl0yJNmgmrofP4OEV6Kgx0RZtN2BBAzu4eT9cAer5-5WiL-SOMFrVqAI68tARf8pQIjZ8rKxvihFPWRf1IYfWwlGsWMWU"/>
              </div>
              <div className="flex flex-col flex-1 justify-between py-1 min-w-0">
                <div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-primary font-bold uppercase tracking-wider">Kong</p>
                    <button className="text-gray-400 hover:text-red-500 ml-2"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                  </div>
                  <p className="text-sm font-bold text-[#111418] line-clamp-2 leading-snug pr-2">Classic Rubber Dog Toy - Red, Medium</p>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-lg font-bold text-[#111418]">$12.99</p>
                  <div className="flex items-center bg-gray-50 rounded-lg ring-1 ring-black/5 h-8">
                    <button className="px-2 hover:text-primary transition-colors flex items-center h-full"><span className="material-symbols-outlined text-[18px]">remove</span></button>
                    <span className="text-sm font-bold px-1 min-w-[20px] text-center">2</span>
                    <button className="px-2 hover:text-primary transition-colors flex items-center h-full"><span className="material-symbols-outlined text-[18px]">add</span></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="py-2 pb-6">
            <div className="flex justify-between items-center px-4 mb-3">
              <h3 className="text-primary tracking-tight text-lg font-bold leading-tight">Recommended Products</h3>
            </div>
            <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-2">
              <div className="flex flex-col w-40 shrink-0 bg-white rounded-2xl p-3 shadow-sm ring-1 ring-black/5 group cursor-pointer">
                <div className="relative w-full aspect-square bg-white rounded-xl mb-3 flex items-center justify-center p-2">
                  <img alt="Bag of cat food" className="object-contain h-full w-full group-hover:scale-105 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgUOjZTzKsv2vrulma26ENW46fl4tcr1WZmtkx58Jin7D_WyQu826iOPDtiQMAC3hsPAB8OGN-yuULtbbpywfeKewSGQy08ifWVAXYuuqj80MmX8png_YNg6bblKdTTfs2mRGkB6IVBfLj_wdbkMKxcKXw5iWQENCvBCiUnyjkWe53qimRWFxHx6XuSXyg8l4BWc2N-GWz95_ZMw01o-Jec63CMRiPis6CO4DZo7lvw0YGTaC1BM1Kc82-p9svMF9y60Rl7qNpZvk"/>
                </div>
                <p className="text-xs text-primary font-bold uppercase truncate">Blue Buffalo</p>
                <p className="text-xs font-bold text-[#111418] line-clamp-2 h-8 leading-snug">Wilderness High Protein</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm font-bold">$38.50</p>
                  <button className="size-7 bg-primary hover:bg-[#013d63] text-white rounded-full flex items-center justify-center shadow-md shadow-primary/20"><span className="material-symbols-outlined text-[16px]">add</span></button>
                </div>
              </div>
              {/* more recs... */}
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 space-y-3">
              <h3 className="font-bold text-[#111418] text-base">Order Summary</h3>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal (3 items)</span>
                <span>$71.97</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery Fee</span>
                <span>$5.00</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Discount (Summer Sale)</span>
                <span>-$7.20</span>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="flex justify-between items-end">
                <span className="font-bold text-[#111418] text-lg">Total</span>
                <span className="font-extrabold text-primary text-2xl">$69.77</span>
              </div>
            </div>
          </div>
        </main>

        <div className="fixed bottom-20 left-0 w-full px-4 z-40 mb-2">
          <button 
            onClick={onProceed}
            className="w-full bg-primary hover:bg-[#013d63] text-white h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            <span>Proceed to Checkout</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-200 pb-safe">
          <div className="flex justify-around items-center h-16 px-4">
            <button onClick={onHomeClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">home</span>
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={onVisitsClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
              <span className="text-[10px] font-medium">Visits</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1 w-full h-full text-primary">
              <div className="relative">
                <span className="material-symbols-outlined text-[24px] filled" style={{fontVariationSettings: "'FILL' 1"}}>shopping_cart</span>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
              </div>
              <span className="text-[10px] font-bold">Cart</span>
            </button>
            <button onClick={onProfileClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">person</span>
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Cart;
