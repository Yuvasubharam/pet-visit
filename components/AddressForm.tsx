
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Address {
  id?: string;
  type: 'Home' | 'Office' | 'Other';
  flatNumber: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

interface Props {
  onClose: () => void;
  onSave: (address: Address) => void;
  initialAddress?: Address;
  initialLocation?: { lat: number; lng: number };
  autoOpenMap?: boolean;
}

// User-Agent for Nominatim API (REQUIRED - Update with your contact email)
const USER_AGENT = 'PetVisitApp/1.0 (contact@example.com)';

// Map Center Updater Component
function MapCenterUpdater({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 15, {
        animate: true,
        duration: 1
      });
    }
  }, [center, map]);

  return null;
}

// Location Marker Component for Map
function LocationMarker({
  position,
  setPosition,
  onLocationSelect
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

const AddressForm: React.FC<Props> = ({ onClose, onSave, initialAddress, initialLocation, autoOpenMap = false }) => {
  const [addressType, setAddressType] = useState<'Home' | 'Office' | 'Other'>(initialAddress?.type || 'Home');
  const [flatNumber, setFlatNumber] = useState(initialAddress?.flatNumber || '');
  const [street, setStreet] = useState(initialAddress?.street || '');
  const [landmark, setLandmark] = useState(initialAddress?.landmark || '');
  const [city, setCity] = useState(initialAddress?.city || '');
  const [state, setState] = useState(initialAddress?.state || '');
  const [pincode, setPincode] = useState(initialAddress?.pincode || '');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMap, setShowMap] = useState(autoOpenMap);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ||
    (initialAddress?.latitude && initialAddress?.longitude
      ? { lat: initialAddress.latitude, lng: initialAddress.longitude }
      : null)
  );

  // Reverse geocode from coordinates to address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&lat=${lat}&lon=${lng}&` +
        `addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': USER_AGENT
          }
        }
      );

      const data = await response.json();

      if (data.address) {
        const addr = data.address;
        // Auto-fill form fields
        setStreet(addr.road || addr.street || addr.suburb || '');
        setCity(addr.city || addr.town || addr.village || '');
        setState(addr.state || '');
        setPincode(addr.postcode || '');
        setLandmark(addr.neighbourhood || '');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Auto-reverse geocode when initial location is provided
  useEffect(() => {
    if (initialLocation && !initialAddress) {
      reverseGeocode(initialLocation.lat, initialLocation.lng);
    }
  }, []);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
          setIsLoadingLocation(false);

          // If map is open, keep it open to show the detected location
          // User can see the pin drop at their current location
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Unable to get your location. ';

          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Please try again or enter your address manually.';
          }

          alert(errorMessage);
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: false, // Changed to false for better compatibility
          timeout: 15000, // Increased timeout
          maximumAge: 30000 // Allow cached location up to 30 seconds old
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter your address manually.');
      setIsLoadingLocation(false);
    }
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    reverseGeocode(lat, lng);
  };

  const handleSave = () => {
    if (!flatNumber || !street || !city || !state || !pincode) {
      alert('Please fill in all required fields');
      return;
    }

    const address: Address = {
      id: initialAddress?.id,
      type: addressType,
      flatNumber,
      street,
      landmark,
      city,
      state,
      pincode,
      latitude: selectedLocation?.lat,
      longitude: selectedLocation?.lng,
      fullAddress: `${flatNumber}, ${street}, ${landmark ? landmark + ', ' : ''}${city}, ${state} - ${pincode}`
    };

    onSave(address);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-[32px] shadow-2xl slide-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900">Add Delivery Address</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-600">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Location Help Text */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-800 font-medium">
              <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
              Location is optional. You can fill the form manually or use GPS/Map for convenience.
            </p>
          </div>

          {/* Location Button */}
          <button
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="w-full flex items-center gap-4 p-4 mb-6 bg-primary/5 border-2 border-primary/20 rounded-2xl hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className={`material-symbols-outlined text-white text-2xl ${isLoadingLocation ? 'animate-spin' : ''}`}>
                {isLoadingLocation ? 'sync' : 'my_location'}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-primary">
                {isLoadingLocation ? 'Getting Location...' : 'Use Current Location (Optional)'}
              </p>
              <p className="text-xs text-gray-500 font-medium">Auto-fill address from GPS</p>
            </div>
            <span className="material-symbols-outlined text-primary">chevron_right</span>
          </button>

          {/* Map Integration Button - Only show when no location is selected */}
          {!selectedLocation && (
            <button
              onClick={() => setShowMap(true)}
              className="w-full flex items-center gap-4 p-4 mb-6 bg-blue-50 border-2 border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">map</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-blue-600">Select on Map</p>
                <p className="text-xs text-gray-500 font-medium">Drop a pin to set location</p>
              </div>
              <span className="material-symbols-outlined text-blue-600">chevron_right</span>
            </button>
          )}

          {/* Selected Location Indicator - Only show when location is selected */}
          {selectedLocation && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-lg">pin_drop</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-green-900 mb-1">Location Pin Dropped</p>
                  <p className="text-xs text-gray-600 mb-2">
                    Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                  <button
                    onClick={() => setShowMap(true)}
                    className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit_location</span>
                    Adjust Pin Location
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Address Type Selection */}
          <div className="mb-6">
            <label className="text-sm font-bold text-gray-700 mb-3 block">Save Address As</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Home', 'Office', 'Other'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setAddressType(type)}
                  className={`p-3 rounded-2xl font-bold text-sm transition-all ${
                    addressType === type
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Flat / House No. / Building <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Flat 301, Building A"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Street / Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Main Street, Sector 1"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Near City Mall"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 110001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-sm"
                maxLength={6}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-primary text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:bg-primary-light transition-all active:scale-95"
          >
            Save Address
          </button>
        </div>

        {/* Map Modal with Leaflet */}
        {showMap && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">Drop Pin on Map</h2>
              <button
                onClick={() => setShowMap(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-600">close</span>
              </button>
            </div>

            {/* Leaflet Map */}
            <div className="flex-1 relative">
              <MapContainer
                center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [17.6868, 83.2185]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapCenterUpdater center={selectedLocation} />
                <LocationMarker
                  position={selectedLocation}
                  setPosition={setSelectedLocation}
                  onLocationSelect={handleMapLocationSelect}
                />
              </MapContainer>

              {/* Instructions Overlay with GPS Button */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[1000]">
                <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <p className="text-xs font-bold text-gray-700">
                    <span className="material-symbols-outlined text-sm align-middle">touch_app</span> Tap to drop pin
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!isLoadingLocation) {
                      getCurrentLocation();
                    }
                  }}
                  disabled={isLoadingLocation}
                  className="bg-primary hover:bg-primary-light disabled:opacity-50 backdrop-blur-sm p-2.5 rounded-full shadow-lg transition-all active:scale-95"
                  title="Use current location"
                >
                  <span className={`material-symbols-outlined text-white text-lg ${isLoadingLocation ? 'animate-spin' : ''}`}>
                    {isLoadingLocation ? 'sync' : 'my_location'}
                  </span>
                </button>
              </div>
            </div>

            {/* Attribution */}
            <div className="px-6 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-500 text-center">
                Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowMap(false)}
                disabled={!selectedLocation}
                className="w-full py-4 bg-primary text-white font-black text-sm rounded-2xl shadow-xl hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedLocation ? 'Confirm Location' : 'Select a location on map'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressForm;