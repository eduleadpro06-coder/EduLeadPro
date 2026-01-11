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
        const url = `https://api.olamaps.io/routing/v1/directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&api_key=${OLA_MAPS_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Request-Id': Math.random().toString(36).substring(7),
            }
        });

        if (!response.ok) {
            console.error("Directions API Error:", await response.text());
            return [];
        }

        const data = await response.json();

        // This is a simplified extraction. 
        // In a real scenario, you'd decode the polyline or extract steps.
        // For now, it returns the first route's overview if available.
        if (data.routes && data.routes.length > 0) {
            // Note: If Ola returns a polyline string, we need a decoder here.
            // If it returns points, we format them as LatLng[].
            return data.routes[0].legs[0].steps.map((s: any) => ({
                latitude: s.start_location.lat,
                longitude: s.start_location.lng
            }));
        }

        return [];
    } catch (error) {
        console.error("Error fetching directions:", error);
        return [];
    }
}
