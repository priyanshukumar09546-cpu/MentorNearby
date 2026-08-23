import React, { useEffect, useRef, useState } from 'react';

const LocationMap = ({
  latitude,
  longitude,
  city = '',
  area = '',
  title = 'Approximate Location',
  height = '280px',
  approximateText = 'Exact address is hidden for privacy',
  zoom = 13
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(false);

  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  const hasCoordinates = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;

  useEffect(() => {
    if (!hasCoordinates) return;

    let isMounted = true;

    const loadLeaflet = async () => {
      try {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (window.L) {
          if (isMounted) setMapLoaded(true);
          return;
        }

        if (!document.getElementById('leaflet-js')) {
          const script = document.createElement('script');
          script.id = 'leaflet-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          script.onload = () => {
            if (isMounted) setMapLoaded(true);
          };
          script.onerror = () => {
            if (isMounted) setError(true);
          };
          document.body.appendChild(script);
        } else {
          const interval = setInterval(() => {
            if (window.L) {
              clearInterval(interval);
              if (isMounted) setMapLoaded(true);
            }
          }, 100);
        }
      } catch (e) {
        if (isMounted) setError(true);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, [latNum, lngNum, hasCoordinates]);

  useEffect(() => {
    if (!mapLoaded || !window.L || !mapRef.current || !hasCoordinates) return;

    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [latNum, lngNum],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Privacy Circle (approx 500m)
      L.circle([latNum, lngNum], {
        color: '#D6A13A',
        fillColor: '#FFF8EB',
        fillOpacity: 0.35,
        radius: 500,
        weight: 2,
      }).addTo(map);

      const goldIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background: #D6A13A;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(214, 161, 58, 0.4);
          border: 2px solid white;
        ">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([latNum, lngNum], { icon: goldIcon })
        .addTo(map)
        .bindPopup(`<b>${title}</b><br/>${area ? `${area}, ` : ''}${city}`);

      mapInstanceRef.current = map;
    } catch (e) {
      console.error('Leaflet map render error:', e);
    }
  }, [mapLoaded, latNum, lngNum, hasCoordinates, city, area, title, zoom]);

  const displayLocationText = [area, city].filter(Boolean).join(', ') || 'Area / City';

  return (
    <div className="space-y-2 font-sans">
      {/* Map Container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-[#E8E2D8] bg-[#FBF9F5] shadow-xs"
        style={{ height }}
      >
        {hasCoordinates && !error ? (
          <div ref={mapRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FBF9F5] to-[#F3EFE6]">
            <div className="w-12 h-12 rounded-full bg-[#FFF8EB] text-[#D6A13A] flex items-center justify-center text-2xl font-bold mb-2 border border-[#E8E2D8]">
              📍
            </div>
            <h4 className="font-bold text-[#1F2937] text-sm">{displayLocationText}</h4>
            <p className="text-xs text-[#667085] mt-1">Approximate Map View</p>
          </div>
        )}
      </div>

      {/* Clean Privacy Notice Below Map (No Overlapping Elements inside Map!) */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#667085] font-medium pt-1">
        <span>🔒</span>
        <span>{approximateText}</span>
      </div>
    </div>
  );
};

export default LocationMap;
