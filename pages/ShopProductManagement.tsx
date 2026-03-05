import React, { useState, useEffect } from 'react';
import { ShopProduct } from '../types';
import { adminProductService, productSellerService } from '../services/adminApi';
import CategoryAttributeModal from '../components/CategoryAttributeModal';

interface Props {
  onBack: () => void;
  onCreateProduct: () => void;
  onCreateGroupedProduct: () => void;
  onBulkImport: () => void;
  onEditProduct: (productId: string) => void;
  onManageVariations: (productId: string) => void;
  sellerId?: string;
}

type CategoryFilter = 'all' | 'Pet Food' | 'Toys' | 'Accessories' | 'Grooming' | 'Medicine' | 'Bedding';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type SellerTypeFilter = 'all' | 'admin' | 'sellers';

const ShopProductManagement: React.FC<Props> = ({
  onBack,
  onCreateProduct,
  onCreateGroupedProduct,
  onBulkImport,
  onEditProduct,
  onManageVariations,
  sellerId,
}) => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sellerTypeFilter, setSellerTypeFilter] = useState<SellerTypeFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    outOfStock: 0,
    lowStock: 0,
  });

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, stockFilter, sellerTypeFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // If sellerId is provided, load products from product_sellers table
      // This shows the seller their own inventory with their prices/stock
      if (sellerId) {
        const data = await productSellerService.getSellerProducts(sellerId);
        setProducts(data);
      } else {
        // Admin view - load all products with seller info
        const [allProducts, sellerProducts] = await Promise.all([
          adminProductService.getAllProducts(),
          productSellerService.getAllProductSellers({ exclude_admin: false }),
        ]);

        // Enrich products with seller type info
        const productSellerMap = new Map<string, string>();
        sellerProducts.forEach((ps: any) => {
          if (ps.shop_products?.id) {
            productSellerMap.set(ps.shop_products.id, ps.seller_type);
          }
        });

        const enrichedProducts = allProducts.map(p => ({
          ...p,
          seller_type: productSellerMap.get(p.id) || 'admin',
        }));

        setProducts(enrichedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      if (sellerId) {
        // For sellers, use their seller-specific stats
        const sellerStats = await productSellerService.getSellerStats(sellerId);
        setStats({
          total: sellerStats.totalProducts,
          outOfStock: products.filter(p => {
            const stock = (p as any).seller_stock ?? p.stock_quantity;
            return stock === 0;
          }).length,
          lowStock: products.filter(p => {
            const stock = (p as any).seller_stock ?? p.stock_quantity;
            return stock > 0 && stock <= 5;
          }).length,
        });
      } else {
        const statsData = await adminProductService.getProductStats();
        setStats({
          total: statsData.total,
          outOfStock: statsData.outOfStock,
          lowStock: statsData.lowStock,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Filter by stock status (use seller_stock if available)
    if (stockFilter === 'out_of_stock') {
      filtered = filtered.filter(p => {
        const stock = (p as any).seller_stock ?? p.stock_quantity;
        return stock === 0;
      });
    } else if (stockFilter === 'low_stock') {
      filtered = filtered.filter(p => {
        const stock = (p as any).seller_stock ?? p.stock_quantity;
        return stock > 0 && stock <= 5;
      });
    } else if (stockFilter === 'in_stock') {
      filtered = filtered.filter(p => {
        const stock = (p as any).seller_stock ?? p.stock_quantity;
        return stock > 5;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }

    // Filter by seller type (admin view only)
    if (!sellerId && sellerTypeFilter !== 'all') {
      filtered = filtered.filter(p => {
        const sellerType = (p as any).seller_type || 'admin';
        if (sellerTypeFilter === 'admin') {
          return sellerType === 'admin';
        } else {
          return sellerType !== 'admin';
        }
      });
    }

    setFilteredProducts(filtered);
  };

  const getStockBadge = (product: ShopProduct) => {
    // Use seller_stock if available (seller view), otherwise use stock_quantity
    const quantity = (product as any).seller_stock ?? product.stock_quantity;
    if (quantity === 0) {
      return {
        text: 'Out of Stock',
        class: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-600/20',
      };
    } else if (quantity <= 5) {
      return {
        text: `Low Stock: ${quantity}`,
        class: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 ring-orange-600/20',
      };
    } else {
      return {
        text: `In Stock: ${quantity}`,
        class: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-600/20',
      };
    }
  };

  const getProductPrice = (product: ShopProduct) => {
    // Use seller_price if available (seller view), otherwise use base_price/sale_price
    if ((product as any).seller_price) {
      return (product as any).seller_price;
    }
    return product.sale_price || product.base_price;
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await adminProductService.deleteProduct(productId);
      await loadProducts();
      await loadStats();
      setShowOptionsMenu(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleToggleActive = async (product: ShopProduct) => {
    try {
      await adminProductService.updateProduct(product.id, { is_active: !product.is_active });
      await loadProducts();
      setShowOptionsMenu(null);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        <h2 className="text-slate-900 dark:text-dark text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-2">
          Shop Inventory
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-800 dark:text-slate-100 text-[24px]">settings</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20 flex flex-col items-center justify-center">
            <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-wide">Total</span>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shadow-sm">
            <span className="text-orange-500 text-[10px] font-semibold uppercase tracking-wide">Low Stock</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.lowStock}</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shadow-sm">
            <span className="text-red-500 text-[10px] font-semibold uppercase tracking-wide">Out of Stock</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.outOfStock}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 sticky top-[60px] z-10 bg-background-light dark:bg-background-dark">
        <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <div className="flex items-center justify-center pl-4 text-slate-400">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </div>
          <input
            className="flex w-full flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 px-4 focus:ring-0 text-base font-normal leading-normal h-full"
            placeholder="Search products, SKUs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="flex items-center justify-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-3 px-4 pb-2 overflow-x-auto no-scrollbar">
        {(['all', 'Pet Food', 'Toys', 'Accessories', 'Grooming', 'Medicine'] as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-transform active:scale-95 ${categoryFilter === cat
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
          >
            <p className="text-sm font-medium leading-normal">
              {cat === 'all' ? 'All' : cat}
            </p>
          </button>
        ))}
      </div>

      {/* Stock Filter Chips */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as StockFilter[]).map((stock) => (
          <button
            key={stock}
            onClick={() => setStockFilter(stock)}
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-xs transition-transform active:scale-95 ${stockFilter === stock
              ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
          >
            {stock === 'all' ? 'All Stock' : stock === 'in_stock' ? 'In Stock' : stock === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
          </button>
        ))}
      </div>

      {/* Seller Type Filter - Admin view only */}
      {!sellerId && (
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {(['all', 'admin', 'sellers'] as SellerTypeFilter[]).map((type) => (
            <button
              key={type}
              onClick={() => setSellerTypeFilter(type)}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-xs transition-transform active:scale-95 ${sellerTypeFilter === type
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {type === 'all' ? 'apps' : type === 'admin' ? 'admin_panel_settings' : 'storefront'}
              </span>
              {type === 'all' ? 'All Products' : type === 'admin' ? 'Admin Products' : 'Seller Products'}
            </button>
          ))}
        </div>
      )}

      {/* Product List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Products ({filteredProducts.length})
        </h3>

        <div className="flex flex-col gap-4">
          {filteredProducts.map((product) => {
            const stockBadge = getStockBadge(product);
            const productStock = (product as any).seller_stock ?? product.stock_quantity;
            const isOutOfStock = productStock === 0;

            return (
              <div
                key={product.id}
                className={`flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${isOutOfStock ? 'opacity-90' : ''
                  }`}
              >
                <div className="flex gap-4 p-3 items-center">
                  {/* Product Image */}
                  <div
                    className={`bg-center bg-no-repeat bg-cover rounded-lg size-[72px] shrink-0 border border-slate-100 dark:border-slate-700 ${isOutOfStock ? 'grayscale' : ''
                      }`}
                    style={{
                      backgroundImage: product.main_image
                        ? `url("${product.main_image}")`
                        : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    }}
                  >
                    {!product.main_image && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 text-3xl">inventory_2</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p
                        className={`text-base font-bold leading-tight truncate pr-2 ${isOutOfStock
                          ? 'text-slate-500 dark:text-slate-400 line-through'
                          : 'text-slate-900 dark:text-white'
                          }`}
                      >
                        {product.name}
                      </p>
                      <div className="relative">
                        <button
                          onClick={() => setShowOptionsMenu(showOptionsMenu === product.id ? null : product.id)}
                          className="shrink-0 text-slate-400 hover:text-primary dark:hover:text-white p-1 -mr-2 -mt-1 rounded-full active:bg-slate-100 dark:active:bg-slate-700"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>

                        {/* Options Menu */}
                        {showOptionsMenu === product.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-30">
                            <button
                              onClick={() => {
                                onEditProduct(product.id);
                                setShowOptionsMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                              Edit Product
                            </button>
                            <button
                              onClick={() => {
                                onManageVariations(product.id);
                                setShowOptionsMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">tune</span>
                              Manage Variations
                            </button>
                            <button
                              onClick={() => handleToggleActive(product)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {product.is_active ? 'visibility_off' : 'visibility'}
                              </span>
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal mb-1">
                      {product.category} • {formatPrice(getProductPrice(product))}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${stockBadge.class}`}
                      >
                        {stockBadge.text}
                      </span>
                      {!product.is_active && (
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                          Inactive
                        </span>
                      )}
                      {!sellerId && (product as any).seller_type && (product as any).seller_type !== 'admin' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-900/30 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 ring-1 ring-inset ring-purple-600/20">
                          <span className="material-symbols-outlined text-[12px]">storefront</span>
                          {(product as any).seller_type === 'doctor' ? 'Doctor' :
                           (product as any).seller_type === 'grooming_store' ? 'Groomer' : 'Seller'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">inventory_2</span>
              <p className="text-slate-500 dark:text-slate-400">No products found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Add Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  onCreateProduct();
                }}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">add_box</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-slate-900 dark:text-white">Single Product</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Add one product with details</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </button>

              <button
                onClick={() => {
                  setShowAddModal(false);
                  onCreateGroupedProduct();
                }}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">inventory</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-slate-900 dark:text-white">Grouped Product</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Create a bundle of products</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </button>

              <button
                onClick={() => {
                  setShowAddModal(false);
                  onBulkImport();
                }}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">upload_file</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-slate-900 dark:text-white">Bulk Import</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Import from CSV or Excel</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {showOptionsMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowOptionsMenu(null)}
        />
      )}

      <CategoryAttributeModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={() => {
          setShowSettingsModal(false);
          loadProducts();
        }}
      />

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

export default ShopProductManagement;
