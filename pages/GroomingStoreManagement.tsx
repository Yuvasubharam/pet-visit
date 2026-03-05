import React, { useState, useEffect } from 'react';
import { groomingStoreAuthService, groomingStorePackageService, groomingStoreTimeSlotService } from '../services/groomingStoreApi';
import StoreLocationPicker from '../components/StoreLocationPicker';
import { GroomingTimeSlot } from '../types';

interface GroomingStoreManagementProps {
  storeId: string | null;
  onBack: () => void;
}

const GroomingStoreManagement: React.FC<GroomingStoreManagementProps> = ({ storeId, onBack }) => {
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'info' | 'timeslots'>('packages');

  // Time slots state
  const [timeSlots, setTimeSlots] = useState<GroomingTimeSlot[]>([]);
  const [showAddTimeSlot, setShowAddTimeSlot] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]); // For multiple selection
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [editingTimeSlot, setEditingTimeSlot] = useState<GroomingTimeSlot | null>(null);

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function to sort time slots in chronological order (AM to PM)
  const sortTimeSlots = (slots: GroomingTimeSlot[]) => {
    return [...slots].sort((a, b) => {
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return hours * 60 + minutes;
      };

      return parseTime(a.time_slot) - parseTime(b.time_slot);
    });
  };

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

      // Load time slots
      const slots = await groomingStoreTimeSlotService.getStoreTimeSlots(storeId);
      setTimeSlots(slots || []);
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

  // Time slot management functions
  const handleAddTimeSlot = async () => {
    if (!storeId) return;

    // Determine which time slots to create
    const timeSlotsToCreate = selectedTimeSlots.length > 0
      ? selectedTimeSlots
      : newTimeSlot.trim() ? [newTimeSlot.trim()] : [];

    if (timeSlotsToCreate.length === 0) {
      alert('Please enter a time slot or select from quick add options');
      return;
    }

    if (selectedWeekdays.length === 0) {
      alert('Please select at least one weekday');
      return;
    }

    try {
      if (editingTimeSlot) {
        // Update existing time slot (single update only)
        await groomingStoreTimeSlotService.updateTimeSlot(editingTimeSlot.id, {
          time_slot: newTimeSlot.trim(),
          weekdays: selectedWeekdays,
        });
        alert('Time slot updated successfully!');
      } else {
        // Create multiple time slots
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (const timeSlot of timeSlotsToCreate) {
          try {
            await groomingStoreTimeSlotService.createTimeSlot(storeId, timeSlot, true, selectedWeekdays);
            successCount++;
          } catch (error: any) {
            failCount++;
            errors.push(`${timeSlot}: ${error.message || 'Failed'}`);
          }
        }

        // Show summary
        if (successCount > 0 && failCount === 0) {
          alert(`Successfully added ${successCount} time slot${successCount > 1 ? 's' : ''}!`);
        } else if (successCount > 0 && failCount > 0) {
          alert(`Added ${successCount} time slot${successCount > 1 ? 's' : ''}, but ${failCount} failed:\n${errors.join('\n')}`);
        } else {
          alert(`Failed to add time slots:\n${errors.join('\n')}`);
        }
      }

      setNewTimeSlot('');
      setSelectedTimeSlots([]);
      setSelectedWeekdays([0,1,2,3,4,5,6]);
      setEditingTimeSlot(null);
      setShowAddTimeSlot(false);
      await loadStoreData();
    } catch (error) {
      console.error('Error saving time slot:', error);
      alert('Failed to save time slot.');
    }
  };

  const handleToggleTimeSlot = async (slotId: string, currentStatus: boolean) => {
    try {
      await groomingStoreTimeSlotService.updateTimeSlot(slotId, { is_active: !currentStatus });
      await loadStoreData();
    } catch (error) {
      console.error('Error toggling time slot:', error);
      alert('Failed to update time slot');
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    try {
      await groomingStoreTimeSlotService.deleteTimeSlot(slotId);
      alert('Time slot deleted successfully!');
      await loadStoreData();
    } catch (error) {
      console.error('Error deleting time slot:', error);
      alert('Failed to delete time slot');
    }
  };

  const handleEditTimeSlot = (slot: GroomingTimeSlot) => {
    setEditingTimeSlot(slot);
    setNewTimeSlot(slot.time_slot);
    setSelectedWeekdays(slot.weekdays || [0,1,2,3,4,5,6]);
    setShowAddTimeSlot(true);
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const toggleTimeSlotSelection = (timeSlot: string) => {
    setSelectedTimeSlots(prev =>
      prev.includes(timeSlot)
        ? prev.filter(t => t !== timeSlot)
        : [...prev, timeSlot]
    );
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
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'packages'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Packages
          </button>
          <button
            onClick={() => setActiveTab('timeslots')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'timeslots'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Time Slots
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
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
        {activeTab === 'timeslots' ? (
          <>
            {/* Add Time Slot Button */}
            <button
              onClick={() => setShowAddTimeSlot(true)}
              className="w-full py-4 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">schedule</span>
              Add New Time Slot
            </button>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-900 mb-1">Time Slot Management</p>
                <p className="text-xs text-blue-700">
                  Configure your available time slots with specific days of the week. Customers will only see slots that are active and available for their selected date.
                </p>
              </div>
            </div>

            {/* Time Slots List */}
            {timeSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-slate-400 text-4xl">schedule</span>
                </div>
                <p className="text-slate-600 font-medium">No time slots configured</p>
                <p className="text-sm text-slate-400 mt-1">Add your first time slot to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Your Time Slots ({timeSlots.length})
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Active</span>
                    <div className="w-2 h-2 rounded-full bg-gray-400 ml-2"></div>
                    <span>Inactive</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {sortTimeSlots(timeSlots).map((slot) => {
                      const slotWeekdays = slot.weekdays || [0,1,2,3,4,5,6];
                      const isAllDays = slotWeekdays.length === 7;

                      return (
                        <div
                          key={slot.id}
                          className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all ${
                            slot.is_active
                              ? 'border-green-200 bg-green-50/30'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xl font-black ${
                              slot.is_active ? 'text-slate-900' : 'text-slate-400'
                            }`}>
                              {slot.time_slot}
                            </span>
                            <div
                              className={`w-3 h-3 rounded-full ${
                                slot.is_active ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>

                          {/* Weekdays Display */}
                          <div className="mb-3 flex flex-wrap gap-1">
                            {isAllDays ? (
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                All Days
                              </span>
                            ) : (
                              weekdayNames.map((day, index) => (
                                <span
                                  key={index}
                                  className={`text-xs font-bold px-2 py-1 rounded ${
                                    slotWeekdays.includes(index)
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {day}
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEditTimeSlot(slot)}
                              className="flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleTimeSlot(slot.id, slot.is_active)}
                              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                                slot.is_active
                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {slot.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDeleteTimeSlot(slot.id)}
                              className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-red-600 text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'packages' ? (
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

                {/* Map Preview - Show current store location */}
                {latitude && longitude && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Store Location on Map</p>
                    <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-md">
                      <iframe
                        src={`https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Store Location Map"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                      <span className="material-symbols-outlined text-sm text-primary">info</span>
                      <p>This is your clinic's location that customers will see</p>
                    </div>
                  </div>
                )}
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

      {/* Add/Edit Time Slot Modal */}
      {showAddTimeSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => {
          setShowAddTimeSlot(false);
          setEditingTimeSlot(null);
          setNewTimeSlot('');
          setSelectedWeekdays([0,1,2,3,4,5,6]);
        }}>
          <div
            className="bg-white rounded-t-[32px] w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-slate-900">
                {editingTimeSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
              </h2>
              <button
                onClick={() => {
                  setShowAddTimeSlot(false);
                  setEditingTimeSlot(null);
                  setNewTimeSlot('');
                  setSelectedTimeSlots([]);
                  setSelectedWeekdays([0,1,2,3,4,5,6]);
                }}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-slate-700">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Time Slot *</label>
                <input
                  type="text"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-center text-lg font-bold"
                  placeholder="e.g., 09:00 AM"
                />
                <p className="text-xs text-slate-500 mt-2">Use format: HH:MM AM/PM (e.g., 09:00 AM, 02:30 PM)</p>
              </div>

              {/* Quick Time Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Add (Multiple Selection)</p>
                  {!editingTimeSlot && selectedTimeSlots.length > 0 && (
                    <button
                      onClick={() => setSelectedTimeSlots([])}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Clear Selected ({selectedTimeSlots.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        if (editingTimeSlot) {
                          // In edit mode, just set the single time slot
                          setNewTimeSlot(time);
                        } else {
                          // In add mode, toggle selection for multiple slots
                          toggleTimeSlotSelection(time);
                        }
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                        editingTimeSlot
                          ? (newTimeSlot === time
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 hover:bg-primary hover:text-white')
                          : (selectedTimeSlots.includes(time)
                              ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                              : 'bg-slate-100 hover:bg-slate-200')
                      }`}
                    >
                      {time}
                      {!editingTimeSlot && selectedTimeSlots.includes(time) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {!editingTimeSlot && selectedTimeSlots.length > 0 && (
                  <p className="text-xs text-primary font-bold mt-2">
                    {selectedTimeSlots.length} time slot{selectedTimeSlots.length > 1 ? 's' : ''} selected: {selectedTimeSlots.join(', ')}
                  </p>
                )}
              </div>

              {/* Weekday Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Days *</label>
                  <button
                    onClick={() => setSelectedWeekdays(
                      selectedWeekdays.length === 7 ? [] : [0,1,2,3,4,5,6]
                    )}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {selectedWeekdays.length === 7 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {weekdayNames.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => toggleWeekday(index)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedWeekdays.includes(index)
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {selectedWeekdays.length === 0 && 'Please select at least one day'}
                  {selectedWeekdays.length === 7 && 'Available all days of the week'}
                  {selectedWeekdays.length > 0 && selectedWeekdays.length < 7 &&
                    `Available on ${selectedWeekdays.length} day${selectedWeekdays.length > 1 ? 's' : ''}`
                  }
                </p>
              </div>

              <button
                onClick={handleAddTimeSlot}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-all"
              >
                {editingTimeSlot
                  ? 'Update Time Slot'
                  : selectedTimeSlots.length > 0
                    ? `Add ${selectedTimeSlots.length} Time Slot${selectedTimeSlots.length > 1 ? 's' : ''}`
                    : 'Add Time Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroomingStoreManagement;
