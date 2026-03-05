
import React, { useState, useEffect } from 'react';
import { Product, ProductVariation } from '../types';
import { productService, cartService } from '../services/api';
import { adminProductService } from '../services/adminApi';
import ProductDetail from './ProductDetail';

interface Props {
    onBack: () => void;
    onCartClick: () => void;
    userId?: string | null;
    initialCategory?: string;
    onHomeClick?: () => void;
    onVisitsClick?: () => void;
    onProfileClick?: () => void;
}

// Extended product type with sale price info
interface ExtendedProduct extends Product {
    sale_price?: number;
    has_variations?: boolean;
}

const Marketplace: React.FC<Props> = ({ onBack, onCartClick, userId, initialCategory, onHomeClick, onVisitsClick, onProfileClick }) => {
    const [products, setProducts] = useState<ExtendedProduct[]>([]);
    const [cartItems, setCartItems] = useState<{[key: string]: number}>({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All');
    const [selectedPetType, setSelectedPetType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);

    useEffect(() => {
        loadProducts();
        if (userId) {
            loadCart();
        }
    }, [userId, selectedCategory, selectedPetType]);

    if (selectedProduct) {
        return (
            <ProductDetail 
                product={selectedProduct} 
                onBack={() => setSelectedProduct(null)} 
                onCartClick={onCartClick}
                userId={userId}
            />
        );
    }

    const loadProducts = async () => {
        try {
            setIsLoading(true);
            console.log('[Marketplace] Loading products - category:', selectedCategory);
            let data = selectedCategory === 'All'
                ? await productService.getAllProducts()
                : await productService.getProductsByCategory(selectedCategory);
            console.log('[Marketplace] Loaded:', data?.length || 0, 'products');

            // Filter by pet type if not 'all'
            if (selectedPetType !== 'all') {
                data = (data || []).filter(product => {
                    // Check traditional products with pet field
                    if (product.pet) {
                        return product.pet === selectedPetType || product.pet === 'all';
                    }
                    // Check shop products with pet_types array
                    if (product.pet_types && Array.isArray(product.pet_types)) {
                        return product.pet_types.includes(selectedPetType) || product.pet_types.includes('all');
                    }
                    return true;
                });
            }

            setProducts(data || []);
        } catch (error) {
            console.error('[Marketplace] Error loading products:', error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const loadCart = async () => {
        if (!userId) return;

        try {
            const data = await cartService.getCartItems(userId);
            const cartMap: {[key: string]: number} = {};
            (data || []).forEach((item: any) => {
                // Sum up quantities for the same product_id (regardless of variation)
                cartMap[item.product_id] = (cartMap[item.product_id] || 0) + item.quantity;
            });
            setCartItems(cartMap);
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    };

    const getItemQuantity = (itemId: string): number => {
        return cartItems[itemId] || 0;
    };

    const handleAddToCart = async (itemId: string) => {
        if (!userId) {
            alert('Please login to add items to cart');
            return;
        }

        try {
            await cartService.addToCart(userId, itemId, 1);
            setCartItems(prev => ({
                ...prev,
                [itemId]: (prev[itemId] || 0) + 1
            }));
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add item to cart');
        }
    };

    const handleIncreaseQuantity = async (itemId: string) => {
        if (!userId) return;

        try {
            await cartService.addToCart(userId, itemId, 1);
            setCartItems(prev => ({
                ...prev,
                [itemId]: (prev[itemId] || 0) + 1
            }));
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    };

    const handleDecreaseQuantity = async (itemId: string) => {
        if (!userId) return;

        const currentQty = cartItems[itemId] || 0;
        if (currentQty <= 1) {
            // Remove item - find cart item ID first
            try {
                const cartData = await cartService.getCartItems(userId);
                const cartItem = (cartData || []).find((item: any) => item.product_id === itemId);
                if (cartItem) {
                    await cartService.removeFromCart(cartItem.id);
                    setCartItems(prev => {
                        const newCart = { ...prev };
                        delete newCart[itemId];
                        return newCart;
                    });
                }
            } catch (error) {
                console.error('Error removing from cart:', error);
            }
        } else {
            try {
                const cartData = await cartService.getCartItems(userId);
                const cartItem = (cartData || []).find((item: any) => item.product_id === itemId);
                if (cartItem) {
                    await cartService.updateCartItemQuantity(cartItem.id, currentQty - 1);
                    setCartItems(prev => ({
                        ...prev,
                        [itemId]: currentQty - 1
                    }));
                }
            } catch (error) {
                console.error('Error updating cart:', error);
            }
        }
    };

    const getTotalCartItems = (): number => {
        return Object.values(cartItems).reduce((total, qty) => total + qty, 0);
    };

    return (
        <div className="flex-1 flex flex-col bg-background-light fade-in overflow-hidden h-screen">
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                    </button>
                    <img src="assets/images/logo.jpg" className="h-8 w-8 object-contain" alt="Logo" />
                    <h1 className="text-xl font-black text-primary tracking-tight font-display">Pet Market</h1>
                </div>
                <button
                    onClick={onCartClick}
                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 relative active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-white text-[22px]">shopping_cart</span>
                    {getTotalCartItems() > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                            {getTotalCartItems()}
                        </span>
                    )}
                </button>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-28">
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:text-primary-light transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Find the best for your pet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-4 pl-12 pr-14 bg-white border-none rounded-[20px] shadow-sm focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-14 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary">
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                    </button>
                </div>

                {/* Pet Type Filter */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider px-1">Pet Type</h3>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                        {[
                            { id: 'all', name: 'All Pets', icon: 'pets' },
                            { id: 'dog', name: 'Dogs', icon: 'pets' },
                            { id: 'cat', name: 'Cats', icon: 'pets' },
                            { id: 'rabbit', name: 'Rabbits', icon: 'cruelty_free' },
                            { id: 'turtle', name: 'Turtles', icon: 'emoji_nature' },
                            { id: 'bird', name: 'Birds', icon: 'flutter' },
                            { id: 'guinea_pig', name: 'Guinea Pigs', icon: 'cruelty_free' },
                            { id: 'hamster', name: 'Hamsters', icon: 'cruelty_free' },
                            { id: 'fish', name: 'Fish', icon: 'water' }
                        ].map((petType) => (
                            <button
                                key={petType.id}
                                onClick={() => setSelectedPetType(petType.id)}
                                className={`px-5 py-2.5 rounded-full flex items-center gap-2 shrink-0 transition-all active:scale-95 ${
                                    selectedPetType === petType.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                        : 'bg-white text-gray-700 shadow-sm border border-gray-100 hover:border-primary/30'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{petType.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider">{petType.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Category Filter */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider px-1">Category</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                        <button
                            onClick={() => setSelectedCategory('All')}
                            className={`px-6 py-3 rounded-2xl flex items-center gap-2 shrink-0 shadow-lg transition-all active:scale-95 ${
                                selectedCategory === 'All'
                                    ? 'bg-primary text-white shadow-primary/20'
                                    : 'bg-white text-gray-700 shadow-sm border border-gray-50 hover:border-primary/20'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">apps</span>
                            <span className="text-xs font-black uppercase tracking-widest">All</span>
                        </button>
                        {[
                            { name: 'Pet Food', icon: 'restaurant' },
                            { name: 'Toys', icon: 'videogame_asset' },
                            { name: 'Accessories', icon: 'spa' },
                            { name: 'Grooming', icon: 'medical_services' },
                            { name: 'Medicine', icon: 'healing' },
                            { name: 'Bedding', icon: 'hotel' }
                        ].map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`px-6 py-3 rounded-2xl flex items-center gap-2 shrink-0 shadow-sm border transition-all active:scale-95 ${
                                    selectedCategory === cat.name
                                        ? 'bg-primary text-white border-primary shadow-primary/20'
                                        : 'bg-white text-gray-700 border-gray-50 hover:border-primary/20'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${selectedCategory === cat.name ? 'text-white' : 'text-primary'}`}>{cat.icon}</span>
                                <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative aspect-[16/9] rounded-[32px] overflow-hidden shadow-2xl group cursor-pointer">
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUQuhpEtIfGp1hVNTRCMmJoSWaOY14GltHMWcDYXzw2rfbiBz2BDSKpPFbBRDGWi3fiB_xKpa83j2D1j2j6Vnwww26lG_4gdgN3XfBL3pHGDKTTnm9vfsdcHVK6n30bIX7q9kG_dJrKLfRFkxPqE3GfHv3wK61d2IO980SM5_HqZDeQQBtBT-x15MhnxEjhZ09uJG-EXpODUDVHuPDhYWbi0OUIty051RTjK1bXT4umqjCBqEioAPo5b5J47E__aA-wfFRdqr8S2U"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        alt="Promotional"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
                        <span className="bg-yellow-400 text-black text-[9px] font-black px-3 py-1 rounded-lg w-fit mb-3 uppercase tracking-widest shadow-lg">New Arrival</span>
                        <h2 className="text-white text-3xl font-black mb-1 leading-tight">Eco-Friendly Essentials</h2>
                        <p className="text-white/70 text-sm font-medium mb-6">Sustainable products for a happy planet & pet.</p>
                        <button className="bg-white text-primary px-8 py-3 rounded-xl font-black text-xs w-fit shadow-xl group-hover:bg-primary group-hover:text-white transition-all active:scale-95">Shop Collection</button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-black text-primary tracking-tight">Products</h3>
                        <p className="text-gray-500 text-xs font-medium">{filteredProducts.length} items</p>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-gray-400 text-4xl">inventory_2</span>
                            </div>
                            <p className="text-gray-600 font-bold mb-2">No products found</p>
                            <p className="text-gray-400 text-sm">Try a different search or category</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-6">
                            {filteredProducts.map((product) => {
                                const quantity = getItemQuantity(product.id);
                                return (
                                    <div 
                                        key={product.id} 
                                        onClick={() => setSelectedProduct(product)}
                                        className="bg-white rounded-[32px] p-4 shadow-md hover:shadow-xl transition-all group flex flex-col border border-gray-50 cursor-pointer"
                                    >
                                        <div className="relative aspect-square bg-gray-50 rounded-[24px] mb-4 flex items-center justify-center overflow-hidden group-hover:bg-primary/5 transition-colors">
                                            <img src={product.image} className="object-contain w-3/4 h-3/4 group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Handle favorite logic
                                                }}
                                                className="absolute top-3 right-3 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px] fill-current">favorite</span>
                                            </button>
                                            {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
                                                <div className="absolute top-3 left-3 bg-orange-500 text-white text-[8px] font-bold px-2 py-1 rounded-lg">
                                                    Only {product.stock} left
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col px-1">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">{product.brand}</span>
                                            <h4 className="text-sm font-black text-gray-900 leading-tight mb-2 line-clamp-2">{product.name}</h4>
                                            {product.rating && (
                                                <div className="flex items-center gap-1.5 mb-4">
                                                    <span className="material-symbols-outlined text-yellow-500 text-[14px] fill-current">star</span>
                                                    <span className="text-[11px] font-bold text-gray-400">{product.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                            <div className="mt-auto flex items-center justify-between gap-2">
                                                {/* Price Display - Show sale price with MRP crossed if available */}
                                                <div className="flex flex-col">
                                                    {product.sale_price && product.sale_price < product.price ? (
                                                        <>
                                                            <span className="text-lg font-black text-gray-900">₹{product.sale_price.toFixed(0)}</span>
                                                            <span className="text-xs text-gray-400 line-through">₹{product.price.toFixed(0)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-lg font-black text-gray-900">₹{product.price.toFixed(0)}</span>
                                                    )}
                                                </div>
                                                {/* For variable products, always show cart icon to open detail page */}
                                                {product.has_variations ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProduct(product);
                                                        }}
                                                        className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-primary transition-all active:scale-90"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                                    </button>
                                                ) : quantity === 0 ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddToCart(product.id);
                                                        }}
                                                        disabled={product.stock === 0}
                                                        className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-primary transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-1 bg-primary/10 rounded-xl px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDecreaseQuantity(product.id);
                                                            }}
                                                            className="w-7 h-7 bg-white text-primary rounded-lg flex items-center justify-center shadow-sm hover:bg-primary hover:text-white transition-all active:scale-90"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">remove</span>
                                                        </button>
                                                        <span className="text-xs font-black text-primary min-w-[18px] text-center">{quantity}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleIncreaseQuantity(product.id);
                                                            }}
                                                            className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-primary-dark transition-all active:scale-90"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <nav className="fixed bottom-0 w-full max-w-md z-50 bg-white border-t border-gray-200">
                <div className="flex justify-around items-center h-16 px-2 relative">
                    <button onClick={onHomeClick} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[22px]">home</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wide">Home</span>
                    </button>
                    <button onClick={onVisitsClick} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wide">Bookings</span>
                    </button>

                    {/* Center Cart Button */}
                    <button
                        onClick={onCartClick}
                        className="flex flex-col items-center justify-center min-w-[64px] -mt-8 relative"
                    >
                        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                            <span className="material-symbols-outlined text-white text-[28px]">shopping_cart</span>
                            {getTotalCartItems() > 0 && (
                                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-black text-white">
                                    {getTotalCartItems()}
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wide text-primary mt-1">Cart</span>
                    </button>

                    <button className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[22px]">pets</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wide">Pets</span>
                    </button>
                    <button onClick={onProfileClick} className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[22px]">person</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wide">Profile</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default Marketplace;
