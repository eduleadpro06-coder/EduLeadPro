export const MAP_CONFIG = {
    // Provider can be 'osm' or 'ola'
    PROVIDER: 'ola',

    // API Keys
    OLA_MAPS_API_KEY: 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0',

    // Tile URLs
    URLS: {
        OSM: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        // OLA Maps raster tile URL (for Leaflet/WebView compatibility)
        // Using the places API tile endpoint which provides raster tiles
        OLA: 'https://api.olamaps.io/places/v1/tiles/default-light-standard/{z}/{x}/{y}.png?api_key=nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0'
    },

    ATTRIBUTION: {
        OSM: '© OpenStreetMap contributors',
        OLA: '© Ola Maps'
    }
};
