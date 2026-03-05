import React, { useState, useEffect } from 'react';
import { ShopProduct, ProductAttribute, ProductVariation } from '../types';
import { adminProductService, adminAttributePricingService } from '../services/adminApi';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  editProductId?: string; // If provided, we're editing an existing product
}

const AdminCreateProduct: React.FC<Props> = ({ onBack, onSuccess, editProductId }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [hasAttributePricing, setHasAttributePricing] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [sku, setSku] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [petTypes, setPetTypes] = useState<string[]>(['dog', 'cat']);
  const [attributes, setAttributes] = useState<{ name: string; values: string[] }[]>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');
  const [attributePricing, setAttributePricing] = useState<any[]>([]);
  const [editingPricingIndex, setEditingPricingIndex] = useState<number | null>(null);
  const [pricingForm, setPricingForm] = useState({
    attribute_name: '',
    attribute_value: '',
    adjusted_price: '',
    sale_price: '',
    stock_quantity: '',
    sku: '',
  });

  // Product Variations State
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);
  const [variationForm, setVariationForm] = useState({
    variation_name: '',
    variation_value: '',
    base_price: '', // MRP for this variation
    sale_price: '', // Discounted price
    purchase_price: '', // Cost price for margin tracking
    stock_quantity: '0',
    sku: '',
    image: '',
  });

  const commonVariationTypes = ['Color', 'Size', 'Material', 'Weight', 'Flavor', 'Style'];

  const categories = ['Pet Food', 'Toys', 'Accessories', 'Grooming', 'Medicine', 'Bedding'];
  const petTypeOptions = [
    { value: 'dog', label: 'Dog' },
    { value: 'cat', label: 'Cat' },
    { value: 'rabbit', label: 'Rabbit' },
    { value: 'bird', label: 'Bird' },
    { value: 'guinea_pig', label: 'Guinea Pig' },
    { value: 'hamster', label: 'Hamster' },
    { value: 'turtle', label: 'Turtle' },
    { value: 'fish', label: 'Fish' },
  ];

  const isEditing = !!editProductId;

  useEffect(() => {
    if (editProductId) {
      loadProduct();
    }
  }, [editProductId]);

  const loadProduct = async () => {
    if (!editProductId) return;

    try {
      setLoading(true);
      const product = await adminProductService.getProductById(editProductId);
      setProductName(product.name);
      setDescription(product.description || '');
      setCategory(product.category);
      setPrice(product.base_price.toString());
      setSalePrice(product.sale_price?.toString() || '');
      setHasAttributePricing(product.has_attribute_pricing || false);
      setStockQuantity(product.stock_quantity.toString());
      setSku(product.sku || '');
      setMainImage(product.main_image || '');
      setAdditionalImages(product.images || []);
      setPetTypes(product.pet_types || ['dog', 'cat']);

      // Load attributes
      if (product.attributes) {
        setAttributes(product.attributes.map(a => ({
          name: a.attribute_name,
          values: a.attribute_values,
        })));
      }

      // Load variations
      if (product.variations) {
        setVariations(product.variations);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  // Variation Handlers
  const resetVariationForm = () => {
    setVariationForm({
      variation_name: '',
      variation_value: '',
      base_price: '',
      sale_price: '',
      purchase_price: '',
      stock_quantity: '0',
      sku: '',
      image: '',
    });
    setEditingVariation(null);
  };

  const handleOpenAddVariation = () => {
    resetVariationForm();
    setShowVariationModal(true);
  };

  const handleOpenEditVariation = (variation: ProductVariation) => {
    setEditingVariation(variation);
    // Use base_price if available, fallback to calculating from price_adjustment
    const variationBasePrice = variation.base_price || (parseFloat(price) + variation.price_adjustment);
    setVariationForm({
      variation_name: variation.variation_name,
      variation_value: variation.variation_value,
      base_price: variationBasePrice.toString(),
      sale_price: variation.sale_price?.toString() || '',
      purchase_price: variation.purchase_price?.toString() || '',
      stock_quantity: variation.stock_quantity.toString(),
      sku: variation.sku || '',
      image: variation.image || '',
    });
    setShowVariationModal(true);
  };

  const handleSaveVariation = () => {
    if (!variationForm.variation_name.trim()) {
      alert('Variation type is required');
      return;
    }
    if (!variationForm.variation_value.trim()) {
      alert('Variation value is required');
      return;
    }
    if (!variationForm.base_price || parseFloat(variationForm.base_price) <= 0) {
      alert('Please enter a valid base price (MRP)');
      return;
    }

    // Validate sale price is less than base price
    if (variationForm.sale_price && parseFloat(variationForm.sale_price) >= parseFloat(variationForm.base_price)) {
      alert('Sale price must be less than base price (MRP)');
      return;
    }

    // Calculate price_adjustment for backward compatibility
    const basePriceNum = parseFloat(variationForm.base_price) || 0;
    const productBasePrice = parseFloat(price) || 0;
    const priceAdjustment = basePriceNum - productBasePrice;

    const newVariation: any = {
      id: editingVariation?.id || `temp-${Date.now()}`,
      product_id: editProductId || '',
      variation_name: variationForm.variation_name.trim(),
      variation_value: variationForm.variation_value.trim(),
      price_adjustment: priceAdjustment,
      base_price: basePriceNum,
      sale_price: variationForm.sale_price ? parseFloat(variationForm.sale_price) : null,
      purchase_price: variationForm.purchase_price ? parseFloat(variationForm.purchase_price) : null,
      stock_quantity: parseInt(variationForm.stock_quantity) || 0,
      sku: variationForm.sku.trim() || undefined,
      image: variationForm.image.trim() || undefined,
      is_active: true,
    };

    if (editingVariation) {
      setVariations(variations.map(v => v.id === editingVariation.id ? newVariation : v));
    } else {
      setVariations([...variations, newVariation]);
    }

    setShowVariationModal(false);
    resetVariationForm();
  };

  const handleDeleteVariation = (variationId: string) => {
    if (!window.confirm('Are you sure you want to delete this variation?')) return;
    setVariations(variations.filter(v => v.id !== variationId));
  };

  const handleToggleVariationActive = (variationId: string) => {
    setVariations(variations.map(v =>
      v.id === variationId ? { ...v, is_active: !v.is_active } : v
    ));
  };

  const calculateVariationFinalPrice = () => {
    const basePriceNum = parseFloat(variationForm.base_price) || 0;
    const salePriceNum = variationForm.sale_price ? parseFloat(variationForm.sale_price) : null;
    if (salePriceNum && salePriceNum > 0) {
      return salePriceNum;
    }
    return basePriceNum;
  };

  const calculateVariationDiscount = () => {
    const basePriceNum = parseFloat(variationForm.base_price) || 0;
    const salePriceNum = parseFloat(variationForm.sale_price) || 0;
    if (basePriceNum > 0 && salePriceNum > 0 && salePriceNum < basePriceNum) {
      return Math.round(((basePriceNum - salePriceNum) / basePriceNum) * 100);
    }
    return 0;
  };

  const calculateVariationMargin = () => {
    const salePriceNum = parseFloat(variationForm.sale_price) || parseFloat(variationForm.base_price) || 0;
    const purchasePriceNum = parseFloat(variationForm.purchase_price) || 0;
    if (salePriceNum > 0 && purchasePriceNum > 0) {
      return Math.round(((salePriceNum - purchasePriceNum) / salePriceNum) * 100);
    }
    return 0;
  };

  // Group variations by type for display
  const groupedVariations: Record<string, ProductVariation[]> = variations.reduce(
    (acc: Record<string, ProductVariation[]>, v: ProductVariation) => {
      if (!acc[v.variation_name]) {
        acc[v.variation_name] = [];
      }
      acc[v.variation_name].push(v);
      return acc;
    },
    {}
  );

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;

    if (!mainImage) {
      setMainImage(newImageUrl.trim());
    } else {
      setAdditionalImages([...additionalImages, newImageUrl.trim()]);
    }
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (index === -1) {
      // Removing main image
      if (additionalImages.length > 0) {
        setMainImage(additionalImages[0]);
        setAdditionalImages(additionalImages.slice(1));
      } else {
        setMainImage('');
      }
    } else {
      setAdditionalImages(additionalImages.filter((_, i) => i !== index));
    }
  };

  const handleSetAsMain = (index: number) => {
    const newMain = additionalImages[index];
    const newAdditional = additionalImages.filter((_, i) => i !== index);
    if (mainImage) {
      newAdditional.unshift(mainImage);
    }
    setMainImage(newMain);
    setAdditionalImages(newAdditional);
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim() || !newAttrValues.trim()) return;

    const values = newAttrValues.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) return;

    setAttributes([...attributes, { name: newAttrName.trim(), values }]);
    setNewAttrName('');
    setNewAttrValues('');
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const getAvailableAttributeValues = () => {
    const allValues: { attribute_name: string; attribute_value: string }[] = [];
    attributes.forEach(attr => {
      attr.values.forEach(val => {
        allValues.push({ attribute_name: attr.name, attribute_value: val });
      });
    });
    return allValues;
  };

  const handleAddAttributePricing = () => {
    if (!pricingForm.attribute_name || !pricingForm.attribute_value || !pricingForm.adjusted_price || !pricingForm.stock_quantity) {
      alert('Please fill in all required fields');
      return;
    }

    const newPricing = {
      attribute_name: pricingForm.attribute_name,
      attribute_value: pricingForm.attribute_value,
      adjusted_price: parseFloat(pricingForm.adjusted_price),
      sale_price: pricingForm.sale_price ? parseFloat(pricingForm.sale_price) : undefined,
      stock_quantity: parseInt(pricingForm.stock_quantity),
      sku: pricingForm.sku || undefined,
    };

    if (editingPricingIndex !== null) {
      const updated = [...attributePricing];
      updated[editingPricingIndex] = newPricing;
      setAttributePricing(updated);
      setEditingPricingIndex(null);
    } else {
      setAttributePricing([...attributePricing, newPricing]);
    }

    setPricingForm({
      attribute_name: '',
      attribute_value: '',
      adjusted_price: '',
      sale_price: '',
      stock_quantity: '',
      sku: '',
    });
  };

  const handleEditAttributePricing = (index: number) => {
    const pricing = attributePricing[index];
    setPricingForm({
      attribute_name: pricing.attribute_name,
      attribute_value: pricing.attribute_value,
      adjusted_price: pricing.adjusted_price.toString(),
      sale_price: pricing.sale_price?.toString() || '',
      stock_quantity: pricing.stock_quantity.toString(),
      sku: pricing.sku || '',
    });
    setEditingPricingIndex(index);
  };

  const handleRemoveAttributePricing = (index: number) => {
    setAttributePricing(attributePricing.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validation
    if (!productName.trim()) {
      alert('Product name is required');
      return;
    }
    if (!category) {
      alert('Please select a category');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (!stockQuantity || parseInt(stockQuantity) < 0) {
      alert('Please enter a valid stock quantity');
      return;
    }

    try {
      setSaving(true);

      // Validate sale price
      if (salePrice && parseFloat(salePrice) >= parseFloat(price)) {
        alert('Sale price must be less than regular price');
        return;
      }

      const productData = {
        name: productName.trim(),
        description: description.trim() || undefined,
        category,
        base_price: parseFloat(price),
        sale_price: salePrice ? parseFloat(salePrice) : undefined,
        has_attribute_pricing: hasAttributePricing,
        stock_quantity: parseInt(stockQuantity),
        sku: sku.trim() || undefined,
        main_image: mainImage || undefined,
        images: additionalImages.length > 0 ? additionalImages : undefined,
        pet_types: petTypes.length > 0 ? petTypes : undefined,
      };

      if (isEditing && editProductId) {
        // Update existing product
        await adminProductService.updateProduct(editProductId, productData);

        // Update attributes (delete old and create new)
        const existingProduct = await adminProductService.getProductById(editProductId);
        for (const attr of existingProduct.attributes) {
          await adminProductService.deleteAttribute(attr.id);
        }
        for (const attr of attributes) {
          await adminProductService.createAttribute({
            product_id: editProductId,
            attribute_name: attr.name,
            attribute_values: attr.values,
          });
        }

        // Save attribute pricing if enabled
        if (hasAttributePricing && attributePricing.length > 0) {
          for (const pricing of attributePricing) {
            await adminAttributePricingService.addAttributePricing(editProductId, pricing);
          }
        }

        // Save variations
        // First, get existing variations and delete ones that are removed
        const existingVariations = await adminProductService.getProductById(editProductId);
        const existingVariationIds = existingVariations.variations?.map(v => v.id) || [];
        const currentVariationIds = variations.filter(v => !v.id.startsWith('temp-')).map(v => v.id);

        // Delete removed variations
        for (const oldId of existingVariationIds) {
          if (!currentVariationIds.includes(oldId)) {
            await adminProductService.deleteVariation(oldId);
          }
        }

        // Update existing or create new variations
        for (const variation of variations) {
          if (variation.id.startsWith('temp-')) {
            // New variation
            await adminProductService.createVariation({
              product_id: editProductId,
              variation_name: variation.variation_name,
              variation_value: variation.variation_value,
              price_adjustment: variation.price_adjustment,
              base_price: variation.base_price || null,
              sale_price: variation.sale_price || null,
              purchase_price: variation.purchase_price || null,
              stock_quantity: variation.stock_quantity,
              sku: variation.sku,
              image: variation.image,
            });
          } else {
            // Update existing
            await adminProductService.updateVariation(variation.id, {
              variation_name: variation.variation_name,
              variation_value: variation.variation_value,
              price_adjustment: variation.price_adjustment,
              base_price: variation.base_price || null,
              sale_price: variation.sale_price || null,
              purchase_price: variation.purchase_price || null,
              stock_quantity: variation.stock_quantity,
              sku: variation.sku,
              image: variation.image,
              is_active: variation.is_active,
            });
          }
        }
      } else {
        // Create new product
        const newProduct = await adminProductService.createProduct(productData);

        // Create attributes
        for (const attr of attributes) {
          await adminProductService.createAttribute({
            product_id: newProduct.id,
            attribute_name: attr.name,
            attribute_values: attr.values,
          });
        }

        // Save attribute pricing if enabled
        if (hasAttributePricing && attributePricing.length > 0) {
          for (const pricing of attributePricing) {
            await adminAttributePricingService.addAttributePricing(newProduct.id, pricing);
          }
        }

        // Create variations for new product
        for (const variation of variations) {
          await adminProductService.createVariation({
            product_id: newProduct.id,
            variation_name: variation.variation_name,
            variation_value: variation.variation_value,
            price_adjustment: variation.price_adjustment,
            base_price: variation.base_price || null,
            sale_price: variation.sale_price || null,
            purchase_price: variation.purchase_price || null,
            stock_quantity: variation.stock_quantity,
            sku: variation.sku,
            image: variation.image,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
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
          {isEditing ? 'Edit Product' : 'Create Product'}
        </h2>
      </header>

      {/* Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
        {/* Images Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">image</span>
            Product Images
          </h3>

          {/* Main Image */}
          {mainImage ? (
            <div className="relative mb-3">
              <div
                className="w-full h-48 rounded-xl bg-cover bg-center border-2 border-primary"
                style={{ backgroundImage: `url("${mainImage}")` }}
              />
              <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                Main
              </div>
              <button
                onClick={() => handleRemoveImage(-1)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ) : (
            <div className="w-full h-48 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center mb-3">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">add_photo_alternate</span>
              <p className="text-sm text-slate-500">Add main product image</p>
            </div>
          )}

          {/* Additional Images */}
          {additionalImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {additionalImages.map((img, index) => (
                <div key={index} className="relative">
                  <div
                    className="w-full h-16 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-600"
                    style={{ backgroundImage: `url("${img}")` }}
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                  <button
                    onClick={() => handleSetAsMain(index)}
                    className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full"
                    title="Set as main"
                  >
                    <span className="material-symbols-outlined text-[14px]">star</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Image URL */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste image URL..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleAddImage}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
            >
              Add
            </button>
          </div>
        </section>

        {/* Basic Info Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            Basic Information
          </h3>

          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Pet Types */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pet Types (This product is for) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {petTypeOptions.map((petType) => (
                  <label key={petType.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={petTypes.includes(petType.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPetTypes([...petTypes, petType.value]);
                        } else {
                          setPetTypes(petTypes.filter(t => t !== petType.value));
                        }
                      }}
                      className="w-4 h-4 rounded text-primary cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{petType.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </section>

        {/* Pricing & Inventory Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">payments</span>
            Pricing & Inventory
          </h3>

          <div className="space-y-4">
            {/* Price Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Base Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {hasAttributePricing ? 'Default Base Price (₹) *' : 'Base Price (₹) *'}
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {hasAttributePricing ? 'Default Sale Price (₹) (Optional)' : 'Sale Price (₹) (Optional)'}
                </label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {salePrice && price && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Save ₹{(parseFloat(price) - parseFloat(salePrice)).toFixed(2)} ({((1 - parseFloat(salePrice) / parseFloat(price)) * 100).toFixed(0)}% off)
                  </p>
                )}
              </div>
            </div>

            {/* Attribute-based Pricing Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Attribute-based Pricing</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Different prices for colors, sizes, etc.</p>
              </div>
              <button
                onClick={() => {
                  setHasAttributePricing(!hasAttributePricing);
                  if (hasAttributePricing) {
                    setAttributePricing([]);
                    setPricingForm({
                      attribute_name: '',
                      attribute_value: '',
                      adjusted_price: '',
                      sale_price: '',
                      stock_quantity: '',
                      sku: '',
                    });
                    setEditingPricingIndex(null);
                  }
                }}
                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                  hasAttributePricing ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    hasAttributePricing ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Attribute Pricing Form (shown when attribute-based pricing is enabled) */}
            {hasAttributePricing && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Add Pricing for Attribute Values</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Attribute Name Dropdown */}
                  <select
                    value={pricingForm.attribute_name}
                    onChange={(e) => setPricingForm({ ...pricingForm, attribute_name: e.target.value, attribute_value: '' })}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Attribute</option>
                    {attributes.map((attr) => (
                      <option key={attr.name} value={attr.name}>{attr.name}</option>
                    ))}
                  </select>

                  {/* Attribute Value Dropdown */}
                  <select
                    value={pricingForm.attribute_value}
                    onChange={(e) => setPricingForm({ ...pricingForm, attribute_value: e.target.value })}
                    disabled={!pricingForm.attribute_name}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">Select Value</option>
                    {pricingForm.attribute_name && attributes.find(a => a.name === pricingForm.attribute_name)?.values.map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Price */}
                  <input
                    type="number"
                    value={pricingForm.adjusted_price}
                    onChange={(e) => setPricingForm({ ...pricingForm, adjusted_price: e.target.value })}
                    placeholder="Price (₹)"
                    min="0"
                    step="0.01"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  {/* Sale Price */}
                  <input
                    type="number"
                    value={pricingForm.sale_price}
                    onChange={(e) => setPricingForm({ ...pricingForm, sale_price: e.target.value })}
                    placeholder="Sale Price (₹)"
                    min="0"
                    step="0.01"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Stock */}
                  <input
                    type="number"
                    value={pricingForm.stock_quantity}
                    onChange={(e) => setPricingForm({ ...pricingForm, stock_quantity: e.target.value })}
                    placeholder="Stock Qty"
                    min="0"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  {/* SKU */}
                  <input
                    type="text"
                    value={pricingForm.sku}
                    onChange={(e) => setPricingForm({ ...pricingForm, sku: e.target.value })}
                    placeholder="SKU (Optional)"
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={handleAddAttributePricing}
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {editingPricingIndex !== null ? 'Update Pricing' : 'Add Pricing'}
                </button>
              </div>
            )}

            {/* Attribute Pricing List */}
            {hasAttributePricing && attributePricing.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Attribute Prices ({attributePricing.length})</p>
                {attributePricing.map((pricing, index) => (
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {pricing.attribute_name}: {pricing.attribute_value}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          ₹{pricing.adjusted_price.toFixed(2)}
                        </span>
                        {pricing.sale_price && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                            Sale: ₹{pricing.sale_price.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                          Stock: {pricing.stock_quantity}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditAttributePricing(index)}
                        className="p-1 text-primary hover:bg-primary/10 rounded-full"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleRemoveAttributePricing(index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stock & SKU */}
            <div className="grid grid-cols-2 gap-4">
              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Stock Quantity *
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

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Enter SKU"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Attributes Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            Attributes & Variations
          </h3>

          {/* Existing Attributes */}
          {attributes.length > 0 && (
            <div className="space-y-2 mb-4">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{attr.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {attr.values.map((val, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveAttribute(index)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Attribute */}
          <div className="space-y-2">
            <input
              type="text"
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              placeholder="Attribute name (e.g., Color, Size)"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              value={newAttrValues}
              onChange={(e) => setNewAttrValues(e.target.value)}
              placeholder="Values (comma separated: Red, Blue, Green)"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleAddAttribute}
              className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Attribute
            </button>
          </div>
        </section>

        {/* Product Variations Section - Shown when attributes exist */}
        {attributes.length > 0 && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                Product Variations
              </h3>
              <button
                onClick={handleOpenAddVariation}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add pricing variations based on the attributes defined above. Each variation can have its own price adjustment, stock, and SKU.
            </p>

            {/* Variations List */}
            {Object.keys(groupedVariations).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedVariations).map(([type, vars]) => (
                  <div key={type} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden">
                    {/* Type Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{type}</span>
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                        {vars.length} options
                      </span>
                    </div>

                    {/* Variation Items */}
                    <div className="divide-y divide-slate-200 dark:divide-slate-600">
                      {vars.map((variation) => (
                        <div
                          key={variation.id}
                          className={`flex items-center gap-2 p-2 ${!variation.is_active ? 'opacity-50' : ''}`}
                        >
                          {/* Variation Image */}
                          {variation.image ? (
                            <div
                              className="w-10 h-10 rounded-lg bg-cover bg-center border border-slate-200 dark:border-slate-600 shrink-0"
                              style={{ backgroundImage: `url("${variation.image}")` }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-slate-400 text-[18px]">palette</span>
                            </div>
                          )}

                          {/* Variation Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {variation.variation_value}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {/* Price Display */}
                              {variation.sale_price && variation.sale_price > 0 ? (
                                <>
                                  <span className="text-green-600 font-semibold">₹{variation.sale_price.toFixed(0)}</span>
                                  <span className="line-through text-slate-400">₹{(variation.base_price || (parseFloat(price) + variation.price_adjustment)).toFixed(0)}</span>
                                </>
                              ) : (
                                <span className="font-semibold">₹{(variation.base_price || (parseFloat(price) + variation.price_adjustment)).toFixed(0)}</span>
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
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleVariationActive(variation.id)}
                              className={`p-1 rounded-full ${
                                variation.is_active
                                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                              }`}
                              title={variation.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {variation.is_active ? 'toggle_on' : 'toggle_off'}
                              </span>
                            </button>
                            <button
                              onClick={() => handleOpenEditVariation(variation)}
                              className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteVariation(variation.id)}
                              className="p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">inventory_2</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">No variations added yet</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add" to create variations based on your attributes</p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Variation Add/Edit Modal */}
      {showVariationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingVariation ? 'Edit Variation' : 'Add Variation'}
              </h3>
              <button
                onClick={() => {
                  setShowVariationModal(false);
                  resetVariationForm();
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-4 space-y-4 pb-24">
              {/* Variation Type - Select from attributes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Variation Type *
                </label>
                <select
                  value={variationForm.variation_name}
                  onChange={(e) => setVariationForm({ ...variationForm, variation_name: e.target.value, variation_value: '' })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select attribute type</option>
                  {attributes.map((attr) => (
                    <option key={attr.name} value={attr.name}>{attr.name}</option>
                  ))}
                </select>
              </div>

              {/* Variation Value - Select from attribute values */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Value *
                </label>
                <select
                  value={variationForm.variation_value}
                  onChange={(e) => setVariationForm({ ...variationForm, variation_value: e.target.value })}
                  disabled={!variationForm.variation_name}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Select value</option>
                  {variationForm.variation_name && attributes.find(a => a.name === variationForm.variation_name)?.values.map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>

              {/* Base Price (MRP) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Base Price / MRP (₹) *
                </label>
                <input
                  type="number"
                  value={variationForm.base_price}
                  onChange={(e) => setVariationForm({ ...variationForm, base_price: e.target.value })}
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
                    value={variationForm.sale_price}
                    onChange={(e) => setVariationForm({ ...variationForm, sale_price: e.target.value })}
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
                    value={variationForm.stock_quantity}
                    onChange={(e) => setVariationForm({ ...variationForm, stock_quantity: e.target.value })}
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
                  value={variationForm.purchase_price}
                  onChange={(e) => setVariationForm({ ...variationForm, purchase_price: e.target.value })}
                  placeholder="Optional - Enter cost price"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Price Summary Display */}
              {variationForm.base_price && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">MRP:</span>
                    <span className={`text-lg font-bold ${variationForm.sale_price ? 'line-through text-slate-400' : 'text-primary'}`}>
                      ₹{parseFloat(variationForm.base_price).toFixed(2)}
                    </span>
                  </div>
                  {variationForm.sale_price && parseFloat(variationForm.sale_price) > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Sale Price:</span>
                        <span className="text-lg font-bold text-green-600">
                          ₹{parseFloat(variationForm.sale_price).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Discount:</span>
                        <span className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                          {calculateVariationDiscount()}% OFF
                        </span>
                      </div>
                    </>
                  )}
                  {variationForm.purchase_price && parseFloat(variationForm.purchase_price) > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                      <span className="text-sm text-slate-500">Margin:</span>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                        {calculateVariationMargin()}%
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
                  value={variationForm.sku}
                  onChange={(e) => setVariationForm({ ...variationForm, sku: e.target.value })}
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
                  value={variationForm.image}
                  onChange={(e) => setVariationForm({ ...variationForm, image: e.target.value })}
                  placeholder="Paste variation image URL"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {variationForm.image && (
                  <div className="mt-2">
                    <div
                      className="w-20 h-20 rounded-xl bg-cover bg-center border border-slate-200 dark:border-slate-600"
                      style={{ backgroundImage: `url("${variationForm.image}")` }}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Sticky Save Button */}
            <div className="sticky bottom-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleSaveVariation}
                className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-bold text-base py-4 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">save</span>
                {editingVariation ? 'Update Variation' : 'Add Variation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-bold text-base py-4 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              {isEditing ? 'Update Product' : 'Create Product'}
            </>
          )}
        </button>
      </div>

      <style>{`
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

export default AdminCreateProduct;
