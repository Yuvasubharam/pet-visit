import React, { useState, useEffect } from 'react';
import { Product, ProductVariation } from '../types';
import { cartService } from '../services/api';
import { adminProductService } from '../services/adminApi';

interface Props {
    product: Product;
    onBack: () => void;
    onCartClick: () => void;
    userId?: string | null;
}

const ProductDetail: React.FC<Props> = ({ product, onBack, onCartClick, userId }) => {
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
    const [groupedVariations, setGroupedVariations] = useState<Record<string, ProductVariation[]>>({});
    const [isLoadingVariations, setIsLoadingVariations] = useState(false);

    useEffect(() => {
        if (userId) {
            loadCartCount();
        }
        loadVariations();
    }, [userId, product.id]);

    const loadVariations = async () => {
        setIsLoadingVariations(true);
        try {
            console.log('[ProductDetail] Loading variations for product:', product.id);
            const productData = await adminProductService.getProductById(product.id);
            console.log('[ProductDetail] Product data received:', productData);
            console.log('[ProductDetail] Variations:', productData.variations);

            if (productData.variations && productData.variations.length > 0) {
                // Filter only active variations
                const activeVariations = productData.variations.filter(v => v.is_active !== false);
                setVariations(activeVariations);

                // Group variations by type
                const grouped = activeVariations.reduce((acc, v) => {
                    if (!acc[v.variation_name]) {
                        acc[v.variation_name] = [];
                    }
                    acc[v.variation_name].push(v);
                    return acc;
                }, {} as Record<string, ProductVariation[]>);
                console.log('[ProductDetail] Grouped variations:', grouped);
                setGroupedVariations(grouped);
            } else {
                console.log('[ProductDetail] No variations found for this product');
                setVariations([]);
                setGroupedVariations({});
            }
        } catch (error) {
            console.error('[ProductDetail] Error loading variations:', error);
            setVariations([]);
            setGroupedVariations({});
        } finally {
            setIsLoadingVariations(false);
        }
    };

    const loadCartCount = async () => {
        try {
            const items = await cartService.getCartItems(userId!);
            const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
            setCartCount(total);
        } catch (error) {
            console.error('Error loading cart count:', error);
        }
    };

    const calculateFinalPrice = (): number => {
        if (selectedVariation) {
            // If variation has sale_price, use it as final price
            if (selectedVariation.sale_price && selectedVariation.sale_price > 0) {
                return selectedVariation.sale_price;
            }
            // If variation has base_price, use it
            if (selectedVariation.base_price && selectedVariation.base_price > 0) {
                return selectedVariation.base_price;
            }
            // Fallback to legacy price_adjustment calculation
            return product.price + selectedVariation.price_adjustment;
        }
        // For product without variation selected
        const productWithSale = product as any;
        if (productWithSale.sale_price && productWithSale.sale_price > 0) {
            return productWithSale.sale_price;
        }
        return product.price;
    };

    const getDisplayPrice = (): { final: number; original?: number; discount?: number } => {
        if (selectedVariation) {
            // Get MRP (base price) for variation
            const variationMRP = selectedVariation.base_price || (product.price + selectedVariation.price_adjustment);

            // If variation has sale_price, show discount
            if (selectedVariation.sale_price && selectedVariation.sale_price > 0 && selectedVariation.sale_price < variationMRP) {
                const discount = Math.round(((variationMRP - selectedVariation.sale_price) / variationMRP) * 100);
                return {
                    final: selectedVariation.sale_price,
                    original: variationMRP,
                    discount
                };
            }
            // No sale price, just show MRP
            return {
                final: variationMRP
            };
        }

        // For product without variation
        const productWithSale = product as any;
        if (productWithSale.sale_price && productWithSale.sale_price > 0 && productWithSale.sale_price < product.price) {
            const discount = Math.round(((product.price - productWithSale.sale_price) / product.price) * 100);
            return {
                final: productWithSale.sale_price,
                original: product.price,
                discount
            };
        }
        return {
            final: product.price
        };
    };

    const handleAddToCart = async () => {
        if (!userId) {
            alert('Please login to add items to cart');
            return;
        }

        // If product has variations but none selected, show alert
        if (Object.keys(groupedVariations).length > 0 && !selectedVariation) {
            alert('Please select a variation before adding to cart');
            return;
        }

        try {
            setIsAdding(true);
            // Pass variation ID if selected
            await cartService.addToCart(userId, product.id, quantity, selectedVariation?.id);
            await loadCartCount();
            alert('Added to cart!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add to cart');
        } finally {
            setIsAdding(false);
        }
    };

    const getAvailableStock = (): number => {
        if (selectedVariation) {
            return selectedVariation.stock_quantity;
        }
        return product.stock || 0;
    };

    const incrementQty = () => {
        const stock = getAvailableStock();
        if (quantity >= stock) return;
        setQuantity(prev => prev + 1);
    };

    const decrementQty = () => {
        setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    };

    return (
        <div className="flex-1 flex flex-col bg-white h-screen overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-30">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="material-symbols-outlined text-gray-900">arrow_back</span>
                </button>
                <button
                    onClick={onCartClick}
                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 relative active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-white text-[22px]">shopping_cart</span>
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                            {cartCount}
                        </span>
                    )}
                </button>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-8">
                    <img 
                        src={product.image} 
                        className="w-full h-full object-contain" 
                        alt={product.name} 
                    />
                    <button className="absolute bottom-6 right-6 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-[24px] fill-current">favorite</span>
                    </button>
                </div>

                {/* Product Info */}
                <div className="p-8 space-y-6">
                    <div>
                        <span className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2 block">{product.brand}</span>
                        <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">{product.name}</h1>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-yellow-500 text-[18px] fill-current">star</span>
                                <span className="text-sm font-bold text-gray-900">{product.rating?.toFixed(1) || '4.5'}</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm font-bold text-gray-400">120+ Reviews</span>
                        </div>
                    </div>

                    {/* Variations Selector */}
                    {isLoadingVariations ? (
                        <div className="flex items-center gap-2 py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            <span className="text-sm text-gray-500">Loading options...</span>
                        </div>
                    ) : Object.keys(groupedVariations).length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(groupedVariations).map(([type, vars]) => (
                                <div key={type}>
                                    <label className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3 block">
                                        {type} {!selectedVariation && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {vars.map((variation) => (
                                            <button
                                                key={variation.id}
                                                onClick={() => setSelectedVariation(variation)}
                                                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                                                    selectedVariation?.id === variation.id
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                        : 'bg-gray-100 text-gray-900 border-2 border-gray-200 hover:border-primary/30'
                                                }`}
                                            >
                                                {variation.variation_value}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {!selectedVariation && (
                                <p className="text-xs text-red-500 mt-2">Please select an option to add to cart</p>
                            )}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Price</span>
                            {(() => {
                                const priceInfo = getDisplayPrice();
                                return (
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-black text-gray-900">
                                            ₹{priceInfo.final.toFixed(2)}
                                        </span>
                                        {priceInfo.original && (
                                            <>
                                                <span className="text-lg text-gray-400 line-through">
                                                    ₹{priceInfo.original.toFixed(2)}
                                                </span>
                                                {priceInfo.discount && (
                                                    <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg">
                                                        {priceInfo.discount}% OFF
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-2">
                            <button 
                                onClick={decrementQty}
                                className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-gray-900 active:scale-90 transition-transform"
                            >
                                <span className="material-symbols-outlined">remove</span>
                            </button>
                            <span className="text-lg font-black text-gray-900 w-6 text-center">{quantity}</span>
                            <button 
                                onClick={incrementQty}
                                className="w-10 h-10 bg-primary text-white shadow-md rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Description</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {product.description || `High-quality ${product.name} for your beloved pet. Specially formulated to provide essential nutrients and support overall health and well-being.`}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-gray-50 p-4 rounded-2xl">
                            <span className="material-symbols-outlined text-primary mb-2">local_shipping</span>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Delivery</p>
                            <p className="text-xs font-bold text-gray-900">2-3 Business Days</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                            <span className="material-symbols-outlined text-primary mb-2">inventory_2</span>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Stock</p>
                            <p className="text-xs font-bold text-gray-900">
                                {selectedVariation ? selectedVariation.stock_quantity : product.stock || 0} units available
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Action */}
            <footer className="p-6 bg-white border-t border-gray-100">
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding || getAvailableStock() === 0 || (Object.keys(groupedVariations).length > 0 && !selectedVariation)}
                    className="w-full bg-gray-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {isAdding
                        ? 'Adding...'
                        : getAvailableStock() === 0
                            ? 'Out of Stock'
                            : (Object.keys(groupedVariations).length > 0 && !selectedVariation)
                                ? 'Select Option'
                                : 'Add to Cart'}
                </button>
            </footer>
        </div>
    );
};

export default ProductDetail;
