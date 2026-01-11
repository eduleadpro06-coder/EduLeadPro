/**
 * Ola Maps API Utilities for Mobile
 */
import { OLA_MAPS_API_KEY } from '../config';

export interface LatLng {
    latitude: number;
    longitude: number;
}

/**
 * Fetches directions between origin and destination
 * Returns an array of coordinates for the polyline
 */
export async function getDirections(origin: LatLng, destination: LatLng): Promise<LatLng[]> {
    try {
        // Use our backend proxy to bypass domain restrictions
        // Hardcoding the production URL here as this is a mobile app utility
        const url = `https://eduleadconnect.vercel.app/api/proxy/directions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Id': Math.random().toString(36).substring(7),
            },
            body: JSON.stringify({ origin, destination })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn(`[getDirections] Proxy failed (${response.status}):`, errText);
            return [];
        }

        const data = await response.json();
        console.log(`[getDirections] Received geometry:`, !!data.routes?.[0]?.geometry);

        if (data.routes && data.routes.length > 0) {
            // 1. Try formatted GeoJSON geometry (preferred)
            if (data.routes[0].geometry && data.routes[0].geometry.coordinates) {
                // GeoJSON is [lng, lat], we need {latitude, longitude}
                return data.routes[0].geometry.coordinates.map((point: any) => ({
                    latitude: point[1],
                    longitude: point[0]
                }));
            }

            // 2. Fallback to steps (sparse)
            if (data.routes[0].legs && data.routes[0].legs[0].steps) {
                return data.routes[0].legs[0].steps.map((s: any) => ({
                    latitude: s.start_location.lat,
                    longitude: s.start_location.lng
                }));
            }
        }

        return [];
    } catch (error) {
        console.error("Error fetching directions:", error);
        return [];
    }
}
