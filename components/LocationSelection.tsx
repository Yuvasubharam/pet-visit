
import React, { useState, useEffect, useRef } from 'react';
import { Address } from '../types';
import { addressService } from '../services/api';
import AddressForm from './AddressForm';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface Props {
  onClose: () => void;
  onSelect: (location: string) => void;
  currentLocation: string;
  userId?: string | null;
}

const LocationSelection: React.FC<Props> = ({ onClose, onSelect, currentLocation, userId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedSearchLocation, setSelectedSearchLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Load addresses from Supabase
  useEffect(() => {
    if (userId) {
      loadAddresses();
    } else {
      setIsLoadingAddresses(false);
    }
  }, [userId]);

  const loadAddresses = async () => {
    if (!userId) {
      console.log('LocationSelection - No userId, skipping address load');
      return;
    }

    try {
      setIsLoadingAddresses(true);
      console.log('LocationSelection - Loading addresses for user:', userId);
      const data = await addressService.getUserAddresses(userId);
      console.log('LocationSelection - Received addresses:', data);

      const mappedAddresses = (data || []).map((addr: any) => ({
        id: addr.id,
        type: addr.type,
        flatNumber: addr.flat_number,
        street: addr.street,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        latitude: addr.latitude,
        longitude: addr.longitude,
        fullAddress: addr.full_address,
      }));

      console.log('LocationSelection - Mapped addresses:', mappedAddresses);
      setSavedAddresses(mappedAddresses);
    } catch (error) {
      console.error('LocationSelection - Error loading addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Filter saved addresses based on search query
  const filteredAddresses = savedAddresses.filter(address =>
    address.fullAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.landmark.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Search for locations using Nominatim API
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&` +
        `addressdetails=1&limit=5&accept-language=en`,
        {
          headers: {
            'User-Agent': 'PetVisitApp/1.0 (contact@example.com)'
          }
        }
      );

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(searchQuery);
      }, 500); // 500ms debounce
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get city name
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'User-Agent': 'PetVisitApp/1.0 (contact@example.com)'
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data.address) {
                const cityName = data.address.city || data.address.town || data.address.village || 'Current Location';
                setSelectedLocation(cityName);
                onSelect(cityName);
                onClose();
              }
              setIsLoadingLocation(false);
            })
            .catch(() => {
              alert('Unable to fetch location details');
              setIsLoadingLocation(false);
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLoadingLocation(false);
    }
  };

  const handleSaveAddress = async (address: Address) => {
    if (!userId) {
      alert('User not logged in. Please log in to save address.');
      return;
    }

    try {
      console.log('LocationSelection - Saving address:', address);
      const savedAddress = await addressService.addAddress(userId, address);
      console.log('LocationSelection - Address saved successfully:', savedAddress);

      // Reload addresses to get the latest list
      await loadAddresses();

      setShowAddressForm(false);
      setSelectedSearchLocation(undefined);

      // Call onSelect with the full address to update the header
      if (address.fullAddress) {
        onSelect(address.fullAddress);
      }

      alert('Address saved successfully!');
    } catch (error: any) {
      console.error('LocationSelection - Error saving address:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to save address. ';
      if (error?.message) {
        errorMessage += error.message;
      } else if (error?.error_description) {
        errorMessage += error.error_description;
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }

      alert(errorMessage);
    }
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const locationName = result.address.city || result.address.town || result.address.village || result.display_name;
    setSelectedLocation(locationName);
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);

    // Set the coordinates and open the address form with map
    setSelectedSearchLocation({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    });
    setShowAddressForm(true);
  };

  const handleConfirm = () => {
    // Find the selected address from savedAddresses
    const selectedAddr = savedAddresses.find(addr => addr.fullAddress === selectedLocation);

    if (selectedAddr) {
      console.log('LocationSelection - Confirming address selection:', selectedAddr);
      // Pass the full address string to trigger update in App.tsx
      onSelect(selectedLocation);
    } else {
      // If no saved address matched, just pass the location string
      onSelect(selectedLocation);
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 fade-in" onClick={onClose}>
        <div
          className="w-full max-w-md bg-white rounded-t-[32px] shadow-2xl slide-up flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-gray-900">Select Location</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-600">close</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                placeholder="Search city or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-primary focus:border-primary placeholder-gray-400"
              />
              {isSearching && (
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin">
                  sync
                </span>
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Current Location Button */}
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full flex items-center gap-4 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <span className={`material-symbols-outlined text-white text-2xl ${isLoadingLocation ? 'animate-spin' : ''}`}>
                  {isLoadingLocation ? 'sync' : 'my_location'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-primary">
                  {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
                </p>
                <p className="text-xs text-gray-500 font-medium">Auto-detect from GPS</p>
              </div>
              <span className="material-symbols-outlined text-primary">chevron_right</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
                </p>
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl hover:bg-blue-100 hover:border-blue-200 transition-all text-left"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-lg">location_on</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-blue-900 mb-1">
                            {result.address.city || result.address.town || result.address.village || 'Location'}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {result.display_name}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-blue-500 flex-shrink-0">arrow_forward</span>
                      </button>
                    ))}
                  </div>
                ) : !isSearching ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-3xl text-gray-400">search_off</span>
                    </div>
                    <p className="text-sm font-bold text-gray-600 mb-1">No results found</p>
                    <p className="text-xs text-gray-400">Try a different search term</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Saved Addresses */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {isLoadingAddresses ? 'Loading Addresses...' : savedAddresses.length > 0 ? 'Saved Addresses' : 'No Saved Addresses'}
                </p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add New
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredAddresses.length > 0 ? (
                <div className="space-y-2">
                  {filteredAddresses.map((address) => (
                    <button
                      key={address.id}
                      onClick={() => {
                        if (address.fullAddress) {
                          setSelectedLocation(address.fullAddress);
                        }
                      }}
                      className={`w-full flex items-start gap-3 p-4 rounded-2xl transition-all ${
                        selectedLocation === address.fullAddress
                          ? 'bg-primary/10 border-2 border-primary shadow-sm'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        selectedLocation === address.fullAddress ? 'bg-primary' : 'bg-gray-200'
                      }`}>
                        <span className={`material-symbols-outlined text-lg ${
                          selectedLocation === address.fullAddress ? 'text-white' : 'text-gray-600'
                        }`}>
                          {address.type === 'Home' ? 'home' : address.type === 'Office' ? 'work' : 'location_on'}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${
                            selectedLocation === address.fullAddress
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {address.type}
                          </span>
                        </div>
                        <p className={`text-sm font-bold mb-1 ${
                          selectedLocation === address.fullAddress ? 'text-primary' : 'text-gray-900'
                        }`}>
                          {address.flatNumber}, {address.street}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {address.landmark && `${address.landmark}, `}{address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                      {selectedLocation === address.fullAddress && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-[16px]">check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-gray-400">location_off</span>
                  </div>
                  <p className="text-sm font-bold text-gray-600 mb-2">
                    {searchQuery ? 'No addresses found' : 'No saved addresses yet'}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    {searchQuery ? 'Try a different search term' : 'Add your first delivery address'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-light transition-colors"
                    >
                      Add Address
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-primary text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:bg-primary-light transition-all active:scale-95"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm
          onClose={() => {
            setShowAddressForm(false);
            setSelectedSearchLocation(undefined);
          }}
          onSave={handleSaveAddress}
          initialLocation={selectedSearchLocation}
          autoOpenMap={!!selectedSearchLocation}
        />
      )}
    </>
  );
};

export default LocationSelection;