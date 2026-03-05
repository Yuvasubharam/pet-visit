
import React, { useState, useEffect } from 'react';
import { Address } from '../types';
import { addressService, cartService, orderService } from '../services/api';
import { adminSettingsService } from '../services/adminApi';
import AddressForm from '../components/AddressForm';

interface CartItemDisplay {
  cartId: string;
  productId: string;
  brand: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Props {
  onBack: () => void;
  onPlaceOrder: (orderData: {
    orderNumber: string;
    orderDate: string;
    cartItems: CartItemDisplay[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
  }) => void;
  onAddressChange?: (selectedAddress: Address | null) => void;
  userId?: string | null;
  initialAddress?: Address | null;
  headerAddress?: Address;
}

const ShopCheckout: React.FC<Props> = ({
  onBack,
  onPlaceOrder,
  onAddressChange,
  userId,
  initialAddress,
  headerAddress
}) => {
  const [cartItems, setCartItems] = useState<CartItemDisplay[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(initialAddress || headerAddress || null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cod'>('card');
  const [marginPercentage, setMarginPercentage] = useState(0.15);

  const DELIVERY_FEE = 5.00;
  const DISCOUNT_PERCENTAGE = 0.1;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const margin = await adminSettingsService.getSetting('shop_margin_percentage');
      if (margin !== null && margin !== undefined) {
        setMarginPercentage(margin);
      }
    } catch (error) {
      console.error('Error loading shop margin:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadCart();
      loadAddresses();
    } else {
      setIsLoadingCart(false);
      setIsLoadingAddresses(false);
    }
  }, [userId]);

  // Update selected address when initialAddress or headerAddress prop changes
  useEffect(() => {
    if (initialAddress) {
      console.log('ShopCheckout - Received initialAddress from cart:', initialAddress);
      setSelectedAddress(initialAddress);
    } else if (headerAddress && !selectedAddress) {
      console.log('ShopCheckout - Using headerAddress as default:', headerAddress);
      setSelectedAddress(headerAddress);
    }
  }, [initialAddress, headerAddress]);

  // Notify parent when address changes
  useEffect(() => {
    if (onAddressChange && selectedAddress) {
      console.log('ShopCheckout - Address changed, notifying parent:', selectedAddress);
      onAddressChange(selectedAddress);
    }
  }, [selectedAddress, onAddressChange]);

  const loadCart = async () => {
    if (!userId) return;

    try {
      setIsLoadingCart(true);
      const data = await cartService.getCartItems(userId);
      console.log('ShopCheckout - Raw cart data:', data);

      const mappedItems = (data || []).map((item: any) => {
        const product = item.shop_products;
        const variation = item.product_variations;

        // Calculate price: variation sale_price > variation price_adjustment > product sale_price > product base_price
        let price = 0;
        if (variation?.sale_price) {
          price = Number(variation.sale_price);
        } else if (variation?.price_adjustment && product?.base_price) {
          price = Number(product.base_price) + Number(variation.price_adjustment);
        } else if (product?.sale_price) {
          price = Number(product.sale_price);
        } else if (product?.base_price) {
          price = Number(product.base_price);
        }

        // Build name with variation if applicable
        let displayName = product?.name || 'Product';
        if (variation?.variation_value) {
          displayName = `${displayName} - ${variation.variation_value}`;
        }

        console.log('ShopCheckout - Mapped item:', {
          name: displayName,
          price,
          product,
          variation
        });

        return {
          cartId: item.id,
          productId: item.product_id,
          brand: product?.category || 'Unknown',
          name: displayName,
          price: price,
          quantity: item.quantity,
          image: product?.main_image || ''
        };
      });

      console.log('ShopCheckout - Final mapped items:', mappedItems);
      setCartItems(mappedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoadingCart(false);
    }
  };

  const loadAddresses = async () => {
    if (!userId) return;

    try {
      setIsLoadingAddresses(true);
      console.log('ShopCheckout - Loading addresses for user:', userId);
      const data = await addressService.getUserAddresses(userId);
      console.log('ShopCheckout - Received addresses:', data);

      const mappedAddresses = (data || []).map((addr: any) => ({
        id: addr.id,
        type: addr.type,
        flatNumber: addr.flat_number,
        street: addr.street,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        latitude: addr.latitude,
        longitude: addr.longitude,
        fullAddress: addr.full_address,
      }));

      console.log('ShopCheckout - Mapped addresses:', mappedAddresses);
      setAddresses(mappedAddresses);

      // Set first address as default if no address is selected
      if (mappedAddresses.length > 0 && !selectedAddress) {
        setSelectedAddress(mappedAddresses[0]);
        console.log('ShopCheckout - Auto-selected first address:', mappedAddresses[0]);
      }
    } catch (error) {
      console.error('ShopCheckout - Error loading addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (address: Address) => {
    if (!userId) {
      alert('User not logged in. Please log in to save address.');
      return;
    }

    try {
      console.log('ShopCheckout - Saving address:', address);
      const savedAddress = await addressService.addAddress(userId, address);
      console.log('ShopCheckout - Address saved successfully:', savedAddress);

      // Reload addresses to get the latest list
      await loadAddresses();

      // Auto-select the newly saved address
      if (savedAddress) {
        const mappedAddress = {
          id: savedAddress.id,
          type: savedAddress.type,
          flatNumber: savedAddress.flat_number,
          street: savedAddress.street,
          landmark: savedAddress.landmark,
          city: savedAddress.city,
          state: savedAddress.state,
          pincode: savedAddress.pincode,
          latitude: savedAddress.latitude,
          longitude: savedAddress.longitude,
          fullAddress: savedAddress.full_address,
        };
        setSelectedAddress(mappedAddress);
        console.log('ShopCheckout - Selected new address:', mappedAddress);
      }

      setShowAddNewAddress(false);
      setShowAddressDropdown(false);
      alert('Address saved successfully!');
    } catch (error: any) {
      console.error('ShopCheckout - Error saving address:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to save address. ';
      if (error?.message) {
        errorMessage += error.message;
      } else if (error?.error_description) {
        errorMessage += error.error_description;
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }

      alert(errorMessage);
    }
  };

  const handlePlaceOrder = async () => {
    if (!userId || !selectedAddress || cartItems.length === 0) {
      alert('Please select a delivery address and add items to cart');
      return;
    }

    try {
      setIsPlacingOrder(true);

      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discount = subtotal * DISCOUNT_PERCENTAGE;
      const tax = subtotal * 0.05; // 5% tax
      const total = subtotal + DELIVERY_FEE + tax - discount;

      // Create order
      const order = await orderService.createOrder({
        userId,
        addressId: selectedAddress.id!,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        tax,
        discount,
        total,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      });

      if (!order) {
        throw new Error('Failed to create order');
      }

      // Clear cart after successful order
      for (const item of cartItems) {
        await cartService.removeFromCart(item.cartId);
      }

      // Pass order data to confirmation page
      onPlaceOrder({
        orderNumber: (order as any).order_number,
        orderDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        cartItems: cartItems,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        discount,
        tax
      });
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const calculatedSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculatedDiscount = calculatedSubtotal * DISCOUNT_PERCENTAGE;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = calculatedSubtotal + DELIVERY_FEE - calculatedDiscount;
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
            {isLoadingAddresses ? (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedAddress ? (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 text-primary rounded-full p-2.5 shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">location_on</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-[#111418] text-base">{selectedAddress.type}</h4>
                      <button
                        onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                        className="text-primary text-sm font-bold px-2 py-1 -mr-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {selectedAddress.flatNumber}, {selectedAddress.street}<br/>
                      {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddNewAddress(true)}
                className="w-full bg-white p-4 rounded-2xl shadow-sm border-2 border-primary/20 hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">add_location_alt</span>
                <span className="text-sm font-bold text-primary">Add Delivery Address</span>
              </button>
            )}

            {/* Address Dropdown */}
            {showAddressDropdown && (
              <div className="mt-3 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-gray-900 text-base font-black tracking-tight">Select Address</h3>
                  <button
                    onClick={() => setShowAddressDropdown(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {addresses.map((addr, index) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setShowAddressDropdown(false);
                      }}
                      className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                        selectedAddress?.id === addr.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                          index === 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="material-symbols-outlined text-lg">
                            {addr.type === 'Home' ? 'home' : addr.type === 'Office' ? 'work' : 'location_on'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900 font-bold text-sm">{addr.type}</p>
                            {index === 0 && (
                              <span className="text-primary text-[8px] uppercase font-bold bg-primary/10 px-2 py-0.5 rounded-md tracking-wider">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            {addr.flatNumber}, {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                          </p>
                        </div>
                        {selectedAddress?.id === addr.id && (
                          <span className="material-symbols-outlined text-primary">check_circle</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4">
                  <button
                    onClick={() => {
                      setShowAddNewAddress(true);
                      setShowAddressDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined">add_location_alt</span>
                    Add New Address
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="px-4">
            <h3 className="px-1 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Method</h3>
            <div className="flex flex-col gap-3">
              {/* Card Payment Option */}
              <div
                onClick={() => setSelectedPaymentMethod('card')}
                className={`bg-white p-4 rounded-2xl shadow-sm border transition-all cursor-pointer ${
                  selectedPaymentMethod === 'card'
                    ? 'border-primary/20 ring-1 ring-primary/20'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-14 bg-gray-50 rounded border border-gray-200 flex items-center justify-center shrink-0">
                    <span className="font-bold text-blue-900 italic text-sm font-serif">VISA</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="font-bold text-[#111418] text-sm">Visa ending in 4242</p>
                    <p className="text-xs text-gray-500">Expires 09/28</p>
                  </div>
                  {selectedPaymentMethod === 'card' && (
                    <div className="text-primary">
                      <span className="material-symbols-outlined filled" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cash on Delivery Option */}
              <div
                onClick={() => setSelectedPaymentMethod('cod')}
                className={`bg-white p-4 rounded-2xl shadow-sm border transition-all cursor-pointer ${
                  selectedPaymentMethod === 'cod'
                    ? 'border-primary/20 ring-1 ring-primary/20'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-14 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-emerald-600 text-xl">payments</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="font-bold text-[#111418] text-sm">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when you receive</p>
                  </div>
                  {selectedPaymentMethod === 'cod' && (
                    <div className="text-primary">
                      <span className="material-symbols-outlined filled" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4">
            <h3 className="px-1 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Order Items ({totalItems})</h3>
            {isLoadingCart ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">shopping_cart</span>
                </div>
                <p className="text-sm font-bold text-gray-600">No items in cart</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 items-center">
                  <div className="h-20 w-20 shrink-0 bg-white rounded-xl border border-gray-100 p-2 flex items-center justify-center overflow-hidden">
                    <img alt={item.name} className="w-full h-full object-contain" src={item.image}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-0.5">{item.brand}</p>
                    <p className="font-semibold text-[#111418] text-sm leading-tight line-clamp-2">{item.name}</p>
                    <div className="flex justify-between items-end mt-2">
                      <p className="font-bold text-[#111418]">₹{item.price.toFixed(2)}</p>
                      <div className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">Qty: {item.quantity}</div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-12">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-500 text-sm font-medium">Subtotal</span>
                <span className="font-bold text-[#111418]">₹{calculatedSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-500 text-sm font-medium">Shipping Fee</span>
                <span className="font-bold text-[#111418]">₹{DELIVERY_FEE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 text-sm font-medium">Discount</span>
                <span className="font-bold text-green-600">-₹{calculatedDiscount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-100 w-full mb-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#111418]">Total</span>
                <span className="text-2xl font-extrabold text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="p-4">
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || cartItems.length === 0 || !selectedAddress}
              className="w-full bg-primary hover:bg-[#013d63] text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <span>Place Order</span>
                  <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Address Form Modal */}
        {showAddNewAddress && (
          <AddressForm
            onClose={() => setShowAddNewAddress(false)}
            onSave={handleSaveAddress}
          />
        )}
      </div>
    </div>
  );
};

export default ShopCheckout;
