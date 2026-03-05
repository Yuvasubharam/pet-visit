
import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';

interface Props {
  onBack: () => void;
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onShopClick: () => void;
  onProfileClick: () => void;
  userId?: string | null;
  orderId?: string | null;
}

const OrderDetailsPage: React.FC<Props> = ({ onBack, onHomeClick, onVisitsClick, onShopClick, onProfileClick, userId, orderId }) => {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    } else {
      setIsLoading(false);
      setError('No order ID provided');
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('OrderDetailsPage - Loading order:', orderId);
      const data = await orderService.getOrder(orderId);
      console.log('OrderDetailsPage - Received order:', data);
      setOrder(data);
    } catch (err: any) {
      console.error('OrderDetailsPage - Error loading order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate order progress based on status
  const getOrderProgress = (status: string) => {
    const progressMap: { [key: string]: number } = {
      'pending': 25,
      'processing': 50,
      'shipped': 75,
      'delivered': 100,
      'cancelled': 0
    };
    return progressMap[status.toLowerCase()] || 0;
  };

  // Format estimated delivery
  const getEstimatedDelivery = () => {
    if (!order) return '';

    if (order.status === 'delivered') {
      return 'Delivered';
    }

    if (order.estimated_delivery) {
      return order.estimated_delivery;
    }

    // Calculate 3-5 days from order date
    const orderDate = new Date(order.created_at);
    const minDate = new Date(orderDate);
    minDate.setDate(orderDate.getDate() + 3);
    const maxDate = new Date(orderDate);
    maxDate.setDate(orderDate.getDate() + 5);

    return `${minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Get status display text
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Order Confirmed',
      'processing': 'Being Packed',
      'shipped': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-red-600 text-4xl">error</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mb-2">Failed to load order</p>
          <p className="text-sm text-gray-500 text-center mb-4">{error || 'Order not found'}</p>
          <button onClick={onBack} className="bg-primary text-white px-6 py-2 rounded-lg font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const progress = getOrderProgress(order.status);
  const statusText = getStatusText(order.status);
  const estimatedDelivery = getEstimatedDelivery();

  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-32">
        <div className="flex flex-col gap-2 p-4 pb-2 sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm border-b border-black/5">
          <div className="flex items-center h-12 justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="text-[#111418] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <p className="text-[#111418] tracking-tight text-xl font-bold leading-tight">Order #{order.order_number}</p>
            </div>
            <button className="text-primary text-sm font-bold px-2 py-1 hover:bg-primary/5 rounded-lg transition-colors">Help</button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-6 pb-24">
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Estimated Delivery</p>
                <h2 className="text-xl font-bold text-primary">{estimatedDelivery}</h2>
              </div>
              <div className="bg-blue-50 text-primary p-2 rounded-full">
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
              </div>
            </div>
            <div className="relative flex items-center justify-between w-full mb-2">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full" style={{ width: `${progress}%` }}></div>
              <div className="flex flex-col items-center gap-2 z-10">
                <div className={`w-4 h-4 rounded-full ${progress >= 25 ? 'bg-primary ring-4 ring-blue-50' : 'bg-gray-200 ring-4 ring-white'}`}></div>
              </div>
              <div className="flex flex-col items-center gap-2 z-10">
                <div className={`w-4 h-4 rounded-full ${progress >= 50 ? 'bg-primary ring-4 ring-blue-50' : 'bg-gray-200 ring-4 ring-white'}`}></div>
              </div>
              <div className="flex flex-col items-center gap-2 z-10">
                <div className={`${progress >= 75 ? 'w-6 h-6' : 'w-4 h-4'} rounded-full ${progress >= 75 ? 'bg-primary flex items-center justify-center ring-4 ring-blue-50 shadow-sm' : 'bg-gray-200 ring-4 ring-white'}`}>
                  {progress >= 75 && <span className="w-2 h-2 bg-white rounded-full"></span>}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 z-10">
                <div className={`w-4 h-4 rounded-full ${progress >= 100 ? 'bg-primary ring-4 ring-blue-50' : 'bg-gray-200 ring-4 ring-white'}`}></div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-2">
              <span className={progress >= 25 ? 'text-primary' : ''}>Confirmed</span>
              <span className={progress >= 50 ? 'text-primary' : ''}>Packed</span>
              <span className={progress >= 75 ? 'text-primary' : ''}>Shipping</span>
              <span className={progress >= 100 ? 'text-primary' : ''}>Delivered</span>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#111418]">{statusText}</p>
                <p className="text-xs text-gray-500">
                  {order.status === 'shipped' ? 'Your pet supplies are on the way.' :
                   order.status === 'delivered' ? 'Your order has been delivered successfully.' :
                   order.status === 'processing' ? 'Your order is being prepared for shipment.' :
                   'Your order has been confirmed and will be processed soon.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[#111418] text-lg font-bold px-1">Items ({order.order_items?.length || 0})</h3>
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 divide-y divide-gray-100 overflow-hidden">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="w-20 h-20 shrink-0 bg-background-light rounded-xl p-2 flex items-center justify-center">
                    <img
                      alt={item.shop_products?.name || 'Product'}
                      className="w-full h-full object-contain"
                      src={item.shop_products?.main_image || 'https://via.placeholder.com/80'}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[10px] text-primary font-bold uppercase mb-0.5">{item.shop_products?.category || 'Category'}</p>
                    <p className="text-sm font-bold text-[#111418] line-clamp-2 leading-tight">{item.shop_products?.name || 'Product'}</p>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-xs font-medium text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-[#111418]">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5">
              <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Delivery Address</h3>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">location_on</span>
                <div>
                  <p className="text-sm font-bold text-[#111418]">{order.addresses?.type || 'Address'}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {order.addresses?.full_address ||
                     `${order.addresses?.flat_number || ''} ${order.addresses?.street || ''}, ${order.addresses?.city || ''}, ${order.addresses?.state || ''} - ${order.addresses?.pincode || ''}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">credit_card</span>
                <p className="text-sm font-bold text-[#111418]">
                  {order.payment_status === 'paid' ? 'Payment Successful' : 'Payment Pending'}
                </p>
              </div>
              <span className={`material-symbols-outlined text-[20px] ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                {order.payment_status === 'paid' ? 'check_circle' : 'schedule'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-[#111418] text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-bold">₹{Number(order.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery Fee</span><span className="font-bold">₹{Number(order.delivery_fee).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-bold">₹{Number(order.tax).toFixed(2)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-green-600 font-bold">-₹{Number(order.discount).toFixed(2)}</span></div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-[#111418]">Total Amount</span>
              <span className="text-xl font-bold text-primary">₹{Number(order.total).toFixed(2)}</span>
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
            <button onClick={onShopClick} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide">Shop</span>
            </button>
            <button onClick={onProfileClick} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-primary relative pb-1.5">
              <span className="material-symbols-outlined text-[22px] filled" style={{fontVariationSettings: "'FILL' 1"}}>person</span>
              <span className="text-[9px] font-bold uppercase tracking-wide">Profile</span>
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
