import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAP_CONFIG } from '../config/maps';

interface Marker {
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    icon?: 'bus' | 'school' | 'stop';
}

interface LeafletMapProps {
    latitude: number;
    longitude: number;
    markers?: Marker[];
    height?: number;
    zoom?: number;
}

const LeafletMap = ({ latitude, longitude, markers = [], height = 300, zoom = 15 }: LeafletMapProps) => {
    const webViewRef = useRef<WebView>(null);

    // HTML Content for Leaflet
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <style>
            body { margin: 0; padding: 0; height: 100vh; width: 100vw; }
            #map { height: 100%; width: 100%; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map').setView([${latitude}, ${longitude}], ${zoom});
            
            var tileUrl = '${MAP_CONFIG.PROVIDER === 'ola' ? MAP_CONFIG.URLS.OLA : MAP_CONFIG.URLS.OSM}';
            var attribution = '${MAP_CONFIG.PROVIDER === 'ola' ? MAP_CONFIG.ATTRIBUTION.OLA : MAP_CONFIG.ATTRIBUTION.OSM}';

            L.tileLayer(tileUrl, {
                maxZoom: 19,
                attribution: attribution,
                id: 'ola-maps' // Optional
            }).addTo(map);

            var markers = [];

            function updateMap(lat, lng, zoomLevel) {
                map.setView([lat, lng], zoomLevel);
            }

            function updateMarkers(newMarkers) {
                // Remove existing markers
                markers.forEach(m => map.removeLayer(m));
                markers = [];

                // Add new markers
                newMarkers.forEach(m => {
                    var iconColor = m.icon === 'bus' ? 'red' : 'blue';
                    // Simple custom icon could be added here, using default for now
                    var marker = L.marker([m.latitude, m.longitude])
                        .addTo(map)
                        .bindPopup('<b>' + (m.title || '') + '</b><br>' + (m.description || ''));
                    
                    if (m.icon === 'bus') {
                        marker.openPopup();
                    }
                    markers.push(marker);
                });
            }

            // Initial markers
            updateMarkers(${JSON.stringify(markers)});
        </script>
    </body>
    </html>
    `;

    // Update map when props change
    useEffect(() => {
        if (webViewRef.current) {
            // Update view
            webViewRef.current.injectJavaScript(`
                updateMap(${latitude}, ${longitude}, ${zoom});
                true;
            `);

            // Update markers
            webViewRef.current.injectJavaScript(`
                updateMarkers(${JSON.stringify(markers)});
                true;
            `);
        }
    }, [latitude, longitude, markers, zoom]);

    return (
        <View style={{ height, width: '100%', overflow: 'hidden' }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView HTTP error: ', nativeEvent);
                }}
            />
        </View>
    );
};

export default LeafletMap;
