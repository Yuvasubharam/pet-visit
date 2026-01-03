
import React, { useState, useEffect } from 'react';
import { Address, Product } from '../types';
import { addressService, cartService, productService } from '../services/api';
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
  onHomeClick: () => void;
  onVisitsClick: () => void;
  onProceed: (selectedAddress: Address | null) => void;
  onProfileClick: () => void;
  userId?: string | null;
  initialAddress?: Address | null;
  headerAddress?: Address;
}

const Cart: React.FC<Props> = ({ onBack, onHomeClick, onVisitsClick, onProceed, onProfileClick, userId, initialAddress, headerAddress }) => {
  const [cartItems, setCartItems] = useState<CartItemDisplay[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(initialAddress || headerAddress || null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    if (userId) {
      loadAddresses();
      loadCart();
      loadRecommendedProducts();
    } else {
      setIsLoadingCart(false);
      setIsLoadingAddresses(false);
      setIsLoadingProducts(false);
    }
  }, [userId]);

  // Update selected address when initialAddress or headerAddress prop changes
  useEffect(() => {
    if (initialAddress) {
      console.log('Cart - Received initialAddress from checkout:', initialAddress);
      setSelectedAddress(initialAddress);
    } else if (headerAddress && !selectedAddress) {
      console.log('Cart - Using headerAddress as default:', headerAddress);
      setSelectedAddress(headerAddress);
    }
  }, [initialAddress, headerAddress]);

  const loadCart = async () => {
    if (!userId) return;

    try {
      setIsLoadingCart(true);
      const data = await cartService.getCartItems(userId);
      const mappedItems = (data || []).map((item: any) => ({
        cartId: item.id,
        productId: item.product_id,
        brand: item.products?.brand || 'Unknown',
        name: item.products?.name || 'Product',
        price: item.products?.price || 0,
        quantity: item.quantity,
        image: item.products?.image || ''
      }));
      setCartItems(mappedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoadingCart(false);
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const data = await productService.getAllProducts();
      // Get first 2 products as recommended (you can customize this logic)
      setRecommendedProducts((data || []).slice(0, 2));
    } catch (error) {
      console.error('Error loading recommended products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadAddresses = async () => {
    if (!userId) return;

    try {
      setIsLoadingAddresses(true);
      console.log('Cart - Loading addresses for user:', userId);
      const data = await addressService.getUserAddresses(userId);
      console.log('Cart - Received addresses:', data);

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

      console.log('Cart - Mapped addresses:', mappedAddresses);
      setAddresses(mappedAddresses);

      // Set first address as default if no address is selected
      if (mappedAddresses.length > 0 && !selectedAddress) {
        setSelectedAddress(mappedAddresses[0]);
        console.log('Cart - Auto-selected first address:', mappedAddresses[0]);
      }
    } catch (error) {
      console.error('Cart - Error loading addresses:', error);
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
      console.log('Cart - Saving address:', address);
      const savedAddress = await addressService.addAddress(userId, address);
      console.log('Cart - Address saved successfully:', savedAddress);

      // Auto-select the newly saved address first (before reload)
      if (savedAddress) {
        const mappedAddress: Address = {
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
        console.log('Cart - Auto-selected new address:', mappedAddress);
      }

      // Reload addresses to get the latest list
      await loadAddresses();

      setShowAddNewAddress(false);
      setShowAddressDropdown(false);
      alert('Address saved successfully!');
    } catch (error: any) {
      console.error('Cart - Error saving address:', error);

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

  const DELIVERY_FEE = 5.00;
  const DISCOUNT_PERCENTAGE = 0.1; // 10% discount

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const discount = subtotal * DISCOUNT_PERCENTAGE;
  const total = subtotal + DELIVERY_FEE - discount;

  // Update quantity
  const updateQuantity = async (cartId: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Prevent quantity less than 1

    try {
      // Update quantity in database
      await cartService.updateCartItemQuantity(cartId, newQuantity);

      // Update local state
      setCartItems(cartItems.map(item =>
        item.cartId === cartId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  // Delete item
  const deleteItem = async (cartId: string) => {
    try {
      // Delete from database
      await cartService.removeFromCart(cartId);

      // Update local state
      setCartItems(cartItems.filter(item => item.cartId !== cartId));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  // Get quantity for a recommended product
  const getRecommendedProductQuantity = (productId: string): number => {
    const item = cartItems.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  // Add recommended product to cart
  const addToCart = async (product: { productId: string; brand: string; name: string; price: number; image: string }) => {
    if (!userId) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      await cartService.addToCart(userId, product.productId, 1);
      await loadCart(); // Reload cart to show updated items
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  // Decrease quantity for recommended product
  const decreaseRecommendedQuantity = async (productId: string) => {
    const item = cartItems.find(item => item.productId === productId);
    if (item) {
      if (item.quantity === 1) {
        await deleteItem(item.cartId);
      } else {
        await updateQuantity(item.cartId, item.quantity - 1);
      }
    }
  };

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
            {isLoadingAddresses ? (
              <div className="flex justify-center items-center p-4 bg-white rounded-2xl shadow-sm ring-1 ring-black/5">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedAddress ? (
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Delivery Location</p>
                    <p className="text-sm font-bold text-[#111418] truncate">{selectedAddress.type} - {selectedAddress.street}, {selectedAddress.city}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                  className="text-primary text-sm font-bold ml-2 shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddNewAddress(true)}
                className="w-full flex items-center justify-center gap-3 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl hover:bg-primary/10 transition-colors"
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

                {/* Existing Addresses */}
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

                {/* Add New Address Button */}
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

          {isLoadingCart ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-400 text-5xl">shopping_cart</span>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-500 mb-6">Add some products to get started</p>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-[#013d63] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 px-4">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="flex bg-white rounded-2xl p-3 shadow-sm ring-1 ring-black/5 gap-3">
                    <div className="w-24 h-24 shrink-0 bg-white rounded-xl p-2 flex items-center justify-center">
                      <img alt={item.name} className="w-full h-full object-contain" src={item.image} />
                    </div>
                    <div className="flex flex-col flex-1 justify-between py-1 min-w-0">
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-primary font-bold uppercase tracking-wider">{item.brand}</p>
                          <button
                            onClick={() => deleteItem(item.cartId)}
                            className="text-gray-400 hover:text-red-500 ml-2 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                        <p className="text-sm font-bold text-[#111418] line-clamp-2 leading-snug pr-2">{item.name}</p>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-lg font-bold text-[#111418]">₹{item.price.toFixed(2)}</p>
                        <div className="flex items-center bg-gray-50 rounded-lg ring-1 ring-black/5 h-8">
                          <button
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 hover:text-primary transition-colors flex items-center h-full disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                          </button>
                          <span className="text-sm font-bold px-1 min-w-[20px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            className="px-2 hover:text-primary transition-colors flex items-center h-full"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="py-2 pb-6">
                <div className="flex justify-between items-center px-4 mb-3">
                  <h3 className="text-primary tracking-tight text-lg font-bold leading-tight">Recommended Products</h3>
                </div>
                {isLoadingProducts ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-2">
                    {recommendedProducts.map((product) => {
                      const quantity = getRecommendedProductQuantity(product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col w-40 shrink-0 bg-white rounded-2xl p-3 shadow-sm ring-1 ring-black/5 group hover:shadow-md transition-shadow"
                        >
                          <div className="relative w-full aspect-square bg-white rounded-xl mb-3 flex items-center justify-center p-2">
                            <img alt={product.name} className="object-contain h-full w-full group-hover:scale-105 transition-transform" src={product.image}/>
                          </div>
                          <p className="text-xs text-primary font-bold uppercase truncate">{product.brand}</p>
                          <p className="text-xs font-bold text-[#111418] line-clamp-2 h-8 leading-snug">{product.name}</p>
                          <div className="flex justify-between items-center mt-2 gap-2">
                            <p className="text-sm font-bold">₹{product.price.toFixed(2)}</p>
                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart({
                                  productId: product.id,
                                  brand: product.brand,
                                  name: product.name,
                                  price: product.price,
                                  image: product.image
                                })}
                                className="size-7 bg-primary hover:bg-[#013d63] text-white rounded-full flex items-center justify-center shadow-md shadow-primary/20 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 bg-primary/10 rounded-xl px-1 py-0.5">
                                <button
                                  onClick={() => decreaseRecommendedQuantity(product.id)}
                                  className="w-6 h-6 bg-white text-primary rounded-lg flex items-center justify-center shadow-sm hover:bg-primary hover:text-white transition-all active:scale-90"
                                >
                                  <span className="material-symbols-outlined text-[14px]">remove</span>
                                </button>
                                <span className="text-xs font-black text-primary min-w-[16px] text-center">{quantity}</span>
                                <button
                                  onClick={() => addToCart({
                                    productId: product.id,
                                    brand: product.brand,
                                    name: product.name,
                                    price: product.price,
                                    image: product.image
                                  })}
                                  className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-primary-dark transition-all active:scale-90"
                                >
                                  <span className="material-symbols-outlined text-[14px]">add</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-4 pb-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 space-y-3">
                  <h3 className="font-bold text-[#111418] text-base">Order Summary</h3>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Delivery Fee</span>
                    <span>₹{DELIVERY_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount (Summer Sale)</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-100 my-2"></div>
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-[#111418] text-lg">Total</span>
                    <span className="font-extrabold text-primary text-2xl">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {cartItems.length > 0 && (
          <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-40 mb-2">
            <button
              onClick={() => {
                console.log('Cart - Proceeding to checkout with address:', selectedAddress);
                onProceed(selectedAddress);
              }}
              className="w-full bg-primary hover:bg-[#013d63] text-white h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
            >
              <span>Proceed to Checkout</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-50 bg-white border-t border-gray-200 pb-safe">
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
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
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

      {/* Address Form Modal */}
      {showAddNewAddress && (
        <AddressForm
          onClose={() => setShowAddNewAddress(false)}
          onSave={handleSaveAddress}
        />
      )}
    </div>
  );
};

export default Cart;