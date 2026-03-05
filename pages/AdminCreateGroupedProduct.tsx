import React, { useState, useEffect } from 'react';
import { ShopProduct, GroupedProduct } from '../types';
import { adminProductService } from '../services/adminApi';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

interface SelectedProduct {
  product: ShopProduct;
  quantity: number;
}

const AdminCreateGroupedProduct: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await adminProductService.getAllProducts({ is_active: true });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    // Exclude already selected products
    const alreadySelected = selectedProducts.some(sp => sp.product.id === p.id);
    if (alreadySelected) return false;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
    }
    return true;
  });

  const handleAddProduct = (product: ShopProduct) => {
    setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    setShowProductSearch(false);
    setSearchQuery('');
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(sp => sp.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(selectedProducts.map(sp =>
      sp.product.id === productId ? { ...sp, quantity } : sp
    ));
  };

  const calculateTotalValue = () => {
    return selectedProducts.reduce((sum, sp) => sum + (sp.product.base_price * sp.quantity), 0);
  };

  const calculateSavings = () => {
    const total = calculateTotalValue();
    const final = parseFloat(finalPrice) || 0;
    return total - final;
  };

  const calculateDiscountPercentage = () => {
    const total = calculateTotalValue();
    if (total === 0) return 0;
    const savings = calculateSavings();
    return Math.round((savings / total) * 100);
  };

  const handleSave = async () => {
    // Validation
    if (!groupName.trim()) {
      alert('Bundle name is required');
      return;
    }
    if (selectedProducts.length < 2) {
      alert('Please add at least 2 products to the bundle');
      return;
    }
    if (!finalPrice || parseFloat(finalPrice) <= 0) {
      alert('Please enter a valid final price');
      return;
    }

    try {
      setSaving(true);

      await adminProductService.createGroupedProduct({
        name: groupName.trim(),
        description: description.trim() || undefined,
        final_price: parseFloat(finalPrice),
        discount_percentage: calculateDiscountPercentage() || undefined,
        items: selectedProducts.map(sp => ({
          product_id: sp.product.id,
          quantity: sp.quantity,
        })),
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating grouped product:', error);
      alert('Failed to create bundle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex size-10 shrink-0 items-center justify-center rounded-full active:bg-slate-200 dark:active:bg-slate-800 cursor-pointer"
        >
          <span className="material-symbols-outlined text-slate-800 dark:text-slate-100 text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
          Create Bundle
        </h2>
      </header>

      {/* Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
        {/* Bundle Info Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">inventory</span>
            Bundle Information
          </h3>

          <div className="space-y-4">
            {/* Bundle Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bundle Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Complete Dog Care Kit"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's included in this bundle"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </section>

        {/* Selected Products Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_basket</span>
              Products in Bundle
            </h3>
            <span className="text-sm text-slate-500">{selectedProducts.length} items</span>
          </div>

          {/* Selected Products List */}
          {selectedProducts.length > 0 ? (
            <div className="space-y-3 mb-4">
              {selectedProducts.map((sp) => (
                <div
                  key={sp.product.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"
                >
                  {/* Product Image */}
                  <div
                    className="w-12 h-12 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-600 shrink-0"
                    style={{
                      backgroundImage: sp.product.main_image
                        ? `url("${sp.product.main_image}")`
                        : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    }}
                  />

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {sp.product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ₹{sp.product.base_price.toFixed(2)} each
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(sp.product.id, sp.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="w-6 text-center font-bold text-slate-900 dark:text-white">
                      {sp.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(sp.product.id, sp.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveProduct(sp.product.id)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">
                shopping_basket
              </span>
              <p className="text-sm text-slate-500">No products added yet</p>
            </div>
          )}

          {/* Add Product Button */}
          <button
            onClick={() => setShowProductSearch(true)}
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Product to Bundle
          </button>
        </section>

        {/* Pricing Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">payments</span>
            Bundle Pricing
          </h3>

          {/* Summary */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedProducts.reduce((sum, sp) => sum + sp.quantity, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Combined Value
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{calculateTotalValue().toFixed(2)}
                </p>
              </div>
            </div>

            {/* Savings Display */}
            {parseFloat(finalPrice) > 0 && calculateSavings() > 0 && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400">
                  savings
                </span>
                <span className="text-green-700 dark:text-green-400 font-bold">
                  Save ₹{calculateSavings().toFixed(2)} ({calculateDiscountPercentage()}% off)
                </span>
              </div>
            )}
          </div>

          {/* Final Price Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bundle Price (₹) *
            </label>
            <input
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-lg font-bold"
            />
            <p className="text-xs text-slate-500 mt-1">
              Recommended: ₹{(calculateTotalValue() * 0.85).toFixed(2)} (15% discount)
            </p>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto">
        <button
          onClick={handleSave}
          disabled={saving || selectedProducts.length < 2}
          className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-bold text-base py-4 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              Create Bundle
            </>
          )}
        </button>
      </div>

      {/* Product Search Modal */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md max-h-[80vh] flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Product</h3>
              <button
                onClick={() => {
                  setShowProductSearch(false);
                  setSearchQuery('');
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex w-full items-stretch rounded-xl h-10 bg-slate-100 dark:bg-slate-700">
                <div className="flex items-center justify-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  className="flex w-full flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 px-3 focus:ring-0 text-sm"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length > 0 ? (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-600 shrink-0"
                        style={{
                          backgroundImage: product.main_image
                            ? `url("${product.main_image}")`
                            : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.category} • ₹{product.base_price.toFixed(2)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-primary">add_circle</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">
                    search_off
                  </span>
                  <p className="text-sm text-slate-500">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default AdminCreateGroupedProduct;
