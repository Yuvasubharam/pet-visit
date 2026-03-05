
import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';

interface OrderDisplay {
  id: string;
  orderNumber: string;
  status: string;
  date: string;
  amount: number;
  images: string[];
  moreCount: number;
}

interface Props {
  onBack: () => void;
  onOrderClick: (id: string) => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onShopClick: () => void;
  userId?: string | null;
}

const OrdersHistory: React.FC<Props> = ({ onBack, onOrderClick, onHomeClick, onVisitsClick, onShopClick, userId }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadOrders();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const loadOrders = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      console.log('OrdersHistory - Loading orders for user:', userId);
      const data = await orderService.getUserOrders(userId);
      console.log('OrdersHistory - Received orders:', data);

      const mappedOrders: OrderDisplay[] = (data || []).map((order: any) => {
        // Get product images from order items (using shop_products)
        const images = (order.order_items || [])
          .slice(0, 2)
          .map((item: any) => item.shop_products?.main_image || '')
          .filter((img: string) => img);

        const moreCount = Math.max(0, (order.order_items?.length || 0) - 2);

        // Format date
        const createdDate = new Date(order.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let formattedDate = '';
        if (createdDate.toDateString() === today.toDateString()) {
          formattedDate = `Today, ${createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (createdDate.toDateString() === yesterday.toDateString()) {
          formattedDate = `Yesterday, ${createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          formattedDate = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        // Capitalize first letter of status
        const displayStatus = order.status.charAt(0).toUpperCase() + order.status.slice(1);

        return {
          id: order.id,
          orderNumber: order.order_number,
          status: displayStatus,
          date: formattedDate,
          amount: order.total,
          images,
          moreCount
        };
      });

      console.log('OrdersHistory - Mapped orders:', mappedOrders);
      setOrders(mappedOrders);
    } catch (error) {
      console.error('OrdersHistory - Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-400 text-4xl">shopping_bag</span>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">No orders yet</p>
              <p className="text-sm text-gray-500 text-center">Your order history will appear here</p>
            </div>
          ) : (
            orders.filter(o => activeTab === 'All' || o.status === activeTab).map((order) => (
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
                      <p className="text-sm font-bold text-[#111418]">Order #{order.orderNumber}</p>
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
                    <p className="text-base font-bold text-primary">₹{order.amount.toFixed(2)}</p>
                  </div>
                </div>
                {order.status === 'Delivered' && (
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-white border border-gray-200 text-primary text-xs font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors">Reorder</button>
                    <button className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-[#013d63] transition-colors">Rate Order</button>
                  </div>
                )}
              </div>
            ))
          )}
        </main>

        <nav className="fixed bottom-0 w-full max-w-md z-50 bg-white border-t border-gray-200">
          <div className="flex justify-around items-center h-16 px-2 pb-2">
            <button onClick={onHomeClick} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">home</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide">Home</span>
            </button>
            <button onClick={onVisitsClick} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide">Bookings</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">pets</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide">Pets</span>
            </button>
            <button onClick={onShopClick} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-primary relative pb-1.5">
              <span className="material-symbols-outlined text-[22px] filled" style={{fontVariationSettings: "'FILL' 1"}}>shopping_bag</span>
              <span className="text-[9px] font-bold uppercase tracking-wide">Shop</span>
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
            </button>
            <button onClick={onBack} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">person</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default OrdersHistory;
