
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onOrderClick: (id: string) => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onShopClick: () => void;
}

const OrdersHistory: React.FC<Props> = ({ onBack, onOrderClick, onHomeClick, onVisitsClick, onShopClick }) => {
  const [activeTab, setActiveTab] = useState('All');

  const orders = [
    { id: '48291', status: 'Processing', date: 'Today, 10:30 AM', amount: '64.97', images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCPLGN2ii82OQcglGSR7fkEJbpPZgGo_eiL4uDVNV9mQkTckta1fmzUMSBr2_2J1Qwaodbz3dtRLn2AplK8Gu8hRpd9JeWBfoIcEMdgtH5VxDy-mQtab64yiyEfMxvoFmZqsNnBAw3byJRTbthi10McS6jNAE9tNaW4ueAIYX6s-2vze_fnGuvwssFeiPe39JJOgNxAteGARuPdoLdmoWcKeSElotyyy12eKiUR4ggeItEn4uSO-fiXdw1UxGrhGt3PzMfzBdtDum4', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlcvySymcrsEFhVXbLd6WEB2Z7PhG8t-PldpXJC46UgMHLQbHU90kg9mVO11V-XmVvwloCcu8AM8UDJz6vCL2NnyPyyUnJdWMwUzXMWO2kE7jIbO8Bu7g3-TtakwW3fIvsrqvNaPkceb1l-MZJgx4xR0TMuo6tEhzH9aZheOtmCzcUGROl0yJNmgmrofP4OEV6Kgx0RZtN2BBAzu4eT9cAer5-5WiL-SOMFrVqAI68tARf8pQIjZ8rKxvihFPWRf1IYfWwlGsWMWU'], moreCount: 1 },
    { id: '48102', status: 'Shipped', date: 'Yesterday, 04:15 PM', amount: '38.50', images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCgUOjZTzKsv2vrulma26ENW46fl4tcr1WZmtkx58Jin7D_WyQu826iOPDtiQMAC3hsPAB8OGN-yuULtbbpywfeKewSGQy08ifWVAXYuuqj80MmX8png_YNg6bblKdTTfs2mRGkB6IVBfLj_wdbkMKxcKXw5iWQENCvBCiUnyjkWe53qimRWFxHx6XuSXyg8l4BWc2N-GWz95_ZMw01o-Jec63CMRiPis6CO4DZo7lvw0YGTaC1BM1Kc82-p9svMF9y60Rl7qNpZvk'], moreCount: 0 },
    { id: '47955', status: 'Delivered', date: 'Oct 24, 2023', amount: '70.94', images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBYZCVAV9XWJy3Tg7bSu6qFDC7wqmES3NpNb0uyCoOdCzDTUD9egvvTFBu040jv-M_hW_oSQVJrwirNsuDKIyvj3WFKRLvNIyiW0QUguVMboKo-JKGEdwYvgebmIqHZhr4VsGdkqo3ZbASxYGGvRrlYDeKWGZQeTjKk3My5DOWCmCOErALUEAhgpYyycmm6cx2zpA2qU-Tsu1YkCfZUkPqWaRKTtx8oaqxcvHeIcdm-vKnRrHzpzYnptWQqfTNykdhR7zxSBZYsDXg', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPLGN2ii82OQcglGSR7fkEJbpPZgGo_eiL4uDVNV9mQkTckta1fmzUMSBr2_2J1Qwaodbz3dtRLn2AplK8Gu8hRpd9JeWBfoIcEMdgtH5VxDy-mQtab64yiyEfMxvoFmZqsNnBAw3byJRTbthi10McS6jNAE9tNaW4ueAIYX6s-2vze_fnGuvwssFeiPe39JJOgNxAteGARuPdoLdmoWcKeSElotyyy12eKiUR4ggeItEn4uSO-fiXdw1UxGrhGt3PzMfzBdtDum4'], moreCount: 0 },
    { id: '47522', status: 'Delivered', date: 'Oct 15, 2023', amount: '12.99', images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAlcvySymcrsEFhVXbLd6WEB2Z7PhG8t-PldpXJC46UgMHLQbHU90kg9mVO11V-XmVvwloCcu8AM8UDJz6vCL2NnyPyyUnJdWMwUzXMWO2kE7jIbO8Bu7g3-TtakwW3fIvsrqvNaPkceb1l-MZJgx4xR0TMuo6tEhzH9aZheOtmCzcUGROl0yJNmgmrofP4OEV6Kgx0RZtN2BBAzu4eT9cAer5-5WiL-SOMFrVqAI68tARf8pQIjZ8rKxvihFPWRf1IYfWwlGsWMWU'], moreCount: 0 },
    { id: '46900', status: 'Cancelled', date: 'Sep 28, 2023', amount: '89.50', images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCgUOjZTzKsv2vrulma26ENW46fl4tcr1WZmtkx58Jin7D_WyQu826iOPDtiQMAC3hsPAB8OGN-yuULtbbpywfeKewSGQy08ifWVAXYuuqj80MmX8png_YNg6bblKdTTfs2mRGkB6IVBfLj_wdbkMKxcKXw5iWQENCvBCiUnyjkWe53qimRWFxHx6XuSXyg8l4BWc2N-GWz95_ZMw01o-Jec63CMRiPis6CO4DZo7lvw0YGTaC1BM1Kc82-p9svMF9y60Rl7qNpZvk'], moreCount: 2 },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24">
        <div className="flex flex-col gap-2 p-4 pb-2 sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center h-12 justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="text-[#111418] flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <p className="text-primary tracking-tight text-[28px] font-extrabold leading-tight">Orders History</p>
            </div>
            <button className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm text-primary hover:bg-gray-50 transition-colors relative">
              <span className="material-symbols-outlined">shopping_cart</span>
              <div className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 border-2 border-background-light"></div>
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-4 py-4 overflow-x-auto no-scrollbar">
          {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((tab) => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm ring-1 ring-black/5 cursor-pointer transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'bg-white hover:bg-gray-50'}`}
            >
              <p className={`text-sm font-bold leading-normal`}>{tab}</p>
            </div>
          ))}
        </div>

        <main className="flex-1 px-4 pb-6 space-y-4 overflow-y-auto no-scrollbar">
          {orders.filter(o => activeTab === 'All' || o.status === activeTab).map((order) => (
            <div 
              key={order.id}
              onClick={() => onOrderClick(order.id)}
              className={`flex flex-col bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 cursor-pointer hover:shadow-md transition-shadow ${order.status === 'Cancelled' ? 'opacity-70' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className={`p-2 rounded-xl flex items-center justify-center h-12 w-12 shrink-0 ${order.status === 'Processing' ? 'bg-blue-50 text-primary' : order.status === 'Shipped' ? 'bg-orange-50 text-orange-600' : order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    <span className="material-symbols-outlined">{order.status === 'Processing' ? 'inventory_2' : order.status === 'Shipped' ? 'local_shipping' : order.status === 'Delivered' ? 'check_circle' : 'cancel'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111418]">Order #{order.id}</p>
                    <p className="text-xs text-gray-500">{order.date}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${order.status === 'Processing' ? 'bg-blue-100 text-blue-800 border-blue-200' : order.status === 'Shipped' ? 'bg-orange-100 text-orange-800 border-orange-200' : order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{order.status}</span>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
              <div className="flex justify-between items-center mt-1">
                <div className="flex -space-x-2 overflow-hidden">
                  {order.images.map((img, i) => (
                    <img key={i} alt="Product" className={`inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover ${order.status === 'Cancelled' ? 'grayscale' : ''}`} src={img}/>
                  ))}
                  {order.moreCount > 0 && (
                    <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">+{order.moreCount}</div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-medium">Total Amount</p>
                  <p className="text-base font-bold text-primary">${order.amount}</p>
                </div>
              </div>
              {order.status === 'Delivered' && (
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 bg-white border border-gray-200 text-primary text-xs font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors">Reorder</button>
                  <button className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-[#013d63] transition-colors">Rate Order</button>
                </div>
              )}
            </div>
          ))}
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
            <button onClick={onShopClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-primary">
              <div className="relative">
                <span className="material-symbols-outlined text-[24px] filled" style={{fontVariationSettings: "'FILL' 1"}}>storefront</span>
              </div>
              <span className="text-[10px] font-bold">Shop</span>
            </button>
            <button onClick={onBack} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">person</span>
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default OrdersHistory;
