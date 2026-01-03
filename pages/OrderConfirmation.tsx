
import React from 'react';

interface CartItem {
  cartId?: string;
  productId?: string;
  brand: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Props {
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onContinueShopping: () => void;
  onProfileClick: () => void;
  onViewOrderDetails: () => void;
  orderData?: {
    orderNumber: string;
    orderDate: string;
    cartItems: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
  } | null;
}

const OrderConfirmation: React.FC<Props> = ({
  onHomeClick,
  onVisitsClick,
  onContinueShopping,
  onProfileClick,
  onViewOrderDetails,
  orderData,
}) => {
  // Use real order data or fallback to defaults
  const cartItems = orderData?.cartItems || [];
  const subtotal = orderData?.subtotal || 0;
  const deliveryFee = orderData?.deliveryFee || 5.00;
  const discount = orderData?.discount || 0;
  const tax = orderData?.tax || 0;
  const total = subtotal + deliveryFee + tax - discount;
  const orderNumber = orderData?.orderNumber || `TRX-${Math.floor(Math.random() * 900000 + 100000)}`;
  const formattedDate = orderData?.orderDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Calculate estimated delivery (3-5 days from now)
  const getDeliveryEstimate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 3);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 5);

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    return `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light font-display text-[#111418] transition-colors duration-200 fade-in overflow-hidden h-screen">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24">
        <div className="flex flex-col gap-2 p-4 pb-2 sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center h-12 justify-between">
            <div className="w-12"></div>
            <p className="text-[#111418] tracking-tight text-lg font-bold leading-tight">Order Confirmation</p>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar space-y-6">
          <div className="flex flex-col items-center justify-center mb-8 text-center animate-fade-in-up">
            <div className="size-20 bg-green-100 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-50">
              <span className="material-symbols-outlined text-green-600 text-[40px] font-bold">check</span>
            </div>
            <h1 className="text-2xl font-extrabold text-primary mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-500 text-sm max-w-[280px] leading-relaxed">Thank you for your purchase. We have sent an email confirmation to you.</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Order Number</span>
                <span className="text-sm font-bold text-[#111418]">#{orderNumber}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Date</span>
                <span className="text-sm font-bold text-[#111418]">{formattedDate}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#111418] mb-0.5">Estimated Delivery</span>
                <span className="text-xs text-gray-500 font-medium">{getDeliveryEstimate()}</span>
              </div>
            </div>
          </div>

          {cartItems.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">Order Summary</h3>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="size-16 bg-white rounded-xl border border-gray-100 p-2 flex items-center justify-center shrink-0 overflow-hidden">
                      <img alt={item.name} className="w-full h-full object-contain" src={item.image}/>
                    </div>
                    <div className="flex flex-col flex-1 justify-center">
                      <span className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">{item.brand}</span>
                      <span className="text-sm font-bold text-[#111418] line-clamp-1">{item.name}</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                        <span className="text-sm font-bold text-[#111418]">₹{item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-sm text-gray-500 font-medium">Subtotal</span>
              <span className="text-sm font-bold text-[#111418]">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-sm text-gray-500 font-medium">Shipping</span>
              <span className="text-sm font-bold text-[#111418]">₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-sm text-gray-500 font-medium">Tax (5%)</span>
              <span className="text-sm font-bold text-[#111418]">₹{tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-sm text-gray-500 font-medium">Discount</span>
                <span className="text-sm font-bold text-green-600">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="h-px bg-gray-100 my-4 w-full"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-extrabold text-[#111418]">Total</span>
              <span className="text-xl font-extrabold text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pb-8">
            <button
              onClick={onContinueShopping}
              className="w-full h-14 bg-primary hover:bg-[#013d63] text-white rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition-all flex items-center justify-center active:scale-[0.98]"
            >
              Continue Shopping
            </button>
            <button
              onClick={onViewOrderDetails}
              className="w-full h-14 bg-transparent border border-primary/20 text-primary hover:bg-blue-50/50 rounded-xl font-bold text-sm transition-all flex items-center justify-center active:scale-[0.98]"
            >
              View Orders History
            </button>
          </div>
        </div>

        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 z-50">
          <div className="flex justify-around items-center h-16 px-4">
            <button onClick={onHomeClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">home</span>
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={onVisitsClick} className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
              <span className="text-[10px] font-medium">Visits</span>
            </button>
            <button onClick={onContinueShopping} className="flex flex-col items-center justify-center gap-1 w-full h-full text-primary">
              <div className="relative">
                <span className="material-symbols-outlined text-[24px] filled" style={{fontVariationSettings: "'FILL' 1"}}>storefront</span>
              </div>
              <span className="text-[10px] font-bold">Shop</span>
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

export default OrderConfirmation;
