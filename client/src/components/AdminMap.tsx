import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// OLA Maps Configuration
const OLA_MAPS_API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
const OLA_MAPS_TILE_URL = `https://api.olakrutrim.com/places/v1/tiles/default-light-standard/{z}/{x}/{y}.png?api_key=${OLA_MAPS_API_KEY}`;

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
    isActive: boolean;
}

interface AdminMapProps {
    activeBuses: Bus[];
}

export default function AdminMap({ activeBuses }: AdminMapProps) {
    // Default center (India center, will be overridden if buses exist)
    const defaultCenter: [number, number] = [20.5937, 78.9629];
    const mapCenter = activeBuses.length > 0
        ? [activeBuses[0].currentLocation.latitude, activeBuses[0].currentLocation.longitude] as [number, number]
        : defaultCenter;

    return (
        <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
        >
            <TileLayer
                url={OLA_MAPS_TILE_URL}
            />
            {activeBuses.map((bus) => (
                <Marker
                    key={bus.routeId}
                    position={[bus.currentLocation.latitude, bus.currentLocation.longitude]}
                >
                    <Popup>
                        <div className="p-2">
                            <h3 className="font-bold text-purple-700">{bus.routeName}</h3>
                            <p className="text-sm"><strong>Vehicle:</strong> {bus.vehicleNumber}</p>
                            <p className="text-sm"><strong>Driver:</strong> {bus.driverName}</p>
                            <p className="text-sm"><strong>Speed:</strong> {bus.currentLocation.speed} km/h</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Last updated: {new Date(bus.lastUpdated).toLocaleTimeString()}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
