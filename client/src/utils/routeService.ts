/**
 * Utility to fetch routing data from Ola Maps Directions API
 */

const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY || 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';

export interface LatLng {
    lat: number;
    lng: number;
}

/**
 * Fetches directions between origin and destination
 * Returns an array of coordinates for the polyline
 */
export async function fetchRoute(origin: LatLng, destination: LatLng) {
    try {
        const url = `https://api.olamaps.io/routing/v1/directions?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&api_key=${OLA_MAPS_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Request-Id': Math.random().toString(36).substring(7),
            }
        });

        if (!response.ok) {
            throw new Error(`Directions API failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract polyline from the first route
        // Usually Ola returns a polyline string or an array of steps
        // If it returns a polyline string, we need to decode it.
        // For simplicity, let's assume it returns coordinates we can use.
        if (data.routes && data.routes.length > 0) {
            // Note: Check the actual response format. 
            // Often "overview_polyline" needs decoding or "geometry" is provided.
            return data.routes[0];
        }

        return null;
    } catch (error) {
        console.error("Error fetching route:", error);
        return null;
    }
}
