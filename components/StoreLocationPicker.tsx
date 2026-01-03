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

interface StoreLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

interface Props {
  onLocationSelect: (location: StoreLocation) => void;
  initialLocation?: StoreLocation;
}

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
  onLocationClick
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
  onLocationClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

const StoreLocationPicker: React.FC<Props> = ({ onLocationSelect, initialLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [city, setCity] = useState(initialLocation?.city || '');
  const [state, setState] = useState(initialLocation?.state || '');
  const [pincode, setPincode] = useState(initialLocation?.pincode || '');
  const [showMap, setShowMap] = useState(false);

  // Reverse geocode from coordinates to address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&lat=${lat}&lon=${lng}&` +
        `addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'PetVisitGroomingApp/1.0'
          }
        }
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();
      console.log('Reverse geocode result:', data);

      if (data.address) {
        const addr = data.address;

        // Extract address components
        const road = addr.road || addr.street || '';
        const suburb = addr.suburb || addr.neighbourhood || '';
        const fullAddress = [road, suburb].filter(Boolean).join(', ');

        const newCity = addr.city || addr.town || addr.village || addr.county || '';
        const newState = addr.state || '';
        const newPincode = addr.postcode || '';

        setAddress(fullAddress);
        setCity(newCity);
        setState(newState);
        setPincode(newPincode);

        // Notify parent component
        onLocationSelect({
          address: fullAddress,
          city: newCity,
          state: newState,
          pincode: newPincode,
          latitude: lat,
          longitude: lng
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      alert('Failed to get address from location. Please enter manually.');
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const newPos = { lat, lng };
          setSelectedLocation(newPos);
          setShowMap(true);

          // Reverse geocode to get address
          await reverseGeocode(lat, lng);

          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Failed to get current location. Please select manually on map or enter address.');
          setIsLoadingLocation(false);
          setShowMap(true);
          // Default to Bangalore, India
          setSelectedLocation({ lat: 12.9716, lng: 77.5946 });
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      setShowMap(true);
      // Default to Bangalore, India
      setSelectedLocation({ lat: 12.9716, lng: 77.5946 });
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    await reverseGeocode(lat, lng);
  };

  const handleManualChange = () => {
    if (selectedLocation && address && city && state && pincode) {
      onLocationSelect({
        address,
        city,
        state,
        pincode,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      });
    }
  };

  useEffect(() => {
    handleManualChange();
  }, [address, city, state, pincode]);

  return (
    <div className="space-y-4">
      {/* Get Location Button */}
      {!showMap && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="w-full py-4 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoadingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Getting Location...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">my_location</span>
                <span>Use Current Location</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMap(true);
              if (!selectedLocation) {
                // Default to Bangalore, India
                setSelectedLocation({ lat: 12.9716, lng: 77.5946 });
              }
            }}
            className="w-full py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">map</span>
            <span>Select on Map</span>
          </button>
        </div>
      )}

      {/* Map View */}
      {showMap && (
        <div className="space-y-4">
          <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl">info</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-primary mb-1">Pin Your Store Location</p>
                <p className="text-xs text-slate-600">Click anywhere on the map to set your store's exact location. Address details will be filled automatically.</p>
              </div>
            </div>
          </div>

          <div className="relative w-full h-80 bg-gray-200 rounded-xl overflow-hidden shadow-lg">
            <MapContainer
              center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [12.9716, 77.5946]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker
                position={selectedLocation}
                setPosition={setSelectedLocation}
                onLocationClick={handleMapClick}
              />
              <MapCenterUpdater center={selectedLocation} />
            </MapContainer>

            {/* Retry Location Button */}
            <button
              type="button"
              onClick={getCurrentLocation}
              className="absolute top-4 right-4 z-[1000] w-12 h-12 bg-white hover:bg-slate-50 rounded-xl shadow-lg flex items-center justify-center transition-all"
              title="Get current location"
            >
              <span className="material-symbols-outlined text-primary">my_location</span>
            </button>
          </div>

          {selectedLocation && (
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selected Coordinates</p>
              <p className="text-sm text-slate-700 font-mono">
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Address Fields - Auto-filled or Manual Entry */}
      {showMap && (
        <div className="space-y-4 bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address Details</p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 ml-1">Store Address *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 px-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
              placeholder="123 Pet Street, Near Park"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 ml-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 px-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="Bangalore"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 ml-1">State *</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 px-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
                placeholder="Karnataka"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 ml-1">Pincode *</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              required
              className="w-full appearance-none rounded-xl bg-white border border-slate-200 py-3 px-4 text-slate-700 font-medium shadow-sm focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-all outline-none"
              placeholder="560001"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreLocationPicker;
