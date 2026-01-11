import { api } from '../../services/api';

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
        // Use our central API service to handle auth tokens and base URLs correctly
        const url = `/parent/proxy/directions`;

        console.log(`[getDirections] Fetching from: ${url}`);
        const data = await api.post<any>(url, { origin, destination });

        console.log(`[getDirections] Raw response routes: ${data.routes?.length || 0}`);

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];

            // 1. Try formatted GeoJSON geometry (preferred)
            if (route.geometry && route.geometry.coordinates) {
                const coords = route.geometry.coordinates.map((point: any) => ({
                    latitude: point[1],
                    longitude: point[0]
                }));
                console.log(`[getDirections] Parsed ${coords.length} coordinates from GeoJSON`);
                return coords;
            }

            // 2. Fallback to overview_polyline (encoded string)
            if (route.overview_polyline) {
                console.warn(`[getDirections] Found encoded polyline, but decoder not implemented yet.`);
                // We'll add a decoder if this is the case
            }

            // 3. Fallback to steps (sparse)
            if (route.legs && route.legs[0].steps) {
                const coords = route.legs[0].steps.map((s: any) => ({
                    latitude: s.start_location.lat,
                    longitude: s.start_location.lng
                }));
                console.log(`[getDirections] Parsed ${coords.length} coordinates from Steps`);
                return coords;
            }
        }

        console.warn(`[getDirections] No usable path found. Full data keys: ${Object.keys(data).join(', ')}`);
        return [];
    } catch (error: any) {
        console.error("[getDirections] Exception:", error?.message);
        return [];
    }
}
