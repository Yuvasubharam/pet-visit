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

interface ClinicLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface Props {
  onClose: () => void;
  onSave: (location: ClinicLocation) => void;
  initialLocation?: { latitude?: number; longitude?: number; address?: string };
}

// Map Center Updater Component
function MapCenterUpdater({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 15, {
        animate: true,
        duration: 0.5
      });
    }
  }, [center, map]);

  return null;
}

// Location Marker Component for Map - Double click to place pin
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
    dblclick(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

const ClinicLocationPicker: React.FC<Props> = ({ onClose, onSave, initialLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation?.latitude && initialLocation?.longitude
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : { lat: 28.6139, lng: 77.2090 } // Default to Delhi, India
  );
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'PetVisitApp/1.0'
          }
        }
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Search for locations
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&` +
        `addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'PetVisitApp/1.0'
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

  // Get current location from GPS
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
          setIsLoadingLocation(false);
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
              errorMessage += 'Please try again or select location manually.';
          }

          alert(errorMessage);
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLoadingLocation(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSelectedLocation({ lat, lng });
    setAddress(result.display_name);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSave = () => {
    if (!selectedLocation) return;

    onSave({
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      address: address,
    });
    onClose();
  };

  // Handle map location selection (from double-click)
  const handleMapLocationSelect = (lat: number, lng: number) => {
    reverseGeocode(lat, lng);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 fade-in" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl slide-up flex flex-col max-h-[90vh] m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900">Select Clinic Location</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-600">close</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Search for clinic location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchLocation(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-400 outline-none"
            />
            {isSearching && (
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin">sync</span>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto bg-gray-50 rounded-2xl p-2 space-y-1">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white transition-colors"
                >
                  <p className="text-sm font-bold text-gray-900">{result.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Location Button */}
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

        {/* Map Container - Leaflet Interactive Map */}
        <div className="flex-1 overflow-hidden relative bg-gray-100" style={{ minHeight: '400px' }}>
          {selectedLocation && (
            <MapContainer
              key={`${selectedLocation.lat}-${selectedLocation.lng}`}
              center={[selectedLocation.lat, selectedLocation.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%', minHeight: '400px' }}
              className="z-0"
              scrollWheelZoom={true}
              doubleClickZoom={false}
              touchZoom={true}
              dragging={true}
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
          )}

          {/* Instruction banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-primary text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">touch_app</span>
              Double-tap to drop pin • Pinch to zoom • Drag to pan
            </div>
          </div>

          {/* Coordinate display */}
          {selectedLocation && (
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-mono text-gray-600 z-[1000] shadow-md pointer-events-none">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          )}
        </div>

        {/* Address Display & Actions */}
        <div className="px-6 py-5 border-t border-gray-100 space-y-4">
          {/* Selected Address */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-lg">location_on</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Selected Clinic Location
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {isLoadingAddress ? 'Loading address...' : address || 'Search or use GPS to select location'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!address}
              className="flex-1 py-4 bg-primary text-white font-bold text-sm rounded-2xl shadow-xl hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicLocationPicker;
