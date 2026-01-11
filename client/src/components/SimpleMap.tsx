import React, { useEffect, useRef, useState } from 'react';
import { OlaMaps } from 'olamaps-web-sdk';

// OLA Maps Configuration
const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY || 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';

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
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<{ [key: number]: any }>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initMap = async () => {
            if (!mapContainerRef.current) return;
            if (mapInstanceRef.current) return;

            try {
                console.log("Initializing Official Ola Maps Web SDK v2 (3D Mode)...");

                // As per latest documentation for 3D Tiles support
                const olamaps = new OlaMaps({
                    apiKey: OLA_MAPS_API_KEY,
                    mode: "3d", // Integrated 3D support to resolve style layer errors
                    threedTileset: "https://api.olamaps.io/tiles/vector/v1/3dtiles/tileset.json",
                });

                const map = await olamaps.init({
                    style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                    container: mapContainerRef.current,
                    center: [77.61648476788898, 12.931423492103944],
                    zoom: 12,
                    pitch: 0, // Initial pitch (0 = 2D view, but 3D data is loaded)
                });

                if (!isMounted) {
                    map.remove();
                    return;
                }

                // Defensive check for navigation control
                try {
                    if (typeof (olamaps as any).addNavigationControl === 'function') {
                        map.addControl((olamaps as any).addNavigationControl(), 'top-right');
                    }
                } catch (controlErr) {
                    console.warn("Failed to add navigation control:", controlErr);
                }

                mapInstanceRef.current = map;

                map.on('load', () => {
                    console.log("Ola Maps SDK v2 Loaded Successfully with 3D support");
                    updateMarkers(activeBuses);
                });

                map.on('error', (e: any) => {
                    console.error("Ola Maps SDK Error:", e);
                });

            } catch (err: any) {
                console.error("Failed to initialize Ola Maps SDK:", err);
                if (isMounted) {
                    setError(err.message || "Failed to load map");
                }
            }
        };

        initMap();

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                try {
                    mapInstanceRef.current.remove();
                } catch (e) {
                    console.warn("Error removing map instance:", e);
                }
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
                const marker = markersRef.current[bus.routeId];
                marker.setLngLat(lngLat);
                const popup = marker.getPopup();
                if (popup) popup.setHTML(getPopupContent(bus));
            } else {
                const el = createBusMarkerElement();

                try {
                    // Documentation shows OlaMaps.Marker / OlaMaps.Popup
                    const OlaNamespace = (window as any).OlaMaps || OlaMaps;

                    if (OlaNamespace && OlaNamespace.Marker) {
                        const popup = new OlaNamespace.Popup({ offset: [0, -15] }).setHTML(getPopupContent(bus));
                        const marker = new OlaNamespace.Marker({ element: el })
                            .setLngLat(lngLat)
                            .setPopup(popup)
                            .addTo(map);

                        markersRef.current[bus.routeId] = marker;
                    }
                } catch (e) {
                    console.error("Error creating marker:", e);
                }
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
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg border border-red-100">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Map Loading Issue</h3>
                <p className="text-sm text-gray-600 text-center mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Retry Loading
                </button>
                <p className="mt-4 text-xs text-gray-400">Ola Maps SDK v2 Integration</p>
            </div>
        );
    }

    return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: '500px', backgroundColor: '#f9fafb', borderRadius: '12px', overflow: 'hidden' }} />;
};

export default SimpleMap;
