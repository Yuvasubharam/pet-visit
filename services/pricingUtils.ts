export interface ProductVariationPrice {
  basePrice: number;
  priceAdjustment: number;
  salePrice: number | null;
  finalPrice: number;
  isSale: boolean;
  originalPrice?: number;
}

export const calculateVariationPrice = (
  basePrice: number,
  priceAdjustment: number = 0,
  salePrice: number | null = null
): ProductVariationPrice => {
  const adjustedPrice = basePrice + priceAdjustment;
  
  if (salePrice && salePrice > 0 && salePrice < adjustedPrice) {
    return {
      basePrice,
      priceAdjustment,
      salePrice,
      finalPrice: salePrice,
      isSale: true,
      originalPrice: adjustedPrice,
    };
  }
  
  return {
    basePrice,
    priceAdjustment,
    salePrice: null,
    finalPrice: adjustedPrice,
    isSale: false,
  };
};

export const formatPriceDisplay = (price: ProductVariationPrice): string => {
  if (price.isSale && price.originalPrice) {
    return `₹${price.finalPrice.toFixed(2)} (was ₹${price.originalPrice.toFixed(2)})`;
  }
  return `₹${price.finalPrice.toFixed(2)}`;
};

export const calculateDiscountPercentage = (originalPrice: number, salePrice: number): number => {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};
