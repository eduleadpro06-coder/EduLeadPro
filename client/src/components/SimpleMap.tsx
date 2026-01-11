import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OLA Maps Configuration
const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY || 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
// Production Vector Style URL
const STYLE_URL = `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=${OLA_MAPS_API_KEY}`;

interface Location {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
}

interface Bus {
    routeId: number;
    routeName: string;
    vehicleNumber: string;
    driverName: string;
    currentLocation: Location;
    lastUpdated: string;
}

interface SimpleMapProps {
    activeBuses: Bus[];
}

const SimpleMap: React.FC<SimpleMapProps> = ({ activeBuses }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<{ [key: number]: maplibregl.Marker }>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initMap = async () => {
            if (!mapContainerRef.current) return;
            if (mapInstanceRef.current) return;

            try {
                console.log("Initializing Ola Maps (Production Mode)...");

                const map = new maplibregl.Map({
                    container: mapContainerRef.current,
                    style: STYLE_URL, // Using OLA Maps Vector Style
                    center: [77.61648476788898, 12.931423492103944],
                    zoom: 12,
                    transformRequest: (url, resourceType) => {
                        // Crucial: Append api_key to all Ola Maps requests if it's missing or empty
                        // This fixes the issue where Ola's own planet.json/street.json return URLs with "?key="
                        if (url.includes('olamaps.io') && (!url.includes('api_key=') || url.includes('key=&'))) {
                            const separator = url.includes('?') ? '&' : '?';
                            const cleanUrl = url.replace(/key=&/g, '').replace(/\?key=$/g, '');
                            return {
                                url: `${cleanUrl}${separator}api_key=${OLA_MAPS_API_KEY}`
                            };
                        }
                        return { url };
                    }
                });

                // Add Controls
                map.addControl(new maplibregl.NavigationControl(), 'top-right');

                // Add custom attribution
                map.addControl(new maplibregl.AttributionControl({
                    customAttribution: '© Ola Maps'
                }), 'bottom-right');

                mapInstanceRef.current = map;

                map.on('load', () => {
                    console.log("Ola Maps Loaded Successfully");
                    updateMarkers(activeBuses);
                });

                map.on('error', (e) => {
                    console.error("Map Load Error:", e);
                    // Don't show UI error for tile errors to avoid scary popups, just log
                    if (e.error && e.error.status === 403) {
                        console.warn("Domain not allowed by Ola Maps. Verify Dashboard whitelist.");
                    }
                });

            } catch (err: any) {
                console.error("Failed to initialize Map:", err);
                setError(err.message || "Failed to load map");
            }
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (mapInstanceRef.current) {
            updateMarkers(activeBuses);
        }
    }, [activeBuses]);

    const updateMarkers = (buses: Bus[]) => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;

        buses.forEach(bus => {
            const { latitude, longitude } = bus.currentLocation;
            const lngLat: [number, number] = [longitude, latitude];

            if (markersRef.current[bus.routeId]) {
                markersRef.current[bus.routeId].setLngLat(lngLat);
                const popup = markersRef.current[bus.routeId].getPopup();
                if (popup) popup.setHTML(getPopupContent(bus));
            } else {
                const el = createBusMarkerElement();
                const popup = new maplibregl.Popup({ offset: 25 }).setHTML(getPopupContent(bus));

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat(lngLat)
                    .setPopup(popup)
                    .addTo(map);

                markersRef.current[bus.routeId] = marker;
            }
        });

        const currentIds = buses.map(b => b.routeId);
        Object.keys(markersRef.current).forEach(idStr => {
            const id = parseInt(idStr);
            if (!currentIds.includes(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });
    };

    const createBusMarkerElement = () => {
        const el = document.createElement('div');
        el.innerHTML = '🚌';
        el.style.backgroundColor = '#7C3AED';
        el.style.color = 'white';
        el.style.width = '36px';
        el.style.height = '36px';
        el.style.borderRadius = '50%';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '20px';
        el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
        el.style.cursor = 'pointer';
        el.style.border = '2px solid white';
        return el;
    };

    const getPopupContent = (bus: Bus) => `
    <div class="p-2 font-sans">
      <h3 class="font-bold text-purple-700 text-lg mb-1">${bus.routeName}</h3>
      <div class="text-sm text-gray-700 space-y-1">
        <p><strong>Vehicle:</strong> ${bus.vehicleNumber}</p>
        <p><strong>Driver:</strong> ${bus.driverName}</p>
        <p><strong>Speed:</strong> ${bus.currentLocation.speed.toFixed(1)} km/h</p>
      </div>
      <p class="text-xs text-gray-500 mt-2 border-t pt-2">
        Last updated: ${new Date(bus.lastUpdated).toLocaleTimeString()}
      </p>
    </div>
  `;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-600 p-4 rounded-lg">
                <span className="text-2xl mb-2">⚠️</span>
                <p className="font-bold">Map Error</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: '500px', backgroundColor: '#e5e7eb', borderRadius: '12px', overflow: 'hidden' }} />;
};

export default SimpleMap;
