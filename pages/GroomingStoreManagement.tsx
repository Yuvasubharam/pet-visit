import React, { useState, useEffect } from 'react';
import { groomingStoreAuthService, groomingStorePackageService } from '../services/groomingStoreApi';
import StoreLocationPicker from '../components/StoreLocationPicker';

interface GroomingStoreManagementProps {
  storeId: string | null;
  onBack: () => void;
}

const GroomingStoreManagement: React.FC<GroomingStoreManagementProps> = ({ storeId, onBack }) => {
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'info'>('packages');

  // Store info form
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  // Package form
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packagePrice, setPackagePrice] = useState('');
  const [packageType, setPackageType] = useState<'basic' | 'full' | 'luxury'>('basic');
  const [packageDuration, setPackageDuration] = useState('60');

  useEffect(() => {
    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  const loadStoreData = async () => {
    if (!storeId) return;

    try {
      setLoading(true);

      // Load store profile
      const user = await groomingStoreAuthService.getCurrentUser();
      if (user) {
        const profile = await groomingStoreAuthService.getGroomingStoreProfile(user.id);
        setStoreProfile(profile);

        // Set form values
        setStoreName(profile?.store_name || '');
        setPhone(profile?.phone || '');
        setAddress(profile?.address || '');
        setCity(profile?.city || '');
        setState(profile?.state || '');
        setPincode(profile?.pincode || '');
        setLatitude(profile?.latitude || undefined);
        setLongitude(profile?.longitude || undefined);
      }

      // Load packages
      const pkgs = await groomingStorePackageService.getStorePackages(storeId);
      setPackages(pkgs || []);
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStoreInfo = async () => {
    if (!storeId) return;

    try {
      await groomingStoreAuthService.updateGroomingStoreProfile(storeId, {
        store_name: storeName,
        phone,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude,
      });

      alert('Store information updated successfully!');
      await loadStoreData();
    } catch (error) {
      console.error('Error updating store info:', error);
      alert('Failed to update store information');
    }
  };

  const handleAddPackage = async () => {
    if (!storeId || !packageName || !packagePrice) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await groomingStorePackageService.createPackage(storeId, {
        name: packageName,
        description: packageDescription,
        price: parseFloat(packagePrice),
        package_type: packageType,
        duration_minutes: parseInt(packageDuration),
      });

      alert('Package added successfully!');
      resetPackageForm();
      setShowAddPackage(false);
      await loadStoreData();
    } catch (error) {
      console.error('Error adding package:', error);
      alert('Failed to add package');
    }
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage || !packageName || !packagePrice) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await groomingStorePackageService.updatePackage(editingPackage.id, {
        name: packageName,
        description: packageDescription,
        price: parseFloat(packagePrice),
        duration_minutes: parseInt(packageDuration),
      });

      alert('Package updated successfully!');
      resetPackageForm();
      setEditingPackage(null);
      await loadStoreData();
    } catch (error) {
      console.error('Error updating package:', error);
      alert('Failed to update package');
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      await groomingStorePackageService.deletePackage(packageId);
      alert('Package deleted successfully!');
      await loadStoreData();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  const resetPackageForm = () => {
    setPackageName('');
    setPackageDescription('');
    setPackagePrice('');
    setPackageType('basic');
    setPackageDuration('60');
  };

  const openEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setPackageName(pkg.name);
    setPackageDescription(pkg.description || '');
    setPackagePrice(pkg.price.toString());
    setPackageType(pkg.package_type);
    setPackageDuration(pkg.duration_minutes?.toString() || '60');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-slate-700">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-black text-primary tracking-tight">Store Management</h1>
              <p className="text-xs text-slate-500 font-medium">Manage packages & info</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'packages'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Packages
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'info'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Store Info
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
        {activeTab === 'packages' ? (
          <>
            {/* Add Package Button */}
            <button
              onClick={() => {
                resetPackageForm();
                setShowAddPackage(true);
              }}
              className="w-full py-4 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add New Package
            </button>

            {/* Packages List */}
            {packages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-slate-400 text-4xl">inventory_2</span>
                </div>
                <p className="text-slate-600 font-medium">No packages yet</p>
                <p className="text-sm text-slate-400 mt-1">Add your first grooming package</p>
              </div>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-900">{pkg.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{pkg.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        pkg.package_type === 'basic' ? 'bg-blue-100 text-blue-700' :
                        pkg.package_type === 'full' ? 'bg-purple-100 text-purple-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {pkg.package_type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-2xl font-black text-primary">₹{pkg.price.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">{pkg.duration_minutes} minutes</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditPackage(pkg)}
                          className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-blue-600 text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-red-600 text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Store Information Form */}
            <div className="space-y-4">
              {/* Basic Info Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">store</span>
                  Basic Information
                </h3>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Store Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="Your Grooming Store"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="+91-9876543210"
                  />
                </div>
              </div>

              {/* Location Card with Map */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  Store Location
                </h3>

                <StoreLocationPicker
                  onLocationSelect={(location) => {
                    setAddress(location.address);
                    setCity(location.city);
                    setState(location.state);
                    setPincode(location.pincode);
                    setLatitude(location.latitude);
                    setLongitude(location.longitude);
                  }}
                  initialLocation={
                    latitude && longitude
                      ? { address, city, state, pincode, latitude, longitude }
                      : undefined
                  }
                />
              </div>

              {/* Update Button */}
              <button
                onClick={handleUpdateStoreInfo}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">save</span>
                Update Store Information
              </button>
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Package Modal */}
      {(showAddPackage || editingPackage) && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => { setShowAddPackage(false); setEditingPackage(null); }}>
          <div
            className="bg-white rounded-t-[32px] w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-slate-900">
                {editingPackage ? 'Edit Package' : 'Add New Package'}
              </h2>
              <button
                onClick={() => { setShowAddPackage(false); setEditingPackage(null); }}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-slate-700">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Package Name *</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="e.g., Full Grooming Package"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                <textarea
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                  placeholder="Package details..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Package Type *</label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value as 'basic' | 'full' | 'luxury')}
                  disabled={!!editingPackage}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  <option value="basic">Basic</option>
                  <option value="full">Full</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Price (₹) *</label>
                <input
                  type="number"
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="299.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Duration (minutes)</label>
                <input
                  type="number"
                  value={packageDuration}
                  onChange={(e) => setPackageDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="60"
                />
              </div>

              <button
                onClick={editingPackage ? handleUpdatePackage : handleAddPackage}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-all"
              >
                {editingPackage ? 'Update Package' : 'Add Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroomingStoreManagement;
