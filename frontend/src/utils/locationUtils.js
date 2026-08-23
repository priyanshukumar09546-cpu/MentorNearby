// ============================================================
// locationUtils.js
// Geospatial distance calculation, formatting & geolocation helpers
// ============================================================

/**
 * Calculate distance between two lat/lng coordinates in kilometers using Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;

  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth radius in km
  const dLat = (numLat2 - numLat1) * (Math.PI / 180);
  const dLon = (numLon2 - numLon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(numLat1 * (Math.PI / 180)) *
      Math.cos(numLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  
  return Math.round(d * 10) / 10; // Round to 1 decimal place
};

/**
 * Format distance in user-friendly string:
 * < 1 km: "800 m away"
 * 1–10 km: "4.8 km away"
 * 10–100 km: "28 km away"
 * 100+ km: "120 km away"
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return null;
  }
  
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters || 100} m away`;
  }
  
  if (distanceKm <= 10) {
    return `${distanceKm} km away`;
  }
  
  if (distanceKm <= 100) {
    return `${Math.round(distanceKm)} km away`;
  }
  
  return `${Math.round(distanceKm)} km away`;
};

/**
 * Browser Geolocation helper (with graceful error handling & manual fallback)
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let msg = 'Geolocation permission denied or unavailable.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please enter location manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable. Please enter location manually.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please enter location manually.';
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};
