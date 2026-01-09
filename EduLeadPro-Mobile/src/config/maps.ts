export const MAP_CONFIG = {
    // Provider can be 'osm' or 'ola'
    PROVIDER: 'ola',

    // API Keys
    OLA_MAPS_API_KEY: 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0',

    // Tile URLs
    URLS: {
        OSM: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        // OLA Maps tile URL with API key
        OLA: `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/{z}/{x}/{y}.png?api_key=nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0`
    },

    ATTRIBUTION: {
        OSM: '© OpenStreetMap contributors',
        OLA: '© Ola Maps'
    }
};
