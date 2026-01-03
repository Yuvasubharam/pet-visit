import React, { useState, useEffect } from 'react';
import { doctorConsultationService, prescriptionProductService, doctorEarningsService } from '../services/doctorApi';
import { supabase } from '../lib/supabase';
import type { Booking, Product, PrescriptionProduct } from '../types';

interface DoctorConsultationDetailsProps {
  onBack: () => void;
  booking: Booking | null;
  doctorId: string | null;
}

const DoctorConsultationDetails: React.FC<DoctorConsultationDetailsProps> = ({ onBack, booking, doctorId }) => {
  const [medicalNotes, setMedicalNotes] = useState(booking?.medical_notes || '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [prescriptionUrl, setPrescriptionUrl] = useState(booking?.prescription_url || '');

  // Product selection states
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [prescriptionProducts, setPrescriptionProducts] = useState<PrescriptionProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);

  // Load prescription products when booking changes
  useEffect(() => {
    if (booking?.id) {
      loadPrescriptionProducts();
    }
  }, [booking?.id]);

  // Load products when search or category changes
  useEffect(() => {
    if (showProductSelection) {
      loadProducts();
    }
  }, [searchQuery, selectedCategory, showProductSelection]);

  const loadPrescriptionProducts = async () => {
    if (!booking?.id) return;
    try {
      const data = await prescriptionProductService.getPrescriptionProducts(booking.id);
      setPrescriptionProducts(data);
    } catch (error) {
      console.error('Error loading prescription products:', error);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await prescriptionProductService.getProducts({
        search: searchQuery,
        category: selectedCategory,
      });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProduct = async (product: Product) => {
    if (!booking?.id || !doctorId) return;

    setAddingProduct(product.id);
    try {
      await prescriptionProductService.addProductToPrescription({
        booking_id: booking.id,
        doctor_id: doctorId,
        product_id: product.id,
        quantity: 1,
      });
      await loadPrescriptionProducts();
      alert(`${product.name} added to prescription!`);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product to prescription');
    } finally {
      setAddingProduct(null);
    }
  };

  const handleRemoveProduct = async (prescriptionProductId: string) => {
    if (!confirm('Remove this product from prescription?')) return;

    try {
      await prescriptionProductService.removeProductFromPrescription(prescriptionProductId);
      await loadPrescriptionProducts();
    } catch (error) {
      console.error('Error removing product:', error);
      alert('Failed to remove product');
    }
  };

  if (!booking) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <p className="text-slate-600 dark:text-slate-400">No booking selected</p>
      </div>
    );
  }

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const url = await doctorConsultationService.uploadPrescription(booking.id, file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      setPrescriptionUrl(url);
      alert('Prescription uploaded successfully!');
    } catch (error) {
      console.error('Error uploading prescription:', error);
      alert('Failed to upload prescription');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleDeletePrescription = async () => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;

    try {
      await doctorConsultationService.deletePrescription(booking.id, prescriptionUrl);
      setPrescriptionUrl('');
      alert('Prescription deleted successfully!');
    } catch (error) {
      console.error('Error deleting prescription:', error);
      alert('Failed to delete prescription');
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);

    try {
      await doctorConsultationService.addMedicalNotes(booking.id, medicalNotes);
      alert('Medical notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (status: 'upcoming' | 'completed' | 'cancelled') => {
    if (!doctorId || !booking) return;

    try {
      // Update booking status and payment_status
      // When marking as completed, update payment_status based on current value
      const updates: any = { status };
      if (status === 'completed') {
        // If payment is pending or failed, mark as COD (Cash on Delivery)
        // If already paid, keep it as paid
        if (booking.payment_status === 'pending' || booking.payment_status === 'failed') {
          updates.payment_status = 'cod';
        }
        // If payment_status is already 'paid', don't change it
        // This preserves pre-paid bookings
      }

      const { error: updateError } = await (supabase as any)
        .from('bookings')
        .update(updates)
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // NOTE: Earning records are now created automatically by the database trigger
      // when booking status changes to 'completed'. No manual creation needed.
      console.log('✅ Booking status updated successfully! Earnings created by trigger.');

      alert('Status updated successfully!');
      onBack();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'online':
        return 'blue';
      case 'clinic':
        return 'emerald';
      case 'home':
        return 'orange';
      default:
        return 'slate';
    }
  };

  const color = getBookingTypeColor(booking.booking_type);

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 z-20 bg-background-light dark:bg-background-dark sticky top-0 border-b border-gray-100 dark:border-slate-800">
        <button
          onClick={onBack}
          className="text-slate-900 dark:text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 light:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-dark tracking-tight">
          Consultation Details
        </h1>
        <button className="text-slate-900 dark:text-dark flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 light:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6">
        {/* Pet & Owner Info */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={booking.pets?.image || '/placeholder-pet.png'}
              alt="Pet"
              className="size-20 rounded-2xl object-cover"
            />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-dark text-xl">
                {booking.pets?.name || 'Unknown Pet'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.pets?.breed || booking.pets?.species} • {booking.pets?.age || '?'} years
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Owner: {(booking as any).users?.name || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Date</span>
              <p className="text-sm font-bold text-slate-900 dark:text-dark mt-1">{booking.date}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Time</span>
              <p className="text-sm font-bold text-slate-900 dark:text-dark mt-1">{booking.time}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Type</span>
              <p className="text-sm font-bold text-slate-900 dark:text-dark mt-1 capitalize">
                {booking.booking_type}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</span>
              <p className="text-sm font-bold text-slate-900 dark:text-dark mt-1 capitalize">
                {booking.status}
              </p>
            </div>
          </div>
        </div>

        {/* Visit Reason */}
        {booking.notes && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-dark uppercase tracking-wider mb-3">
              Visit Reason
            </h3>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-slate-400">description</span>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {booking.notes}
              </p>
            </div>
          </div>
        )}

        {/* Address (for home visits) */}
        {booking.booking_type === 'home' && booking.addresses && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-dark uppercase tracking-wider mb-3">
              Visit Address
            </h3>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-slate-400">location_on</span>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {booking.addresses.full_address || `${booking.addresses.street}, ${booking.addresses.city}, ${booking.addresses.state} ${booking.addresses.pincode}`}
              </p>
            </div>
          </div>
        )}

        {/* Medical Notes */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-dark uppercase tracking-wider mb-3">
            Medical Notes
          </h3>
          <textarea
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            rows={5}
            className="w-full appearance-none rounded-xl bg-slate-50 dark:bg-slate-800 border-0 p-4 text-slate-900 dark:text-white font-medium shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary placeholder:text-slate-400 transition-all outline-none resize-none"
            placeholder="Enter medical notes, diagnosis, treatment plan..."
          />
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="mt-3 w-full bg-primary hover:bg-[#013d63] text-white font-bold py-3 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        {/* Prescription Upload */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-dark uppercase tracking-wider mb-3">
            Prescription
          </h3>

          {/* Uploaded Prescription Display */}
          {prescriptionUrl ? (
            <div className="mb-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/15 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    {prescriptionUrl.toLowerCase().endsWith('.pdf') ? (
                      <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
                        picture_as_pdf
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
                        image
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-700 dark:text-green-900 mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Prescription Uploaded
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-600 mb-2">
                    {prescriptionUrl.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Image File'}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={prescriptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-white hover:bg-primary hover:text-white dark:hover:bg-primary border border-primary rounded-lg text-xs font-bold transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      View
                    </a>
                    <button
                      onClick={handleDeletePrescription}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-red-600 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 border border-red-600 rounded-lg text-xs font-bold transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Delete
                    </button>
                    <label
                      htmlFor="prescription-reupload"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 hover:text-white dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">sync</span>
                      Replace
                    </label>
                    <input
                      id="prescription-reupload"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handlePrescriptionUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  Uploading prescription... {uploadProgress}%
                </p>
              </div>
              <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!prescriptionUrl && !uploading && (
            <label
              htmlFor="prescription-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-2 group-hover:text-primary transition-colors">
                  upload_file
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-200">
                  <span className="font-bold">Click to upload</span> prescription
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF or Image (MAX. 10MB)</p>
              </div>
              <input
                id="prescription-upload"
                type="file"
                accept=".pdf,image/*"
                onChange={handlePrescriptionUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Recommended Products */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-dark uppercase tracking-wider">
              Recommended Products
            </h3>
            <button
              onClick={() => setShowProductSelection(!showProductSelection)}
              className="text-xs font-bold text-primary hover:text-[#013d63] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">
                {showProductSelection ? 'remove' : 'add'}
              </span>
              {showProductSelection ? 'Close' : 'Add Products'}
            </button>
          </div>

          {/* Prescription Products List */}
          {prescriptionProducts.length > 0 ? (
            <div className="space-y-2 mb-3">
              {prescriptionProducts.map((pp) => (
                <div
                  key={pp.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                >
                  <img
                    src={pp.product?.image || '/placeholder-product.png'}
                    alt={pp.product?.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {pp.product?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Qty: {pp.quantity} • ₹{pp.product?.price}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(pp.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-3">No products recommended yet</p>
          )}

          {/* Product Selection Section */}
          {showProductSelection && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              {/* Search Bar */}
              <div className="mb-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 text-sm text-slate-900 dark:text-white font-medium ring-1 ring-inset ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary placeholder:text-slate-400 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {['all', 'food', 'toys', 'care', 'medicine'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="max-h-96 overflow-y-auto no-scrollbar">
                {loadingProducts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-xs text-slate-500 mt-2">Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700">
                      inventory_2
                    </span>
                    <p className="text-sm text-slate-500 mt-2">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {products.map((product) => {
                      const isAdded = prescriptionProducts.some(
                        (pp) => pp.product_id === product.id
                      );
                      const isAdding = addingProduct === product.id;

                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-colors"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{product.brand}</p>
                            <p className="text-sm font-bold text-primary mt-1">₹{product.price}</p>
                          </div>
                          <button
                            onClick={() => handleAddProduct(product)}
                            disabled={isAdded || isAdding}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAdded
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 cursor-not-allowed'
                              : isAdding
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait'
                                : 'bg-primary text-white hover:bg-[#013d63] active:scale-95'
                              }`}
                          >
                            {isAdded ? '✓ Added' : isAdding ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Actions */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-dark uppercase tracking-wider mb-3">
            Update Status
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleUpdateStatus('completed')}
              disabled={booking.status === 'completed'}
              className="py-3 rounded-xl text-sm font-bold bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark Complete
            </button>
            <button
              onClick={() => handleUpdateStatus('cancelled')}
              disabled={booking.status === 'cancelled'}
              className="py-3 rounded-xl text-sm font-bold bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default DoctorConsultationDetails;
