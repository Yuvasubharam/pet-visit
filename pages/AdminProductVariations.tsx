import React, { useState, useEffect } from 'react';
import { ShopProduct, ProductVariation } from '../types';
import { adminProductService } from '../services/adminApi';

interface Props {
  onBack: () => void;
  productId: string;
}

const AdminProductVariations: React.FC<Props> = ({ onBack, productId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);

  // Form state
  const [variationName, setVariationName] = useState('');
  const [variationValue, setVariationValue] = useState('');
  const [basePrice, setBasePrice] = useState(''); // MRP
  const [salePrice, setSalePrice] = useState(''); // Discounted price
  const [purchasePrice, setPurchasePrice] = useState(''); // Cost price for margin
  const [stockQuantity, setStockQuantity] = useState('0');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const commonVariationTypes = ['Color', 'Size', 'Material', 'Weight', 'Flavor', 'Style'];

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const data = await adminProductService.getProductById(productId);
      setProduct(data);
      setVariations(data.variations || []);
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVariationName('');
    setVariationValue('');
    setBasePrice('');
    setSalePrice('');
    setPurchasePrice('');
    setStockQuantity('0');
    setSku('');
    setImageUrl('');
    setEditingVariation(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (variation: ProductVariation) => {
    setEditingVariation(variation);
    setVariationName(variation.variation_name);
    setVariationValue(variation.variation_value);
    // Use base_price if available, fallback to calculating from price_adjustment
    const variationBasePrice = variation.base_price || (product ? product.base_price + variation.price_adjustment : variation.price_adjustment);
    setBasePrice(variationBasePrice.toString());
    setSalePrice(variation.sale_price?.toString() || '');
    setPurchasePrice(variation.purchase_price?.toString() || '');
    setStockQuantity(variation.stock_quantity.toString());
    setSku(variation.sku || '');
    setImageUrl(variation.image || '');
    setShowAddModal(true);
  };

  const handleSaveVariation = async () => {
    // Validation
    if (!variationName.trim()) {
      alert('Variation type is required');
      return;
    }
    if (!variationValue.trim()) {
      alert('Variation value is required');
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      alert('Please enter a valid base price (MRP)');
      return;
    }

    // Validate sale price is less than base price
    if (salePrice && parseFloat(salePrice) >= parseFloat(basePrice)) {
      alert('Sale price must be less than base price (MRP)');
      return;
    }

    try {
      setSaving(true);

      // Calculate price_adjustment for backward compatibility
      const basePriceNum = parseFloat(basePrice) || 0;
      const priceAdjustment = product ? basePriceNum - product.base_price : 0;

      if (editingVariation) {
        // Update existing variation
        await adminProductService.updateVariation(editingVariation.id, {
          variation_name: variationName.trim(),
          variation_value: variationValue.trim(),
          price_adjustment: priceAdjustment,
          base_price: basePriceNum,
          sale_price: salePrice ? parseFloat(salePrice) : null,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
          stock_quantity: parseInt(stockQuantity) || 0,
          sku: sku.trim() || undefined,
          image: imageUrl.trim() || undefined,
        });
      } else {
        // Create new variation
        await adminProductService.createVariation({
          product_id: productId,
          variation_name: variationName.trim(),
          variation_value: variationValue.trim(),
          price_adjustment: priceAdjustment,
          base_price: basePriceNum,
          sale_price: salePrice ? parseFloat(salePrice) : null,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
          stock_quantity: parseInt(stockQuantity) || 0,
          sku: sku.trim() || undefined,
          image: imageUrl.trim() || undefined,
        });
      }

      await loadProductData();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving variation:', error);
      alert('Failed to save variation');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariation = async (variationId: string) => {
    if (!window.confirm('Are you sure you want to delete this variation?')) return;

    try {
      await adminProductService.deleteVariation(variationId);
      await loadProductData();
    } catch (error) {
      console.error('Error deleting variation:', error);
      alert('Failed to delete variation');
    }
  };

  const handleToggleActive = async (variation: ProductVariation) => {
    try {
      await adminProductService.updateVariation(variation.id, {
        is_active: !variation.is_active,
      });
      await loadProductData();
    } catch (error) {
      console.error('Error updating variation:', error);
      alert('Failed to update variation');
    }
  };

  const calculateFinalPrice = () => {
    const basePriceNum = parseFloat(basePrice) || 0;
    return basePriceNum;
  };

  const calculateDiscount = () => {
    const basePriceNum = parseFloat(basePrice) || 0;
    const salePriceNum = parseFloat(salePrice) || 0;
    if (basePriceNum > 0 && salePriceNum > 0 && salePriceNum < basePriceNum) {
      return Math.round(((basePriceNum - salePriceNum) / basePriceNum) * 100);
    }
    return 0;
  };

  const calculateMargin = () => {
    const salePriceNum = parseFloat(salePrice) || parseFloat(basePrice) || 0;
    const purchasePriceNum = parseFloat(purchasePrice) || 0;
    if (salePriceNum > 0 && purchasePriceNum > 0) {
      return Math.round(((salePriceNum - purchasePriceNum) / salePriceNum) * 100);
    }
    return 0;
  };

  // Group variations by type
  const groupedVariations = variations.reduce((acc, v) => {
    if (!acc[v.variation_name]) {
      acc[v.variation_name] = [];
    }
    acc[v.variation_name].push(v);
    return acc;
  }, {} as Record<string, ProductVariation[]>);

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
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-2">
          Product Variations
        </h2>
        <button
          onClick={handleOpenAdd}
          className="flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>
      </header>

      {/* Product Info */}
      {product && (
        <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl bg-cover bg-center border border-slate-200 dark:border-slate-600 shrink-0"
              style={{
                backgroundImage: product.main_image
                  ? `url("${product.main_image}")`
                  : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
              <p className="text-sm text-slate-500">
                Base Price: ₹{product.base_price.toFixed(2)} • {variations.length} variations
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Variations List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
        {Object.keys(groupedVariations).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedVariations).map(([type, vars]) => (
              <section key={type} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                {/* Type Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">tune</span>
                    <span className="font-bold text-slate-900 dark:text-white">{type}</span>
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                    {vars.length} options
                  </span>
                </div>

                {/* Variation Items */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {vars.map((variation) => (
                    <div
                      key={variation.id}
                      className={`flex items-center gap-3 p-3 ${!variation.is_active ? 'opacity-50' : ''}`}
                    >
                      {/* Variation Image */}
                      {variation.image ? (
                        <div
                          className="w-12 h-12 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-600 shrink-0"
                          style={{ backgroundImage: `url("${variation.image}")` }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-slate-400">palette</span>
                        </div>
                      )}

                      {/* Variation Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {variation.variation_value}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {/* Price Display */}
                          {variation.sale_price && variation.sale_price > 0 ? (
                            <>
                              <span className="text-green-600 font-semibold">₹{variation.sale_price.toFixed(0)}</span>
                              <span className="line-through text-slate-400">₹{(variation.base_price || (product ? product.base_price + variation.price_adjustment : 0)).toFixed(0)}</span>
                            </>
                          ) : (
                            <span className="font-semibold">₹{(variation.base_price || (product ? product.base_price + variation.price_adjustment : 0)).toFixed(0)}</span>
                          )}
                          <span>•</span>
                          <span className={variation.stock_quantity <= 5 ? 'text-orange-500' : ''}>
                            Stock: {variation.stock_quantity}
                          </span>
                          {variation.purchase_price && variation.purchase_price > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-blue-500">Cost: ₹{variation.purchase_price.toFixed(0)}</span>
                            </>
                          )}
                          {variation.sku && (
                            <>
                              <span>•</span>
                              <span>{variation.sku}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(variation)}
                          className={`p-1.5 rounded-full ${
                            variation.is_active
                              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={variation.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {variation.is_active ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(variation)}
                          className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVariation(variation.id)}
                          className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">tune</span>
            <p className="text-slate-500 dark:text-slate-400 mb-2">No variations added yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Add variations like colors, sizes, or materials
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Add Variation
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingVariation ? 'Edit Variation' : 'Add Variation'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-4 space-y-4">
              {/* Variation Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Variation Type *
                </label>
                <input
                  type="text"
                  value={variationName}
                  onChange={(e) => setVariationName(e.target.value)}
                  placeholder="e.g., Color, Size, Material"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  list="variation-types"
                />
                <datalist id="variation-types">
                  {commonVariationTypes.map(type => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>

              {/* Variation Value */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Value *
                </label>
                <input
                  type="text"
                  value={variationValue}
                  onChange={(e) => setVariationValue(e.target.value)}
                  placeholder="e.g., Red, Large, Cotton"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Base Price (MRP) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Base Price / MRP (₹) *
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="Enter MRP"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Sale Price & Stock Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Sale Price (₹)
                  </label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Optional"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Purchase Price (Cost) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Purchase Price / Cost (₹) - For margin tracking
                </label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Optional - Enter cost price"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Price Summary Display */}
              {basePrice && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">MRP:</span>
                    <span className={`text-lg font-bold ${salePrice ? 'line-through text-slate-400' : 'text-primary'}`}>
                      ₹{parseFloat(basePrice).toFixed(2)}
                    </span>
                  </div>
                  {salePrice && parseFloat(salePrice) > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Sale Price:</span>
                        <span className="text-lg font-bold text-green-600">
                          ₹{parseFloat(salePrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Discount:</span>
                        <span className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                          {calculateDiscount()}% OFF
                        </span>
                      </div>
                    </>
                  )}
                  {purchasePrice && parseFloat(purchasePrice) > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                      <span className="text-sm text-slate-500">Margin:</span>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                        {calculateMargin()}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Enter variant SKU"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste variation image URL"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {imageUrl && (
                  <div className="mt-2">
                    <div
                      className="w-20 h-20 rounded-xl bg-cover bg-center border border-slate-200 dark:border-slate-600"
                      style={{ backgroundImage: `url("${imageUrl}")` }}
                    />
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveVariation}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-bold text-base py-4 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    {editingVariation ? 'Update Variation' : 'Add Variation'}
                  </>
                )}
              </button>
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

export default AdminProductVariations;
