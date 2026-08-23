import React, { useState } from 'react';
import { getCurrentPosition } from '../../utils/locationUtils';
import { useToast } from '../../context/ToastContext';

const LocationPicker = ({ location = {}, onChange }) => {
  const [loadingGeo, setLoadingGeo] = useState(false);
  const { showToast } = useToast();

  const handleUseCurrentLocation = async () => {
    try {
      setLoadingGeo(true);
      const coords = await getCurrentPosition();
      
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
        );
        const data = await res.json();
        const address = data.address || {};
        
        const city = address.city || address.town || address.village || address.county || location.city || '';
        const area = address.suburb || address.neighbourhood || address.residential || address.road || location.area || '';
        const pincode = address.postcode || location.pincode || '';
        const state = address.state || location.state || '';

        const updated = {
          ...location,
          city,
          area,
          pincode,
          state,
          coordinates: {
            type: 'Point',
            coordinates: [coords.longitude, coords.latitude],
          },
        };

        onChange(updated);
        showToast(`Location set to ${area ? `${area}, ` : ''}${city}`, 'success');
      } catch (e) {
        onChange({
          ...location,
          coordinates: {
            type: 'Point',
            coordinates: [coords.longitude, coords.latitude],
          },
        });
        showToast('Location coordinates detected.', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Geolocation permission denied. Please enter location manually.', 'warning');
    } finally {
      setLoadingGeo(false);
    }
  };

  const handleFieldChange = (field, val) => {
    onChange({
      ...location,
      [field]: val,
    });
  };

  return (
    <div className="space-y-4 bg-[#FBF9F5] p-5 rounded-2xl border border-[#E8E2D8] font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
        <div>
          <h4 className="font-bold text-[#1F2937] text-xs uppercase tracking-wider">
            📍 Location Details
          </h4>
          <p className="text-xs text-[#667085] mt-0.5">
            Your exact residential address is never shown to other users.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={loadingGeo}
          className="px-4 py-2 bg-white hover:bg-[#FFF8EB] text-[#D6A13A] border border-[#E8E2D8] text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer flex-shrink-0"
        >
          <span className={loadingGeo ? 'animate-spin' : ''}>🎯</span>
          <span>{loadingGeo ? 'Detecting Location...' : 'Use My Current Location'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1.5">City</label>
          <input
            type="text"
            placeholder="e.g. Hapur"
            value={location.city || ''}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            className="w-full h-[46px] bg-white border border-[#E8E2D8] rounded-xl px-3.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#D6A13A]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1.5">Area / Locality</label>
          <input
            type="text"
            placeholder="e.g. Anand Vihar"
            value={location.area || ''}
            onChange={(e) => handleFieldChange('area', e.target.value)}
            className="w-full h-[46px] bg-white border border-[#E8E2D8] rounded-xl px-3.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#D6A13A]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1F2937] mb-1.5">PIN Code</label>
          <input
            type="text"
            placeholder="e.g. 245101"
            value={location.pincode || ''}
            onChange={(e) => handleFieldChange('pincode', e.target.value)}
            className="w-full h-[46px] bg-white border border-[#E8E2D8] rounded-xl px-3.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#D6A13A]"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
