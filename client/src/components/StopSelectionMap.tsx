import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

// OlaMaps is loaded via CDN in index.html
const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY || 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';

interface StopSelectionMapProps {
    onLocationSelect: (lat: string, lng: string) => void;
    initialLocation?: { latitude: string; longitude: string };
}

const StopSelectionMap: React.FC<StopSelectionMapProps> = ({ onLocationSelect, initialLocation }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const { toast } = useToast();

    const initMap = useCallback(async () => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        try {
            const OlaNamespace = (window as any).OlaMaps;
            if (!OlaNamespace) {
                console.error("Ola Maps SDK not found on window");
                return;
            }

            const OlaSDK = (OlaNamespace.OlaMaps) ? OlaNamespace.OlaMaps : OlaNamespace;

            const olamaps = new OlaSDK({
                apiKey: OLA_MAPS_API_KEY,
                mode: "3d",
                threedTileset: "https://api.olamaps.io/tiles/vector/v1/3dtiles/tileset.json",
            });

            const initialLat = parseFloat(initialLocation?.latitude || '20.5937');
            const initialLng = parseFloat(initialLocation?.longitude || '78.9629');

            const map = await olamaps.init({
                style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                container: mapContainerRef.current,
                center: [initialLng, initialLat],
                zoom: initialLocation ? 15 : 5,
            });

            mapInstanceRef.current = map;

            map.on('load', () => {
                setIsLoaded(true);

                // Add draggable marker
                const el = document.createElement('div');
                el.style.fontSize = '32px';
                el.innerHTML = '📍';
                el.style.cursor = 'grab';

                const marker = new OlaNamespace.Marker({
                    element: el,
                    draggable: true
                })
                    .setLngLat([initialLng, initialLat])
                    .addTo(map);

                markerRef.current = marker;

                marker.on('dragend', () => {
                    const lngLat = marker.getLngLat();
                    onLocationSelect(lngLat.lat.toFixed(6), lngLat.lng.toFixed(6));
                });
            });

        } catch (error) {
            console.error("Failed to init map:", error);
        }
    }, [initialLocation, onLocationSelect]);

    useEffect(() => {
        const timer = setTimeout(initMap, 500); // Small delay to ensure container is ready
        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [initMap]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            // Using proxy endpoint to avoid CORS and hide API key if possible
            // But for now, let's try direct search if available or Geocoding API
            const response = await fetch(`/api/maps/geocode?address=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.geocodingResults && data.geocodingResults.length > 0) {
                const result = data.geocodingResults[0];
                const { lat, lng } = result.geometry.location;

                if (mapInstanceRef.current && markerRef.current) {
                    mapInstanceRef.current.flyTo({
                        center: [lng, lat],
                        zoom: 15,
                        essential: true
                    });
                    markerRef.current.setLngLat([lng, lat]);
                    onLocationSelect(lat.toFixed(6), lng.toFixed(6));
                }
            } else {
                toast({
                    title: "Location not found",
                    description: "Could not find the specified address. Please try again or drag the pin manually.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Search error:", error);
            toast({
                title: "Search error",
                description: "Failed to search for location. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search for an address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-9"
                    />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
            </div>

            <div className="relative h-[300px] w-full rounded-xl overflow-hidden border shadow-inner bg-gray-50">
                <div ref={mapContainerRef} className="h-full w-full" />
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-10 text-gray-400">
                        <MapPin className="h-8 w-8 animate-bounce mr-2" />
                        Initializing Map...
                    </div>
                )}
            </div>
            <p className="text-[10px] text-center text-gray-500 italic">
                👆 Search for an address or drag the pin to set the exact location
            </p>
        </div>
    );
};

export default StopSelectionMap;
