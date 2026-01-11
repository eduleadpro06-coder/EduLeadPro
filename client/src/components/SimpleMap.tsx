import React, { useEffect, useRef, useState } from 'react';
// OlaMaps is now loaded via CDN in index.html to avoid bundling issues
const OlaMapsSDK = (window as any).OlaMaps;

// OLA Maps Configuration
const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY || 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';

interface Location {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
}

interface BusStop {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    arrivalTime?: string;
}

interface Bus {
    routeId: number;
    routeName: string;
    vehicleNumber: string;
    driverName: string;
    currentLocation: Location;
    lastUpdated: string;
    stops?: BusStop[];
}

interface SimpleMapProps {
    activeBuses: Bus[];
    allRoutes?: { routeId: number, coords: [number, number][] }[]; // { id, [lng, lat][] }[]
}

const SimpleMap: React.FC<SimpleMapProps> = ({ activeBuses, allRoutes }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<{ [key: number]: any }>({});
    const stopMarkersRef = useRef<{ [key: string]: any }>({});
    const routesRef = useRef<{ [key: number]: boolean }>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initMap = async () => {
            if (!mapContainerRef.current) return;
            if (mapInstanceRef.current) return;

            try {
                console.log("Initializing Official Ola Maps Web SDK v2 (3D Mode via CDN)...");

                const waitForSDK = async (attempts = 10, delay = 500): Promise<any> => {
                    const existingNs = (window as any).OlaMaps;
                    if (existingNs) return existingNs;

                    if (attempts === 0) throw new Error("Ola Maps SDK failed to load after retries");

                    await new Promise(resolve => setTimeout(resolve, delay));
                    return waitForSDK(attempts - 1, delay);
                };

                const ns = await waitForSDK();

                // Robust check for Constructor (handles both namespace.OlaMaps and direct export)
                const OlaSDK = (ns.OlaMaps) ? ns.OlaMaps : ns;

                console.log("SDK Constructor Found:", OlaSDK);

                const olamaps = new OlaSDK({
                    apiKey: OLA_MAPS_API_KEY,
                    mode: "3d",
                    threedTileset: "https://api.olamaps.io/tiles/vector/v1/3dtiles/tileset.json",
                });

                const map = await olamaps.init({
                    style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                    container: mapContainerRef.current,
                    center: [77.61648476788898, 12.931423492103944],
                    zoom: 12,
                    pitch: 0,
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
                    console.log("Ola Maps SDK v2 Loaded Successfully");
                    updateMarkers(activeBuses);
                    if (allRoutes) updateAllRoutes(allRoutes);
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

    useEffect(() => {
        if (mapInstanceRef.current && allRoutes) {
            updateAllRoutes(allRoutes);
        }
    }, [allRoutes]);

    const updateAllRoutes = (routes: { routeId: number, coords: [number, number][] }[]) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Add or update routes
        routes.forEach(route => {
            const sourceId = `route-${route.routeId}`;
            const layerId = `layer-${route.routeId}`;

            if (map.getSource(sourceId)) {
                (map.getSource(sourceId) as any).setData({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: route.coords
                    }
                });
            } else {
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: route.coords
                        }
                    }
                });

                map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#4f46e5',
                        'line-width': 4,
                        'line-opacity': 0.6
                    }
                });
                routesRef.current[route.routeId] = true;
            }
        });

        // Remove old routes
        const currentIds = routes.map(r => r.routeId);
        Object.keys(routesRef.current).forEach(idStr => {
            const id = parseInt(idStr);
            if (!currentIds.includes(id)) {
                try {
                    map.removeLayer(`layer-${id}`);
                    map.removeSource(`route-${id}`);
                } catch (e) {
                    console.warn("Error removing route:", e);
                }
                delete routesRef.current[id];
            }
        });
    };

    const updateMarkers = (buses: Bus[]) => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;
        const OlaNamespace = (window as any).OlaMaps;

        // Bounds for auto-fitting
        const bounds = new OlaNamespace.LngLatBounds();

        buses.forEach(bus => {
            const { latitude, longitude } = bus.currentLocation;
            const lngLat: [number, number] = [longitude, latitude];

            // Extend bounds
            bounds.extend(lngLat);

            if (markersRef.current[bus.routeId]) {
                const marker = markersRef.current[bus.routeId];
                marker.setLngLat(lngLat);
                const popup = marker.getPopup();
                if (popup) popup.setHTML(getPopupContent(bus));
            } else {
                const el = createBusMarkerElement();

                try {
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

        // Remove old markers
        const currentIds = buses.map(b => b.routeId);
        Object.keys(markersRef.current).forEach(idStr => {
            const id = parseInt(idStr);
            if (!currentIds.includes(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // Auto-center map if there are buses
        if (buses.length > 0 && !map._userInteracting) { // Optional: avoid hijacking if user is dragging
            try {
                map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15,
                    duration: 1000
                });
            } catch (e) {
                console.warn("FitBounds failed:", e);
            }
        }

        // Update Stops for each bus
        updateRouteStops(buses);
    };

    const updateRouteStops = (buses: Bus[]) => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;
        const OlaNamespace = (window as any).OlaMaps;
        if (!OlaNamespace) return;

        const activeStopIds: string[] = [];

        buses.forEach(bus => {
            if (!bus.stops || bus.stops.length === 0) return;

            // Assuming last stop is School, others are pickups
            bus.stops.forEach((stop, index) => {
                const isSchool = index === bus.stops!.length - 1;
                const markerId = `stop-${bus.routeId}-${stop.id}`;
                activeStopIds.push(markerId);

                if (!stopMarkersRef.current[markerId]) {
                    const el = document.createElement('div');
                    if (isSchool) {
                        // School Marker Style (Blue Square with S)
                        el.style.width = '32px';
                        el.style.height = '32px';
                        el.style.backgroundColor = '#3B82F6';
                        el.style.border = '2px solid white';
                        el.style.borderRadius = '4px';
                        el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
                        el.style.display = 'flex';
                        el.style.justifyContent = 'center';
                        el.style.alignItems = 'center';
                        el.style.color = 'white';
                        el.style.fontWeight = 'bold';
                        el.style.fontFamily = 'sans-serif';
                        el.innerHTML = 'S';
                        el.style.zIndex = '95';
                    } else {
                        // Stop Marker Style (Red Circle)
                        el.style.width = '16px';
                        el.style.height = '16px';
                        el.style.backgroundColor = '#EF4444';
                        el.style.border = '2px solid white';
                        el.style.borderRadius = '50%';
                        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                        el.style.zIndex = '90';
                    }

                    const popup = new OlaNamespace.Popup({ offset: [0, -10] })
                        .setHTML(`<div class="p-2 font-sans font-bold">${stop.name}</div>`);

                    const marker = new OlaNamespace.Marker({ element: el })
                        .setLngLat([parseFloat(stop.longitude), parseFloat(stop.latitude)])
                        .setPopup(popup)
                        .addTo(map);

                    stopMarkersRef.current[markerId] = marker;
                }
            });
        });

        // Cleanup old stop markers
        Object.keys(stopMarkersRef.current).forEach(id => {
            if (!activeStopIds.includes(id)) {
                stopMarkersRef.current[id].remove();
                delete stopMarkersRef.current[id];
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
        el.style.zIndex = '1000'; // Force on top
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
            </div>
        );
    }

    return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: '500px', backgroundColor: '#f9fafb', borderRadius: '12px', overflow: 'hidden' }} />;
};

export default SimpleMap;
